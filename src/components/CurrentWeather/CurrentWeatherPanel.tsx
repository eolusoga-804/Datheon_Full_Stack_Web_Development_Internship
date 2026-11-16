import { useEffect, useState } from "react";
import { getCurrentWeather } from "../../services/currentWeather";
import type { City } from "../../types/city";
import type { CurrentWeather, Forecast } from "../../types/weather";
import { formatCity } from "../../utils/formatCity";
import WeatherIcon from "../WeatherIcon/WeatherIcon";
import WeatherTimes from "./WeatherTimes";
import WeatherTelemetry from "../WeatherTelemetry/WeatherTelemetry";
import LoadingState from "../LoadingState/LoadingState";

type WeatherResult =
  | { status: "loading" }
  | { status: "ready"; weather: CurrentWeather }
  | { status: "error"; message: string };

export default function CurrentWeatherPanel({
  city,
  forecast,
}: {
  city: City;
  forecast: Forecast | null;
}) {
  const [result, setResult] = useState<WeatherResult>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const { latitude, longitude } = city;

  // Cancel the request when the selected city changes or the panel unmounts.
  useEffect(() => {
    const controller = new AbortController();

    async function loadWeather() {
      try {
        const weather = await getCurrentWeather(
          { latitude, longitude },
          controller.signal,
        );

        if (!controller.signal.aborted) {
          setResult({ status: "ready", weather });
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setResult({
            status: "error",
            message:
              error instanceof Error
                ? error.message
                : "Could not load current weather.",
          });
        }
      }
    }

    void loadWeather();
    return () => controller.abort();
  }, [latitude, longitude, attempt]);

  function retry() {
    setResult({ status: "loading" });
    setAttempt((previous) => previous + 1);
  }

  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-base font-medium">{formatCity(city)}</h3>

      {/* Announce the result without making the retry button part of the status. */}
      <div role="status" className="text-sm">
        {result.status === "loading" && (
          <LoadingState
            message={`Retrieving current weather for ${city.name}…`}
          />
        )}

        {result.status === "error" && <p>{result.message}</p>}

        {result.status === "ready" && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {/* The visible condition text supplies the meaning of the icon. */}
            <WeatherIcon
              conditionCode={result.weather.conditionCode}
              providerIconCode={result.weather.providerIconCode}
              className="shrink-0 text-4xl text-sky-200"
            />

            <div className="min-w-0">
              <p className="text-3xl font-semibold tabular-nums">
                {Math.round(result.weather.temperatureC)} °C
              </p>
              <p className="capitalize">{result.weather.description}</p>

              {result.weather.feelsLikeC !== undefined && (
                <p className="dashboard__description">
                  Feels like {Math.round(result.weather.feelsLikeC)} °C
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Keep the ticking clock outside the live announcement region. */}
      {result.status === "ready" && (
        <WeatherTimes
          timezone={city.timezone}
          weather={result.weather}
          forecast={forecast}
        />
      )}

      {result.status === "ready" && (
        <WeatherTelemetry weather={result.weather} timezone={city.timezone} />
      )}

      {result.status === "ready" && (
        <a
          href="https://openweathermap.org/"
          className="dashboard__description self-start text-xs underline underline-offset-2"
        >
          Weather data provided by OpenWeather
        </a>
      )}

      {result.status === "error" && (
        <button
          type="button"
          onClick={retry}
          className="min-h-11 self-start rounded-full border border-white/30 px-4 text-sm font-semibold hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Retry weather
        </button>
      )}
    </div>
  );
}
