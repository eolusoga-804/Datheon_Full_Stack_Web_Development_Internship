import Atmosphere from "./components/Atmosphere/Atmosphere";
import SiteHeader from "./components/SiteHeader/SiteHeader";
import "./App.css";

// Mount shared branding above the main weather content.
export default function App() {
  return (
    <>
      <Atmosphere />
      <SiteHeader />
      <main className="dashboard">
        {/* Keep weather first in both reading and visual order. */}
        <section className="dashboard__panel" aria-labelledby="weather-heading">
          <h2 id="weather-heading" className="text-lg font-semibold">
            Weather
          </h2>
          <p className="dashboard__description text-sm">
            Weather forecasts and climate telemetry.
          </p>
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
