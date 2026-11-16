import type { City } from "../types/city";
import { asRecord, readText } from "./readWeatherPayload.ts";

const REQUEST_TIMEOUT_MS = 10_000;

const WEATHER_CACHE_TTL_MS = 60_000;
const WEATHER_CACHE_LIMIT = 32;

const weatherCache = new Map<string, { payload: unknown; expiresAt: number }>();

export async function requestWeather<T>(
  route: "/api/current-weather" | "/api/forecast",
  location: Pick<City, "latitude" | "longitude">,
  unavailableMessage: string,
  decode: (payload: unknown) => T,
  signal?: AbortSignal,
): Promise<T> {
  const query = new URLSearchParams({
    lat: String(location.latitude),
    lon: String(location.longitude),
  });

  signal?.throwIfAborted();
  const requestUrl = `${route}?${query}`;

  // Reuse recent responses for the same route and coordinates.
  const cached = weatherCache.get(requestUrl);
  if (cached && cached.expiresAt > Date.now() && navigator.onLine !== false) {
    return decode(cached.payload);
  }

  weatherCache.delete(requestUrl);

  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  const requestSignal = signal ? AbortSignal.any([signal, timeout]) : timeout;

  try {
    // Send coordinates to the app server and keep provider credentials there.
    const response = await fetch(requestUrl, {
      signal: requestSignal,
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type") ?? "";
      const body: unknown = contentType.includes("application/json")
        ? await response.json()
        : undefined;

      throw new Error(readText(asRecord(body)?.message) ?? unavailableMessage);
    }

    // Cache only complete responses that pass validation.
    const payload: unknown = await response.json();
    requestSignal.throwIfAborted();
    const result = decode(payload);

    weatherCache.set(requestUrl, {
      payload,
      expiresAt: Date.now() + WEATHER_CACHE_TTL_MS,
    });

    if (weatherCache.size > WEATHER_CACHE_LIMIT) {
      const oldest = weatherCache.keys().next().value;
      if (oldest !== undefined) weatherCache.delete(oldest);
    }

    return result;
  } catch (error) {
    if (signal?.aborted) throw signal.reason;

    if (timeout.aborted) {
      throw new Error("The weather request timed out. Try again.", {
        cause: error,
      });
    }

    if (error instanceof SyntaxError) {
      throw new Error("The weather service returned an unexpected response.", {
        cause: error,
      });
    }

    if (error instanceof TypeError) {
      throw new Error(
        "Could not reach the weather service. Check your connection.",
        { cause: error },
      );
    }

    throw error;
  }
}
