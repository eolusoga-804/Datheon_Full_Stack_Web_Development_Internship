import { useEffect, useState } from "react";
import { getForecast } from "../../services/forecast";
import { FORECAST_DAY_COUNT } from "../../services/normalizeForecast";
import type { City } from "../../types/city";
import type { Forecast } from "../../types/weather";
import WeatherIcon from "../WeatherIcon/WeatherIcon";
import LoadingState from "../LoadingState/LoadingState";
import "./ForecastPanel.css";

type ForecastResult =
  | { status: "loading" }
  | { status: "ready"; forecast: Forecast }
  | { status: "error"; message: string };

const degrees = new Intl.NumberFormat(undefined, {
  style: "unit",
  unit: "celsius",
  maximumFractionDigits: 0,
});

export default function ForecastPanel({
  city,
  onForecastReady,
}: {
  city: City;
  onForecastReady: (forecast: Forecast) => void;
}) {
  const [result, setResult] = useState<ForecastResult>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const { latitude, longitude, timezone } = city;

  // Cancel the lookup when the city changes or the panel unmounts.
  useEffect(() => {
    const controller = new AbortController();

    async function loadForecast() {
      try {
        const forecast = await getForecast(
          { latitude, longitude, timezone },
          controller.signal,
        );

        if (!controller.signal.aborted) {
          setResult({ status: "ready", forecast });
          onForecastReady(forecast);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setResult({
            status: "error",
            message:
              error instanceof Error
                ? error.message
                : "Could not load the forecast.",
          });
        }
      }
    }

    void loadForecast();
    return () => controller.abort();
  }, [latitude, longitude, timezone, attempt, onForecastReady]);

  function retryForecast() {
    setResult({ status: "loading" });
    setAttempt((previous) => previous + 1);
  }

  const forecast = result.status === "ready" ? result.forecast : null;

  // Give missing coverage an explicit card without inventing a date or reading.
  const cards = forecast
    ? Array.from({ length: FORECAST_DAY_COUNT }, (_, index) => ({
        slot: index + 1,
        day: forecast.days[index],
      }))
    : [];

  return (
    <section className="forecast">
      <h3 className="text-base font-semibold">Five-day forecast</h3>

      <div role="status" className="text-sm">
        {result.status === "loading" && (
          <LoadingState
            message={`Retrieving the five-day forecast for ${city.name}…`}
          />
        )}

        {result.status === "error" && <p>{result.message}</p>}

        {forecast && (
          <p className="dashboard__description text-xs">
            Starts {forecast.days[0]?.dateLabel} (
            {forecast.usesLocalTime ? "city local time" : "UTC"}). Ranges use
            available three-hour readings.
          </p>
        )}
      </div>

      {result.status === "error" && (
        <button
          type="button"
          onClick={retryForecast}
          className="min-h-11 self-start rounded-full border border-white/30 px-4 text-sm font-semibold hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Retry forecast
        </button>
      )}

      {forecast && (
        <ol className="forecast__list">
          {cards.map(({ slot, day }) => (
            <li
              className="forecast__card"
              key={day?.dateKey ?? `missing-${slot}`}
            >
              {day ? (
                <>
                  <p className="text-sm font-semibold">{day.dateLabel}</p>
                  <WeatherIcon
                    conditionCode={day.conditionCode}
                    providerIconCode={day.providerIconCode}
                    className="text-xl text-sky-200"
                  />
                  <p className="dashboard__description text-xs capitalize">
                    {day.description}
                  </p>
                  <p className="text-xs font-semibold tabular-nums">
                    Low {degrees.format(day.lowC)} · High{" "}
                    {degrees.format(day.highC)}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold">Day {slot}</p>
                  <p className="dashboard__description text-xs">
                    Forecast unavailable
                  </p>
                </>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
