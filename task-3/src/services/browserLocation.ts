import type { City } from "../types/city";

const LOCATION_TIMEOUT_MS = 10_000;
const MAX_LOCATION_AGE_MS = 60_000;
const COORDINATE_SCALE = 100;

export function getBrowserLocation(): Promise<
  Pick<City, "latitude" | "longitude">
> {
  return new Promise((resolve, reject) => {
    if (!globalThis.isSecureContext || !navigator.geolocation) {
      reject(
        new Error("Location detection is unavailable here. Search for a city."),
      );
      return;
    }

    // Request standard accuracy and reduce precision before returning coordinates.
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        resolve({
          latitude:
            Math.round(coords.latitude * COORDINATE_SCALE) / COORDINATE_SCALE,
          longitude:
            Math.round(coords.longitude * COORDINATE_SCALE) / COORDINATE_SCALE,
        });
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(
              new Error("Location permission was denied. Search for a city."),
            );
            break;
          case error.TIMEOUT:
            reject(
              new Error(
                "Location detection timed out. Try again or search for a city.",
              ),
            );
            break;
          default:
            reject(
              new Error(
                "Your location is unavailable. Try again or search for a city.",
              ),
            );
        }
      },
      {
        enableHighAccuracy: false,
        timeout: LOCATION_TIMEOUT_MS,
        maximumAge: MAX_LOCATION_AGE_MS,
      },
    );
  });
}
