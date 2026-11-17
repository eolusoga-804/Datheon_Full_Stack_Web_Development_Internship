import AnnouncementBar from "../AnnouncementBar/AnnouncementBar";
import CitySearch from "../CitySearch/CitySearch";
import type { City } from "../../types/city";
import { faLocationCrosshairs } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./SiteHeader.css";

type SiteHeaderProps = {
  onCitySelect: (city: City) => void;
  onUseLocation: () => void;
  isLocating: boolean;
};

// Use the same brand mark in the header and browser tab.
export default function SiteHeader({
  onCitySelect,
  onUseLocation,
  isLocating,
}: SiteHeaderProps) {
  return (
    <header className="site-header">
      <AnnouncementBar />

      <div className="site-header__surface">
        {/* Keep the logo and title together as the header adapts to screen width. */}
        <div className="site-header__brand">
          <img src="/favicon.svg" alt="" width={40} height={40} />
          <h1 className="site-header__title">MyForecast</h1>
        </div>

        <CitySearch onCitySelect={onCitySelect} />

        {/* Match the visual order to the keyboard order on every screen. */}
        <button
          type="button"
          className="site-header__location"
          disabled={isLocating}
          onClick={onUseLocation}
        >
          <FontAwesomeIcon icon={faLocationCrosshairs} aria-hidden="true" />
          <span>{isLocating ? "Finding location…" : "Use my location"}</span>
        </button>
      </div>
    </header>
  );
}
