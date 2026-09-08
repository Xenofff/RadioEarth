import React from 'react';
import { CameraCoordinates } from '../types/radio';
import { Compass, Radio, Shuffle } from 'lucide-react';

interface HUDOverlayProps {
  cameraCoords: CameraCoordinates;
  totalStations: number;
  totalCities: number;
  onRandomTune: () => void;
  isLoading: boolean;
}

export const HUDOverlay: React.FC<HUDOverlayProps> = ({
  cameraCoords,
  totalStations,
  totalCities,
  onRandomTune,
  isLoading,
}) => {
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
        <div className="pointer-events-auto flex items-center gap-2.5 bg-[#0B0E14]/85 backdrop-blur-md px-3.5 py-2 rounded-lg border border-[#16C683]/25 shadow-lg shadow-black/40">
          <div className="relative flex items-center justify-center w-7 h-7 rounded bg-[#16C683]/10 border border-[#16C683]/30">
            <Radio className="w-3.5 h-3.5 text-[#16C683] animate-pulse" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#16C683] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#16C683]"></span>
            </span>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-xs font-mono font-bold tracking-widest text-[#16C683] uppercase">
                RADIO EARTH
              </span>
              <span className="text-[8px] font-mono px-1 py-0.5 rounded bg-[#16C683]/20 text-[#16C683] font-semibold leading-none">
                LIVE
              </span>
            </div>
            <span className="text-[9px] font-mono tracking-wider text-[#8B949E] uppercase mt-0.5 leading-none">
              GLOBAL FREQUENCY TUNER
            </span>
          </div>
        </div>

        {/* Telemetry & Quick Action Module */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Random Frequency Jump Button */}
          <button
            onClick={onRandomTune}
            disabled={isLoading || totalCities === 0}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#12161F]/90 hover:bg-[#16C683] text-[#16C683] hover:text-[#0B0E14] border border-[#16C683]/40 hover:border-[#16C683] rounded-lg text-xs font-mono font-medium transition-all duration-150 shadow-md active:scale-95 disabled:opacity-50"
            title="Tune in to a random city"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">RANDOM</span>
          </button>

          {/* Telemetry Module */}
          <div className="flex items-center gap-2.5 bg-[#0B0E14]/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#16C683]/25 font-mono text-right shadow-lg shadow-black/40">
            <div className="p-1 rounded bg-[#16C683]/10 text-[#16C683]">
              <Compass className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center justify-end gap-1.5 text-[10px] text-[#16C683] font-bold tracking-widest leading-none">
                <span>TELEMETRY</span>
                <span className="text-[#8B949E] font-normal text-[9px]">
                  ALT {cameraCoords.altitude.toFixed(2)}x
                </span>
              </div>
              <div className="text-white text-[11px] font-mono leading-none mt-1">
                {formatCoord(cameraCoords.lat, 'N', 'S')}, {formatCoord(cameraCoords.lng, 'E', 'W')}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Minimalist Central Tactical Reticle */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-28 h-28 md:w-36 md:h-36 flex items-center justify-center">
          {/* Thin Outer Ring */}
          <div className="absolute inset-0 rounded-full border border-[#16C683]/20"></div>

          {/* Dotted Inner Ring */}
          <div className="absolute inset-3 rounded-full border border-dashed border-[#16C683]/25"></div>

          {/* Corner Brackets */}
          <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-[#16C683]/80"></div>
          <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-[#16C683]/80"></div>
          <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-[#16C683]/80"></div>
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-[#16C683]/80"></div>

          {/* Reticle Fine Crosshairs */}
          <div className="absolute w-5 h-[1px] bg-[#16C683]/60"></div>
          <div className="absolute h-5 w-[1px] bg-[#16C683]/60"></div>

          {/* Center Point */}
          <div className="w-1.5 h-1.5 rounded-full bg-[#16C683] shadow-[0_0_8px_#16C683]"></div>
        </div>
      </div>

      {/* Subtle Footer Telemetry Bar */}
      <footer className="pointer-events-none flex justify-between items-end pb-24 md:pb-24">
        <div className="text-[10px] font-mono text-[#8B949E]/70 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#16C683]"></span>
          VECTOR ORBIT &bull; {totalCities} CITIES &bull; {totalStations} STATIONS
        </div>
        <div className="text-[10px] font-mono text-[#8B949E]/70">
          GEOJSON VECTOR CLUSTERING ONLINE
        </div>
      </footer>
    </div>
  );
};
