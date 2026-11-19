// Keep reverse geocoding credentials and provider requests on the server.
const REVERSE_LOCATION_URL = "https://api.openweathermap.org/geo/1.0/reverse";
const LOCATION_TIMEOUT_MS = 8_000;

// Prevent location responses and error messages from entering shared caches.
function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

// Reject missing and out-of-range coordinates before contacting the provider.
function readCoordinate(value: string | null, limit: number) {
  if (!value?.trim()) return null;

  const coordinate = Number(value);
  return Number.isFinite(coordinate) && Math.abs(coordinate) <= limit
    ? coordinate
    : null;
}

// Expose only validated place labels needed by the dashboard.
function readLocation(value: unknown) {
  if (typeof value !== "object" || value === null) return null;

  const place = value as Record<string, unknown>;
  const name = typeof place.name === "string" ? place.name.trim() : "";
  const country = typeof place.country === "string" ? place.country.trim() : "";

  if (!name || !/^[A-Z]{2}$/.test(country)) return null;

  return {
    name,
    country,
    region:
      typeof place.state === "string"
        ? place.state.trim() || undefined
        : undefined,
  };
}

// Resolve a place name without returning provider URLs or credentials.
export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== "GET") {
      return Response.json(
        { message: "Use GET to resolve a location." },
        {
          status: 405,
          headers: { Allow: "GET", "Cache-Control": "no-store" },
        },
      );
    }

    const parameters = new URL(request.url).searchParams;
    const latitude = readCoordinate(parameters.get("lat"), 90);
    const longitude = readCoordinate(parameters.get("lon"), 180);

    if (latitude === null || longitude === null) {
      return json(
        { message: "A valid latitude and longitude are required." },
        400,
      );
    }

    // Reuse the existing server-side OpenWeather credential.
    const apiKey = process.env.OPENWEATHER_API_KEY?.trim();
    if (!apiKey) {
      return json({ message: "Location lookup is not configured." }, 503);
    }

    const upstream = new URL(REVERSE_LOCATION_URL);
    upstream.search = new URLSearchParams({
      lat: String(latitude),
      lon: String(longitude),
      limit: "1",
      appid: apiKey,
    }).toString();

    const timeout = AbortSignal.timeout(LOCATION_TIMEOUT_MS);

    try {
      const response = await fetch(upstream, { signal: timeout });

      if (response.status === 429) {
        return json(
          { message: "Location lookup is busy. Try again shortly." },
          429,
        );
      }

      if (!response.ok) {
        return json(
          { message: "Location lookup is temporarily unavailable." },
          502,
        );
      }

      // Distinguish an unrecognized location from malformed provider data.
      const payload: unknown = await response.json();

      if (!Array.isArray(payload)) {
        return json(
          { message: "Location lookup returned an unexpected response." },
          502,
        );
      }

      if (payload.length === 0) {
        return json({ message: "No place name was found here." }, 404);
      }

      const location = readLocation(payload[0]);
      if (!location) {
        return json(
          { message: "Location lookup returned an unexpected response." },
          502,
        );
      }

      return json({ location });
    } catch {
      // Keep provider details private while explaining recoverable failures.
      return json(
        {
          message: timeout.aborted
            ? "Location lookup timed out. Try again."
            : "Could not resolve the location. Try again.",
        },
        timeout.aborted ? 504 : 502,
      );
    }
  },
};
