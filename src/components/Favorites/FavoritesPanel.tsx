// Use one grip icon for reordering and retain the separate remove action.
import { faGripVertical, faTrashCan } from "@fortawesome/free-solid-svg-icons";
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

    // Describe the move without introducing numbered positions.
    setOrderMessage(`${formatCity(city)} moved in Favorites.`);
  }

  return (
    <section
      className="dashboard__panel dashboard__panel--favorites favorites"
      aria-labelledby="favorites-heading"
    >
      <h2 id="favorites-heading" className="text-base font-semibold">
        Favorites
      </h2>

      {/* Describe keyboard operation without adding visible controls. */}
      <p id="favorites-reorder-help" className="sr-only">
        Focus a reorder handle and use Arrow Up or Arrow Down to move that city.
      </p>

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
              {/* Load weather for the saved city. */}
              <button
                type="button"
                aria-current={city.id === selectedCity?.id ? "true" : undefined}
                className="min-h-11 min-w-0 flex-1 rounded-lg px-2 text-left text-sm wrap-anywhere hover:bg-white/10 focus-visible:outline-2 aria-[current=true]:bg-white/15"
                onClick={() => onCitySelect(city)}
              >
                {formatCity(city)}
              </button>

              {/* Use one handle for keyboard ordering and the upcoming drag interaction. */}
              <button
                type="button"
                className="favorites__reorder-handle"
                aria-label={`Reorder ${formatCity(city)}`}
                aria-describedby="favorites-reorder-help"
                aria-keyshortcuts="ArrowUp ArrowDown"
                onClick={() => {
                  setOrderMessage(
                    `Use Arrow Up or Arrow Down to reorder ${formatCity(city)}.`,
                  );
                }}
                onKeyDown={(event) => {
                  // Prevent page scrolling only when the handle receives a reorder key.
                  if (event.key !== "ArrowUp" && event.key !== "ArrowDown")
                    return;
                  event.preventDefault();

                  const targetIndex =
                    index + (event.key === "ArrowUp" ? -1 : 1);

                  // Keep the city inside the list and explain when it reaches an edge.
                  if (targetIndex < 0 || targetIndex >= cities.length) {
                    setOrderMessage(
                      `${formatCity(city)} is already ${targetIndex < 0 ? "first" : "last"} in Favorites.`,
                    );
                    return;
                  }

                  moveFavorite(city, targetIndex);
                }}
              >
                <FontAwesomeIcon icon={faGripVertical} aria-hidden="true" />
              </button>

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
