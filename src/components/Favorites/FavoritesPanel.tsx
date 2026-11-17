import { faStar, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import {
  isFavoriteCity,
  readFavorites,
  writeFavorites,
} from "../../services/favoriteStorage";
import type { City } from "../../types/city";
import { formatCity } from "../../utils/formatCity";
import "./FavoritesPanel.css";

type FavoritesState = {
  cities: City[];
  storageAvailable: boolean;
};

type FavoritesPanelProps = {
  selectedCity: City | null;
  onCitySelect: (city: City) => void;
};

function loadFavorites(): FavoritesState {
  try {
    return { cities: readFavorites(), storageAvailable: true };
  } catch {
    return { cities: [], storageAvailable: false };
  }
}

export default function FavoritesPanel({
  selectedCity,
  onCitySelect,
}: FavoritesPanelProps) {
  const [{ cities, storageAvailable }, setFavorites] = useState(loadFavorites);
  const canSave = isFavoriteCity(selectedCity);
  const isSaved = cities.some((city) => city.id === selectedCity?.id);

  // Keep favorites usable for the session if browser storage fails.
  function updateFavorites(next: City[]) {
    if (storageAvailable) {
      try {
        writeFavorites(next);
      } catch {
        setFavorites({ cities: next, storageAvailable: false });
        return;
      }
    }

    setFavorites({ cities: next, storageAvailable });
  }

  function saveSelectedCity() {
    if (canSave && !isSaved) updateFavorites([...cities, selectedCity]);
  }

  return (
    <section
      className="dashboard__panel dashboard__panel--favorites favorites"
      aria-labelledby="favorites-heading"
    >
      <h2 id="favorites-heading" className="text-base font-semibold">
        Favorites
      </h2>

      {canSave && (
        <button
          type="button"
          className="favorites__save"
          disabled={isSaved}
          onClick={saveSelectedCity}
        >
          <FontAwesomeIcon icon={faStar} aria-hidden="true" />
          {isSaved ? "City saved" : "Save this city"}
        </button>
      )}

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
          {cities.map((city) => (
            <li key={city.id} className="flex items-center gap-1">
              <button
                type="button"
                aria-current={city.id === selectedCity?.id ? "true" : undefined}
                className="min-h-11 min-w-0 flex-1 rounded-lg px-2 text-left text-sm wrap-anywhere hover:bg-white/10 focus-visible:outline-2 aria-[current=true]:bg-white/15"
                onClick={() => onCitySelect(city)}
              >
                {formatCity(city)}
              </button>
              <button
                type="button"
                aria-label={`Remove ${formatCity(city)} from favorites`}
                className="size-11 shrink-0 rounded-lg hover:bg-white/10 focus-visible:outline-2"
                onClick={() =>
                  updateFavorites(
                    cities.filter((saved) => saved.id !== city.id),
                  )
                }
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
