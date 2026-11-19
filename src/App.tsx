import Atmosphere from "./components/Atmosphere/Atmosphere";
import SiteHeader from "./components/SiteHeader/SiteHeader";
// Cancel pending location lookups when the dashboard unmounts.
import { useEffect, useRef, useState } from "react";
import { getBrowserLocation } from "./services/browserLocation";
import type { City } from "./types/city";
import FavoritesPanel from "./components/Favorites/FavoritesPanel";
import LocalArticles from "./components/LocalArticles/LocalArticles";
import LoadingState from "./components/LoadingState/LoadingState";
import CityWeather from "./components/CityWeather/CityWeather";
import { faStar } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useFavorites } from "./hooks/useFavorites";
import { isFavoriteCity } from "./services/favoriteStorage";
import { formatCity } from "./utils/formatCity";
import InstallInvitation from "./components/InstallInvitation/InstallInvitation";
// Resolve browser coordinates to display labels through the server.
import { reverseLocation } from "./services/reverseLocation";
import "./App.css";

// Mount shared branding above the main weather content.
export default function App() {
  const [selectedCity, setSelectedCity] = useState<City | null>(null);

  // Share favorite selection, removal, and ordering across the dashboard.
  const { cities, storageAvailable, saveCity, removeCity, moveCity } =
    useFavorites();
  const isSelectedCitySaved = cities.some(
    (city) => city.id === selectedCity?.id,
  );

  const locationRequest = useRef(0);

  // Keep detected labels separate from manually searched city identifiers.
  const locationController = useRef<AbortController | null>(null);
  const [detectedPlaceName, setDetectedPlaceName] = useState<string | null>(
    null,
  );

  const articleCityName = selectedCity
    ? selectedCity.id > 0
      ? selectedCity.name
      : detectedPlaceName
    : null;

  // Stop pending reverse lookup when the dashboard unmounts.
  useEffect(() => {
    return () => locationController.current?.abort();
  }, []);

  const [isLocating, setIsLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");

  // Give manual city selection priority over pending location detection.
  function selectCity(city: City) {
    locationRequest.current += 1;
    locationController.current?.abort();
    setDetectedPlaceName(null);
    setIsLocating(false);
    setLocationMessage("");
    setSelectedCity(city);
  }

  // Load weather at detected coordinates and resolve the associated place separately.
  async function useCurrentLocation() {
    const requestId = ++locationRequest.current;
    locationController.current?.abort();

    const controller = new AbortController();
    locationController.current = controller;
    setIsLocating(true);
    setLocationMessage("Finding your location…");

    try {
      const coordinates = await getBrowserLocation();
      if (requestId !== locationRequest.current || controller.signal.aborted)
        return;

      // Start weather immediately and keep rounded coordinates in this visit only.
      const detectedCity: City = {
        id: -1,
        name: "Current location",
        ...coordinates,
      };

      setSelectedCity(detectedCity);
      setDetectedPlaceName(null);
      setLocationMessage("Resolving your place name…");

      try {
        const labels = await reverseLocation(coordinates, controller.signal);
        if (
          requestId !== locationRequest.current ||
          controller.signal.aborted
        ) {
          return;
        }

        // Preserve coordinates so weather continues to represent the detected position.
        setSelectedCity({ ...detectedCity, ...labels });
        setDetectedPlaceName(labels.name);
        setLocationMessage("");
      } catch {
        if (
          requestId !== locationRequest.current ||
          controller.signal.aborted
        ) {
          return;
        }

        // A failed place lookup must not prevent coordinate-based weather from loading.
        setLocationMessage(
          "Weather uses your detected position. Its place name is unavailable; search for a city to view local articles.",
        );
      }
    } catch (error) {
      if (requestId !== locationRequest.current || controller.signal.aborted)
        return;

      setLocationMessage(
        error instanceof Error
          ? error.message
          : "Could not find your location.",
      );
    } finally {
      if (requestId === locationRequest.current) setIsLocating(false);
    }
  }

  return (
    <>
      <a className="dashboard-skip-link" href="#weather-dashboard">
        Skip to weather dashboard
      </a>

      {/* Reserve introductory glow orbs for the dashboard before location selection. */}
      <Atmosphere showOrbs={selectedCity === null} />

      <SiteHeader
        onCitySelect={selectCity}
        onUseLocation={useCurrentLocation}
        isLocating={isLocating}
      />

      <main id="weather-dashboard" className="dashboard" tabIndex={-1}>
        {/* Keep favorite cities first in the mobile layout and keyboard order. */}
        <FavoritesPanel
          cities={cities}
          storageAvailable={storageAvailable}
          selectedCity={selectedCity}
          onCitySelect={selectCity}
          onRemoveCity={removeCity}
          onMoveCity={moveCity}
        />

        <section
          className="dashboard__panel dashboard__panel--weather"
          aria-labelledby="weather-heading"
        >
          <h2 id="weather-heading" className="text-lg font-semibold">
            Weather conditions
          </h2>

          <div
            role="status"
            className={
              locationMessage ? "dashboard__description text-sm" : "sr-only"
            }
          >
            {isLocating ? (
              <LoadingState message={locationMessage} />
            ) : (
              locationMessage
            )}
          </div>

          {selectedCity ? (
            <>
              {/* Keep long city names readable while giving the save action its own space. */}
              <div className="dashboard__city-row">
                <h3
                  className="dashboard__city-name"
                  title={formatCity(selectedCity)}
                >
                  {formatCity(selectedCity)}
                </h3>

                {isFavoriteCity(selectedCity) && (
                  <button
                    type="button"
                    className="favorite-save"
                    disabled={isSelectedCitySaved}
                    onClick={() => saveCity(selectedCity)}
                  >
                    <FontAwesomeIcon icon={faStar} aria-hidden="true" />
                    {isSelectedCitySaved ? "City saved" : "Save this city"}
                  </button>
                )}
              </div>

              <CityWeather
                key={`${selectedCity.id}:${selectedCity.latitude}:${selectedCity.longitude}`}
                city={selectedCity}
              />
            </>
          ) : (
            <p className="dashboard__description text-sm">
              Search for a city to get started.
            </p>
          )}

          <InstallInvitation paused={false} />
        </section>

        <aside
          className="dashboard__panel dashboard__panel--articles"
          aria-labelledby="articles-heading"
        >
          <h2 id="articles-heading" className="text-lg font-medium">
            Local articles
          </h2>
          {articleCityName ? (
            <LocalArticles
              key={`${articleCityName}:${selectedCity?.country ?? ""}`}
              cityName={articleCityName}
            />
          ) : (
            <p className="dashboard__description text-sm">
              Choose a city to explore local weather articles.
            </p>
          )}
        </aside>
      </main>

      {/* Keep developer credit and weather attribution together below the dashboard. */}
      <footer className="dashboard-footer">
        <div className="dashboard-footer__content">
          <p>Developed by Emmanuel#804</p>

          <a
            className="dashboard-footer__link"
            href="https://openweathermap.org/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Weather data provided by OpenWeather
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
      </footer>
    </>
  );
}
