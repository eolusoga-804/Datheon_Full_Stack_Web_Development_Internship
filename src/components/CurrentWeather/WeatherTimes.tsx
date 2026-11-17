import { useEffect, useState } from "react";
import type { City } from "../../types/city";
import type { CurrentWeather, Forecast } from "../../types/weather";
import {
  createCityTimeFormatter,
  createCityDateFormatter,
} from "../../utils/createCityTimeFormatter";
import {
  getWeatherCondition,
  getWeatherTheme,
} from "../../utils/getWeatherTheme";
// Share the summary's responsive time-label styles.
import "./CurrentWeatherPanel.css";

type WeatherTimesProps = {
  timezone: City["timezone"];
  weather: CurrentWeather;
  forecast: Forecast | null;
};

const CLOCK_REFRESH_MS = 10_000;

export default function WeatherTimes({
  timezone,
  weather,
  forecast,
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

  const clock = createCityTimeFormatter(timezone, weather.utcOffsetSeconds, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const calculatedAt = new Date(weather.calculatedAtUnix * 1_000);
  const hasValidTimestamp = Number.isFinite(calculatedAt.getTime());

  // Reuse the ticking city clock so yesterday's range clears at local midnight.
  const todayKey = forecast?.usesLocalTime
    ? createCityDateFormatter(timezone, forecast.utcOffsetSeconds).format(now)
    : undefined;
  const today = todayKey
    ? forecast?.days.find((day) => day.dateKey === todayKey)
    : undefined;

  return (
    <dl
      className="current-weather__times"
      data-weather-theme={getWeatherTheme(weather, timezone, now)}
      data-weather-condition={getWeatherCondition(weather.conditionCode)}
    >
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

      {today && (
        <div>
          <dt className="font-semibold">Today’s forecast range</dt>
          <dd>
            Low {Math.round(today.lowC)} °C · High {Math.round(today.highC)} °C
          </dd>
        </div>
      )}
    </dl>
  );
}
