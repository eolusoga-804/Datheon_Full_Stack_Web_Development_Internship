import { faDroplet, faGauge, faWind } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { CurrentWeather } from "../../types/weather";
import "./WeatherTelemetry.css";

const numberFormat = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 1,
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
}: {
  weather: CurrentWeather;
}) {
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
  ];

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
