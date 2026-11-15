import Atmosphere from "./components/Atmosphere/Atmosphere";
import SiteHeader from "./components/SiteHeader/SiteHeader";
import { useState } from "react";
import type { City } from "./types/city";
import CurrentWeatherPanel from "./components/CurrentWeather/CurrentWeatherPanel";
import "./App.css";

// Mount shared branding above the main weather content.
export default function App() {
  const [selectedCity, setSelectedCity] = useState<City | null>(null);

  return (
    <>
      <Atmosphere />

      <SiteHeader onCitySelect={setSelectedCity} />

      <main className="dashboard">
        {/* Keep weather first in both reading and visual order. */}
        <section className="dashboard__panel" aria-labelledby="weather-heading">
          <h2 id="weather-heading" className="text-lg font-semibold">
            Weather
          </h2>
          {selectedCity ? (
            <CurrentWeatherPanel key={selectedCity.id} city={selectedCity} />
          ) : (
            <p className="dashboard__description text-sm">
              Search for a city to get started.
            </p>
          )}
        </section>

        <aside className="dashboard__panel" aria-labelledby="articles-heading">
          <h2 id="articles-heading" className="text-lg font-medium">
            Local articles
          </h2>
          <p className="dashboard__description text-sm">
            Choose a city to explore local articles.
          </p>
        </aside>
      </main>
    </>
  );
}
