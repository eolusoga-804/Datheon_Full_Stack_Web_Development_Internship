// Classify the local hour without changing the existing sunrise-based weather theme.
export function getCityTimeOfDay(
  now: Date,
  timezone: string | undefined,
  utcOffsetSeconds: number | undefined,
): string {
  let hour: number | undefined;

  // Prefer the city's named timezone so daylight-saving changes are respected.
  if (timezone) {
    try {
      const formatter = new Intl.DateTimeFormat("en-GB", {
        timeZone: timezone,
        hour: "2-digit",
        hourCycle: "h23",
        numberingSystem: "latn",
      });

      const hourPart = formatter
        .formatToParts(now)
        .find((part) => part.type === "hour");

      if (hourPart) hour = Number(hourPart.value);
    } catch (error) {
      if (!(error instanceof RangeError)) throw error;
    }
  }

  // Use the provider's offset when a valid named timezone is unavailable.
  if (
    hour === undefined &&
    utcOffsetSeconds !== undefined &&
    Number.isFinite(utcOffsetSeconds) &&
    Math.abs(utcOffsetSeconds) <= 86_400
  ) {
    hour = new Date(now.getTime() + utcOffsetSeconds * 1_000).getUTCHours();
  }

  // Avoid presenting the visitor's own time as the selected city's time.
  if (hour === undefined || !Number.isFinite(hour)) return "Unavailable";

  if (hour >= 5 && hour < 12) return "Morning";
  if (hour >= 12 && hour < 17) return "Afternoon";
  if (hour >= 17 && hour < 21) return "Evening";
  return "Night";
}
