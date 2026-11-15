import type { City } from "../types/city";
import type { CurrentWeather } from "../types/weather";
import { asRecord, readNumber, readText } from "./readWeatherPayload.ts";

const CURRENT_WEATHER_ROUTE = "/api/current-weather";
const REQUEST_TIMEOUT_MS = 10_000;

// Require enough data for the weather summary and read telemetry independently.
function normalizeCurrentWeather(payload: unknown): CurrentWeather {
  const data = asRecord(payload);
  const main = asRecord(data?.main);
  const conditions = data?.weather;
  const condition = Array.isArray(conditions)
    ? asRecord(conditions[0])
    : undefined;
  const temperatureC = readNumber(main?.temp);
  const conditionCode = readNumber(condition?.id);
  const description = readText(condition?.description);
  const calculatedAtUnix = readNumber(data?.dt);

  if (
    temperatureC === undefined ||
    conditionCode === undefined ||
    !description ||
    calculatedAtUnix === undefined
  ) {
    throw new Error("Current weather returned incomplete data. Try again.");
  }

  const wind = asRecord(data?.wind);
  const sun = asRecord(data?.sys);

  return {
    temperatureC,
    conditionCode,
    description,
    calculatedAtUnix,
    providerIconCode: readText(condition?.icon),
    feelsLikeC: readNumber(main?.feels_like),
    humidityPercent: readNumber(main?.humidity),
    pressureHpa: readNumber(main?.pressure),
    windSpeedMps: readNumber(wind?.speed),
    windDirectionDeg: readNumber(wind?.deg),
    visibilityMeters: readNumber(data?.visibility),
    cloudCoverPercent: readNumber(asRecord(data?.clouds)?.all),
    sunriseUnix: readNumber(sun?.sunrise),
    sunsetUnix: readNumber(sun?.sunset),
    utcOffsetSeconds: readNumber(data?.timezone),
    rainLastHourMm: readNumber(asRecord(data?.rain)?.["1h"]),
    snowLastHourMm: readNumber(asRecord(data?.snow)?.["1h"]),
  };
}

export async function getCurrentWeather(
  city: Pick<City, "latitude" | "longitude">,
  signal?: AbortSignal,
): Promise<CurrentWeather> {
  const query = new URLSearchParams({
    lat: String(city.latitude),
    lon: String(city.longitude),
  });
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  const requestSignal = signal ? AbortSignal.any([signal, timeout]) : timeout;

  try {
    // Send the coordinates to the app's server route.
    const response = await fetch(`${CURRENT_WEATHER_ROUTE}?${query}`, {
      signal: requestSignal,
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type") ?? "";
      const errorBody: unknown = contentType.includes("application/json")
        ? await response.json()
        : undefined;

      throw new Error(
        readText(asRecord(errorBody)?.message) ??
          "Current weather is temporarily unavailable. Try again.",
      );
    }

    const payload: unknown = await response.json();
    return normalizeCurrentWeather(payload);
  } catch (error) {
    if (signal?.aborted) throw signal.reason;

    if (timeout.aborted) {
      throw new Error("The weather request timed out. Try again.", {
        cause: error,
      });
    }

    if (error instanceof SyntaxError) {
      throw new Error("The weather service returned an unexpected response.", {
        cause: error,
      });
    }

    if (error instanceof TypeError) {
      throw new Error(
        "Could not reach the weather service. Check your connection.",
        {
          cause: error,
        },
      );
    }

    throw error;
  }
}
