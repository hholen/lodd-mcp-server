export interface DateRange {
  start: Date;
  end: Date;
  interval: "hour" | "day";
}

/**
 * Parse a period string into a date range.
 * Supports: "today", "1d", "yesterday", "7d", "30d", "90d", or "YYYY-MM-DD..YYYY-MM-DD"
 */
export function parsePeriod(period: string): DateRange {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (period) {
    case "today":
    case "1d":
      return { start: startOfToday, end: now, interval: "hour" };

    case "yesterday": {
      const startOfYesterday = new Date(startOfToday);
      startOfYesterday.setDate(startOfYesterday.getDate() - 1);
      return { start: startOfYesterday, end: startOfToday, interval: "hour" };
    }

    case "7d": {
      const start = new Date(startOfToday);
      start.setDate(start.getDate() - 7);
      return { start, end: now, interval: "day" };
    }

    case "30d": {
      const start = new Date(startOfToday);
      start.setDate(start.getDate() - 30);
      return { start, end: now, interval: "day" };
    }

    case "90d": {
      const start = new Date(startOfToday);
      start.setDate(start.getDate() - 90);
      return { start, end: now, interval: "day" };
    }

    default: {
      // Try "YYYY-MM-DD..YYYY-MM-DD" format
      const match = period.match(/^(\d{4}-\d{2}-\d{2})\.\.(\d{4}-\d{2}-\d{2})$/);
      if (match) {
        const start = new Date(match[1]);
        const end = new Date(match[2]);
        end.setHours(23, 59, 59, 999);
        const days = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
        return { start, end, interval: days <= 2 ? "hour" : "day" };
      }
      throw new Error(
        `Invalid period: "${period}". Use "today", "yesterday", "7d", "30d", "90d", or "YYYY-MM-DD..YYYY-MM-DD"`
      );
    }
  }
}

/**
 * Get the previous period of the same length for comparison.
 */
export function getPreviousPeriod(range: DateRange): DateRange {
  const durationMs = range.end.getTime() - range.start.getTime();
  return {
    start: new Date(range.start.getTime() - durationMs),
    end: new Date(range.start.getTime()),
    interval: range.interval,
  };
}
