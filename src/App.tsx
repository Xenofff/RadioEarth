import { useEffect, useState, useRef, useCallback } from 'react';
import { MapGlobeView, MapGlobeViewHandle } from './components/MapGlobeView';
import { HUDOverlay } from './components/HUDOverlay';
import { PlayerBottom } from './components/PlayerBottom';
import { CityStationsDrawer } from './components/CityStationsDrawer';
import { fetchStations } from './services/radioApi';
import { useRadioPlayer } from './hooks/useRadioPlayer';
import { CameraCoordinates, CityGroup, Station } from './types/radio';
import { Loader2, RefreshCw } from 'lucide-react';
import { useLanguage } from './i18n/LanguageContext';
import { useTheme } from './theme/ThemeContext';

export function App() {
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const [cities, setCities] = useState<CityGroup[]>([]);
  const [selectedCity, setSelectedCity] = useState<CityGroup | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<boolean>(false);

  const [cameraCoords, setCameraCoords] = useState<CameraCoordinates>({
    lat: 20,
    lng: 0,
    altitude: 2.5,
  });

  const globeRef = useRef<MapGlobeViewHandle | null>(null);

  const {
    currentStation,
    playbackStatus,
    isPlaying,
    volume,
    isMuted,
    errorMessage,
    playStation,
    togglePlay,
    setVolume,
    toggleMute,
  } = useRadioPlayer();

  // Загрузка станций с сервера при старте
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setApiError(false);
    try {
      const data = await fetchStations();
      setCities(data);
    } catch (err) {
      console.error('Failed to load stations data:', err);
      setApiError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Обработка клика по городу на глобусе
  // Обработка выбора города (по клику или через интерактивный прицел)
  const handleSelectCity = useCallback(
    (city: CityGroup, targetStation?: Station, shouldFlyTo: boolean = true) => {
      setSelectedCity(city);
      setIsDrawerOpen(true);

      // 1. Плавный подлет камеры к выбранному городу (только если shouldFlyTo === true)
      if (shouldFlyTo && globeRef.current) {
        globeRef.current.flyTo(city.lat, city.lng, 4.5);
      }

      // 2. Запуск выбранной или случайной станции из города
      if (targetStation) {
        playStation(targetStation);
      } else if (city.stations.length > 0) {
        const randomIndex = Math.floor(Math.random() * city.stations.length);
        const selected = city.stations[randomIndex];
        playStation(selected);
      }
    },
    [playStation]
  );

  // Случайный перелет по миру
  const handleRandomTune = useCallback(() => {
    if (cities.length === 0) return;
    const randomCity = cities[Math.floor(Math.random() * cities.length)];
    handleSelectCity(randomCity, undefined, true);
  }, [cities, handleSelectCity]);

  // Переключение станций внутри текущего выбранного города
  const handleNextStation = useCallback(() => {
    if (!selectedCity || selectedCity.stations.length <= 1) return;
    const currentIndex = selectedCity.stations.findIndex((s) => s.id === currentStation?.id);
    const nextIndex = (currentIndex + 1) % selectedCity.stations.length;
    playStation(selectedCity.stations[nextIndex]);
  }, [selectedCity, currentStation, playStation]);

  const handlePrevStation = useCallback(() => {
    if (!selectedCity || selectedCity.stations.length <= 1) return;
    const currentIndex = selectedCity.stations.findIndex((s) => s.id === currentStation?.id);
    const prevIndex =
      (currentIndex - 1 + selectedCity.stations.length) % selectedCity.stations.length;
    playStation(selectedCity.stations[prevIndex]);
  }, [selectedCity, currentStation, playStation]);

  const totalStations = cities.reduce((acc, c) => acc + c.stations.length, 0);

  return (
    <div
      className={`relative w-screen h-screen transition-colors duration-300 ${
        isDark ? 'bg-[#0B0E14]' : 'bg-[#EBF0F5]'
      } overflow-hidden`}
    >
      {/* Векторный 3D Глобус MapLibre GL с Carto Dark Matter / Positron */}
      <MapGlobeView
        ref={globeRef}
        cities={cities}
        selectedCity={selectedCity}
        onSelectCity={(city, targetStation, shouldFlyTo) =>
          handleSelectCity(city, targetStation, shouldFlyTo)
        }
        onCameraChange={(coords) => setCameraCoords(coords)}
      />

      {/* Компактный минималистичный HUD оверлей с прицелом и телеметрией */}
      <HUDOverlay
        cameraCoords={cameraCoords}
        totalStations={totalStations}
        totalCities={cities.length}
        onRandomTune={handleRandomTune}
        isLoading={isLoading}
      />

      {/* Выдвижная левая панель со станциями города */}
      <CityStationsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        city={selectedCity}
        currentStation={currentStation}
        playbackStatus={playbackStatus}
        onSelectStation={(station) => playStation(station)}
      />

      {/* Модульная нижняя панель плеера */}
      <PlayerBottom
        station={currentStation}
        playbackStatus={playbackStatus}
        isPlaying={isPlaying}
        volume={volume}
        isMuted={isMuted}
        errorMessage={errorMessage}
        stationsInCityCount={selectedCity?.stations.length}
        onTogglePlay={togglePlay}
        onSetVolume={setVolume}
        onToggleMute={toggleMute}
        onPrevStation={handlePrevStation}
        onNextStation={handleNextStation}
        hasMultipleStations={Boolean(selectedCity && selectedCity.stations.length > 1)}
        onOpenDrawer={() => setIsDrawerOpen(true)}
      />

      {/* Экран загрузки */}
      {isLoading && (
        <div
          className={`absolute inset-0 z-50 backdrop-blur-md flex flex-col items-center justify-center p-6 select-none transition-colors ${
            isDark ? 'bg-[#0B0E14]/90 text-white' : 'bg-slate-50/90 text-slate-900'
          }`}
        >
          <div className="relative flex items-center justify-center w-16 h-16 mb-4">
            <div
              className={`absolute inset-0 rounded-full border animate-ping ${
                isDark ? 'border-[#16C683]/25' : 'border-emerald-500/25'
              }`}
            ></div>
            <div
              className={`w-14 h-14 rounded-full border-2 border-t-transparent animate-spin ${
                isDark ? 'border-[#16C683]' : 'border-emerald-600'
              }`}
            ></div>
            <Loader2
              className={`w-7 h-7 animate-pulse absolute ${
                isDark ? 'text-[#16C683]' : 'text-emerald-600'
              }`}
            />
          </div>
          <h1
            className={`text-base font-mono font-bold tracking-widest uppercase ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            {t.loadingTitle}
          </h1>
          <p
            className={`text-[11px] font-mono mt-1.5 ${
              isDark ? 'text-[#8B949E]' : 'text-slate-500'
            }`}
          >
            {t.loadingSubtitle}
          </p>
        </div>
      )}

      {/* Ошибка сети */}
      {apiError && !isLoading && (
        <div
          className={`absolute inset-0 z-50 flex items-center justify-center p-6 ${
            isDark ? 'bg-[#0B0E14]/90' : 'bg-slate-900/30 backdrop-blur-sm'
          }`}
        >
          <div
            className={`border rounded-2xl p-6 max-w-md text-center shadow-2xl ${
              isDark
                ? 'bg-[#12161F] border-rose-500/30'
                : 'bg-white border-rose-200 text-slate-900'
            }`}
          >
            <h2 className="text-base font-mono font-bold text-rose-500 mb-2">
              {t.errorTitle}
            </h2>
            <p
              className={`text-xs mb-5 ${
                isDark ? 'text-[#8B949E]' : 'text-slate-600'
              }`}
            >
              {t.errorMessage}
            </p>
            <button
              onClick={loadData}
              className={`inline-flex items-center gap-2 px-4 py-2 font-mono text-xs font-semibold rounded-lg transition-colors ${
                isDark
                  ? 'bg-[#16C683] text-[#0B0E14] hover:bg-[#2FE29C]'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {t.retryBtn}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
