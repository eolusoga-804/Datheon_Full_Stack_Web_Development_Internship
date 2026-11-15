import AnnouncementBar from "../AnnouncementBar/AnnouncementBar";
import CitySearch from "../CitySearch/CitySearch";
import type { City } from "../../types/city";
import "./SiteHeader.css";

type SiteHeaderProps = {
  onCitySelect: (city: City) => void;
};

// Use the same brand mark in the header and browser tab.
export default function SiteHeader({ onCitySelect }: SiteHeaderProps) {
  return (
    <header className="site-header">
      <AnnouncementBar />

      <div className="site-header__surface">
        <div className="flex items-center gap-2">
          <img
            src="/favicon.svg"
            alt=""
            width={40}
            height={40}
            className="shrink-0"
          />
          <h1 className="text-xl font-bold">MyForecast</h1>
        </div>

        <CitySearch onCitySelect={onCitySelect} />
      </div>
    </header>
  );
}
