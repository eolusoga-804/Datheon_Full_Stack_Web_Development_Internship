// Use project icons for favorite ordering and removal.
import {
  faArrowDown,
  faArrowUp,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { City } from "../../types/city";
import { formatCity } from "../../utils/formatCity";
// Keep reorder feedback available to assistive technology.
import { useState } from "react";
import "./FavoritesPanel.css";

type FavoritesPanelProps = {
  cities: City[];
  storageAvailable: boolean;
  selectedCity: City | null;
  onCitySelect: (city: City) => void;
  onRemoveCity: (cityId: number) => void;
  onMoveCity: (cityId: number, targetIndex: number) => void;
};

// Render the shared favorites list and forward each row action.
export default function FavoritesPanel({
  cities,
  storageAvailable,
  selectedCity,
  onCitySelect,
  onRemoveCity,
  onMoveCity,
}: FavoritesPanelProps) {
  // Announce each requested move without shifting focus away from its control.
  const [orderMessage, setOrderMessage] = useState("");

  function moveFavorite(city: City, targetIndex: number) {
    onMoveCity(city.id, targetIndex);
    setOrderMessage(
      `${formatCity(city)} moved to position ${targetIndex + 1} of ${cities.length}.`,
    );
  }

  return (
    <section
      className="dashboard__panel dashboard__panel--favorites favorites"
      aria-labelledby="favorites-heading"
    >
      <h2 id="favorites-heading" className="text-base font-semibold">
        Favorites
      </h2>

      {/* Keep reorder announcements separate from the visible list. */}
      <p className="sr-only" role="status">
        {orderMessage}
      </p>

      {!storageAvailable && (
        <p className="dashboard__description text-xs" role="status">
          Saved favorites are unavailable. Changes apply to this session only.
        </p>
      )}

      {cities.length === 0 ? (
        <p className="dashboard__description text-sm">
          No favorites yet. Search for a city to save it.
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {cities.map((city, index) => (
            <li key={city.id} className="favorites__item">
              {/* Keep the position visible and identify each item's place in the list. */}
              <span className="favorites__position" aria-hidden="true">
                {index + 1}
              </span>

              {/* Load weather for the saved city. */}
              <button
                type="button"
                aria-current={city.id === selectedCity?.id ? "true" : undefined}
                className="min-h-11 min-w-0 flex-1 rounded-lg px-2 text-left text-sm wrap-anywhere hover:bg-white/10 focus-visible:outline-2 aria-[current=true]:bg-white/15"
                onClick={() => onCitySelect(city)}
              >
                {formatCity(city)}
              </button>

              {/* Provide touch and keyboard alternatives to the upcoming drag interaction. */}
              <div className="favorites__order-controls">
                <button
                  type="button"
                  className="favorites__order-button"
                  aria-label={`Move ${formatCity(city)} up`}
                  aria-disabled={index === 0}
                  onClick={() => {
                    if (index > 0) moveFavorite(city, index - 1);
                  }}
                >
                  <FontAwesomeIcon icon={faArrowUp} aria-hidden="true" />
                </button>

                <button
                  type="button"
                  className="favorites__order-button"
                  aria-label={`Move ${formatCity(city)} down`}
                  aria-disabled={index === cities.length - 1}
                  onClick={() => {
                    if (index < cities.length - 1)
                      moveFavorite(city, index + 1);
                  }}
                >
                  <FontAwesomeIcon icon={faArrowDown} aria-hidden="true" />
                </button>
              </div>

              {/* Remove the favorite through the trash button. */}
              <button
                type="button"
                aria-label={`Remove ${formatCity(city)} from favorites`}
                className="size-11 shrink-0 rounded-lg hover:bg-white/10 focus-visible:outline-2"
                onClick={() => onRemoveCity(city.id)}
              >
                <FontAwesomeIcon icon={faTrashCan} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
