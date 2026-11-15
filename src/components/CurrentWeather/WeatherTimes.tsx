import { useEffect, useState } from "react";
import type { City } from "../../types/city";
import type { CurrentWeather } from "../../types/weather";
import { createCityTimeFormatter } from "../../utils/createCityTimeFormatter";

type WeatherTimesProps = {
  timezone: City["timezone"];
  calculatedAtUnix: CurrentWeather["calculatedAtUnix"];
  utcOffsetSeconds: CurrentWeather["utcOffsetSeconds"];
};

const CLOCK_REFRESH_MS = 10_000;

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

  const clock = createCityTimeFormatter(timezone, utcOffsetSeconds, {
    dateStyle: "medium",
    timeStyle: "short",
  });
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
