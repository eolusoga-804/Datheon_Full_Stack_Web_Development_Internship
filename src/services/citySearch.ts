import type { City } from "../types/city";

const GEOCODING_ENDPOINT = "https://geocoding-api.open-meteo.com/v1/search";
const MAX_SUGGESTIONS = 6;
const TIMEOUT_MS = 8_000;
export const MIN_CITY_QUERY_LENGTH = 2;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readText(value: unknown): string | undefined {
  return typeof value === "string" ? value.trim() || undefined : undefined;
}

// Validate the fields needed to identify and locate a city.
function readCity(value: unknown): City | undefined {
  if (!isRecord(value)) return undefined;

  const { id, latitude, longitude } = value;
  const name = readText(value.name);

  if (
    typeof id !== "number" ||
    !Number.isSafeInteger(id) ||
    !name ||
    typeof latitude !== "number" ||
    !Number.isFinite(latitude) ||
    Math.abs(latitude) > 90 ||
    typeof longitude !== "number" ||
    !Number.isFinite(longitude) ||
    Math.abs(longitude) > 180
  ) {
    return undefined;
  }

  return {
    id,
    name,
    latitude,
    longitude,
    region: readText(value.admin1),
    country: readText(value.country) ?? readText(value.country_code),
    timezone: readText(value.timezone),
  };
}

export async function searchCities(
  query: string,
  signal?: AbortSignal,
): Promise<City[]> {
  const name = query.trim();
  if (name.length < MIN_CITY_QUERY_LENGTH) return [];

  const url = new URL(GEOCODING_ENDPOINT);
  url.search = new URLSearchParams({
    name,
    count: String(MAX_SUGGESTIONS),
    language: "en",
  }).toString();

  // Cancel superseded searches and put a time limit on each request.
  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  const requestSignal = signal ? AbortSignal.any([signal, timeout]) : timeout;

  try {
    const response = await fetch(url, { signal: requestSignal });

    if (response.status === 429) {
      throw new Error("Too many city lookups. Wait a moment and try again.");
    }

    if (!response.ok) {
      throw new Error("City lookup is unavailable. Try again shortly.");
    }

    const payload: unknown = await response.json();

    if (!isRecord(payload) || payload.error === true) {
      throw new Error("City lookup returned an unexpected response.");
    }

    // The provider may omit results when there are no matches.
    if (payload.results === undefined) return [];

    if (!Array.isArray(payload.results)) {
      throw new Error("City lookup returned an unexpected response.");
    }

    const cities = payload.results
      .map(readCity)
      .filter((city): city is City => city !== undefined);

    if (payload.results.length > 0 && cities.length === 0) {
      throw new Error("City lookup returned an unexpected response.");
    }

    return cities;
  } catch (error) {
    if (signal?.aborted) throw signal.reason;

    // Keep the original failure available for debugging.
    if (timeout.aborted) {
      throw new Error("City lookup timed out. Try again.", { cause: error });
    }

    if (error instanceof SyntaxError) {
      throw new Error("City lookup returned an unexpected response.", {
        cause: error,
      });
    }

    if (error instanceof TypeError) {
      throw new Error("Could not reach city lookup. Check your connection.", {
        cause: error,
      });
    }

    throw error;
  }
}
