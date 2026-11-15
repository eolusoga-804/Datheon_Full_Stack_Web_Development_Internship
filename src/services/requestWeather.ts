import type { City } from "../types/city";
import { asRecord, readText } from "./readWeatherPayload.ts";

const REQUEST_TIMEOUT_MS = 10_000;

export async function requestWeather(
  route: "/api/current-weather" | "/api/forecast",
  location: Pick<City, "latitude" | "longitude">,
  unavailableMessage: string,
  signal?: AbortSignal,
): Promise<unknown> {
  const query = new URLSearchParams({
    lat: String(location.latitude),
    lon: String(location.longitude),
  });
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  const requestSignal = signal ? AbortSignal.any([signal, timeout]) : timeout;

  try {
    // Send coordinates to the app server and keep provider credentials there.
    const response = await fetch(`${route}?${query}`, {
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

    // Await parsing here so a malformed response uses the same error handling.
    return await response.json();
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
