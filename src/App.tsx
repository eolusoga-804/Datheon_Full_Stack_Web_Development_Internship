import Atmosphere from "./components/Atmosphere/Atmosphere";
import SiteHeader from "./components/SiteHeader/SiteHeader";
import { useRef, useState } from "react";
import { getBrowserLocation } from "./services/browserLocation";
import type { City } from "./types/city";

import FavoritesPanel from "./components/Favorites/FavoritesPanel";
import LocalArticles from "./components/LocalArticles/LocalArticles";
import Personalization from "./components/Personalization/Personalization";
import LoadingState from "./components/LoadingState/LoadingState";
import CityWeather from "./components/CityWeather/CityWeather";
import "./App.css";

// Mount shared branding above the main weather content.
export default function App() {
  const [selectedCity, setSelectedCity] = useState<City | null>(null);

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
      <Atmosphere />

      <SiteHeader
        onCitySelect={selectCity}
        onUseLocation={useCurrentLocation}
        isLocating={isLocating}
      />

      <main className="dashboard">
        {/* Keep weather first in both reading and visual order. */}
        <section className="dashboard__panel" aria-labelledby="weather-heading">
          <h2 id="weather-heading" className="text-lg font-semibold">
            Weather
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
            <CityWeather
              key={`${selectedCity.id}:${selectedCity.latitude}:${selectedCity.longitude}`}
              city={selectedCity}
            />
          ) : (
            <p className="dashboard__description text-sm">
              Search for a city to get started.
            </p>
          )}

          <Personalization />

          <FavoritesPanel
            selectedCity={selectedCity}
            onCitySelect={selectCity}
          />
        </section>

        <aside className="dashboard__panel" aria-labelledby="articles-heading">
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
    </>
  );
}
