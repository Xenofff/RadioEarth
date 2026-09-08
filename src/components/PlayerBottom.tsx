import React from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Radio,
  SkipBack,
  SkipForward,
  AlertCircle,
  Loader2,
  ListMusic,
} from 'lucide-react';
import { PlaybackStatus, Station } from '../types/radio';
import { useLanguage } from '../i18n/LanguageContext';

interface PlayerBottomProps {
  station: Station | null;
  playbackStatus: PlaybackStatus;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  errorMessage: string | null;
  stationsInCityCount?: number;
  onTogglePlay: () => void;
  onSetVolume: (vol: number) => void;
  onToggleMute: () => void;
  onPrevStation: () => void;
  onNextStation: () => void;
  hasMultipleStations: boolean;
  onOpenDrawer: () => void;
}

export const PlayerBottom: React.FC<PlayerBottomProps> = ({
  station,
  playbackStatus,
  isPlaying,
  volume,
  isMuted,
  errorMessage,
  stationsInCityCount,
  onTogglePlay,
  onSetVolume,
  onToggleMute,
  onPrevStation,
  onNextStation,
  hasMultipleStations,
  onOpenDrawer,
}) => {
  const { t } = useLanguage();

  if (!station) {
    return null;
  }

  const renderStatus = () => {
    switch (playbackStatus) {
      case 'loading':
        return (
          <div className="flex items-center gap-1.5 text-[11px] text-amber-400 font-mono">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>{t.buffering}</span>
          </div>
        );
      case 'playing':
        return (
          <div className="flex items-center gap-2 text-[11px] text-[#16C683] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16C683] animate-pulse"></span>
            <span className="font-semibold">{t.onAir}</span>
            {/* Minimalist Equalizer Wave */}
            <div className="flex items-end gap-0.5 h-2.5 ml-0.5">
              <span className="w-0.5 bg-[#16C683] h-full animate-wave-1 rounded-full"></span>
              <span className="w-0.5 bg-[#16C683] h-full animate-wave-2 rounded-full"></span>
              <span className="w-0.5 bg-[#16C683] h-full animate-wave-3 rounded-full"></span>
              <span className="w-0.5 bg-[#16C683] h-full animate-wave-4 rounded-full"></span>
            </div>
          </div>
        );
      case 'error':
        return (
          <div
            className="flex items-center gap-1.5 text-[11px] text-rose-400 font-mono"
            title={errorMessage || t.streamOffline}
          >
            <AlertCircle className="w-3 h-3" />
            <span className="truncate max-w-[160px]">{t.streamOffline}</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 text-[11px] text-[#8B949E] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8B949E]"></span>
            <span>{t.paused}</span>
          </div>
        );
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0B0E14]/95 backdrop-blur-xl border-t border-[#16C683]/25 px-3 py-2.5 md:px-6 md:py-3 shadow-2xl">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
        {/* Module 1: Station Information */}
        <div
          onClick={onOpenDrawer}
          className="flex items-center gap-3 w-full md:w-1/3 cursor-pointer group select-none min-w-0"
          title={t.viewCityStationsTitle}
        >
          <div className="relative w-11 h-11 flex-shrink-0 rounded-lg bg-[#12161F] border border-[#16C683]/30 flex items-center justify-center overflow-hidden group-hover:border-[#16C683] transition-colors shadow-inner">
            {station.favicon ? (
              <img
                src={station.favicon}
                alt={station.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <Radio className="w-5 h-5 text-[#16C683]" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-white truncate group-hover:text-[#16C683] transition-colors leading-snug">
              {station.name}
            </h4>

            <div className="text-xs text-[#8B949E] truncate leading-tight mt-0.5">
              {station.state ? `${station.state}, ` : ''}
              {station.country}
            </div>

            <div className="mt-1 flex items-center gap-2">
              {renderStatus()}
              {station.codec && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#12161F] text-[#8B949E] border border-white/5 uppercase">
                  {station.codec} {station.bitrate ? `${station.bitrate}k` : ''}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Module 2: Playback Control Bar */}
        <div className="flex items-center gap-3 bg-[#12161F]/80 px-4 py-1.5 rounded-full border border-white/5 shadow-md">
          <button
            onClick={onPrevStation}
            disabled={!hasMultipleStations}
            className="p-1.5 text-[#8B949E] hover:text-[#16C683] disabled:opacity-25 disabled:hover:text-[#8B949E] transition-colors"
            title={t.prevStationTitle}
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {/* Main Play/Pause Button */}
          <button
            onClick={onTogglePlay}
            disabled={playbackStatus === 'loading'}
            className="w-10 h-10 rounded-full bg-[#16C683] text-[#0B0E14] hover:bg-[#2FE29C] transition-all flex items-center justify-center shadow-lg shadow-[#16C683]/30 hover:scale-105 active:scale-95"
            title={isPlaying ? t.pauseTitle : t.playTitle}
          >
            {playbackStatus === 'loading' ? (
              <Loader2 className="w-5 h-5 animate-spin text-[#0B0E14]" />
            ) : isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current translate-x-0.5" />
            )}
          </button>

          <button
            onClick={onNextStation}
            disabled={!hasMultipleStations}
            className="p-1.5 text-[#8B949E] hover:text-[#16C683] disabled:opacity-25 disabled:hover:text-[#8B949E] transition-colors"
            title={t.nextStationTitle}
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Module 3: All Stations Button & Volume Control */}
        <div className="flex items-center justify-end gap-3 w-full md:w-1/3">
          {/* Integrated ALL STATIONS Button */}
          <button
            onClick={onOpenDrawer}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#16C683]/10 hover:bg-[#16C683] text-[#16C683] hover:text-[#0B0E14] border border-[#16C683]/40 hover:border-[#16C683] text-xs font-mono font-medium transition-all duration-150 shadow-sm active:scale-95"
            title={t.viewCityStationsTitle}
          >
            <ListMusic className="w-3.5 h-3.5" />
            <span>{t.allStationsBtn}</span>
            {stationsInCityCount !== undefined && stationsInCityCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#16C683]/25 text-[10px] font-bold">
                {stationsInCityCount}
              </span>
            )}
          </button>

          {/* Volume Module */}
          <div className="flex items-center gap-2 w-28 md:w-32 bg-[#12161F]/60 px-2.5 py-1.5 rounded-lg border border-white/5">
            <button
              onClick={onToggleMute}
              className="text-[#8B949E] hover:text-[#16C683] transition-colors"
              title={isMuted ? t.unmuteTitle : t.muteTitle}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-[#16C683]" />
              )}
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => onSetVolume(parseFloat(e.target.value))}
              className="w-full h-1 bg-[#1E2330] rounded appearance-none cursor-pointer accent-[#16C683]"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
