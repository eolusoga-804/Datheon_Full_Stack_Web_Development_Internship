import type { City } from "../types/city";

const FAVORITES_KEY = "myforecast:favorites";

export function isFavoriteCity(value: unknown): value is City {
  if (typeof value !== "object" || value === null) return false;

  const city = value as Partial<City>;

  return (
    typeof city.id === "number" &&
    Number.isSafeInteger(city.id) &&
    city.id > 0 &&
    typeof city.name === "string" &&
    city.name.trim().length > 0 &&
    typeof city.latitude === "number" &&
    Math.abs(city.latitude) <= 90 &&
    typeof city.longitude === "number" &&
    Math.abs(city.longitude) <= 180 &&
    [city.region, city.country, city.timezone].every(
      (field) => field === undefined || typeof field === "string",
    )
  );
}

export function readFavorites(): City[] {
  const raw = localStorage.getItem(FAVORITES_KEY);
  if (raw === null) return [];

  // Validate stored data before using it to look up weather.
  const saved: unknown = JSON.parse(raw);
  if (!Array.isArray(saved) || !saved.every(isFavoriteCity)) {
    throw new Error("The saved favorites could not be read.");
  }

  return [...new Map(saved.map((city) => [city.id, city])).values()];
}

export function writeFavorites(cities: City[]) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(cities));
}
