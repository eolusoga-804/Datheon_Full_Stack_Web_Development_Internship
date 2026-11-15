import {
  faCloud,
  faCloudRain,
  faDroplet,
  faEye,
  faGauge,
  faMoon,
  faSnowflake,
  faSun,
  faWind,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { CurrentWeather } from "../../types/weather";
import type { City } from "../../types/city";
import { createCityTimeFormatter } from "../../utils/createCityTimeFormatter";
import "./WeatherTelemetry.css";

const numberFormat = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 2,
});

const compassPoints = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

function formatMeasurement(value: number | undefined, unit: string) {
  return value === undefined
    ? "Unavailable"
    : `${numberFormat.format(value)}${unit}`;
}

// Convert the reported wind bearing to the nearest compass point.
function formatWind(speed: number | undefined, direction: number | undefined) {
  const speedLabel = formatMeasurement(speed, " m/s");

  if (speed === undefined || speed === 0 || direction === undefined) {
    return speedLabel;
  }

  const bearing = ((direction % 360) + 360) % 360;
  const directionLabel =
    compassPoints[Math.round(bearing / 45) % compassPoints.length];

  return `${speedLabel} · ${directionLabel}`;
}

export default function WeatherTelemetry({
  weather,
  timezone,
}: {
  weather: CurrentWeather;
  timezone: City["timezone"];
}) {
  const clock = createCityTimeFormatter(timezone, weather.utcOffsetSeconds, {
    timeStyle: "short",
  });
  const timeSuffix = clock.usesLocalTime ? "" : " (UTC)";

  // Format sunrise and sunset in the same zone as the city clock.
  function formatSunTime(unixSeconds: number | undefined) {
    if (unixSeconds === undefined || unixSeconds <= 0) return "Unavailable";

    const date = new Date(unixSeconds * 1_000);
    return Number.isFinite(date.getTime()) ? clock.format(date) : "Unavailable";
  }
  // Keep labels, icon choices, and formatting together for each measurement.
  const measurements = [
    {
      label: "Humidity",
      icon: faDroplet,
      value: formatMeasurement(weather.humidityPercent, "%"),
    },
    {
      label: "Wind",
      icon: faWind,
      value: formatWind(weather.windSpeedMps, weather.windDirectionDeg),
    },
    {
      label: "Pressure",
      icon: faGauge,
      value: formatMeasurement(weather.pressureHpa, " hPa"),
    },
    {
      label: "Visibility",
      icon: faEye,
      value: formatMeasurement(weather.visibilityMeters, " m"),
    },
    {
      label: "Cloud coverage",
      icon: faCloud,
      value: formatMeasurement(weather.cloudCoverPercent, "%"),
    },
    {
      label: `Sunrise${timeSuffix}`,
      icon: faSun,
      value: formatSunTime(weather.sunriseUnix),
    },
    {
      label: `Sunset${timeSuffix}`,
      icon: faMoon,
      value: formatSunTime(weather.sunsetUnix),
    },
  ];

  // Show hourly precipitation only when the provider reports an amount.
  if (weather.rainLastHourMm !== undefined) {
    measurements.push({
      label: "Rain in last hour",
      icon: faCloudRain,
      value: formatMeasurement(weather.rainLastHourMm, " mm"),
    });
  }

  if (weather.snowLastHourMm !== undefined) {
    measurements.push({
      label: "Snow in last hour",
      icon: faSnowflake,
      value: formatMeasurement(weather.snowLastHourMm, " mm"),
    });
  }

  return (
    <section className="weather-telemetry">
      <h4 className="text-sm font-semibold">Climate telemetry</h4>
      <dl className="weather-telemetry__list">
        {measurements.map(({ label, icon, value }) => (
          <div className="weather-telemetry__card" key={label}>
            <dt className="weather-telemetry__label">
              <FontAwesomeIcon icon={icon} aria-hidden="true" />
              {label}
            </dt>
            <dd className="text-sm font-semibold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
