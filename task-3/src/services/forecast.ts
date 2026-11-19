import type { City } from "../types/city";
import type { Forecast } from "../types/weather";
import { normalizeForecast } from "./normalizeForecast.ts";
import { requestWeather } from "./requestWeather.ts";

// Group the returned readings using the selected city's calendar dates.
export async function getForecast(
  city: Pick<City, "latitude" | "longitude" | "timezone">,
  signal?: AbortSignal,
): Promise<Forecast> {
  return requestWeather(
    "/api/forecast",
    city,
    "The forecast is temporarily unavailable. Try again.",
    (payload) => normalizeForecast(payload, city.timezone),
    signal,
  );
}
