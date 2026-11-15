import type { City } from "../types/city";

// Include the region and country to distinguish cities with the same name.
export function formatCity(city: City): string {
  return [
    ...new Set([city.name, city.region, city.country].filter(Boolean)),
  ].join(", ");
}
