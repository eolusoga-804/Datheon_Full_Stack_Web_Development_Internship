import {
  faChevronDown,
  faGripVertical,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { City } from "../../types/city";
import { formatCity } from "../../utils/formatCity";
import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import "./FavoritesPanel.css";

type FavoritesPanelProps = {
  cities: City[];
  storageAvailable: boolean;
  selectedCity: City | null;
  onCitySelect: (city: City) => void;
  onRemoveCity: (cityId: number) => void;
  onMoveCity: (cityId: number, targetIndex: number) => void;
};

// Match the breakpoint that moves Favorites into the desktop sidebar.
const FAVORITES_DESKTOP_QUERY = "(min-width: 64rem)";

// Subscribe to breakpoint changes without resetting the user's mobile preference.
function subscribeToDesktopLayout(onChange: () => void) {
  const query = window.matchMedia(FAVORITES_DESKTOP_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

// Read the current layout for React's external-store subscription.
function isDesktopLayout() {
  return window.matchMedia(FAVORITES_DESKTOP_QUERY).matches;
}

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

  // Start collapsed on mobile and tablet while keeping the desktop list visible.
  const [isExpanded, setIsExpanded] = useState(false);
  const isDesktop = useSyncExternalStore(
    subscribeToDesktopLayout,
    isDesktopLayout,
  );
  const showFavorites = isDesktop || isExpanded;
  const favoritesBodyId = useId();

  // Preview a drag without changing the saved order until the user drops.
  const [draggedCityId, setDraggedCityId] = useState<number | null>(null);
  const [dropTargetId, setDropTargetId] = useState<number | null>(null);

  const draggedIndex = cities.findIndex((city) => city.id === draggedCityId);

  // Restrict touch drop targets to rows in this Favorites list.
  const listRef = useRef<HTMLUListElement>(null);

  // Remember which city should receive landing feedback after its position changes.
  const landingCityId = useRef<number | null>(null);

  // Animate the moved row after React places it in its new location.
  useLayoutEffect(() => {
    const cityId = landingCityId.current;
    landingCityId.current = null;

    if (cityId === null) return;

    const row = listRef.current?.querySelector<HTMLElement>(
      `[data-favorite-id="${cityId}"]`,
    );

    if (!row) return;

    // Keep a stationary color pulse when reduced motion is requested.
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const animation = row.animate(
      [
        {
          transform: reducedMotion ? "none" : "translateY(-7px)",
          backgroundColor: "rgb(139 92 246 / 35%)",
          boxShadow: "inset 0 0 0 1px #a8c5ff",
        },
        {
          transform: "none",
          backgroundColor: "rgb(96 165 250 / 18%)",
          boxShadow: "inset 0 0 0 1px rgb(168 197 255 / 40%)",
          offset: 0.65,
        },
        {
          transform: "none",
          backgroundColor: "transparent",
          boxShadow: "inset 0 0 0 1px transparent",
        },
      ],
      {
        duration: reducedMotion ? 250 : 550,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    );

    // Cancel unfinished feedback if the list changes again or unmounts.
    return () => animation.cancel();
  }, [cities]);

  const pointerDrag = useRef<{
    pointerId: number;
    city: City;
  } | null>(null);

  // Find the favorite directly beneath a touch or pen pointer.
  function findPointerTarget(clientX: number, clientY: number) {
    const row = document
      .elementFromPoint(clientX, clientY)
      ?.closest<HTMLElement>("[data-favorite-id]");

    if (!row || !listRef.current?.contains(row)) return undefined;

    return cities.find((saved) => String(saved.id) === row.dataset.favoriteId);
  }

  // Capture touch and pen input so releasing outside the handle still ends the drag.
  function startPointerDrag(
    event: ReactPointerEvent<HTMLButtonElement>,
    city: City,
  ) {
    if (
      event.pointerType === "mouse" ||
      !event.isPrimary ||
      event.button !== 0 ||
      cities.length < 2
    ) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    pointerDrag.current = { pointerId: event.pointerId, city };
    setDraggedCityId(city.id);
    setDropTargetId(null);
    setOrderMessage(`Dragging ${formatCity(city)}.`);
  }

  // Update the destination marker without modifying the saved order.
  function movePointerDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    if (pointerDrag.current?.pointerId !== event.pointerId) return;

    const target = findPointerTarget(event.clientX, event.clientY);
    setDropTargetId(target?.id ?? null);
  }

  // Commit only when the pointer is released over another valid favorite.
  function finishPointerDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    const gesture = pointerDrag.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;

    const target = findPointerTarget(event.clientX, event.clientY);

    if (target && target.id !== gesture.city.id) {
      moveFavorite(
        gesture.city,
        cities.findIndex((saved) => saved.id === target.id),
      );
    } else {
      setOrderMessage(`Finished dragging ${formatCity(gesture.city)}.`);
    }

    cancelPointerDrag();
  }

  // A cancelled gesture clears the preview without saving a move.
  function cancelPointerDrag() {
    if (!pointerDrag.current) return;
    pointerDrag.current = null;
    clearDrag();
  }

  // Clear previews after dropping, cancelling, or leaving the application.
  function clearDrag() {
    setDraggedCityId(null);
    setDropTargetId(null);
  }

  // Persist a valid move and mark the city for feedback in its new location.
  function moveFavorite(city: City, targetIndex: number) {
    const sourceIndex = cities.findIndex((saved) => saved.id === city.id);

    if (
      sourceIndex < 0 ||
      !Number.isInteger(targetIndex) ||
      targetIndex < 0 ||
      targetIndex >= cities.length ||
      targetIndex === sourceIndex
    ) {
      return;
    }

    landingCityId.current = city.id;
    onMoveCity(city.id, targetIndex);
    setOrderMessage(`${formatCity(city)} moved in Favorites.`);
  }

  return (
    <section
      className="dashboard__panel dashboard__panel--favorites favorites"
      aria-labelledby="favorites-heading"
    >
      {/* Use a native button for accessible Enter, Space, and touch activation. */}
      <h2 id="favorites-heading" className="text-base font-semibold">
        <button
          type="button"
          className="favorites__toggle"
          aria-expanded={showFavorites}
          aria-controls={favoritesBodyId}
          disabled={isDesktop}
          onClick={() => setIsExpanded((expanded) => !expanded)}
        >
          <span>Favorites</span>
          <FontAwesomeIcon
            icon={faChevronDown}
            className="favorites__chevron"
            aria-hidden="true"
          />
        </button>
      </h2>

      {/* Hide the list and its controls from both display and keyboard navigation. */}
      <div
        id={favoritesBodyId}
        className="favorites__body"
        hidden={!showFavorites}
      >
        {/* Explain both supported desktop input methods on the same handle. */}
        <p id="favorites-reorder-help" className="sr-only">
          Drag this handle onto another favorite, or use Arrow Up and Arrow Down
          while the handle is focused.
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
          <ul ref={listRef} className="flex flex-col gap-1">
            {cities.map((city, index) => (
              <li
                key={city.id}
                className="favorites__item"
                data-dragging={draggedCityId === city.id || undefined}
                data-drop-edge={
                  dropTargetId === city.id && draggedCityId !== city.id
                    ? draggedIndex < index
                      ? "after"
                      : "before"
                    : undefined
                }
                onDragOver={(event) => {
                  // Accept moves only while one of this list's handles is being dragged.
                  if (draggedCityId === null) return;
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                  setDropTargetId(city.id);
                }}
                onDrop={(event) => {
                  // Commit the previewed move through the existing persistence action.
                  if (draggedCityId === null) return;
                  event.preventDefault();

                  const draggedCity = cities.find(
                    (saved) => saved.id === draggedCityId,
                  );

                  if (draggedCity && draggedCity.id !== city.id) {
                    moveFavorite(draggedCity, index);
                  }

                  clearDrag();
                }}
                data-favorite-id={city.id}
              >
                {/* Load weather for the saved city. */}
                <button
                  type="button"
                  aria-current={
                    city.id === selectedCity?.id ? "true" : undefined
                  }
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
                  draggable={cities.length > 1}
                  onDragStart={(event) => {
                    // Prevent native dragging from competing with an active touch gesture.
                    if (pointerDrag.current) {
                      event.preventDefault();
                      return;
                    }
                    // Supply native drag data and show the complete city row as the drag preview.
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("text/plain", String(city.id));

                    const row = event.currentTarget.closest("li");
                    if (row) event.dataTransfer.setDragImage(row, 24, 24);

                    setDraggedCityId(city.id);
                    setDropTargetId(null);
                    setOrderMessage(`Dragging ${formatCity(city)}.`);
                  }}
                  onDragEnd={() => {
                    // A cancelled drag leaves the original saved order intact.
                    clearDrag();
                  }}
                  onPointerDown={(event) => startPointerDrag(event, city)}
                  onPointerMove={movePointerDrag}
                  onPointerUp={finishPointerDrag}
                  onPointerCancel={cancelPointerDrag}
                  onLostPointerCapture={cancelPointerDrag}
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
      </div>
    </section>
  );
}
