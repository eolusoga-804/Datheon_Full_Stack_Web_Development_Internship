// Prefer the named city zone so daylight-saving rules apply automatically.
export function createCityTimeFormatter(
  timezone: string | undefined,
  utcOffsetSeconds: number | undefined,
  options: Omit<Intl.DateTimeFormatOptions, "timeZone">,
) {
  if (timezone) {
    try {
      const formatter = new Intl.DateTimeFormat(undefined, {
        ...options,
        timeZone: timezone,
      });

      return { format: formatter.format, usesLocalTime: true };
    } catch (error) {
      if (!(error instanceof RangeError)) throw error;
    }
  }

  // Apply the provider offset when a named zone is unavailable.
  const formatter = new Intl.DateTimeFormat(undefined, {
    ...options,
    timeZone: "UTC",
  });
  const usesLocalTime =
    utcOffsetSeconds !== undefined && Math.abs(utcOffsetSeconds) <= 86_400;

  return {
    format: (date: Date) =>
      formatter.format(
        date.getTime() + (usesLocalTime ? utcOffsetSeconds * 1_000 : 0),
      ),
    usesLocalTime,
  };
}

// Use the same calendar-date format for forecast grouping and lookup.
export function createCityDateFormatter(
  timezone: string | undefined,
  utcOffsetSeconds: number | undefined,
) {
  return createCityTimeFormatter(timezone, utcOffsetSeconds, {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
}
