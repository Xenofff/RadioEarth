import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, MapPin, Radio, Heart, CornerDownLeft } from 'lucide-react';
import { CityGroup, Station } from '../types/radio';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../theme/ThemeContext';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  cities: CityGroup[];
  onSelectStation: (city: CityGroup, station: Station) => void;
  isFavorite: (stationId: string) => boolean;
}

interface SearchResultItem {
  type: 'station';
  city: CityGroup;
  station: Station;
}

const POPULAR_GENRES = [
  'Jazz',
  'Classical',
  'Electronic',
  'Techno',
  'Rock',
  'Ambient',
  'Pop',
  'News',
  'Chillout',
  'Reggae',
];

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  cities,
  onSelectStation,
  isFavorite,
}) => {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Compute search results
  const results = useMemo<SearchResultItem[]>(() => {
    const q = query.toLowerCase().trim();
    if (!q) {
      // Default: show top featured stations across major cities
      const featured: SearchResultItem[] = [];
      for (const city of cities) {
        if (featured.length >= 15) break;
        if (city.stations.length > 0) {
          featured.push({
            type: 'station',
            city,
            station: city.stations[0],
          });
        }
      }
      return featured;
    }

    const matches: SearchResultItem[] = [];
    const maxResults = 30;

    for (const city of cities) {
      const cityMatches =
        city.cityName.toLowerCase().includes(q) ||
        city.country.toLowerCase().includes(q) ||
        city.countryCode.toLowerCase() === q;

      for (const station of city.stations) {
        const nameMatch = station.name.toLowerCase().includes(q);
        const tagMatch = station.tags.some((tag) => tag.toLowerCase().includes(q));

        if (nameMatch || tagMatch || cityMatches) {
          matches.push({
            type: 'station',
            city,
            station,
          });
          if (matches.length >= maxResults) {
            return matches;
          }
        }
      }
    }

    return matches;
  }, [cities, query]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (results.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + results.length) % (results.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results[selectedIndex]) {
          const item = results[selectedIndex];
          onSelectStation(item.city, item.station);
          onClose();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onSelectStation, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 px-3 select-none">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Dialog */}
      <div
        className={`relative w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[82vh] backdrop-blur-2xl transition-all duration-200 ${
          isDark
            ? 'bg-[#0B0E14]/95 border-[#16C683]/30 text-white shadow-black/70'
            : 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-300/60'
        }`}
      >
        {/* Search Header Bar */}
        <div
          className={`flex items-center px-4 py-3.5 border-b gap-3 ${
            isDark ? 'border-white/10 bg-[#12161F]/60' : 'border-slate-200 bg-slate-50/80'
          }`}
        >
          <Search
            className={`w-5 h-5 flex-shrink-0 ${
              isDark ? 'text-[#16C683]' : 'text-emerald-600'
            }`}
          />
          <input
            ref={inputRef}
            type="text"
            placeholder={t.searchPlaceholderGlobal}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`flex-1 bg-transparent text-base outline-none tracking-wide ${
              isDark
                ? 'text-white placeholder-[#8B949E]'
                : 'text-slate-900 placeholder-slate-400'
            }`}
          />

          {query && (
            <button
              onClick={() => setQuery('')}
              className={`p-1 rounded-md text-xs transition-colors ${
                isDark
                  ? 'text-[#8B949E] hover:text-white hover:bg-white/10'
                  : 'text-slate-400 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div
            className={`hidden sm:flex items-center gap-1 text-[10px] font-mono px-2 py-1 rounded border ${
              isDark
                ? 'bg-[#0B0E14] text-[#8B949E] border-white/10'
                : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}
          >
            <span>ESC</span>
          </div>
        </div>

        {/* Quick Genre Chips */}
        <div
          className={`px-4 py-2.5 border-b flex items-center gap-1.5 overflow-x-auto custom-scrollbar text-xs ${
            isDark ? 'border-white/5 bg-[#0B0E14]/70' : 'border-slate-100 bg-slate-50/50'
          }`}
        >
          <span
            className={`text-[11px] font-mono font-semibold flex-shrink-0 mr-1 ${
              isDark ? 'text-[#8B949E]' : 'text-slate-500'
            }`}
          >
            {t.quickGenres}
          </span>
          {POPULAR_GENRES.map((genre) => (
            <button
              key={genre}
              onClick={() => setQuery(genre)}
              className={`px-2 py-0.5 rounded-full text-xs font-mono transition-all flex-shrink-0 ${
                query.toLowerCase() === genre.toLowerCase()
                  ? isDark
                    ? 'bg-[#16C683] text-[#0B0E14] font-bold shadow-sm shadow-[#16C683]/30'
                    : 'bg-emerald-600 text-white font-bold'
                  : isDark
                  ? 'bg-white/5 text-[#8B949E] hover:text-white hover:bg-white/10'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>

        {/* Search Results List */}
        <div
          ref={listRef}
          className={`flex-1 overflow-y-auto divide-y custom-scrollbar ${
            isDark ? 'divide-white/5' : 'divide-slate-100'
          }`}
        >
          {results.length === 0 ? (
            <div
              className={`p-12 text-center text-sm ${
                isDark ? 'text-[#8B949E]' : 'text-slate-500'
              }`}
            >
              <p>{t.searchNoResults(query)}</p>
            </div>
          ) : (
            results.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const hasFav = isFavorite(item.station.id);

              return (
                <div
                  key={`${item.city.id}_${item.station.id}`}
                  data-active={isSelected}
                  onClick={() => {
                    onSelectStation(item.city, item.station);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-3.5 sm:px-4 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                    isSelected
                      ? isDark
                        ? 'bg-[#16C683]/15'
                        : 'bg-emerald-50'
                      : isDark
                      ? 'hover:bg-white/5'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Favicon or Radio icon */}
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border overflow-hidden transition-colors ${
                        isSelected
                          ? isDark
                            ? 'bg-[#16C683] text-[#0B0E14] border-[#16C683]'
                            : 'bg-emerald-600 text-white border-emerald-600'
                          : isDark
                          ? 'bg-[#12161F] text-[#16C683] border-white/10'
                          : 'bg-slate-100 text-emerald-600 border-slate-200'
                      }`}
                    >
                      {item.station.favicon ? (
                        <img
                          src={item.station.favicon}
                          alt={item.station.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <Radio className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4
                          className={`text-sm font-semibold truncate ${
                            isSelected
                              ? isDark
                                ? 'text-[#16C683]'
                                : 'text-emerald-800 font-bold'
                              : isDark
                              ? 'text-white'
                              : 'text-slate-900'
                          }`}
                        >
                          {item.station.name}
                        </h4>
                        {hasFav && (
                          <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500 flex-shrink-0" />
                        )}
                      </div>

                      <div
                        className={`flex items-center gap-1.5 text-xs truncate mt-0.5 ${
                          isDark ? 'text-[#8B949E]' : 'text-slate-500'
                        }`}
                      >
                        <MapPin className="w-3 h-3 flex-shrink-0 opacity-75" />
                        <span className="truncate">
                          {item.city.cityName}, {item.city.country}
                        </span>
                        {item.station.codec && (
                          <span className="text-[10px] uppercase font-mono opacity-70">
                            • {item.station.codec} {item.station.bitrate ? `${item.station.bitrate}k` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tags and Enter indicator */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="hidden sm:flex items-center gap-1">
                      {item.station.tags.slice(0, 2).map((t, i) => (
                        <span
                          key={i}
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                            isDark
                              ? 'bg-white/5 text-[#8B949E]'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {t}
                        </span>
                      ))}
                    </div>

                    {isSelected && (
                      <div
                        className={`flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-1 rounded transition-transform ${
                          isDark
                            ? 'text-[#16C683] bg-[#16C683]/10'
                            : 'text-emerald-700 bg-emerald-100'
                        }`}
                      >
                        <span className="hidden sm:inline">ENTER</span>
                        <CornerDownLeft className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div
          className={`px-4 py-2.5 border-t flex items-center justify-between text-[11px] font-mono transition-colors ${
            isDark
              ? 'border-white/5 bg-[#0B0E14] text-[#8B949E]'
              : 'border-slate-200 bg-slate-50 text-slate-500'
          }`}
        >
          <div className="flex items-center gap-3">
            <span>↑↓ НАВИГАЦИЯ</span>
            <span>↵ ПЕРЕЙТИ</span>
            <span>ESC ЗАКРЫТЬ</span>
          </div>
          <div>
            <span>{results.length} РЕЗУЛЬТАТОВ</span>
          </div>
        </div>
      </div>
    </div>
  );
};
