import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { MIN_CITY_QUERY_LENGTH, searchCities } from "../../services/citySearch";
import type { City } from "../../types/city";
import { formatCity } from "../../utils/formatCity";
import "./CitySearch.css";

const SEARCH_DELAY_MS = 300;

type SearchResult =
  | { cities: City[]; error?: never }
  | { cities?: never; error: string };

type CitySearchProps = {
  onCitySelect: (city: City) => void;
};

export default function CitySearch({ onCitySelect }: CitySearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const usesCommand = /Mac|iPhone|iPad|iPod/i.test(navigator.platform);
  const shortcut = usesCommand ? "Meta+K" : "Control+K";

  const listboxId = useId();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const searchTerm = query.trim();
  const canSearch = isOpen && searchTerm.length >= MIN_CITY_QUERY_LENGTH;
  const cities = result?.cities ?? [];
  const showList = canSearch && cities.length > 0;

  const status = !isOpen
    ? ""
    : (result?.error ??
      (canSearch && !result
        ? "Searching for cities…"
        : canSearch && cities.length === 0
          ? "No cities found. Try a different name."
          : ""));

  const activeOptionId =
    showList && activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined;

  // Debounce typing and cancel requests when the query changes or closes.
  useEffect(() => {
    if (!canSearch) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const matches = await searchCities(searchTerm, controller.signal);
        if (!controller.signal.aborted) setResult({ cities: matches });
      } catch (error) {
        if (!controller.signal.aborted) {
          setResult({
            error:
              error instanceof Error ? error.message : "City lookup failed.",
          });
        }
      }
    }, SEARCH_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [canSearch, searchTerm]);

  // Keep the highlighted option visible in the scrollable suggestion list.
  useEffect(() => {
    if (activeOptionId) {
      document
        .getElementById(activeOptionId)
        ?.scrollIntoView({ block: "nearest" });
    }
  }, [activeOptionId]);

  function closeSuggestions() {
    setIsOpen(false);
    setActiveIndex(-1);
    setResult(null);
  }

  // Send the chosen location to the dashboard from every selection method.
  function selectCity(city: City) {
    setQuery(formatCity(city));
    closeSuggestions();
    onCitySelect(city);
  }

  function handleSearchKey(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) return;

    if (event.key === "Escape" && isOpen) {
      event.preventDefault();
      closeSuggestions();
      return;
    }

    if (event.key === "ArrowDown" && !isOpen) {
      event.preventDefault();
      setIsOpen(true);
      return;
    }

    if (!showList) return;

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => {
        if (event.key === "ArrowDown") return (index + 1) % cities.length;
        return index <= 0 ? cities.length - 1 : index - 1;
      });
    }

    const activeCity = cities[activeIndex];
    if (event.key === "Enter" && activeCity) {
      event.preventDefault();
      selectCity(activeCity);
    }
  }

  // Give the header search priority over the browser shortcut when delivered.
  useEffect(() => {
    function focusSearch(event: KeyboardEvent) {
      const hasModifier = usesCommand
        ? event.metaKey && !event.ctrlKey
        : event.ctrlKey && !event.metaKey;

      if (
        event.defaultPrevented ||
        !hasModifier ||
        event.altKey ||
        event.shiftKey ||
        event.key.toLowerCase() !== "k"
      ) {
        return;
      }

      event.preventDefault();
      inputRef.current?.focus();
    }

    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, [usesCommand]);

  return (
    <div className="city-search">
      <label className="city-search__field">
        <span className="sr-only">Search for a city</span>
        <FontAwesomeIcon icon={faMagnifyingGlass} aria-hidden="true" />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          className="city-search__input"
          placeholder="Search for a city"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={showList}
          aria-controls={showList ? listboxId : undefined}
          aria-activedescendant={activeOptionId}
          aria-keyshortcuts={shortcut}
          value={query}
          onChange={(event) => {
            const nextQuery = event.target.value;
            if (nextQuery.trim() !== searchTerm) {
              setResult(null);
              setActiveIndex(-1);
            }
            setQuery(nextQuery);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={closeSuggestions}
          onKeyDown={handleSearchKey}
        />
        <kbd className="city-search__shortcut" aria-hidden="true">
          {usesCommand ? "⌘K" : "Ctrl+K"}
        </kbd>
      </label>

      {/* Keep the live region mounted so assistive technology hears updates. */}
      <p className="sr-only" role="status">
        {status ||
          (showList ? `${cities.length} city suggestions available.` : "")}
      </p>

      {status && (
        <p
          className="city-search__popup city-search__message"
          aria-hidden="true"
        >
          {status}
        </p>
      )}

      {showList && (
        <ul
          id={listboxId}
          className="city-search__popup"
          role="listbox"
          aria-label="City suggestions"
        >
          {cities.map((city, index) => (
            <li
              key={city.id}
              id={`${listboxId}-${index}`}
              className="city-search__option"
              role="option"
              aria-selected={activeIndex === index}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectCity(city)}
            >
              {formatCity(city)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
