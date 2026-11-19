import { useState } from "react";
import {
  isFavoriteCity,
  readFavorites,
  writeFavorites,
} from "../services/favoriteStorage";
import type { City } from "../types/city";

type FavoritesState = {
  cities: City[];
  storageAvailable: boolean;
};

// Read saved cities once when the dashboard mounts.
function loadFavorites(): FavoritesState {
  try {
    return { cities: readFavorites(), storageAvailable: true };
  } catch {
    return { cities: [], storageAvailable: false };
  }
}

export function useFavorites() {
  const [{ cities, storageAvailable }, setFavorites] = useState(loadFavorites);

  // Keep changes available for the current visit when storage fails.
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

  function saveCity(city: City) {
    if (isFavoriteCity(city) && !cities.some((saved) => saved.id === city.id)) {
      updateFavorites([...cities, city]);
    }
  }

  function removeCity(cityId: number) {
    updateFavorites(cities.filter((city) => city.id !== cityId));
  }

  // Move a saved city to a valid position and persist the updated order.
  function moveCity(cityId: number, targetIndex: number) {
    const sourceIndex = cities.findIndex((city) => city.id === cityId);

    if (
      sourceIndex < 0 ||
      !Number.isInteger(targetIndex) ||
      targetIndex < 0 ||
      targetIndex >= cities.length ||
      sourceIndex === targetIndex
    ) {
      return;
    }

    const next = [...cities];
    const [city] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, city);
    updateFavorites(next);
  }

  // Share all favorite actions with the dashboard.
  return { cities, storageAvailable, saveCity, removeCity, moveCity };
}
