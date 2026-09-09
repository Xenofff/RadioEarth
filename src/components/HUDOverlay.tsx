import { Compass, Radio, Shuffle, Languages, Sun, Moon, Search, Heart } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../theme/ThemeContext';
import { CameraCoordinates } from '../types/radio';

interface HUDOverlayProps {
  cameraCoords: CameraCoordinates;
  totalStations: number;
  totalCities: number;
  onRandomTune: () => void;
  isLoading: boolean;
  onOpenSearch: () => void;
  onOpenFavorites: () => void;
  favoritesCount: number;
}

export const HUDOverlay: React.FC<HUDOverlayProps> = ({
  cameraCoords,
  totalStations,
  totalCities,
  onRandomTune,
  isLoading,
  onOpenSearch,
  onOpenFavorites,
  favoritesCount,
}) => {
  const { t, toggleLanguage } = useLanguage();
  const { toggleTheme, isDark } = useTheme();

  const formatCoord = (val: number, posLabel: string, negLabel: string) => {
    const abs = Math.abs(val).toFixed(2);
    const dir = val >= 0 ? posLabel : negLabel;
    return `${abs}° ${dir}`;
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 flex flex-col justify-between p-3 md:p-5">
      {/* Compact Minimalist Header */}
      <header className="flex items-center justify-between w-full">
        {/* Brand & Global Frequency Tuner Label */}
        <div
          className={`pointer-events-auto flex items-center gap-2.5 backdrop-blur-md px-3.5 py-2 rounded-lg border transition-colors shadow-lg ${
            isDark
              ? 'bg-[#0B0E14]/85 border-[#16C683]/25 shadow-black/40'
              : 'bg-white/85 border-slate-200/80 shadow-slate-300/40'
          }`}
        >
          <div
            className={`relative flex items-center justify-center w-7 h-7 rounded border ${
              isDark
                ? 'bg-[#16C683]/10 border-[#16C683]/30 text-[#16C683]'
                : 'bg-emerald-50 border-emerald-200 text-emerald-600'
            }`}
          >
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isDark ? 'bg-[#16C683]' : 'bg-emerald-500'
                }`}
              ></span>
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isDark ? 'bg-[#16C683]' : 'bg-emerald-500'
                }`}
              ></span>
            </span>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 leading-none">
              <span
                className={`text-xs font-mono font-bold tracking-widest uppercase ${
                  isDark ? 'text-[#16C683]' : 'text-emerald-700'
                }`}
              >
                {t.brandTitle}
              </span>
              <span
                className={`text-[8px] font-mono px-1 py-0.5 rounded font-semibold leading-none ${
                  isDark
                    ? 'bg-[#16C683]/20 text-[#16C683]'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {t.brandLive}
              </span>
            </div>
            <span
              className={`text-[9px] font-mono tracking-wider uppercase mt-0.5 leading-none ${
                isDark ? 'text-[#8B949E]' : 'text-slate-500'
              }`}
            >
              {t.brandSubtitle}
            </span>
          </div>
        </div>

        {/* Telemetry, Actions, Theme & Language Switcher Module */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Theme Switcher Button */}
          <button
            onClick={toggleTheme}
            className={`flex items-center justify-center p-2 rounded-lg text-xs font-mono font-bold transition-all duration-150 shadow-lg active:scale-95 ${
              isDark
                ? 'bg-[#0B0E14]/85 hover:bg-[#16C683] text-[#16C683] hover:text-[#0B0E14] border border-[#16C683]/30 hover:border-[#16C683] shadow-black/40'
                : 'bg-white/85 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-slate-200/80 hover:border-emerald-600 shadow-slate-300/40'
            }`}
            title={t.switchThemeTitle}
            aria-label={t.switchThemeTitle}
          >
            {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          {/* Language Switcher Button */}
          <button
            onClick={toggleLanguage}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all duration-150 shadow-lg active:scale-95 ${
              isDark
                ? 'bg-[#0B0E14]/85 hover:bg-[#16C683] text-[#16C683] hover:text-[#0B0E14] border border-[#16C683]/30 hover:border-[#16C683] shadow-black/40'
                : 'bg-white/85 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-slate-200/80 hover:border-emerald-600 shadow-slate-300/40'
            }`}
            title={t.switchLangTitle}
            aria-label={t.switchLangTitle}
          >
            <Languages className="w-3.5 h-3.5" />
            <span>{t.currentLangLabel}</span>
          </button>

          {/* Global Search Button */}
          <button
            onClick={onOpenSearch}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all duration-150 shadow-md active:scale-95 ${
              isDark
                ? 'bg-[#12161F]/90 hover:bg-[#16C683] text-[#16C683] hover:text-[#0B0E14] border border-[#16C683]/40 hover:border-[#16C683]'
                : 'bg-white/85 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-slate-200/80 hover:border-emerald-600 shadow-slate-300/40'
            }`}
            title={t.searchGlobalTitle}
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.searchGlobalBtn}</span>
            <span
              className={`hidden md:inline text-[9px] font-mono px-1 py-0.2 rounded border ${
                isDark ? 'border-white/10 text-[#8B949E]' : 'border-slate-200 text-slate-500'
              }`}
            >
              ⌘K
            </span>
          </button>

          {/* Favorites Button */}
          <button
            onClick={onOpenFavorites}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all duration-150 shadow-md active:scale-95 ${
              favoritesCount > 0
                ? isDark
                  ? 'bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/40 hover:border-rose-500'
                  : 'bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 hover:border-rose-600'
                : isDark
                ? 'bg-[#12161F]/90 hover:bg-[#16C683] text-[#8B949E] hover:text-[#0B0E14] border border-white/10 hover:border-[#16C683]'
                : 'bg-white/85 hover:bg-emerald-600 text-slate-600 hover:text-white border border-slate-200/80 hover:border-emerald-600'
            }`}
            title={t.favoritesTitle}
          >
            <Heart
              className={`w-3.5 h-3.5 transition-colors ${
                favoritesCount > 0 ? 'fill-rose-500 text-rose-500' : ''
              }`}
            />
            <span className="hidden sm:inline">{t.favoritesBtn}</span>
            {favoritesCount > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isDark ? 'bg-rose-500/25 text-rose-300' : 'bg-rose-100 text-rose-700'
                }`}
              >
                {favoritesCount}
              </span>
            )}
          </button>

          {/* Random Frequency Jump Button */}
          <button
            onClick={onRandomTune}
            disabled={isLoading || totalCities === 0}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all duration-150 shadow-md active:scale-95 disabled:opacity-50 ${
              isDark
                ? 'bg-[#12161F]/90 hover:bg-[#16C683] text-[#16C683] hover:text-[#0B0E14] border border-[#16C683]/40 hover:border-[#16C683]'
                : 'bg-white/85 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-slate-200/80 hover:border-emerald-600'
            }`}
            title={t.randomTitle}
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.randomBtn}</span>
          </button>

          {/* Telemetry Module */}
          <div
            className={`flex items-center gap-2.5 backdrop-blur-md px-3 py-1.5 rounded-lg border font-mono text-right shadow-lg transition-colors ${
              isDark
                ? 'bg-[#0B0E14]/85 border-[#16C683]/25 shadow-black/40'
                : 'bg-white/85 border-slate-200/80 shadow-slate-300/40'
            }`}
          >
            <div
              className={`p-1 rounded ${
                isDark ? 'bg-[#16C683]/10 text-[#16C683]' : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col">
              <div
                className={`flex items-center justify-end gap-1.5 text-[10px] font-bold tracking-widest leading-none ${
                  isDark ? 'text-[#16C683]' : 'text-emerald-700'
                }`}
              >
                <span>{t.telemetry}</span>
                <span
                  className={`font-normal text-[9px] ${
                    isDark ? 'text-[#8B949E]' : 'text-slate-500'
                  }`}
                >
                  {t.altPrefix} {cameraCoords.altitude.toFixed(2)}x
                </span>
              </div>
              <div
                className={`text-[11px] font-mono leading-none mt-1 ${
                  isDark ? 'text-white' : 'text-slate-900 font-semibold'
                }`}
              >
                {formatCoord(cameraCoords.lat, t.coordN, t.coordS)}, {formatCoord(cameraCoords.lng, t.coordE, t.coordW)}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Compact Interactive Reticle (Radio Garden Style) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-14 h-14 flex items-center justify-center transition-transform duration-200">
          {/* Main Crisp Ring */}
          <div
            className={`absolute inset-0 rounded-full border-[1.5px] ${
              isDark
                ? 'border-white/80 shadow-[0_0_12px_rgba(22,198,131,0.35)]'
                : 'border-slate-800/80 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
            }`}
          ></div>

          {/* Subtle Outer Glow Halo */}
          <div
            className={`absolute -inset-1 rounded-full border ${
              isDark ? 'border-[#16C683]/25' : 'border-emerald-500/25'
            }`}
          ></div>

          {/* 4 Fine Cardinal Ticks */}
          <div
            className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-[1px] h-2 ${
              isDark ? 'bg-white/80' : 'bg-slate-800/80'
            }`}
          ></div>
          <div
            className={`absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 w-[1px] h-2 ${
              isDark ? 'bg-white/80' : 'bg-slate-800/80'
            }`}
          ></div>
          <div
            className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 h-[1px] w-2 ${
              isDark ? 'bg-white/80' : 'bg-slate-800/80'
            }`}
          ></div>
          <div
            className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 h-[1px] w-2 ${
              isDark ? 'bg-white/80' : 'bg-slate-800/80'
            }`}
          ></div>

          {/* Center Crosshairs */}
          <div
            className={`absolute w-3 h-[1px] ${
              isDark ? 'bg-[#16C683]/70' : 'bg-emerald-600/70'
            }`}
          ></div>
          <div
            className={`absolute h-3 w-[1px] ${
              isDark ? 'bg-[#16C683]/70' : 'bg-emerald-600/70'
            }`}
          ></div>

          {/* Center Point */}
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              isDark
                ? 'bg-[#16C683] shadow-[0_0_6px_#16C683]'
                : 'bg-emerald-600 shadow-[0_0_6px_#059669]'
            }`}
          ></div>
        </div>
      </div>

      {/* Subtle Footer Telemetry Bar */}
      <footer className="pointer-events-none flex justify-between items-end pb-24 md:pb-24">
        <div
          className={`text-[10px] font-mono flex items-center gap-1.5 ${
            isDark ? 'text-[#8B949E]/70' : 'text-slate-600'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isDark ? 'bg-[#16C683]' : 'bg-emerald-500'
            }`}
          ></span>
          {t.orbitTelemetry(totalCities, totalStations)}
        </div>
        <div
          className={`text-[10px] font-mono ${
            isDark ? 'text-[#8B949E]/70' : 'text-slate-600'
          }`}
        >
          {t.engineOnline}
        </div>
      </footer>
    </div>
  );
};
