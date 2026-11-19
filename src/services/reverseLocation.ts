import type { City } from "../types/city";

// Return place labels while preserving the browser's original weather coordinates.
type LocationLabels = Pick<City, "name" | "region" | "country">;
const LOCATION_LOOKUP_TIMEOUT_MS = 10_000;

// Validate provider labels before displaying them in the dashboard.
function readLocationLabels(value: unknown): LocationLabels {
  if (typeof value !== "object" || value === null) {
    throw new Error("Location lookup returned an unexpected response.");
  }

  const location = value as Record<string, unknown>;
  if (
    typeof location.name !== "string" ||
    !location.name.trim() ||
    typeof location.country !== "string" ||
    !/^[A-Z]{2}$/.test(location.country)
  ) {
    throw new Error("Location lookup returned an unexpected response.");
  }

  // Match the full country names used by manual city search.
  const countries = new Intl.DisplayNames(["en"], { type: "region" });

  return {
    name: location.name.trim(),
    country: countries.of(location.country) ?? location.country,
    region:
      typeof location.region === "string"
        ? location.region.trim() || undefined
        : undefined,
  };
}

// Resolve a place name through the protected endpoint with cancellation and timeout.
export async function reverseLocation(
  coordinates: Pick<City, "latitude" | "longitude">,
  signal: AbortSignal,
): Promise<LocationLabels> {
  const timeout = AbortSignal.timeout(LOCATION_LOOKUP_TIMEOUT_MS);
  const query = new URLSearchParams({
    lat: String(coordinates.latitude),
    lon: String(coordinates.longitude),
  });

  try {
    const response = await fetch(`/api/reverse-location?${query}`, {
      signal: AbortSignal.any([signal, timeout]),
    });

    if (!response.ok) {
      throw new Error("Could not resolve your place name.");
    }

    const payload: unknown = await response.json();
    const location =
      typeof payload === "object" && payload !== null && "location" in payload
        ? payload.location
        : undefined;

    return readLocationLabels(location);
  } catch (error) {
    if (signal.aborted) throw signal.reason;

    throw new Error(
      timeout.aborted
        ? "Place-name lookup timed out."
        : "Could not resolve your place name.",
      { cause: error },
    );
  }
}
