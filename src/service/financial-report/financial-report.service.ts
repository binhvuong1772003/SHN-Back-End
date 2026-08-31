import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { db } from "@/db/prisma";
import { ApiError } from "@/utils/ApiError";
import type { FinancialReportQuery } from "@/validation/financial-report.validate";

dayjs.extend(utc);
dayjs.extend(timezone);

type ReportPeriod = {
  start: Date;
  endExclusive: Date;
  startLabel: string;
  endLabel: string;
};

const sum = (values: number[]) =>
  values.reduce((total, value) => total + value, 0);
const round = (value: number) => Math.round(value * 100) / 100;

const toPeriod = (
  periodStart: string,
  periodEnd: string,
  shopTimezone: string,
): ReportPeriod => {
  const start = dayjs.tz(periodStart, shopTimezone).startOf("day");
  const end = dayjs.tz(periodEnd, shopTimezone).add(1, "day").startOf("day");
  return {
    start: start.toDate(),
    endExclusive: end.toDate(),
    startLabel: start.format("YYYY-MM-DD"),
    endLabel: end.subtract(1, "day").format("YYYY-MM-DD"),
  };
};

const previousPeriod = (
  period: ReportPeriod,
  shopTimezone: string,
): ReportPeriod => {
  const days = dayjs(period.endExclusive).diff(dayjs(period.start), "day");
  const end = dayjs.tz(period.start, shopTimezone).startOf("day");
  const start = end.subtract(days, "day");
  return {
    start: start.toDate(),
    endExclusive: end.toDate(),
    startLabel: start.format("YYYY-MM-DD"),
    endLabel: end.subtract(1, "day").format("YYYY-MM-DD"),
  };
};

const paidAmount = (
  payment: { paidAmount: number } | null,
  totalAmount: number,
) => payment?.paidAmount || totalAmount;

const aggregatePeriod = async (
  shopId: string,
  period: ReportPeriod,
  shopTimezone: string,
) => {
  const [appointments, payrolls] = await Promise.all([
    db.appointment.findMany({
      where: {
        shopId,
        status: "COMPLETED",
        date: { gte: period.start, lt: period.endExclusive },
        payment: { is: { status: "PAID" } },
      },
      select: {
        date: true,
        totalAmount: true,
        staffId: true,
        staff: { select: { name: true, email: true } },
        payment: { select: { paidAmount: true, method: true } },
        services: {
          select: {
            serviceName: true,
            priceAtBooking: true,
            selectedValues: { select: { priceAtBooking: true } },
          },
        },
        packages: {
          select: {
            priceAtBooking: true,
            addons: { select: { extraPrice: true } },
          },
        },
        addons: { select: { priceAtBooking: true } },
      },
    }),
    db.payroll.findMany({
      where: {
        shopId,
        status: { in: ["CONFIRMED", "PAID"] },
        periodStart: { lte: period.endExclusive },
        periodEnd: { gte: period.start },
      },
      select: {
        userId: true,
        grossAmount: true,
        netAmount: true,
        baseSalary: true,
        commissionTotal: true,
        bonusTotal: true,
        penaltyTotal: true,
        otAmount: true,
        advanceDeduction: true,
        otherDeductions: true,
        otherBonuses: true,
        user: { select: { name: true, email: true } },
      },
    }),
  ]);

  const trend = new Map<string, number>();
  const paymentMethods = new Map<string, number>();
  const revenueBreakdown = new Map<string, number>();
  const serviceMap = new Map<
    string,
    { appointments: number; revenue: number }
  >();
  const staffMap = new Map<
    string,
    { name: string; email?: string; appointments: number; revenue: number }
  >();

  let revenue = 0;
  for (const appointment of appointments) {
    const amount = paidAmount(appointment.payment, appointment.totalAmount);
    const date = dayjs(appointment.date).tz(shopTimezone).format("YYYY-MM-DD");
    revenue += amount;
    trend.set(date, (trend.get(date) ?? 0) + amount);
    paymentMethods.set(
      appointment.payment?.method ?? "UNKNOWN",
      (paymentMethods.get(appointment.payment?.method ?? "UNKNOWN") ?? 0) +
        amount,
    );

    if (appointment.staffId) {
      const staff = staffMap.get(appointment.staffId) ?? {
        name: appointment.staff?.name ?? "Unknown staff",
        email: appointment.staff?.email ?? undefined,
        appointments: 0,
        revenue: 0,
      };
      staff.appointments += 1;
      staff.revenue += amount;
      staffMap.set(appointment.staffId, staff);
    }

    for (const service of appointment.services) {
      const serviceRevenue =
        service.priceAtBooking +
        sum(service.selectedValues.map((value) => value.priceAtBooking));
      revenueBreakdown.set(
        "SERVICES",
        (revenueBreakdown.get("SERVICES") ?? 0) + serviceRevenue,
      );
      const item = serviceMap.get(service.serviceName) ?? {
        appointments: 0,
        revenue: 0,
      };
      item.appointments += 1;
      item.revenue += serviceRevenue;
      serviceMap.set(service.serviceName, item);
    }

    for (const servicePackage of appointment.packages) {
      const packageRevenue =
        servicePackage.priceAtBooking +
        sum(servicePackage.addons.map((addon) => addon.extraPrice));
      revenueBreakdown.set(
        "PACKAGES",
        (revenueBreakdown.get("PACKAGES") ?? 0) + packageRevenue,
      );
    }

    for (const addon of appointment.addons) {
      revenueBreakdown.set(
        "ADD_ONS",
        (revenueBreakdown.get("ADD_ONS") ?? 0) + addon.priceAtBooking,
      );
    }
  }

  const payroll = payrolls.length
    ? {
        records: payrolls.length,
        cost: round(sum(payrolls.map((item) => item.grossAmount))),
        baseSalary: round(sum(payrolls.map((item) => item.baseSalary))),
        commission: round(sum(payrolls.map((item) => item.commissionTotal))),
        bonus: round(
          sum(payrolls.map((item) => item.bonusTotal + item.otherBonuses)),
        ),
        deductions: round(
          sum(
            payrolls.map(
              (item) =>
                item.penaltyTotal +
                item.advanceDeduction +
                item.otherDeductions,
            ),
          ),
        ),
        overtime: round(sum(payrolls.map((item) => item.otAmount))),
        netPaid: round(sum(payrolls.map((item) => item.netAmount))),
      }
    : null;

  const staffPayroll = new Map<string, number>();
  for (const item of payrolls) {
    staffPayroll.set(
      item.userId,
      (staffPayroll.get(item.userId) ?? 0) + item.commissionTotal,
    );
  }

  return {
    dataAvailable: appointments.length > 0 || payrolls.length > 0,
    revenue: round(revenue),
    completedAppointments: appointments.length,
    averageTicket: appointments.length
      ? round(revenue / appointments.length)
      : 0,
    payroll,
    revenueAfterPayroll: payroll ? round(revenue - payroll.cost) : null,
    trend: Array.from(trend, ([date, value]) => ({
      date,
      revenue: round(value),
    })).sort((a, b) => a.date.localeCompare(b.date)),
    revenueBreakdown: Array.from(revenueBreakdown, ([key, value]) => ({
      key,
      revenue: round(value),
    })).sort((a, b) => b.revenue - a.revenue),
    topServices: Array.from(serviceMap, ([name, value]) => ({
      name,
      appointments: value.appointments,
      revenue: round(value.revenue),
      averageTicket: round(value.revenue / value.appointments),
    }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8),
    staffPerformance: Array.from(staffMap, ([staffId, value]) => ({
      staffId,
      ...value,
      revenue: round(value.revenue),
      commission: round(staffPayroll.get(staffId) ?? 0),
    }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8),
    paymentMethods: Array.from(paymentMethods, ([method, value]) => ({
      method,
      revenue: round(value),
    })).sort((a, b) => b.revenue - a.revenue),
  };
};

export const getFinancialReportService = async (
  shopSlug: string,
  query: FinancialReportQuery,
) => {
  const shop = await db.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) throw new ApiError(404, "Shop not found");

  const currentPeriod = toPeriod(
    query.periodStart,
    query.periodEnd,
    shop.timezone,
  );
  const previous = previousPeriod(currentPeriod, shop.timezone);
  const [current, previousData] = await Promise.all([
    aggregatePeriod(shop.id, currentPeriod, shop.timezone),
    aggregatePeriod(shop.id, previous, shop.timezone),
  ]);

  return {
    period: {
      start: currentPeriod.startLabel,
      end: currentPeriod.endLabel,
      previousStart: previous.startLabel,
      previousEnd: previous.endLabel,
    },
    current,
    previous: {
      revenue: previousData.revenue,
      payrollCost: previousData.payroll?.cost ?? null,
      revenueAfterPayroll: previousData.revenueAfterPayroll,
      completedAppointments: previousData.completedAppointments,
      dataAvailable: previousData.dataAvailable,
    },
    coverage: {
      revenue: true,
      payroll: current.payroll !== null,
      operatingExpenses: false,
      paymentMethods: current.paymentMethods.length > 0,
    },
  };
};
