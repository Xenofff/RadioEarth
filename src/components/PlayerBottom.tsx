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
  Heart,
  Share2,
  Check,
} from 'lucide-react';
import { PlaybackStatus, Station } from '../types/radio';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../theme/ThemeContext';

interface PlayerBottomProps {
  station: Station | null;
  playbackStatus: PlaybackStatus;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  errorMessage: string | null;
  cityName?: string;
  stationsInCityCount?: number;
  onTogglePlay: () => void;
  onSetVolume: (vol: number) => void;
  onToggleMute: () => void;
  onPrevStation: () => void;
  onNextStation: () => void;
  hasMultipleStations: boolean;
  onOpenDrawer: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onShare: () => void;
  shareCopied: boolean;
}

export const PlayerBottom: React.FC<PlayerBottomProps> = ({
  station,
  playbackStatus,
  isPlaying,
  volume,
  isMuted,
  errorMessage,
  cityName,
  stationsInCityCount,
  onTogglePlay,
  onSetVolume,
  onToggleMute,
  onPrevStation,
  onNextStation,
  hasMultipleStations,
  onOpenDrawer,
  isFavorite,
  onToggleFavorite,
  onShare,
  shareCopied,
}) => {
  const { t } = useLanguage();
  const { isDark } = useTheme();

  if (!station) {
    return null;
  }

  const renderStatus = () => {
    switch (playbackStatus) {
      case 'loading':
        return (
          <div className="flex items-center gap-1.5 text-[11px] text-amber-500 font-mono">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>{t.buffering}</span>
          </div>
        );
      case 'playing':
        return (
          <div
            className={`flex items-center gap-2 text-[11px] font-mono ${
              isDark ? 'text-[#16C683]' : 'text-emerald-700'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                isDark ? 'bg-[#16C683]' : 'bg-emerald-600'
              }`}
            ></span>
            <span className="font-semibold">{t.onAir}</span>
            {/* Minimalist Equalizer Wave */}
            <div className="flex items-end gap-0.5 h-2.5 ml-0.5">
              <span
                className={`w-0.5 h-full animate-wave-1 rounded-full ${
                  isDark ? 'bg-[#16C683]' : 'bg-emerald-600'
                }`}
              ></span>
              <span
                className={`w-0.5 h-full animate-wave-2 rounded-full ${
                  isDark ? 'bg-[#16C683]' : 'bg-emerald-600'
                }`}
              ></span>
              <span
                className={`w-0.5 h-full animate-wave-3 rounded-full ${
                  isDark ? 'bg-[#16C683]' : 'bg-emerald-600'
                }`}
              ></span>
              <span
                className={`w-0.5 h-full animate-wave-4 rounded-full ${
                  isDark ? 'bg-[#16C683]' : 'bg-emerald-600'
                }`}
              ></span>
            </div>
          </div>
        );
      case 'error':
        return (
          <div
            className="flex items-center gap-1.5 text-[11px] text-rose-500 font-mono"
            title={errorMessage || t.streamOffline}
          >
            <AlertCircle className="w-3 h-3" />
            <span className="truncate max-w-[160px]">{t.streamOffline}</span>
          </div>
        );
      default:
        return (
          <div
            className={`flex items-center gap-1.5 text-[11px] font-mono ${
              isDark ? 'text-[#8B949E]' : 'text-slate-500'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isDark ? 'bg-[#8B949E]' : 'bg-slate-400'
              }`}
            ></span>
            <span>{t.paused}</span>
          </div>
        );
    }
  };

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl border-t px-3 py-2.5 md:px-6 md:py-3 shadow-2xl transition-colors ${
        isDark
          ? 'bg-[#0B0E14]/95 border-[#16C683]/25 text-white'
          : 'bg-white/95 border-slate-200/80 text-slate-900 shadow-slate-300/40'
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
        {/* Module 1: Station Information */}
        <div
          onClick={onOpenDrawer}
          className="flex items-center gap-3 w-full md:w-1/3 cursor-pointer group select-none min-w-0"
          title={t.viewCityStationsTitle}
        >
          <div
            className={`relative w-11 h-11 flex-shrink-0 rounded-lg border flex items-center justify-center overflow-hidden transition-colors shadow-inner ${
              isDark
                ? 'bg-[#12161F] border-[#16C683]/30 group-hover:border-[#16C683]'
                : 'bg-slate-100 border-slate-200 group-hover:border-emerald-600'
            }`}
          >
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
              <Radio
                className={`w-5 h-5 ${isDark ? 'text-[#16C683]' : 'text-emerald-600'}`}
              />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h4
              className={`text-sm font-semibold truncate transition-colors leading-snug ${
                isDark
                  ? 'text-white group-hover:text-[#16C683]'
                  : 'text-slate-900 group-hover:text-emerald-700'
              }`}
            >
              {station.name}
            </h4>

            <div
              className={`text-xs truncate leading-tight mt-0.5 ${
                isDark ? 'text-[#8B949E]' : 'text-slate-500'
              }`}
            >
              {cityName ? `${cityName}, ` : station.state ? `${station.state}, ` : ''}
              {station.country}
            </div>

            <div className="mt-1 flex items-center gap-2">
              {renderStatus()}
              {station.codec && (
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase border ${
                    isDark
                      ? 'bg-[#12161F] text-[#8B949E] border-white/5'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {station.codec} {station.bitrate ? `${station.bitrate}k` : ''}
                </span>
              )}
            </div>
          </div>

          {/* Actions: Favorite & Share */}
          <div className="flex items-center gap-1 flex-shrink-0 ml-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
              className={`p-1.5 rounded-lg transition-all active:scale-125 ${
                isFavorite
                  ? 'text-rose-500 hover:text-rose-400'
                  : isDark
                  ? 'text-[#8B949E] hover:text-rose-400 hover:bg-white/5'
                  : 'text-slate-400 hover:text-rose-500 hover:bg-slate-100'
              }`}
              title={isFavorite ? t.removeFromFavorites : t.addToFavorites}
            >
              <Heart
                className={`w-4 h-4 transition-transform duration-150 ${
                  isFavorite ? 'fill-rose-500 text-rose-500 scale-110' : ''
                }`}
              />
            </button>

            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onShare();
                }}
                className={`p-1.5 rounded-lg transition-all active:scale-95 ${
                  shareCopied
                    ? isDark
                      ? 'bg-[#16C683]/20 text-[#16C683]'
                      : 'bg-emerald-100 text-emerald-700'
                    : isDark
                    ? 'text-[#8B949E] hover:text-[#16C683] hover:bg-white/5'
                    : 'text-slate-400 hover:text-emerald-600 hover:bg-slate-100'
                }`}
                title={t.shareTitle}
              >
                {shareCopied ? (
                  <Check className="w-4 h-4 text-emerald-500 stroke-[2.5]" />
                ) : (
                  <Share2 className="w-4 h-4" />
                )}
              </button>

              {shareCopied && (
                <div
                  className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 rounded-md text-[10px] font-mono whitespace-nowrap shadow-xl z-50 pointer-events-none ${
                    isDark
                      ? 'bg-[#16C683] text-[#0B0E14] font-bold shadow-[#16C683]/30'
                      : 'bg-slate-900 text-white font-semibold'
                  }`}
                >
                  {t.shareCopied}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Module 2: Playback Control Bar */}
        <div
          className={`flex items-center gap-3 px-4 py-1.5 rounded-full border shadow-md transition-colors ${
            isDark
              ? 'bg-[#12161F]/80 border-white/5'
              : 'bg-slate-100/90 border-slate-200/80 shadow-slate-200/50'
          }`}
        >
          <button
            onClick={onPrevStation}
            disabled={!hasMultipleStations}
            className={`p-1.5 disabled:opacity-25 transition-colors ${
              isDark
                ? 'text-[#8B949E] hover:text-[#16C683] disabled:hover:text-[#8B949E]'
                : 'text-slate-500 hover:text-emerald-600 disabled:hover:text-slate-400'
            }`}
            title={t.prevStationTitle}
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {/* Main Play/Pause Button */}
          <button
            onClick={onTogglePlay}
            disabled={playbackStatus === 'loading'}
            className={`w-10 h-10 rounded-full transition-all flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 ${
              isDark
                ? 'bg-[#16C683] text-[#0B0E14] hover:bg-[#2FE29C] shadow-[#16C683]/30'
                : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-600/30'
            }`}
            title={isPlaying ? t.pauseTitle : t.playTitle}
          >
            {playbackStatus === 'loading' ? (
              <Loader2
                className={`w-5 h-5 animate-spin ${
                  isDark ? 'text-[#0B0E14]' : 'text-white'
                }`}
              />
            ) : isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current translate-x-0.5" />
            )}
          </button>

          <button
            onClick={onNextStation}
            disabled={!hasMultipleStations}
            className={`p-1.5 disabled:opacity-25 transition-colors ${
              isDark
                ? 'text-[#8B949E] hover:text-[#16C683] disabled:hover:text-[#8B949E]'
                : 'text-slate-500 hover:text-emerald-600 disabled:hover:text-slate-400'
            }`}
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all duration-150 shadow-sm active:scale-95 border ${
              isDark
                ? 'bg-[#16C683]/10 hover:bg-[#16C683] text-[#16C683] hover:text-[#0B0E14] border-[#16C683]/40 hover:border-[#16C683]'
                : 'bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border-emerald-200/90 hover:border-emerald-600'
            }`}
            title={t.viewCityStationsTitle}
          >
            <ListMusic className="w-3.5 h-3.5" />
            <span>{t.allStationsBtn}</span>
            {stationsInCityCount !== undefined && stationsInCityCount > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isDark ? 'bg-[#16C683]/25' : 'bg-emerald-200/60 text-emerald-800'
                }`}
              >
                {stationsInCityCount}
              </span>
            )}
          </button>

          {/* Volume Module */}
          <div
            className={`flex items-center gap-2 w-28 md:w-32 px-2.5 py-1.5 rounded-lg border transition-colors ${
              isDark
                ? 'bg-[#12161F]/60 border-white/5'
                : 'bg-slate-100/90 border-slate-200/80'
            }`}
          >
            <button
              onClick={onToggleMute}
              className={`transition-colors ${
                isDark
                  ? 'text-[#8B949E] hover:text-[#16C683]'
                  : 'text-slate-500 hover:text-emerald-600'
              }`}
              title={isMuted ? t.unmuteTitle : t.muteTitle}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-3.5 h-3.5 text-rose-500" />
              ) : (
                <Volume2
                  className={`w-3.5 h-3.5 ${
                    isDark ? 'text-[#16C683]' : 'text-emerald-600'
                  }`}
                />
              )}
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => onSetVolume(parseFloat(e.target.value))}
              className={`w-full h-1 rounded appearance-none cursor-pointer ${
                isDark ? 'bg-[#1E2330] accent-[#16C683]' : 'bg-slate-200 accent-emerald-600'
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
