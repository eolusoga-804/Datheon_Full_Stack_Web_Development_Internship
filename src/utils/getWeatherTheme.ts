import type { CurrentWeather } from "../types/weather";
import { createCityTimeFormatter } from "./createCityTimeFormatter.ts";

export type WeatherTheme = "sunny" | "cloudy" | "rainy" | "night";

// Keep the weather condition separate from the city’s daylight state.
export function getWeatherCondition(conditionCode: number) {
  const group = Math.floor(conditionCode / 100);

  if (group === 2 || group === 3 || group === 5) return "rainy";
  if (conditionCode === 800 || conditionCode === 801) return "sunny";
  return "cloudy";
}

export function getWeatherTheme(
  weather: CurrentWeather,
  timezone: string | undefined,
  now: Date,
): WeatherTheme {
  const { sunriseUnix, sunsetUnix, providerIconCode, conditionCode } = weather;
  let isNight = providerIconCode?.endsWith("n") === true;

  // Use the selected city's sun times when today's readings are available.
  if (sunriseUnix !== undefined && sunsetUnix !== undefined) {
    const sunrise = new Date(sunriseUnix * 1_000);
    const sunset = new Date(sunsetUnix * 1_000);
    const localDate = createCityTimeFormatter(
      timezone,
      weather.utcOffsetSeconds,
      {
        dateStyle: "short",
      },
    );

    if (
      localDate.usesLocalTime &&
      sunrise < sunset &&
      localDate.format(sunrise) === localDate.format(now) &&
      localDate.format(sunset) === localDate.format(now)
    ) {
      isNight = now < sunrise || now >= sunset;
    }
  }

  return isNight ? "night" : getWeatherCondition(conditionCode);
}
