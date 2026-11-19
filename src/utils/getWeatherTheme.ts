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

// Select a decorative rain intensity from the provider's condition description.
export function getRainIntensity(
  conditionCode: number,
): "light" | "normal" | "heavy" | undefined {
  if (getWeatherCondition(conditionCode) !== "rainy") return undefined;

  // These codes explicitly describe light rain, drizzle, or thunderstorms.
  if ([200, 210, 230, 300, 310, 500, 520].includes(conditionCode)) {
    return "light";
  }

  // These codes explicitly describe heavy or more intense precipitation.
  if (
    [202, 212, 232, 302, 312, 314, 502, 503, 504, 522].includes(conditionCode)
  ) {
    return "heavy";
  }

  // Use the normal visual for remaining rainy conditions.
  return "normal";
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
