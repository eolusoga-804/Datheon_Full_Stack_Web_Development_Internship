import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { getCurrentWeather } from "../../services/currentWeather";
import type { City } from "../../types/city";
import type { CurrentWeather } from "../../types/weather";
import { formatCity } from "../../utils/formatCity";

type WeatherResult =
  | { status: "loading" }
  | { status: "ready"; weather: CurrentWeather }
  | { status: "error"; message: string };

export default function CurrentWeatherPanel({ city }: { city: City }) {
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
          <p className="flex items-center gap-2">
            <FontAwesomeIcon
              icon={faSpinner}
              aria-hidden="true"
              className="motion-safe:animate-spin"
            />
            Loading current weather…
          </p>
        )}

        {result.status === "error" && <p>{result.message}</p>}

        {result.status === "ready" && (
          <>
            <p className="text-3xl font-semibold tabular-nums">
              {Math.round(result.weather.temperatureC)} °C
            </p>
            <p className="capitalize">{result.weather.description}</p>
          </>
        )}
      </div>

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
