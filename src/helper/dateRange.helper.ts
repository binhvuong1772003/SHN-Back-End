export type DateRangeType = "day" | "week" | "month" | "year";

export const getDateRange = (type: DateRangeType, date: Date = new Date()) => {
  const start = new Date(date);
  const end = new Date(date);

  switch (type) {
    case "day": {
      start.setHours(0, 0, 0, 0);

      end.setDate(end.getDate() + 1);
      end.setHours(0, 0, 0, 0);

      break;
    }

    case "week": {
      const day = start.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;

      start.setDate(start.getDate() + diffToMonday);
      start.setHours(0, 0, 0, 0);

      end.setTime(start.getTime());
      end.setDate(end.getDate() + 7);

      break;
    }

    case "month": {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);

      end.setMonth(end.getMonth() + 1, 1);
      end.setHours(0, 0, 0, 0);

      break;
    }

    case "year": {
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);

      end.setFullYear(end.getFullYear() + 1, 0, 1);
      end.setHours(0, 0, 0, 0);

      break;
    }
  }

  return { start, end };
};
