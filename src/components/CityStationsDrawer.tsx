import React, { useState, useMemo } from 'react';
import { X, Play, Volume2, Search, MapPin, Tag, Heart } from 'lucide-react';
import { CityGroup, PlaybackStatus, Station } from '../types/radio';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../theme/ThemeContext';

interface CityStationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  city: CityGroup | null;
  currentStation: Station | null;
  playbackStatus: PlaybackStatus;
  onSelectStation: (station: Station) => void;
  isFavorite: (stationId: string) => boolean;
  onToggleFavorite: (station: Station) => void;
}

export const CityStationsDrawer: React.FC<CityStationsDrawerProps> = ({
  isOpen,
  onClose,
  city,
  currentStation,
  playbackStatus,
  onSelectStation,
  isFavorite,
  onToggleFavorite,
}) => {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter stations based on search query (name or tags)
  const filteredStations = useMemo(() => {
    if (!city) return [];
    if (!searchQuery.trim()) return city.stations;

    const query = searchQuery.toLowerCase().trim();
    return city.stations.filter(
      (station) =>
        station.name.toLowerCase().includes(query) ||
        station.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [city, searchQuery]);

  if (!city) return null;

  return (
    <aside
      className={`fixed left-3 sm:left-4 z-30 w-[calc(100vw-24px)] sm:w-[310px] md:w-[320px] max-w-[340px] backdrop-blur-xl border rounded-2xl flex flex-col transition-all duration-300 ease-in-out shadow-2xl overflow-hidden ${
        isOpen
          ? 'translate-x-0 opacity-100 pointer-events-auto'
          : '-translate-x-full sm:-translate-x-8 opacity-0 pointer-events-none'
      } ${
        isDark
          ? 'bg-[#0B0E14]/95 border-[#16C683]/25 text-white shadow-black/60'
          : 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-300/40'
      }`}
      style={{
        top: 'max(64px, calc(env(safe-area-inset-top, 16px) + 50px))',
        bottom: 'max(84px, calc(env(safe-area-inset-bottom, 16px) + 72px))',
      }}
    >
      {/* Header */}
      <div
        className={`p-3.5 sm:p-4 border-b flex items-start justify-between gap-2.5 transition-colors ${
          isDark ? 'border-white/5 bg-[#12161F]/60' : 'border-slate-200 bg-slate-50/80'
        }`}
      >
        <div className="min-w-0 flex-1">
          <div
            className={`flex items-center gap-1.5 text-[10px] font-mono leading-none ${
              isDark ? 'text-[#16C683]' : 'text-emerald-700'
            }`}
          >
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="uppercase tracking-wider truncate">{city.country}</span>
          </div>
          <h2
            className={`text-base font-bold mt-1 truncate ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            {city.cityName}
          </h2>
          <p
            className={`text-[11px] mt-0.5 ${
              isDark ? 'text-[#8B949E]' : 'text-slate-500'
            }`}
          >
            {t.stationsAvailable(city.stations.length)}
          </p>
        </div>

        <button
          onClick={onClose}
          className={`p-1.5 rounded-lg border transition-colors flex-shrink-0 ${
            isDark
              ? 'bg-[#12161F] text-[#8B949E] hover:text-white hover:bg-[#16C683]/20 border-white/10'
              : 'bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 border-slate-200'
          }`}
          title={t.closeDrawerTitle}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Search Bar */}
      <div
        className={`p-2.5 border-b ${
          isDark ? 'border-white/5' : 'border-slate-200'
        }`}
      >
        <div className="relative">
          <Search
            className={`w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 ${
              isDark ? 'text-[#8B949E]' : 'text-slate-400'
            }`}
          />
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-8 pr-4 py-1.5 border rounded-lg text-xs outline-none transition-colors ${
              isDark
                ? 'bg-[#12161F] border-white/10 focus:border-[#16C683] text-white placeholder-[#8B949E]'
                : 'bg-slate-100 border-slate-200 focus:border-emerald-600 text-slate-900 placeholder-slate-400'
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className={`absolute right-2 top-1/2 -translate-y-1/2 text-[10px] ${
                isDark ? 'text-[#8B949E] hover:text-white' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {t.clearBtn}
            </button>
          )}
        </div>
      </div>

      {/* Stations List */}
      <div
        className={`flex-1 overflow-y-auto divide-y custom-scrollbar ${
          isDark ? 'divide-white/5' : 'divide-slate-200/60'
        }`}
      >
        {filteredStations.length === 0 ? (
          <div
            className={`p-6 text-center text-xs ${
              isDark ? 'text-[#8B949E]' : 'text-slate-500'
            }`}
          >
            {t.noStationsFound(searchQuery)}
          </div>
        ) : (
          filteredStations.map((station) => {
            const isCurrent = currentStation?.id === station.id;
            const isPlaying = isCurrent && playbackStatus === 'playing';
            const isLoading = isCurrent && playbackStatus === 'loading';
            const isFav = isFavorite(station.id);

            return (
              <div
                key={station.id}
                onClick={() => onSelectStation(station)}
                className={`p-2.5 px-3 flex items-center gap-2.5 cursor-pointer transition-all duration-150 ${
                  isCurrent
                    ? isDark
                      ? 'bg-[#16C683]/10 border-l-[3px] border-l-[#16C683]'
                      : 'bg-emerald-50 border-l-[3px] border-l-emerald-600'
                    : isDark
                    ? 'hover:bg-[#12161F]/80 border-l-[3px] border-l-transparent'
                    : 'hover:bg-slate-50 border-l-[3px] border-l-transparent'
                }`}
              >
                {/* Station Icon or Playing state */}
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border transition-all ${
                    isCurrent
                      ? isDark
                        ? 'bg-[#16C683] text-[#0B0E14] border-[#16C683] shadow-sm shadow-[#16C683]/20'
                        : 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-500/20'
                      : isDark
                      ? 'bg-[#12161F] text-[#8B949E] border-white/10'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}
                >
                  {isLoading ? (
                    <span
                      className={`w-3.5 h-3.5 border-2 border-t-transparent rounded-full animate-spin ${
                        isCurrent && !isDark ? 'border-white' : 'border-[#0B0E14]'
                      }`}
                    ></span>
                  ) : isPlaying ? (
                    <Volume2 className="w-4 h-4 animate-pulse" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  )}
                </div>

                {/* Station Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1.5">
                    <h3
                      className={`text-xs font-semibold truncate ${
                        isCurrent
                          ? isDark
                            ? 'text-[#16C683]'
                            : 'text-emerald-700 font-bold'
                          : isDark
                          ? 'text-white'
                          : 'text-slate-900'
                      }`}
                    >
                      {station.name}
                    </h3>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(station);
                      }}
                      className={`p-1 rounded transition-all active:scale-125 flex-shrink-0 ${
                        isFav
                          ? 'text-rose-500 hover:text-rose-400'
                          : isDark
                          ? 'text-[#8B949E]/40 hover:text-rose-400 hover:bg-white/5'
                          : 'text-slate-300 hover:text-rose-500 hover:bg-slate-100'
                      }`}
                      title={isFav ? t.removeFromFavorites : t.addToFavorites}
                    >
                      <Heart
                        className={`w-3.5 h-3.5 transition-transform duration-150 ${
                          isFav ? 'fill-rose-500 text-rose-500 scale-110' : ''
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className={`text-[9px] font-mono uppercase ${
                        isDark ? 'text-[#8B949E]' : 'text-slate-500'
                      }`}
                    >
                      {station.codec || 'MP3'} {station.bitrate ? `${station.bitrate}k` : ''}
                    </span>

                    {station.votes > 0 && (
                      <span
                        className={`text-[9px] font-mono ${
                          isDark ? 'text-[#8B949E]' : 'text-slate-500'
                        }`}
                      >
                        ★ {station.votes}
                      </span>
                    )}
                  </div>

                  {station.tags.length > 0 && (
                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                      {station.tags.slice(0, 2).map((tag, i) => (
                        <span
                          key={i}
                          className={`inline-flex items-center gap-0.5 text-[8.5px] px-1.5 py-0.2 rounded font-mono truncate max-w-[90px] ${
                            isDark
                              ? 'bg-white/5 text-[#8B949E]'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <Tag
                            className={`w-2 h-2 ${
                              isDark ? 'text-[#16C683]/60' : 'text-emerald-600'
                            }`}
                          />
                          <span className="truncate">{tag}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Drawer Footer Info */}
      <div
        className={`p-2 border-t text-center text-[10px] font-mono transition-colors ${
          isDark
            ? 'border-white/5 bg-[#0B0E14] text-[#8B949E]'
            : 'border-slate-200 bg-slate-50 text-slate-500'
        }`}
      >
        GEO: {city.lat.toFixed(2)}°, {city.lng.toFixed(2)}°
      </div>
    </aside>
  );
};
