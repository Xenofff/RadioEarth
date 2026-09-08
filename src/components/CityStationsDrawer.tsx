import React, { useState, useMemo } from 'react';
import { X, Play, Volume2, Search, MapPin, Tag } from 'lucide-react';
import { CityGroup, PlaybackStatus, Station } from '../types/radio';

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
      className={`fixed top-0 left-0 bottom-0 z-50 w-full sm:w-96 bg-[#0B0E14]/95 backdrop-blur-xl border-r border-[#16C683]/20 flex flex-col transition-transform duration-300 ease-in-out shadow-2xl ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Header */}
      <div className="p-5 border-b border-white/5 flex items-start justify-between gap-3 bg-[#12161F]/40">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-mono text-[#16C683]">
            <MapPin className="w-3.5 h-3.5" />
            <span className="uppercase tracking-wider">{city.country}</span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1">{city.cityName}</h2>
          <p className="text-xs text-[#8B949E] mt-0.5">
            {city.stations.length} {city.stations.length === 1 ? 'station' : 'stations'} available
          </p>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-lg bg-[#12161F] text-[#8B949E] hover:text-white hover:bg-[#16C683]/20 border border-white/10 transition-colors"
          title="Close drawer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b border-white/5">
        <div className="relative">
          <Search className="w-4 h-4 text-[#8B949E] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search stations or genres..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#12161F] border border-white/10 focus:border-[#16C683] rounded-lg text-sm text-white placeholder-[#8B949E] outline-none transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#8B949E] hover:text-white"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Stations List */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/5 custom-scrollbar pb-24">
        {filteredStations.length === 0 ? (
          <div className="p-8 text-center text-[#8B949E] text-sm">
            No radio stations found matching &quot;{searchQuery}&quot;
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
                    ? 'bg-[#16C683]/10 border-l-4 border-l-[#16C683]'
                    : 'hover:bg-[#12161F]/80 border-l-4 border-l-transparent'
                }`}
              >
                {/* Station Icon or Playing state */}
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border transition-all ${
                    isCurrent
                      ? 'bg-[#16C683] text-[#0B0E14] border-[#16C683] shadow-md shadow-[#16C683]/20'
                      : 'bg-[#12161F] text-[#8B949E] border-white/10 group-hover:border-[#16C683]/50'
                  }`}
                >
                  {isLoading ? (
                    <span className="w-4 h-4 border-2 border-[#0B0E14] border-t-transparent rounded-full animate-spin"></span>
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
                        isCurrent ? 'text-[#16C683]' : 'text-white'
                      }`}
                    >
                      {station.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-mono text-[#8B949E] uppercase">
                      {station.codec || 'MP3'} {station.bitrate ? `${station.bitrate} kbps` : ''}
                    </span>

                    {station.votes > 0 && (
                      <span className="text-[10px] font-mono text-[#8B949E]">
                        ★ {station.votes}
                      </span>
                    )}
                  </div>

                  {station.tags.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      {station.tags.slice(0, 3).map((tag, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-[#8B949E]"
                        >
                          <Tag className="w-2.5 h-2.5 text-[#16C683]/60" />
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
      <div className="p-3 border-t border-white/5 bg-[#0B0E14] text-center text-[11px] font-mono text-[#8B949E]">
        GEO: {city.lat.toFixed(4)}, {city.lng.toFixed(4)}
      </div>
    </aside>
  );
};
