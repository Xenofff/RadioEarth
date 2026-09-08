import React, { useState, useMemo } from 'react';
import { X, Play, Volume2, Search, MapPin, Tag } from 'lucide-react';
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
}

export const CityStationsDrawer: React.FC<CityStationsDrawerProps> = ({
  isOpen,
  onClose,
  city,
  currentStation,
  playbackStatus,
  onSelectStation,
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
      className={`fixed top-0 left-0 bottom-0 z-50 w-full sm:w-96 backdrop-blur-xl border-r flex flex-col transition-transform duration-300 ease-in-out shadow-2xl ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } ${
        isDark
          ? 'bg-[#0B0E14]/95 border-[#16C683]/20 text-white'
          : 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-300/40'
      }`}
    >
      {/* Header */}
      <div
        className={`p-5 border-b flex items-start justify-between gap-3 transition-colors ${
          isDark ? 'border-white/5 bg-[#12161F]/40' : 'border-slate-200 bg-slate-50/70'
        }`}
      >
        <div>
          <div
            className={`flex items-center gap-1.5 text-xs font-mono ${
              isDark ? 'text-[#16C683]' : 'text-emerald-700'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span className="uppercase tracking-wider">{city.country}</span>
          </div>
          <h2
            className={`text-xl font-bold mt-1 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            {city.cityName}
          </h2>
          <p
            className={`text-xs mt-0.5 ${
              isDark ? 'text-[#8B949E]' : 'text-slate-500'
            }`}
          >
            {t.stationsAvailable(city.stations.length)}
          </p>
        </div>

        <button
          onClick={onClose}
          className={`p-2 rounded-lg border transition-colors ${
            isDark
              ? 'bg-[#12161F] text-[#8B949E] hover:text-white hover:bg-[#16C683]/20 border-white/10'
              : 'bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 border-slate-200'
          }`}
          title={t.closeDrawerTitle}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search Bar */}
      <div
        className={`p-4 border-b ${
          isDark ? 'border-white/5' : 'border-slate-200'
        }`}
      >
        <div className="relative">
          <Search
            className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${
              isDark ? 'text-[#8B949E]' : 'text-slate-400'
            }`}
          />
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-4 py-2 border rounded-lg text-sm outline-none transition-colors ${
              isDark
                ? 'bg-[#12161F] border-white/10 focus:border-[#16C683] text-white placeholder-[#8B949E]'
                : 'bg-slate-100 border-slate-200 focus:border-emerald-600 text-slate-900 placeholder-slate-400'
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-xs ${
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
        className={`flex-1 overflow-y-auto divide-y custom-scrollbar pb-24 ${
          isDark ? 'divide-white/5' : 'divide-slate-200/60'
        }`}
      >
        {filteredStations.length === 0 ? (
          <div
            className={`p-8 text-center text-sm ${
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

            return (
              <div
                key={station.id}
                onClick={() => onSelectStation(station)}
                className={`p-4 flex items-center gap-3 cursor-pointer transition-all duration-150 ${
                  isCurrent
                    ? isDark
                      ? 'bg-[#16C683]/10 border-l-4 border-l-[#16C683]'
                      : 'bg-emerald-50 border-l-4 border-l-emerald-600'
                    : isDark
                    ? 'hover:bg-[#12161F]/80 border-l-4 border-l-transparent'
                    : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                }`}
              >
                {/* Station Icon or Playing state */}
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border transition-all ${
                    isCurrent
                      ? isDark
                        ? 'bg-[#16C683] text-[#0B0E14] border-[#16C683] shadow-md shadow-[#16C683]/20'
                        : 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20'
                      : isDark
                      ? 'bg-[#12161F] text-[#8B949E] border-white/10 group-hover:border-[#16C683]/50'
                      : 'bg-slate-100 text-slate-500 border-slate-200 group-hover:border-emerald-400'
                  }`}
                >
                  {isLoading ? (
                    <span
                      className={`w-4 h-4 border-2 border-t-transparent rounded-full animate-spin ${
                        isCurrent && !isDark ? 'border-white' : 'border-[#0B0E14]'
                      }`}
                    ></span>
                  ) : isPlaying ? (
                    <Volume2 className="w-5 h-5 animate-pulse" />
                  ) : (
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  )}
                </div>

                {/* Station Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3
                      className={`text-sm font-medium truncate ${
                        isCurrent
                          ? isDark
                            ? 'text-[#16C683]'
                            : 'text-emerald-700 font-semibold'
                          : isDark
                          ? 'text-white'
                          : 'text-slate-900'
                      }`}
                    >
                      {station.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`text-[10px] font-mono uppercase ${
                        isDark ? 'text-[#8B949E]' : 'text-slate-500'
                      }`}
                    >
                      {station.codec || 'MP3'} {station.bitrate ? `${station.bitrate} kbps` : ''}
                    </span>

                    {station.votes > 0 && (
                      <span
                        className={`text-[10px] font-mono ${
                          isDark ? 'text-[#8B949E]' : 'text-slate-500'
                        }`}
                      >
                        ★ {station.votes}
                      </span>
                    )}
                  </div>

                  {station.tags.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      {station.tags.slice(0, 3).map((tag, i) => (
                        <span
                          key={i}
                          className={`inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded ${
                            isDark
                              ? 'bg-white/5 text-[#8B949E]'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <Tag
                            className={`w-2.5 h-2.5 ${
                              isDark ? 'text-[#16C683]/60' : 'text-emerald-600'
                            }`}
                          />
                          {tag}
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
        className={`p-3 border-t text-center text-[11px] font-mono transition-colors ${
          isDark
            ? 'border-white/5 bg-[#0B0E14] text-[#8B949E]'
            : 'border-slate-200 bg-slate-50 text-slate-500'
        }`}
      >
        GEO: {city.lat.toFixed(4)}, {city.lng.toFixed(4)}
      </div>
    </aside>
  );
};
