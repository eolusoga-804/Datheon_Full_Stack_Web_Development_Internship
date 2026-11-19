import AnnouncementBar from "../AnnouncementBar/AnnouncementBar";
import CitySearch from "../CitySearch/CitySearch";
import type { City } from "../../types/city";
import { faLocationCrosshairs } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./SiteHeader.css";
import { useLayoutEffect, useRef } from "react";

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
  // Keep the dashboard's top offset synchronized with the actual header height.
  const headerRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const root = document.documentElement;

    function updateHeaderHeight() {
      if (!header) return;

      root.style.setProperty(
        "--header-stack-height",
        `${Math.ceil(header.getBoundingClientRect().height)}px`,
      );
    }

    updateHeaderHeight();
    const observer = new ResizeObserver(updateHeaderHeight);
    observer.observe(header);

    // Remove the measurement when the header unmounts.
    return () => {
      observer.disconnect();
      root.style.removeProperty("--header-stack-height");
    };
  }, []);

  return (
    <header ref={headerRef} className="site-header">
      <AnnouncementBar />

      <div className="site-header__surface">
        {/* Keep the logo and title together as the header adapts to screen width. */}
        <div className="site-header__brand">
          <img src="/favicon.svg" alt="" width={40} height={40} />
          <h1 className="site-header__title">MyForecast</h1>
        </div>

        {/* Keep search before location in both visual and keyboard order. */}
        <div className="site-header__controls">
          <CitySearch onCitySelect={onCitySelect} />

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
      </div>
    </header>
  );
}
