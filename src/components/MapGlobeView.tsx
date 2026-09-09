import { useEffect, useRef, useImperativeHandle, forwardRef, useCallback, memo } from 'react';
import { Map as MapLibreMap, GeoJSONSource, MapLayerMouseEvent } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { CameraCoordinates, CityGroup, Station } from '../types/radio';
import { useTheme } from '../theme/ThemeContext';
import { SpaceBackground } from './SpaceBackground';
import { LightBackground } from './LightBackground';
import { buildGraticuleGeoJson } from '../utils/mapTextures';
import { buildTerminatorGeoJson } from '../utils/solarTerminator';
import { radioStaticEngine } from '../utils/radioStatic';

const DARK_MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
const LIGHT_MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

export interface MapGlobeViewHandle {
  flyTo: (lat: number, lng: number, zoom?: number) => void;
}

interface MapGlobeViewProps {
  cities: CityGroup[];
  selectedCity: CityGroup | null;
  onSelectCity: (city: CityGroup, targetStation?: Station, shouldFlyTo?: boolean) => void;
  onCameraChange: (coords: CameraCoordinates) => void;
  volume?: number;
  isMuted?: boolean;
}

export const MapGlobeView = memo(
  forwardRef<MapGlobeViewHandle, MapGlobeViewProps>(
    ({ cities, selectedCity, onSelectCity, onCameraChange, volume, isMuted }, ref) => {
    const { theme, isDark } = useTheme();
    const themeRef = useRef(theme);
    themeRef.current = theme;

    const citiesRef = useRef(cities);
    citiesRef.current = cities;

    const selectedCityRef = useRef(selectedCity);
    selectedCityRef.current = selectedCity;

    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<MapLibreMap | null>(null);
    const isStyleLoadedRef = useRef<boolean>(false);
    const hoveredDotIdRef = useRef<string | number | null>(null);

    // Flags for interactive dragging & reticle station auto-tune
    const isMouseDownRef = useRef<boolean>(false);
    const isUserInteractingRef = useRef<boolean>(false);
    const isProgrammaticMoveRef = useRef<boolean>(false);
    const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const onSelectCityRef = useRef(onSelectCity);
    onSelectCityRef.current = onSelectCity;

    // Sync volume and mute state with radio static engine
    useEffect(() => {
      if (volume !== undefined) {
        radioStaticEngine.setVolume(volume);
      }
    }, [volume]);

    useEffect(() => {
      if (isMuted !== undefined) {
        radioStaticEngine.setMuted(isMuted);
      }
    }, [isMuted]);

    // Periodically update Solar Terminator (every 60 seconds)
    useEffect(() => {
      const interval = setInterval(() => {
        if (mapRef.current && isStyleLoadedRef.current) {
          const src = mapRef.current.getSource('terminator-source') as GeoJSONSource | undefined;
          if (src) {
            src.setData(buildTerminatorGeoJson());
          }
        }
      }, 60000);
      return () => clearInterval(interval);
    }, []);

    // Imperative flyTo method for camera positioning
    useImperativeHandle(ref, () => ({
      flyTo: (lat: number, lng: number, zoom = 4.5) => {
        if (mapRef.current) {
          isProgrammaticMoveRef.current = true;
          mapRef.current.flyTo({
            center: [lng, lat],
            zoom,
            speed: 0.95,
            curve: 1.42,
            essential: true,
          });
        }
      },
    }));

    // Convert CityGroup[] into GeoJSON FeatureCollection with unique numeric IDs for MapLibre feature-state
    const buildGeoJson = useCallback((cityList: CityGroup[]): GeoJSON.FeatureCollection<GeoJSON.Point> => {
      return {
        type: 'FeatureCollection',
        features: cityList.map((city, index) => ({
          type: 'Feature',
          id: index + 1, // MapLibre setFeatureState requires numeric integer IDs
          geometry: {
            type: 'Point',
            coordinates: [city.lng, city.lat],
          },
          properties: {
            id: city.id,
            numericId: index + 1,
            cityName: city.cityName,
            country: city.country,
            countryCode: city.countryCode,
            stationCount: city.stations.length,
            cityData: JSON.stringify(city),
          },
        })),
      };
    }, []);

    // Setup layers on map style load
    const setupGlobeLayers = useCallback((map: MapLibreMap, currentTheme: 'dark' | 'light') => {
      isStyleLoadedRef.current = true;

      // Set native 3D globe projection
      try {
        map.setProjection({
          type: 'globe',
        });
      } catch (err) {
        console.error('[setupGlobeLayers] setProjection error:', err);
      }

      // Configure sky & atmospheric halo
      try {
        if (currentTheme === 'dark') {
          map.setSky({
            'sky-color': 'rgba(0, 0, 0, 0)',
            'horizon-color': 'rgba(22, 198, 131, 0.15)',
            'fog-color': 'rgba(0, 0, 0, 0)',
            'atmosphere-blend': 0.75,
          });
        } else {
          map.setSky({
            'sky-color': 'rgba(235, 240, 245, 0)',
            'horizon-color': 'rgba(16, 185, 129, 0.22)',
            'fog-color': 'rgba(235, 240, 245, 0)',
            'atmosphere-blend': 0.8,
          });
        }
      } catch (err) {
        console.warn('[setupGlobeLayers] setSky error:', err);
      }

      // Set background and ocean colors
      try {
        if (map.getLayer('background')) {
          map.setPaintProperty(
            'background',
            'background-color',
            currentTheme === 'dark' ? 'rgb(47, 49, 54)' : '#E6ECF2'
          );
        }
        if (map.getLayer('water')) {
          map.setPaintProperty(
            'water',
            'fill-color',
            currentTheme === 'dark' ? '#0B0E14' : '#D0DFEB'
          );
        }
      } catch (err) {
        console.error('[setupGlobeLayers] paint property error:', err);
      }

      // Add explicit vector countries layer
      try {
        if (!map.getSource('countries-source')) {
          map.addSource('countries-source', {
            type: 'geojson',
            data: `${import.meta.env.BASE_URL}data/countries.geojson`,
          });

        const beforeLayer = map.getLayer('water') ? 'water' : undefined;

        // 1. Solid Base Fill
        map.addLayer(
          {
            id: 'countries-fill',
            type: 'fill',
            source: 'countries-source',
            paint: {
              'fill-color': currentTheme === 'dark' ? 'rgb(47, 49, 54)' : '#E8EEF5',
              'fill-opacity': 1,
            },
          },
          beforeLayer
        );

        // 2. Authentic Geographic Shaded Relief (Mountains, Valleys & Topography)
        if (!map.getSource('shaded-relief-source')) {
          map.addSource('shaded-relief-source', {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}',
            ],
            tileSize: 256,
            maxzoom: 13,
          });
        }

        if (!map.getLayer('shaded-relief-layer')) {
          map.addLayer(
            {
              id: 'shaded-relief-layer',
              type: 'raster',
              source: 'shaded-relief-source',
              paint: {
                // Subtle authentic relief shading on continents
                'raster-opacity': currentTheme === 'dark' ? 0.32 : 0.28,
                'raster-contrast': currentTheme === 'dark' ? 0.35 : 0.2,
                'raster-brightness-max': currentTheme === 'dark' ? 0.75 : 0.95,
                'raster-saturation': -1, // Monochrome topographical shading
              },
            },
            beforeLayer // rendered under 'water' layer so oceans stay clean #0B0E14
          );
        }

        // 3. Subtle Coastline Relief Inner Shadow
        map.addLayer(
          {
            id: 'countries-inner-shadow',
            type: 'line',
            source: 'countries-source',
            paint: {
              'line-color':
                currentTheme === 'dark' ? 'rgba(0, 0, 0, 0.45)' : 'rgba(100, 116, 139, 0.25)',
              'line-width': 2.5,
              'line-blur': 1.8,
              'line-opacity': 0.65,
            },
          },
          beforeLayer
        );

        // 4. Subtle Country Borders
        map.addLayer(
          {
            id: 'countries-border',
            type: 'line',
            source: 'countries-source',
            paint: {
              'line-color':
                currentTheme === 'dark'
                  ? 'rgba(255, 255, 255, 0.18)'
                  : 'rgba(100, 116, 139, 0.35)',
              'line-width': 0.85,
            },
          },
          beforeLayer
        );
      }
      } catch (err) {
        console.error('[setupGlobeLayers] countries-source/layer error:', err);
      }

      // Add planetary graticule lines (delicate geographic coordinate grid)
      try {
        if (!map.getSource('graticule-source')) {
          map.addSource('graticule-source', {
            type: 'geojson',
            data: buildGraticuleGeoJson(),
          });

          map.addLayer({
            id: 'graticule-lines',
            type: 'line',
            source: 'graticule-source',
            paint: {
              'line-color':
                currentTheme === 'dark'
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(71, 85, 105, 0.12)',
              'line-width': [
                'case',
                ['boolean', ['get', 'isEquator'], false],
                1.1,
                0.6,
              ],
              'line-dasharray': [3, 4],
            },
          });
        }
      } catch (err) {
        console.error('[setupGlobeLayers] graticule error:', err);
      }

      // Add stations GeoJSON source
      try {
        if (!map.getSource('stations-source')) {
          map.addSource('stations-source', {
            type: 'geojson',
            data: buildGeoJson(citiesRef.current),
            cluster: false,
          });
        } else {
          const src = map.getSource('stations-source') as GeoJSONSource | undefined;
          if (src) {
            src.setData(buildGeoJson(citiesRef.current));
          }
        }
      } catch (err) {
        console.error('[setupGlobeLayers] stations-source error:', err);
      }

      // Add Solar Terminator (Real-time day/night dividing line & nocturnal shadow)
      try {
        const terminatorData = buildTerminatorGeoJson();
        if (!map.getSource('terminator-source')) {
          map.addSource('terminator-source', {
            type: 'geojson',
            data: terminatorData,
          });

          // 1. Nocturnal shadow fill polygon
          map.addLayer({
            id: 'terminator-night-shadow',
            type: 'fill',
            source: 'terminator-source',
            filter: ['==', '$type', 'Polygon'],
            paint: {
              'fill-color': currentTheme === 'dark' ? '#010307' : '#0B132B',
              'fill-opacity': currentTheme === 'dark' ? 0.4 : 0.25,
            },
          });

          // 2. Glowing sunset/sunrise twilight line
          map.addLayer({
            id: 'terminator-twilight-line',
            type: 'line',
            source: 'terminator-source',
            filter: ['==', '$type', 'LineString'],
            paint: {
              'line-color': '#F59E0B',
              'line-width': 2.2,
              'line-blur': 3.5,
              'line-opacity': currentTheme === 'dark' ? 0.65 : 0.45,
            },
          });
        } else {
          const src = map.getSource('terminator-source') as GeoJSONSource | undefined;
          if (src) {
            src.setData(terminatorData);
          }
        }
      } catch (err) {
        console.error('[setupGlobeLayers] terminator error:', err);
      }

      // Add dedicated source for selected city targeting reticle & pulse
      if (!map.getSource('selected-city-source')) {
        map.addSource('selected-city-source', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: selectedCityRef.current
              ? [
                  {
                    type: 'Feature',
                    geometry: {
                      type: 'Point',
                      coordinates: [selectedCityRef.current.lng, selectedCityRef.current.lat],
                    },
                    properties: {},
                  },
                ]
              : [],
          },
        });
      }

      // 1. SELECTED CITY: Ambient pulse
      if (!map.getLayer('selected-city-pulse')) {
        map.addLayer({
          id: 'selected-city-pulse',
          type: 'circle',
          source: 'selected-city-source',
          paint: {
            'circle-color': currentTheme === 'dark' ? '#2FE29C' : '#10B981',
            'circle-radius': 22,
            'circle-blur': 0.75,
            'circle-opacity': currentTheme === 'dark' ? 0.55 : 0.45,
          },
        });
      }

      // 2. SELECTED CITY: White or dark reticle ring
      if (!map.getLayer('selected-city-reticle')) {
        map.addLayer({
          id: 'selected-city-reticle',
          type: 'circle',
          source: 'selected-city-source',
          paint: {
            'circle-color': 'rgba(0, 0, 0, 0)',
            'circle-radius': 16,
            'circle-stroke-width': 2,
            'circle-stroke-color': currentTheme === 'dark' ? '#FFFFFF' : '#0F172A',
            'circle-stroke-opacity': 0.95,
          },
        });
      }

      // 3. CITY DOTS GLOW: Soft aura scaled by station density
      if (!map.getLayer('city-dots-glow')) {
        map.addLayer({
          id: 'city-dots-glow',
          type: 'circle',
          source: 'stations-source',
          paint: {
            'circle-color': currentTheme === 'dark' ? '#16C683' : '#059669',
            'circle-blur': 0.55,
            'circle-opacity': currentTheme === 'dark' ? 0.45 : 0.35,
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              1.5,
              [
                'step',
                ['get', 'stationCount'],
                3,       // 1 station: soft aura
                2, 4.8,  // 2-5 stations: medium aura
                6, 7,    // 6-19 stations: larger aura
                20, 9.5  // 20+ stations: broad aura
              ],
              7,
              [
                'step',
                ['get', 'stationCount'],
                4.5,
                2, 7.5,
                6, 11,
                20, 15
              ]
            ],
          },
        });
      }

      // 4. CITY DOTS: Radio Garden style dots
      if (!map.getLayer('city-dots')) {
        map.addLayer({
          id: 'city-dots',
          type: 'circle',
          source: 'stations-source',
          paint: {
            'circle-color': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              currentTheme === 'dark' ? '#2FE29C' : '#10B981',
              currentTheme === 'dark' ? '#16C683' : '#059669',
            ],
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              1.5,
              [
                'step',
                ['get', 'stationCount'],
                1.9,    // 1 station: compact point
                2, 3.4, // 2-5 stations: noticeable dot
                6, 4.9, // 6-19 stations: prominent dot
                20, 7   // 20+ stations: large metropolitan hub
              ],
              7,
              [
                'step',
                ['get', 'stationCount'],
                2.8,
                2, 5.2,
                6, 7.5,
                20, 11
              ]
            ],
            'circle-stroke-width': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              1.5,
              0.6
            ],
            'circle-stroke-color': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              currentTheme === 'dark' ? '#FFFFFF' : '#0F172A',
              currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.45)' : 'rgba(15, 23, 42, 0.35)'
            ],
          },
        });
      }

      // 5. CITY LABELS: Clean minimal typography
      if (!map.getLayer('city-labels')) {
        map.addLayer({
          id: 'city-labels',
          type: 'symbol',
          source: 'stations-source',
          minzoom: 4.8,
          filter: ['>', ['get', 'stationCount'], 1],
          layout: {
            'text-field': ['get', 'cityName'],
            'text-font': ['Open Sans Regular', 'Montserrat Regular', 'Arial Unicode MS Regular'],
            'text-size': 10,
            'text-offset': [0, 1.2],
            'text-anchor': 'top',
            'text-optional': true,
          },
          paint: {
            'text-color': currentTheme === 'dark' ? '#E6EDF3' : '#0F172A',
            'text-halo-color': currentTheme === 'dark' ? '#0B0E14' : '#FFFFFF',
            'text-halo-width': 1.8,
          },
        });
      }
    }, [buildGeoJson]);

    // Initialize MapLibre GL instance
    useEffect(() => {
      if (!mapContainerRef.current) return;

      const initialStyle = themeRef.current === 'dark' ? DARK_MAP_STYLE : LIGHT_MAP_STYLE;
      const map = new MapLibreMap({
        container: mapContainerRef.current,
        style: initialStyle,
        center: [0, 20],
        zoom: 1.5,
        minZoom: 1,
        maxZoom: 14,
        attributionControl: false,
      });

      mapRef.current = map;

      // Handle camera telemetry updates (throttled to RAF to avoid React state spam during movement)
      let telemetryRaf: number | null = null;
      const handleCameraUpdate = () => {
        if (telemetryRaf !== null) return;
        telemetryRaf = requestAnimationFrame(() => {
          telemetryRaf = null;
          if (!mapRef.current) return;
          const center = mapRef.current.getCenter();
          const zoom = mapRef.current.getZoom();
          onCameraChange({
            lat: center.lat,
            lng: center.lng,
            altitude: Number(zoom.toFixed(2)),
          });
        });
      };

      map.on('move', handleCameraUpdate);

      // Once style loads, activate Globe projection and configure layers
      const onStyleReady = () => {
        setupGlobeLayers(map, themeRef.current);
        handleCameraUpdate();
      };

      map.on('style.load', onStyleReady);
      map.on('load', onStyleReady);
      if (map.isStyleLoaded()) {
        onStyleReady();
      }

      const cancelScan = () => {
        if (scanTimerRef.current) {
          clearTimeout(scanTimerRef.current);
          scanTimerRef.current = null;
        }
      };

      const performReticleScan = () => {
        if (!map || !isStyleLoadedRef.current) return;
        // If user is currently holding the mouse down, do not interrupt!
        if (isMouseDownRef.current) return;

        const canvas = map.getCanvas();
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const centerX = width / 2;
        const centerY = height / 2;

        // Radius of central reticle circle (matches 56px diameter HUD reticle)
        const RETICLE_RADIUS = 28;
        // Search radius for magnetic snapping around the reticle
        const MAGNETIC_RADIUS = 75;

        const bbox: [[number, number], [number, number]] = [
          [centerX - MAGNETIC_RADIUS, centerY - MAGNETIC_RADIUS],
          [centerX + MAGNETIC_RADIUS, centerY + MAGNETIC_RADIUS],
        ];

        const features = map.queryRenderedFeatures(bbox, {
          layers: ['city-dots'],
        });

        if (!features || features.length === 0) return;

        const candidates: Array<{ city: CityGroup; distance: number }> = [];
        const seen = new Set<string>();

        for (const f of features) {
          const raw = f.properties?.cityData;
          if (!raw) continue;
          try {
            const city: CityGroup = JSON.parse(raw);
            if (seen.has(city.id)) continue;
            seen.add(city.id);

            const screenPos = map.project([city.lng, city.lat]);
            const distance = Math.hypot(screenPos.x - centerX, screenPos.y - centerY);
            candidates.push({ city, distance });
          } catch {
            // ignore JSON error
          }
        }

        if (candidates.length === 0) return;

        // 1. Check if any stations/cities are directly inside the reticle circle
        const insideReticle = candidates.filter((c) => c.distance <= RETICLE_RADIUS);

        if (insideReticle.length > 0) {
          // If multiple cities in the circle, pick a random one
          const chosen = insideReticle[Math.floor(Math.random() * insideReticle.length)].city;
          let chosenStation: Station | undefined;
          if (chosen.stations.length > 0) {
            chosenStation = chosen.stations[Math.floor(Math.random() * chosen.stations.length)];
          }

          // Smoothly glide the reticle center to the center of the radio station dot
          isProgrammaticMoveRef.current = true;
          map.easeTo({
            center: [chosen.lng, chosen.lat],
            duration: 600,
            easing: (t) => 1 - Math.pow(1 - t, 3), // Smooth cubic ease-out
            essential: true,
          });

          radioStaticEngine.stopNoise(300);
          onSelectCityRef.current(chosen, chosenStation, false);
          return;
        }

        // 2. If nothing directly inside the circle, check magnetic snap radius
        const insideMagnetic = candidates.filter((c) => c.distance <= MAGNETIC_RADIUS);

        if (insideMagnetic.length > 0) {
          // Sort by distance ascending to pick the nearest city
          insideMagnetic.sort((a, b) => a.distance - b.distance);
          const chosen = insideMagnetic[0].city;

          let chosenStation: Station | undefined;
          if (chosen.stations.length > 0) {
            chosenStation = chosen.stations[Math.floor(Math.random() * chosen.stations.length)];
          }

          // Magnetic snap: smoothly center the dot into the reticle at current zoom level
          isProgrammaticMoveRef.current = true;
          map.easeTo({
            center: [chosen.lng, chosen.lat],
            duration: 700,
            easing: (t) => 1 - Math.pow(1 - t, 3), // Smooth cubic ease-out
            essential: true,
          });

          radioStaticEngine.stopNoise(350);
          onSelectCityRef.current(chosen, chosenStation, false);
          return;
        }

        // 3. If nothing near, do not play anything
      };

      const scheduleScan = () => {
        cancelScan();
        scanTimerRef.current = setTimeout(() => {
          performReticleScan();
        }, 350); // 300-400ms range
      };

      // Map movement and user dragging detection with natural inertia preservation
      map.on('movestart', (e) => {
        if (isProgrammaticMoveRef.current) return;
        cancelScan();
        if (e.originalEvent) {
          isUserInteractingRef.current = true;
          radioStaticEngine.startNoise();
        }
      });

      map.on('move', () => {
        handleCameraUpdate();
        if (isProgrammaticMoveRef.current) return;
        if (isUserInteractingRef.current) {
          radioStaticEngine.startNoise();
          cancelScan();
          // If mouse is released and map is coasting on inertia, debounce scan
          if (!isMouseDownRef.current) {
            scheduleScan();
          }
        }
      });

      map.on('dragstart', () => {
        cancelScan();
        isUserInteractingRef.current = true;
        isMouseDownRef.current = true;
        radioStaticEngine.startNoise();
      });

      map.on('dragend', () => {
        isMouseDownRef.current = false;
        scheduleScan();
      });

      map.on('moveend', () => {
        if (isProgrammaticMoveRef.current) {
          isProgrammaticMoveRef.current = false;
          radioStaticEngine.stopNoise(300);
          return;
        }
        if (isUserInteractingRef.current) {
          isUserInteractingRef.current = false;
          radioStaticEngine.stopNoise(450);
          scheduleScan();
        }
      });

      const handleCanvasMouseDown = () => {
        isMouseDownRef.current = true;
        cancelScan();
        radioStaticEngine.ensureContextRunning();
      };

      const handleCanvasMouseUp = () => {
        isMouseDownRef.current = false;
        if (isUserInteractingRef.current) {
          scheduleScan();
        }
      };

      const canvas = map.getCanvas();
      canvas.addEventListener('mousedown', handleCanvasMouseDown);
      canvas.addEventListener('touchstart', handleCanvasMouseDown);
      canvas.addEventListener('mouseup', handleCanvasMouseUp);
      canvas.addEventListener('touchend', handleCanvasMouseUp);

      // Click on any city dot -> select city, fly to it, open drawer with station list, start playback
      map.on('click', 'city-dots', (e: MapLayerMouseEvent) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ['city-dots'],
        });
        if (!features.length) return;

        radioStaticEngine.stopNoise(300);
        const rawData = features[0].properties?.cityData;
        if (rawData) {
          try {
            const cityGroup: CityGroup = JSON.parse(rawData);
            onSelectCityRef.current(cityGroup, undefined, true);
          } catch (err) {
            console.error('Failed to parse city data:', err);
          }
        }
      });

      // Hover Dynamics on City Dots
      map.on('mousemove', 'city-dots', (e: MapLayerMouseEvent) => {
        map.getCanvas().style.cursor = 'pointer';
        if (e.features && e.features.length > 0) {
          const currentId = e.features[0].id;
          if (hoveredDotIdRef.current !== null && hoveredDotIdRef.current !== currentId) {
            map.setFeatureState(
              { source: 'stations-source', id: hoveredDotIdRef.current },
              { hover: false }
            );
          }
          if (currentId !== undefined) {
            hoveredDotIdRef.current = currentId;
            map.setFeatureState(
              { source: 'stations-source', id: currentId },
              { hover: true }
            );
          }
        }
      });

      map.on('mouseleave', 'city-dots', () => {
        map.getCanvas().style.cursor = '';
        if (hoveredDotIdRef.current !== null) {
          map.setFeatureState(
            { source: 'stations-source', id: hoveredDotIdRef.current },
            { hover: false }
          );
          hoveredDotIdRef.current = null;
        }
      });

      return () => {
        cancelScan();
        if (telemetryRaf !== null) {
          cancelAnimationFrame(telemetryRaf);
          telemetryRaf = null;
        }
        canvas.removeEventListener('mousedown', handleCanvasMouseDown);
        canvas.removeEventListener('touchstart', handleCanvasMouseDown);
        canvas.removeEventListener('mouseup', handleCanvasMouseUp);
        canvas.removeEventListener('touchend', handleCanvasMouseUp);
        map.remove();
        mapRef.current = null;
        isStyleLoadedRef.current = false;
      };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Update GeoJSON source when cities change
    useEffect(() => {
      const map = mapRef.current;
      if (!map || !isStyleLoadedRef.current) return;

      const source = map.getSource('stations-source') as GeoJSONSource | undefined;
      if (source) {
        source.setData(buildGeoJson(cities));
      }
    }, [cities, buildGeoJson]);

    // Update selected city indicator
    useEffect(() => {
      const map = mapRef.current;
      if (!map || !isStyleLoadedRef.current) return;

      const source = map.getSource('selected-city-source') as GeoJSONSource | undefined;
      if (source) {
        source.setData({
          type: 'FeatureCollection',
          features: selectedCity
            ? [
                {
                  type: 'Feature',
                  geometry: {
                    type: 'Point',
                    coordinates: [selectedCity.lng, selectedCity.lat],
                  },
                  properties: {},
                },
              ]
            : [],
        });
      }
    }, [selectedCity]);

    // Switch map style when theme changes
    const activeStyleThemeRef = useRef(theme);
    useEffect(() => {
      const map = mapRef.current;
      if (!map) return;
      if (activeStyleThemeRef.current === theme) return;
      activeStyleThemeRef.current = theme;

      isStyleLoadedRef.current = false;
      map.setStyle(theme === 'dark' ? DARK_MAP_STYLE : LIGHT_MAP_STYLE);
    }, [theme]);

    return (
      <div
        className={`relative w-full h-full ${
          isDark ? 'bg-[#07090D]' : 'bg-[#EBF0F5]'
        } overflow-hidden select-none`}
      >
        {/* Dynamic Celestial or Neutral Studio Background */}
        {isDark ? <SpaceBackground /> : <LightBackground />}

        {/* MapLibre Canvas Container */}
        <div ref={mapContainerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      </div>
    );
  })
);

MapGlobeView.displayName = 'MapGlobeView';
export default MapGlobeView;
