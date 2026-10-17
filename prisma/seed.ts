import "dotenv/config";
import { db } from "../src/db/prisma";

/**
 * Idempotent demo catalog seed for an existing shop.
 *
 * The seed intentionally creates only catalog/configuration data. It does not
 * delete records or overwrite an existing shop's settings. Run it with:
 *   npm run db:seed
 *
 * Override the target with SEED_SHOP_SLUG when needed. Set
 * SEED_OVERWRITE_SETTINGS=true only when the demo business hours/settings
 * should replace the current values.
 */

const shopSlug = process.env.SEED_SHOP_SLUG ?? "mimo-ban-pate";
const overwriteSettings = process.env.SEED_OVERWRITE_SETTINGS === "true";

const image = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;

const categorySeeds = [
  { name: "Manicure", icon: "hand" },
  { name: "Pedicure", icon: "footprints" },
  { name: "Nail Art", icon: "sparkles" },
  { name: "Spa & Relax", icon: "flower-2" },
] as const;

const serviceSeeds = [
  {
    category: "Manicure",
    name: "Classic Gel Manicure",
    description: "A clean, durable gel finish with cuticle care.",
    basePrice: 320000,
    durationMin: 60,
    imageUrl: image("photo-1604654894610-df63bc536371"),
    options: [
      {
        name: "Finish",
        isRequired: true,
        values: [
          { name: "Classic", price: 0, duration: 0 },
          { name: "Chrome", price: 70000, duration: 10 },
          { name: "Cat eye", price: 90000, duration: 15 },
        ],
      },
      {
        name: "Shape",
        isRequired: true,
        values: [
          { name: "Round", price: 0, duration: 0 },
          { name: "Almond", price: 0, duration: 0 },
          { name: "Square", price: 0, duration: 0 },
        ],
      },
    ],
  },
  {
    category: "Manicure",
    name: "Acrylic Full Set",
    description: "A sculpted full set with shaping and gel colour.",
    basePrice: 550000,
    durationMin: 105,
    imageUrl: image("photo-1610992015732-2449b76344bc"),
    options: [
      {
        name: "Length",
        isRequired: true,
        values: [
          { name: "Short", price: 0, duration: 0 },
          { name: "Medium", price: 80000, duration: 10 },
          { name: "Long", price: 160000, duration: 20 },
        ],
      },
      {
        name: "Shape",
        isRequired: true,
        values: [
          { name: "Square", price: 0, duration: 0 },
          { name: "Coffin", price: 50000, duration: 5 },
          { name: "Almond", price: 50000, duration: 5 },
        ],
      },
    ],
  },
  {
    category: "Pedicure",
    name: "Spa Pedicure",
    description: "Soak, exfoliation, cuticle care and a relaxing massage.",
    basePrice: 420000,
    durationMin: 75,
    imageUrl: image("photo-1519014816548-bf5fe059798b"),
    options: [
      {
        name: "Polish",
        isRequired: true,
        values: [
          { name: "Regular polish", price: 0, duration: 0 },
          { name: "Gel polish", price: 120000, duration: 15 },
        ],
      },
    ],
  },
  {
    category: "Nail Art",
    name: "Minimal Nail Art",
    description: "A refined accent design for two feature nails.",
    basePrice: 180000,
    durationMin: 30,
    imageUrl: image("photo-1607779097040-26e80aa78e66"),
    options: [
      {
        name: "Design level",
        isRequired: true,
        values: [
          { name: "Line art", price: 0, duration: 0 },
          { name: "Chrome detail", price: 50000, duration: 5 },
          { name: "Hand-painted detail", price: 100000, duration: 15 },
        ],
      },
    ],
  },
  {
    category: "Spa & Relax",
    name: "Hand & Foot Relaxation",
    description: "A calming treatment focused on hands, feet and wrists.",
    basePrice: 480000,
    durationMin: 60,
    imageUrl: image("photo-1540555700478-4be289fbecef"),
    options: [
      {
        name: "Aroma",
        isRequired: true,
        values: [
          { name: "Lavender", price: 0, duration: 0 },
          { name: "Citrus", price: 0, duration: 0 },
          { name: "Rose", price: 30000, duration: 0 },
        ],
      },
    ],
  },
] as const;

const addonSeeds = [
  { name: "Gel removal", price: 80000, duration: 15, service: "Classic Gel Manicure" },
  { name: "Nail repair", price: 50000, duration: 10, service: "Acrylic Full Set" },
  { name: "French tip", price: 100000, duration: 15, service: "Classic Gel Manicure" },
  { name: "Paraffin wax", price: 120000, duration: 20, service: "Spa Pedicure" },
  { name: "10-minute massage", price: 90000, duration: 10, service: "Hand & Foot Relaxation" },
] as const;

const settingsSeed = {
  autoConfirm: false,
  autoConfirmMinutes: 30,
  reminderH24: true,
  reminderH2: true,
  reviewRequestMinutes: 30,
  depositRequired: false,
  depositPercent: 30,
  maxAdvanceBookingDays: 45,
  slotIntervalMinutes: 15,
  attendanceGraceMinutes: 5,
  earlyCheckInMinutes: 30,
  lateCheckOutMinutes: 30,
};

const businessHoursSeed = [
  { dayOfWeek: 0, openTime: "10:00", closeTime: "18:00", isClosed: true },
  { dayOfWeek: 1, openTime: "09:00", closeTime: "20:00", isClosed: false },
  { dayOfWeek: 2, openTime: "09:00", closeTime: "20:00", isClosed: false },
  { dayOfWeek: 3, openTime: "09:00", closeTime: "20:00", isClosed: false },
  { dayOfWeek: 4, openTime: "09:00", closeTime: "20:00", isClosed: false },
  { dayOfWeek: 5, openTime: "09:00", closeTime: "21:00", isClosed: false },
  { dayOfWeek: 6, openTime: "09:00", closeTime: "21:00", isClosed: false },
] as const;

function log(message: string) {
  console.log(`[seed] ${message}`);
}

async function ensureCategory(shopId: string, seed: (typeof categorySeeds)[number]) {
  const existing = await db.serviceCategory.findFirst({
    where: { shopId, name: seed.name },
  });
  if (existing) return existing;

  const category = await db.serviceCategory.create({
    data: {
      shopId,
      name: seed.name,
      icon: seed.icon,
      sortOrder: categorySeeds.indexOf(seed),
      isActive: true,
    },
  });
  log(`created category: ${category.name}`);
  return category;
}

async function ensureService(
  shopId: string,
  categoryId: string,
  seed: (typeof serviceSeeds)[number],
) {
  const existing = await db.service.findFirst({
    where: { shopId, name: seed.name },
  });
  const service =
    existing ??
    (await db.service.create({
      data: {
        shopId,
        categoryId,
        name: seed.name,
        description: seed.description,
        basePrice: seed.basePrice,
        durationMin: seed.durationMin,
        imageUrl: seed.imageUrl,
        isActive: true,
        sortOrder: serviceSeeds.indexOf(seed),
      },
    }));

  if (!existing) log(`created service: ${service.name}`);

  for (const [optionIndex, optionSeed] of seed.options.entries()) {
    const option =
      (await db.serviceOption.findFirst({
        where: { serviceId: service.id, name: optionSeed.name },
      })) ??
      (await db.serviceOption.create({
        data: {
          serviceId: service.id,
          name: optionSeed.name,
          isRequired: optionSeed.isRequired,
          sortOrder: optionIndex,
        },
      }));

    for (const [valueIndex, valueSeed] of optionSeed.values.entries()) {
      const value = await db.optionValue.findFirst({
        where: { optionId: option.id, name: valueSeed.name },
      });
      if (value) continue;
      await db.optionValue.create({
        data: {
          optionId: option.id,
          name: valueSeed.name,
          price: valueSeed.price,
          duration: valueSeed.duration,
          sortOrder: valueIndex,
          isActive: true,
        },
      });
    }
  }

  return service;
}

async function ensureAddon(
  shopId: string,
  serviceId: string | undefined,
  seed: (typeof addonSeeds)[number],
) {
  const existing = await db.addonService.findFirst({
    where: { shopId, name: seed.name },
  });
  if (existing) return existing;

  const addon = await db.addonService.create({
    data: {
      shopId,
      serviceId,
      name: seed.name,
      price: seed.price,
      duration: seed.duration,
      sortOrder: addonSeeds.indexOf(seed),
      isActive: true,
    },
  });
  log(`created addon: ${addon.name}`);
  return addon;
}

async function ensurePackage(
  shopId: string,
  name: string,
  description: string,
  basePrice: number,
  durationMin: number,
  serviceIds: string[],
  addonIds: string[],
) {
  const existing = await db.servicePackage.findFirst({
    where: { shopId, name },
  });
  if (existing) return existing;

  const result = await db.servicePackage.create({
    data: {
      shopId,
      name,
      description,
      basePrice,
      durationMin,
      isActive: true,
      items: {
        create: serviceIds.map((serviceId) => ({ serviceId, isIncluded: true })),
      },
      addons: {
        create: addonIds.map((addonId) => ({ addonId, extraPrice: 0 })),
      },
    },
  });
  log(`created package: ${result.name}`);
  return result;
}

async function seed() {
  const shop = await db.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) {
    throw new Error(
      `Shop '${shopSlug}' was not found. Create the shop first or set SEED_SHOP_SLUG to an existing shop.`,
    );
  }

  if (overwriteSettings || !shop.settings) {
    await db.shop.update({
      where: { id: shop.id },
      data: {
        openTime: "09:00",
        closeTime: "20:00",
        workDays: [1, 2, 3, 4, 5, 6],
        timezone: "Asia/Ho_Chi_Minh",
        settings: settingsSeed,
      },
    });
    log("configured shop settings");
  } else {
    log("kept existing shop settings");
  }

  const existingHours = await db.shopBusinessHour.count({ where: { shopId: shop.id } });
  if (overwriteSettings || existingHours === 0) {
    for (const day of businessHoursSeed) {
      await db.shopBusinessHour.upsert({
        where: { shopId_dayOfWeek: { shopId: shop.id, dayOfWeek: day.dayOfWeek } },
        create: { ...day, shopId: shop.id },
        update: {
          openTime: day.openTime,
          closeTime: day.closeTime,
          isClosed: day.isClosed,
        },
      });
    }
    log("configured weekly business hours");
  } else {
    log("kept existing business hours");
  }

  const categories = new Map<string, { id: string }>();
  for (const categorySeed of categorySeeds) {
    categories.set(categorySeed.name, await ensureCategory(shop.id, categorySeed));
  }

  const services = new Map<string, { id: string }>();
  for (const serviceSeed of serviceSeeds) {
    const category = categories.get(serviceSeed.category);
    if (!category) throw new Error(`Missing seeded category '${serviceSeed.category}'`);
    services.set(
      serviceSeed.name,
      await ensureService(shop.id, category.id, serviceSeed),
    );
  }

  const addons = new Map<string, { id: string }>();
  for (const addonSeed of addonSeeds) {
    addons.set(
      addonSeed.name,
      await ensureAddon(
        shop.id,
        services.get(addonSeed.service)?.id,
        addonSeed,
      ),
    );
  }

  await ensurePackage(
    shop.id,
    "Mimo Signature Set",
    "A polished manicure and pedicure pairing for a complete reset.",
    680000,
    120,
    [services.get("Classic Gel Manicure")!.id, services.get("Spa Pedicure")!.id],
    [addons.get("French tip")!.id],
  );
  await ensurePackage(
    shop.id,
    "Weekend Nail Art Set",
    "A full set with a minimal accent design for your weekend plans.",
    790000,
    150,
    [services.get("Acrylic Full Set")!.id, services.get("Minimal Nail Art")!.id],
    [addons.get("Nail repair")!.id],
  );

  const activeStaff = await db.shopStaff.findMany({
    where: { shopId: shop.id, isActive: true },
    select: { id: true },
  });
  if (activeStaff.length > 0) {
    const serviceIds = [...services.values()].map((service) => service.id);
    for (const staff of activeStaff) {
      for (const serviceId of serviceIds) {
        await db.staffService.upsert({
          where: { shopStaffId_serviceId: { shopStaffId: staff.id, serviceId } },
          create: { shopStaffId: staff.id, serviceId, isActive: true },
          update: { isActive: true },
        });
      }
    }
    log(`assigned ${serviceIds.length} services to ${activeStaff.length} active staff member(s)`);
  } else {
    log("no active staff found; skipped staff-service assignments");
  }

  log(`completed catalog seed for '${shopSlug}'`);
}

seed()
  .catch((error: unknown) => {
    console.error("[seed] failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
