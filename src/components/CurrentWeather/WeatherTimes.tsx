import { useEffect, useState } from "react";
import type { City } from "../../types/city";
import type { CurrentWeather } from "../../types/weather";

type WeatherTimesProps = {
  timezone: City["timezone"];
  calculatedAtUnix: CurrentWeather["calculatedAtUnix"];
  utcOffsetSeconds: CurrentWeather["utcOffsetSeconds"];
};

const CLOCK_REFRESH_MS = 10_000;

// Prefer the city's named zone so daylight-saving rules apply automatically.
function getCityClock(timezone?: string, utcOffsetSeconds?: number) {
  const options = {
    dateStyle: "medium",
    timeStyle: "short",
  } satisfies Intl.DateTimeFormatOptions;

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

  // Use the provider's offset when a named zone is missing or unsupported.
  const formatter = new Intl.DateTimeFormat(undefined, {
    ...options,
    timeZone: "UTC",
  });
  const usesLocalTime =
    utcOffsetSeconds !== undefined && Math.abs(utcOffsetSeconds) <= 86_400;
  const offsetMs = usesLocalTime ? utcOffsetSeconds * 1_000 : 0;

  return {
    format: (date: Date) => formatter.format(date.getTime() + offsetMs),
    usesLocalTime,
  };
}

export default function WeatherTimes({
  timezone,
  calculatedAtUnix,
  utcOffsetSeconds,
}: WeatherTimesProps) {
  const [now, setNow] = useState(() => new Date());

  // Update the clock independently of weather requests.
  useEffect(() => {
    const timer = window.setInterval(
      () => setNow(new Date()),
      CLOCK_REFRESH_MS,
    );

    return () => window.clearInterval(timer);
  }, []);

  const clock = getCityClock(timezone, utcOffsetSeconds);
  const calculatedAt = new Date(calculatedAtUnix * 1_000);
  const hasValidTimestamp = Number.isFinite(calculatedAt.getTime());

  return (
    <dl className="dashboard__description flex flex-wrap gap-x-4 gap-y-1 text-xs">
      <div>
        <dt className="font-semibold">
          {clock.usesLocalTime ? "Local time" : "Time (UTC)"}
        </dt>
        <dd>
          <time dateTime={now.toISOString()}>{clock.format(now)}</time>
        </dd>
      </div>

      <div>
        <dt className="font-semibold">
          {clock.usesLocalTime
            ? "Weather calculated"
            : "Weather calculated (UTC)"}
        </dt>
        <dd>
          {hasValidTimestamp ? (
            <time dateTime={calculatedAt.toISOString()}>
              {clock.format(calculatedAt)}
            </time>
          ) : (
            "Unavailable"
          )}
        </dd>
      </div>
    </dl>
  );
}
