import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useRef } from "react";
import "./CitySearch.css";

export default function CitySearch() {
  const inputRef = useRef<HTMLInputElement>(null);
  const usesCommand = /Mac|iPhone|iPad|iPod/i.test(navigator.platform);
  const shortcut = usesCommand ? "Meta+K" : "Control+K";

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
    <label className="city-search">
      <span className="sr-only">Search for a city</span>
      <FontAwesomeIcon icon={faMagnifyingGlass} aria-hidden="true" />
      <input
        ref={inputRef}
        type="search"
        className="city-search__input"
        placeholder="Search for a city"
        autoComplete="off"
        aria-keyshortcuts={shortcut}
      />
      <kbd className="city-search__shortcut" aria-hidden="true">
        {usesCommand ? "⌘K" : "Ctrl+K"}
      </kbd>
    </label>
  );
}
