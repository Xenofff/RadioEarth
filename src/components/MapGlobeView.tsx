import { useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import { Map as MapLibreMap, GeoJSONSource, MapLayerMouseEvent } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { CameraCoordinates, CityGroup, Station } from '../types/radio';

export interface MapGlobeViewHandle {
  flyTo: (lat: number, lng: number, zoom?: number) => void;
}

interface MapGlobeViewProps {
  cities: CityGroup[];
  selectedCity: CityGroup | null;
  onSelectCity: (city: CityGroup, targetStation?: Station, shouldFlyTo?: boolean) => void;
  onCameraChange: (coords: CameraCoordinates) => void;
}

export const MapGlobeView = forwardRef<MapGlobeViewHandle, MapGlobeViewProps>(
  ({ cities, selectedCity, onSelectCity, onCameraChange }, ref) => {
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

    // Convert CityGroup[] into GeoJSON FeatureCollection
    const buildGeoJson = useCallback((cityList: CityGroup[]): GeoJSON.FeatureCollection<GeoJSON.Point> => {
      return {
        type: 'FeatureCollection',
        features: cityList.map((city) => ({
          type: 'Feature',
          id: city.id,
          geometry: {
            type: 'Point',
            coordinates: [city.lng, city.lat],
          },
          properties: {
            id: city.id,
            cityName: city.cityName,
            country: city.country,
            countryCode: city.countryCode,
            stationCount: city.stations.length,
            cityData: JSON.stringify(city),
          },
        })),
      };
    }, []);

    // Initialize MapLibre GL instance
    useEffect(() => {
      if (!mapContainerRef.current) return;

      const map = new MapLibreMap({
        container: mapContainerRef.current,
        style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
        center: [0, 20],
        zoom: 1.5,
        minZoom: 1,
        maxZoom: 14,
        attributionControl: false,
      });

      mapRef.current = map;

      // Handle camera telemetry updates
      const handleCameraUpdate = () => {
        const center = map.getCenter();
        const zoom = map.getZoom();
        onCameraChange({
          lat: center.lat,
          lng: center.lng,
          altitude: Number(zoom.toFixed(2)),
        });
      };

      map.on('move', handleCameraUpdate);

      // Once style loads, activate Globe projection and configure layers
      map.on('style.load', () => {
        isStyleLoadedRef.current = true;

        // Set native 3D globe projection
        map.setProjection({
          type: 'globe',
        });

        // Set space sky & atmospheric halo
        try {
          map.setSky({
            'sky-color': '#0B0E14',
            'sky-horizon-blend': 0.35,
            'fog-color': '#07090D',
            'fog-ground-blend': 0.35,
          });
        } catch {
          // Ignored if sky is not supported in current style version
        }

        // Set background and ocean colors for high-contrast presentation
        if (map.getLayer('background')) {
          map.setPaintProperty('background', 'background-color', 'rgb(47, 49, 54)');
        }
        if (map.getLayer('water')) {
          map.setPaintProperty('water', 'fill-color', '#0B0E14');
        }

        // Add explicit vector countries layer with fill-color rgb(47, 49, 54)
        if (!map.getSource('countries-source')) {
          map.addSource('countries-source', {
            type: 'geojson',
            data: '/data/countries.geojson',
          });

          map.addLayer(
            {
              id: 'countries-fill',
              type: 'fill',
              source: 'countries-source',
              paint: {
                'fill-color': 'rgb(47, 49, 54)',
                'fill-opacity': 1,
              },
            },
            'water'
          );

          map.addLayer(
            {
              id: 'countries-border',
              type: 'line',
              source: 'countries-source',
              paint: {
                'line-color': 'rgba(255, 255, 255, 0.12)',
                'line-width': 0.8,
              },
            },
            'water'
          );
        }

        // Add stations GeoJSON source (unclustered for Radio Garden starry dot aesthetics)
        map.addSource('stations-source', {
          type: 'geojson',
          data: buildGeoJson(cities),
          cluster: false,
        });

        // Add dedicated source for selected city targeting reticle & pulse
        map.addSource('selected-city-source', {
          type: 'geojson',
          data: {
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
          },
        });

        // 1. SELECTED CITY: Ambient green pulse behind the active city
        map.addLayer({
          id: 'selected-city-pulse',
          type: 'circle',
          source: 'selected-city-source',
          paint: {
            'circle-color': '#2FE29C',
            'circle-radius': 22,
            'circle-blur': 0.75,
            'circle-opacity': 0.55,
          },
        });

        // 2. SELECTED CITY: Iconic Radio Garden white reticle ring
        map.addLayer({
          id: 'selected-city-reticle',
          type: 'circle',
          source: 'selected-city-source',
          paint: {
            'circle-color': 'rgba(0, 0, 0, 0)',
            'circle-radius': 16,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#FFFFFF',
            'circle-stroke-opacity': 0.95,
          },
        });

        // 3. CITY DOTS GLOW: Soft emerald aura scaled by station density
        map.addLayer({
          id: 'city-dots-glow',
          type: 'circle',
          source: 'stations-source',
          paint: {
            'circle-color': '#16C683',
            'circle-blur': 0.55,
            'circle-opacity': 0.45,
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

        // 4. CITY DOTS: Radio Garden style dots (small for 1 station, larger for multiple, largest for major hubs)
        map.addLayer({
          id: 'city-dots',
          type: 'circle',
          source: 'stations-source',
          paint: {
            'circle-color': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              '#2FE29C',
              '#16C683',
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
              '#FFFFFF',
              'rgba(255, 255, 255, 0.45)'
            ],
          },
        });

        // 5. CITY LABELS: Clean minimal typography for multi-station cities when zoomed in
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
            'text-color': '#E6EDF3',
            'text-halo-color': '#0B0E14',
            'text-halo-width': 1.8,
          },
        });

        // Initial camera update
        handleCameraUpdate();
      });

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
        }
      });

      map.on('move', () => {
        handleCameraUpdate();
        if (isProgrammaticMoveRef.current) return;
        if (isUserInteractingRef.current) {
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
      });

      map.on('dragend', () => {
        isMouseDownRef.current = false;
        scheduleScan();
      });

      map.on('moveend', () => {
        if (isProgrammaticMoveRef.current) {
          isProgrammaticMoveRef.current = false;
          return;
        }
        if (isUserInteractingRef.current) {
          isUserInteractingRef.current = false;
          scheduleScan();
        }
      });

      const handleCanvasMouseDown = () => {
        isMouseDownRef.current = true;
        cancelScan();
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

    return (
      <div className="relative w-full h-full bg-[#07090D] overflow-hidden select-none">
        {/* Subtle Starry Space Background Texture behind the globe */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            backgroundImage: `radial-gradient(1.5px 1.5px at 20px 30px, #ffffff, rgba(0,0,0,0)),
                              radial-gradient(1px 1px at 40px 70px, #16C683, rgba(0,0,0,0)),
                              radial-gradient(1.5px 1.5px at 90px 40px, #ffffff, rgba(0,0,0,0)),
                              radial-gradient(1px 1px at 160px 120px, #8B949E, rgba(0,0,0,0)),
                              radial-gradient(1.5px 1.5px at 230px 190px, #ffffff, rgba(0,0,0,0)),
                              radial-gradient(1px 1px at 290px 80px, #16C683, rgba(0,0,0,0))`,
            backgroundRepeat: 'repeat',
            backgroundSize: '320px 320px',
          }}
        />

        {/* MapLibre Canvas Container */}
        <div ref={mapContainerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      </div>
    );
  }
);

MapGlobeView.displayName = 'MapGlobeView';
export default MapGlobeView;
