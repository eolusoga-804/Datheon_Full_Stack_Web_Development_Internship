import { faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { City } from "../../types/city";
import { formatCity } from "../../utils/formatCity";
import "./FavoritesPanel.css";

type FavoritesPanelProps = {
  cities: City[];
  storageAvailable: boolean;
  selectedCity: City | null;
  onCitySelect: (city: City) => void;
  onRemoveCity: (cityId: number) => void;
};

// Render the shared favorites list and forward each row action.
export default function FavoritesPanel({
  cities,
  storageAvailable,
  selectedCity,
  onCitySelect,
  onRemoveCity,
}: FavoritesPanelProps) {
  return (
    <section
      className="dashboard__panel dashboard__panel--favorites favorites"
      aria-labelledby="favorites-heading"
    >
      <h2 id="favorites-heading" className="text-base font-semibold">
        Favorites
      </h2>

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
              {/* Load weather for the saved city. */}
              <button
                type="button"
                aria-current={city.id === selectedCity?.id ? "true" : undefined}
                className="min-h-11 min-w-0 flex-1 rounded-lg px-2 text-left text-sm wrap-anywhere hover:bg-white/10 focus-visible:outline-2 aria-[current=true]:bg-white/15"
                onClick={() => onCitySelect(city)}
              >
                {formatCity(city)}
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
