import { useEffect, useState, useRef, useCallback } from 'react';
import { MapGlobeView, MapGlobeViewHandle } from './components/MapGlobeView';
import { HUDOverlay } from './components/HUDOverlay';
import { PlayerBottom } from './components/PlayerBottom';
import { CityStationsDrawer } from './components/CityStationsDrawer';
import { fetchStations } from './services/radioApi';
import { useRadioPlayer } from './hooks/useRadioPlayer';
import { CameraCoordinates, CityGroup, Station } from './types/radio';
import { Loader2, RefreshCw } from 'lucide-react';

export function App() {
  const [cities, setCities] = useState<CityGroup[]>([]);
  const [selectedCity, setSelectedCity] = useState<CityGroup | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);

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
    setApiError(null);
    try {
      const data = await fetchStations();
      setCities(data);
    } catch (err) {
      console.error('Failed to load stations data:', err);
      setApiError('Failed to load live radio frequencies. Please check network connection.');
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
    <div className="relative w-screen h-screen bg-[#0B0E14] overflow-hidden">
      {/* Векторный 3D Глобус MapLibre GL с Carto Dark Matter и кластеризацией станций */}
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
        <div className="absolute inset-0 z-50 bg-[#0B0E14]/90 backdrop-blur-md flex flex-col items-center justify-center p-6 select-none">
          <div className="relative flex items-center justify-center w-16 h-16 mb-4">
            <div className="absolute inset-0 rounded-full border border-[#16C683]/25 animate-ping"></div>
            <div className="w-14 h-14 rounded-full border-2 border-[#16C683] border-t-transparent animate-spin"></div>
            <Loader2 className="w-7 h-7 text-[#16C683] animate-pulse absolute" />
          </div>
          <h1 className="text-base font-mono font-bold text-white tracking-widest uppercase">
            SYNCHRONIZING ORBITAL FREQUENCIES
          </h1>
          <p className="text-[11px] font-mono text-[#8B949E] mt-1.5">
            LOADING VECTOR TOPOLOGY &bull; HTTPS STREAMS
          </p>
        </div>
      )}

      {/* Ошибка сети */}
      {apiError && !isLoading && (
        <div className="absolute inset-0 z-50 bg-[#0B0E14]/90 flex items-center justify-center p-6">
          <div className="bg-[#12161F] border border-rose-500/30 rounded-2xl p-6 max-w-md text-center shadow-2xl">
            <h2 className="text-base font-mono font-bold text-rose-400 mb-2">SIGNAL INTERRUPTED</h2>
            <p className="text-xs text-[#8B949E] mb-5">{apiError}</p>
            <button
              onClick={loadData}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#16C683] text-[#0B0E14] font-mono text-xs font-semibold rounded-lg hover:bg-[#2FE29C] transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              RETRY CONNECTION
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
