import SiteHeader from "./components/SiteHeader/SiteHeader";
import "./App.css";

// Mount shared branding above the main weather content.
export default function App() {
  return (
    <>
      <SiteHeader />
      <main className="dashboard">
        <div className="dashboard__intro">
          <p className="dashboard__description text-sm">
            Weather forecasts and climate telemetry.
          </p>
        </div>
      </main>
    </>
  );
}
