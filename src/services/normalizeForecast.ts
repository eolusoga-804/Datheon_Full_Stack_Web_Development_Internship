import type { Forecast } from "../types/weather";
import { createCityTimeFormatter } from "../utils/createCityTimeFormatter.ts";
import { asRecord, readNumber, readText } from "./readWeatherPayload.ts";

export const FORECAST_DAY_COUNT = 5;

type ForecastSample = {
  timeMs: number;
  temperatureC: number;
  conditionCode: number;
  description: string;
  providerIconCode?: string;
};

// Read the timestamp, metric temperature, and primary condition.
function readSample(value: unknown): ForecastSample | undefined {
  const sample = asRecord(value);
  const unixSeconds = readNumber(sample?.dt);
  const temperatureC = readNumber(asRecord(sample?.main)?.temp);
  const weather = sample?.weather;
  const condition = Array.isArray(weather) ? asRecord(weather[0]) : undefined;
  const conditionCode = readNumber(condition?.id);
  const description = readText(condition?.description);

  if (
    unixSeconds === undefined ||
    temperatureC === undefined ||
    conditionCode === undefined ||
    !description
  ) {
    return undefined;
  }

  const timeMs = new Date(unixSeconds * 1_000).getTime();
  if (!Number.isFinite(timeMs)) return undefined;

  return {
    timeMs,
    temperatureC,
    conditionCode,
    description,
    providerIconCode: readText(condition?.icon),
  };
}

export function normalizeForecast(
  payload: unknown,
  timezone?: string,
): Forecast {
  const data = asRecord(payload);
  if (!Array.isArray(data?.list)) {
    throw new Error("The forecast service returned an unexpected response.");
  }

  const samples = data.list
    .map(readSample)
    .filter((sample): sample is ForecastSample => sample !== undefined)
    .sort((a, b) => a.timeMs - b.timeMs);

  if (samples.length === 0) {
    throw new Error("No forecast readings are available. Try again.");
  }

  const utcOffset = readNumber(asRecord(data.city)?.timezone);
  const dateKey = createCityTimeFormatter(timezone, utcOffset, {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
  const dateLabel = createCityTimeFormatter(timezone, utcOffset, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  // Sort before grouping so the first five groups are the earliest dates.
  const groups = new Map<string, ForecastSample[]>();
  for (const sample of samples) {
    const key = dateKey.format(new Date(sample.timeMs));
    const existing = groups.get(key);

    if (existing) {
      existing.push(sample);
    } else {
      groups.set(key, [sample]);
    }
  }

  const days = [...groups.entries()]
    .slice(0, FORECAST_DAY_COUNT)
    .map(([key, readings]) => {
      const representative = readings[Math.floor(readings.length / 2)];
      const temperatures = readings.map((reading) => reading.temperatureC);

      return {
        dateKey: key,
        dateLabel: dateLabel.format(new Date(representative.timeMs)),
        lowC: Math.min(...temperatures),
        highC: Math.max(...temperatures),
        conditionCode: representative.conditionCode,
        description: representative.description,
        providerIconCode: representative.providerIconCode,
      };
    });

  return { days, usesLocalTime: dateKey.usesLocalTime };
}
