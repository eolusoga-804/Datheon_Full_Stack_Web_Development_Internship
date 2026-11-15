import type { City } from "../types/city";
import type { CurrentWeather } from "../types/weather";
import { asRecord, readNumber, readText } from "./readWeatherPayload.ts";
import { requestWeather } from "./requestWeather.ts";

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
  const payload = await requestWeather(
    "/api/current-weather",
    city,
    "Current weather is temporarily unavailable. Try again.",
    signal,
  );

  return normalizeCurrentWeather(payload);
}
