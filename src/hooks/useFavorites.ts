import { useState, useEffect, useCallback } from 'react';
import { CityGroup, FavoriteStation, Station } from '../types/radio';

const STORAGE_KEY = 'radioearth_favorites_v1';

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteStation[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Failed to load favorites from localStorage:', err);
    }
    return [];
  });

  // Persist to localStorage whenever favorites changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch (err) {
      console.warn('Failed to save favorites to localStorage:', err);
    }
  }, [favorites]);

  const isFavorite = useCallback(
    (stationId: string) => {
      return favorites.some((fav) => fav.id === stationId);
    },
    [favorites]
  );

  const toggleFavorite = useCallback(
    (station: Station, city?: CityGroup | null) => {
      setFavorites((prev) => {
        const exists = prev.some((fav) => fav.id === station.id);
        if (exists) {
          return prev.filter((fav) => fav.id !== station.id);
        } else {
          const newFav: FavoriteStation = {
            ...station,
            cityId: city?.id || `${station.lat.toFixed(2)}_${station.lng.toFixed(2)}`,
            cityName: city?.cityName || station.state || station.name.split(/[-–—|:]/)[0].trim() || station.country,
            addedAt: Date.now(),
          };
          return [newFav, ...prev];
        }
      });
    },
    []
  );

  const removeFavorite = useCallback((stationId: string) => {
    setFavorites((prev) => prev.filter((fav) => fav.id !== stationId));
  }, []);

  return {
    favorites,
    isFavorite,
    toggleFavorite,
    removeFavorite,
  };
}
