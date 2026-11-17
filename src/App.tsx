import Atmosphere from "./components/Atmosphere/Atmosphere";
import SiteHeader from "./components/SiteHeader/SiteHeader";
import { useRef, useState } from "react";
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
import "./App.css";

// Mount shared branding above the main weather content.
export default function App() {
  const [selectedCity, setSelectedCity] = useState<City | null>(null);

  // Keep the weather action and Favorites panel in sync.
  const { cities, storageAvailable, saveCity, removeCity } = useFavorites();
  const isSelectedCitySaved = cities.some(
    (city) => city.id === selectedCity?.id,
  );

  const locationRequest = useRef(0);
  const [isLocating, setIsLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");

  function selectCity(city: City) {
    // Invalidate a pending location result when the user selects a city.
    locationRequest.current += 1;
    setIsLocating(false);
    setLocationMessage("");
    setSelectedCity(city);
  }

  async function useCurrentLocation() {
    const requestId = ++locationRequest.current;
    setIsLocating(true);
    setLocationMessage("Finding your location…");

    try {
      const coordinates = await getBrowserLocation();
      if (requestId !== locationRequest.current) return;

      // Keep the rounded coordinates in the current dashboard session.
      setSelectedCity({
        id: -1,
        name: "Current location",
        ...coordinates,
      });
      setLocationMessage("");
    } catch (error) {
      if (requestId !== locationRequest.current) return;

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

      <Atmosphere />

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
          {selectedCity && selectedCity.id > 0 ? (
            <LocalArticles key={selectedCity.id} cityName={selectedCity.name} />
          ) : (
            <p className="dashboard__description text-sm">
              Choose a city to explore local weather articles.
            </p>
          )}
        </aside>
      </main>

      <footer className="dashboard-footer">
        <p>Developed by Emmanuel#804</p>
      </footer>
    </>
  );
}
