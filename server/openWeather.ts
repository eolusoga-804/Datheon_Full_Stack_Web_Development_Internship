const OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5/";
const UPSTREAM_TIMEOUT_MS = 8_000;

// Reject missing, empty, or out-of-range coordinates before using API quota.
function parseCoordinate(value: string | null, limit: number): number | null {
  if (!value?.trim()) return null;

  const coordinate = Number(value);
  return Number.isFinite(coordinate) && Math.abs(coordinate) <= limit
    ? coordinate
    : null;
}

// Restrict the proxy to the two weather endpoints the dashboard uses.
export function createOpenWeatherRoute(endpoint: "weather" | "forecast") {
  const label = endpoint === "weather" ? "Current weather" : "Forecast";

  return {
    async fetch(request: Request): Promise<Response> {
      if (request.method !== "GET") {
        return Response.json(
          { message: "Use GET to request weather data." },
          { status: 405, headers: { Allow: "GET" } },
        );
      }

      const { searchParams } = new URL(request.url);
      const latitude = parseCoordinate(searchParams.get("lat"), 90);
      const longitude = parseCoordinate(searchParams.get("lon"), 180);

      if (latitude === null || longitude === null) {
        return Response.json(
          { message: "A valid latitude and longitude are required." },
          { status: 400 },
        );
      }

      // Read the credential only in the server runtime.
      const apiKey = process.env.OPENWEATHER_API_KEY?.trim();
      if (!apiKey) {
        return Response.json(
          { message: "The weather service is not configured." },
          { status: 503 },
        );
      }

      const upstream = new URL(endpoint, OPENWEATHER_BASE_URL);
      upstream.search = new URLSearchParams({
        lat: String(latitude),
        lon: String(longitude),
        units: "metric",
        appid: apiKey,
      }).toString();

      const timeout = AbortSignal.timeout(UPSTREAM_TIMEOUT_MS);

      try {
        const response = await fetch(upstream, { signal: timeout });

        if (response.status === 429) {
          return Response.json(
            {
              message:
                "Weather requests are temporarily limited. Try again shortly.",
            },
            { status: 429 },
          );
        }

        if (!response.ok) {
          return Response.json(
            { message: `${label} is temporarily unavailable.` },
            { status: 502 },
          );
        }

        const weather: unknown = await response.json();
        return Response.json(weather, {
          headers: { "Cache-Control": "no-store" },
        });
      } catch {
        // Keep upstream URLs and credentials out of error responses.
        return Response.json(
          {
            message: timeout.aborted
              ? "The weather request timed out. Try again."
              : "Could not retrieve current weather. Try again shortly.",
          },
          { status: timeout.aborted ? 504 : 502 },
        );
      }
    },
  };
}
