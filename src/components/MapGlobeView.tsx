import { useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import { Map as MapLibreMap, GeoJSONSource, MapLayerMouseEvent } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { CameraCoordinates, CityGroup } from '../types/radio';

export interface MapGlobeViewHandle {
  flyTo: (lat: number, lng: number, zoom?: number) => void;
}

interface MapGlobeViewProps {
  cities: CityGroup[];
  selectedCity: CityGroup | null;
  onSelectCity: (city: CityGroup) => void;
  onCameraChange: (coords: CameraCoordinates) => void;
}

export const MapGlobeView = forwardRef<MapGlobeViewHandle, MapGlobeViewProps>(
  ({ cities, selectedCity, onSelectCity, onCameraChange }, ref) => {
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<MapLibreMap | null>(null);
    const isStyleLoadedRef = useRef<boolean>(false);
    const hoveredClusterIdRef = useRef<string | number | null>(null);

    // Imperative flyTo method for camera positioning
    useImperativeHandle(ref, () => ({
      flyTo: (lat: number, lng: number, zoom = 4.5) => {
        if (mapRef.current) {
          mapRef.current.flyTo({
            center: [lng, lat],
            zoom,
            speed: 1.2,
            curve: 1.4,
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

        // Add clustered GeoJSON source
        map.addSource('stations-source', {
          type: 'geojson',
          data: buildGeoJson(cities),
          cluster: true,
          clusterRadius: 50,
          clusterMaxZoom: 14,
          clusterProperties: {
            total_stations: ['+', ['get', 'stationCount']],
          },
        });

        // Add dedicated source for selected city pulsing indicator
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

        // 1. CLUSTER: Outer radiant glow
        map.addLayer({
          id: 'clusters-glow',
          type: 'circle',
          source: 'stations-source',
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': '#16C683',
            'circle-radius': [
              'step',
              ['coalesce', ['get', 'total_stations'], ['get', 'point_count']],
              22,
              10, 26,
              50, 32,
              100, 38,
            ],
            'circle-blur': 0.55,
            'circle-opacity': 0.45,
          },
        });

        // 2. CLUSTER: Mint green base circle with high-contrast border
        map.addLayer({
          id: 'clusters-circle',
          type: 'circle',
          source: 'stations-source',
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              '#2FE29C',
              '#16C683',
            ],
            'circle-radius': [
              'step',
              ['coalesce', ['get', 'total_stations'], ['get', 'point_count']],
              14,
              10, 18,
              50, 24,
              100, 30,
            ],
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
            'circle-stroke-opacity': 0.9,
          },
        });

        // 3. CLUSTER: Station count text inside circle
        map.addLayer({
          id: 'clusters-count',
          type: 'symbol',
          source: 'stations-source',
          filter: ['has', 'point_count'],
          layout: {
            'text-field': ['to-string', ['coalesce', ['get', 'total_stations'], ['get', 'point_count']]],
            'text-font': ['Open Sans Bold', 'Montserrat Medium', 'Arial Unicode MS Bold'],
            'text-size': [
              'step',
              ['coalesce', ['get', 'total_stations'], ['get', 'point_count']],
              11,
              50, 12,
              100, 13,
            ],
            'text-allow-overlap': true,
            'text-ignore-placement': true,
          },
          paint: {
            'text-color': '#0B0E14',
          },
        });

        // 4. UNCLUSTERED: Selected city halo pulse
        map.addLayer({
          id: 'selected-city-pulse',
          type: 'circle',
          source: 'selected-city-source',
          paint: {
            'circle-color': '#2FE29C',
            'circle-radius': 24,
            'circle-blur': 0.6,
            'circle-opacity': 0.7,
          },
        });

        // 5. UNCLUSTERED: Outer soft glow
        map.addLayer({
          id: 'unclustered-glow',
          type: 'circle',
          source: 'stations-source',
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color': '#16C683',
            'circle-radius': 16,
            'circle-blur': 0.5,
            'circle-opacity': 0.35,
          },
        });

        // 6. UNCLUSTERED: Station / City circle
        map.addLayer({
          id: 'unclustered-circle',
          type: 'circle',
          source: 'stations-source',
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color': '#16C683',
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['get', 'stationCount'],
              1, 9,
              5, 12,
              20, 15,
            ],
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
            'circle-stroke-opacity': 0.9,
          },
        });

        // 7. UNCLUSTERED: Station count inside circle (if multiple stations in city)
        map.addLayer({
          id: 'unclustered-count',
          type: 'symbol',
          source: 'stations-source',
          filter: ['all', ['!', ['has', 'point_count']], ['>', ['get', 'stationCount'], 1]],
          layout: {
            'text-field': ['to-string', ['get', 'stationCount']],
            'text-font': ['Open Sans Bold', 'Montserrat Medium', 'Arial Unicode MS Bold'],
            'text-size': 9,
            'text-allow-overlap': true,
            'text-ignore-placement': true,
          },
          paint: {
            'text-color': '#0B0E14',
          },
        });

        // 8. UNCLUSTERED: Clean city name label
        map.addLayer({
          id: 'unclustered-label',
          type: 'symbol',
          source: 'stations-source',
          filter: ['!', ['has', 'point_count']],
          layout: {
            'text-field': ['get', 'cityName'],
            'text-font': ['Open Sans Regular', 'Montserrat Regular', 'Arial Unicode MS Regular'],
            'text-size': 11,
            'text-offset': [0, 1.4],
            'text-anchor': 'top',
            'text-optional': true,
          },
          paint: {
            'text-color': '#E6EDF3',
            'text-halo-color': '#0B0E14',
            'text-halo-width': 2,
          },
        });

        // Initial camera update
        handleCameraUpdate();
      });

      // Cluster Click: Smooth zoom towards cluster center
      map.on('click', 'clusters-circle', async (e: MapLayerMouseEvent) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ['clusters-circle'],
        });
        if (!features.length) return;

        const clusterId = features[0].properties?.cluster_id;
        const coordinates = (features[0].geometry as GeoJSON.Point).coordinates as [number, number];
        const source = map.getSource('stations-source') as GeoJSONSource | undefined;

        if (source && typeof clusterId === 'number') {
          try {
            const zoom = await source.getClusterExpansionZoom(clusterId);
            map.easeTo({
              center: coordinates,
              zoom: Math.max(zoom, map.getZoom() + 1.8),
              duration: 900,
              essential: true,
            });
          } catch {
            map.easeTo({
              center: coordinates,
              zoom: map.getZoom() + 2,
              duration: 900,
              essential: true,
            });
          }
        } else {
          map.easeTo({
            center: coordinates,
            zoom: map.getZoom() + 2,
            duration: 900,
            essential: true,
          });
        }
      });

      // Unclustered Point Click: Select city & start playback
      map.on('click', 'unclustered-circle', (e: MapLayerMouseEvent) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ['unclustered-circle'],
        });
        if (!features.length) return;

        const rawData = features[0].properties?.cityData;
        if (rawData) {
          try {
            const cityGroup: CityGroup = JSON.parse(rawData);
            onSelectCity(cityGroup);
          } catch (err) {
            console.error('Failed to parse city data:', err);
          }
        }
      });

      // Cluster Hover Dynamics
      map.on('mousemove', 'clusters-circle', (e: MapLayerMouseEvent) => {
        map.getCanvas().style.cursor = 'pointer';
        if (e.features && e.features.length > 0) {
          const currentId = e.features[0].id;
          if (hoveredClusterIdRef.current !== null && hoveredClusterIdRef.current !== currentId) {
            map.setFeatureState(
              { source: 'stations-source', id: hoveredClusterIdRef.current },
              { hover: false }
            );
          }
          if (currentId !== undefined) {
            hoveredClusterIdRef.current = currentId;
            map.setFeatureState(
              { source: 'stations-source', id: currentId },
              { hover: true }
            );
          }
        }
      });

      map.on('mouseleave', 'clusters-circle', () => {
        map.getCanvas().style.cursor = '';
        if (hoveredClusterIdRef.current !== null) {
          map.setFeatureState(
            { source: 'stations-source', id: hoveredClusterIdRef.current },
            { hover: false }
          );
          hoveredClusterIdRef.current = null;
        }
      });

      // Unclustered Hover Cursor
      map.on('mouseenter', 'unclustered-circle', () => {
        map.getCanvas().style.cursor = 'pointer';
      });

      map.on('mouseleave', 'unclustered-circle', () => {
        map.getCanvas().style.cursor = '';
      });

      return () => {
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
