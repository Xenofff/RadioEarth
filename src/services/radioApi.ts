import { CityGroup, Station } from '../types/radio';

interface RawApiStation {
  changeuuid: string;
  stationuuid: string;
  name: string;
  url: string;
  url_resolved: string;
  homepage: string;
  favicon: string;
  tags: string;
  country: string;
  countrycode: string;
  state: string;
  language: string;
  votes: number;
  lastchangetime: string;
  codec: string;
  bitrate: number;
  hls: number;
  lastcheckok: number;
  clickcount: number;
  clicktrend: number;
  geo_lat: number | null;
  geo_long: number | null;
}

const RADIO_API_SERVERS = [
  'https://de1.api.radio-browser.info',
  'https://nl1.api.radio-browser.info',
  'https://at1.api.radio-browser.info',
];

const SEARCH_PARAMS =
  'has_geo_info=true&limit=3500&order=clickcount&reverse=true&hidebroken=true';

function groupStations(validStations: Station[]): CityGroup[] {
  const cityMap = new Map<string, CityGroup>();

  for (const station of validStations) {
    const latCluster = (Math.round(station.lat * 8) / 8).toFixed(2);
    const lngCluster = (Math.round(station.lng * 8) / 8).toFixed(2);
    const clusterKey = `${latCluster}_${lngCluster}`;

    const resolvedCityName =
      station.state ||
      station.name.split(/[-–—|:]/)[0].trim() ||
      station.country;

    if (!cityMap.has(clusterKey)) {
      cityMap.set(clusterKey, {
        id: clusterKey,
        cityName: resolvedCityName,
        country: station.country,
        countryCode: station.countryCode,
        lat: station.lat,
        lng: station.lng,
        stations: [station],
      });
    } else {
      const group = cityMap.get(clusterKey)!;
      if (!group.stations.some((s) => s.id === station.id)) {
        group.stations.push(station);
      }
    }
  }

  const groupedCities = Array.from(cityMap.values()).map((city) => {
    city.stations.sort((a, b) => b.clickCount - a.clickCount);
    return city;
  });

  groupedCities.sort((a, b) => b.stations.length - a.stations.length);
  return groupedCities;
}

/**
 * Fetches stations with high availability:
 * 1. Loads pre-bundled data/stations.json snapshot (instant, zero CORS, guaranteed to work on GitHub Pages & offline).
 * 2. Attempts live refresh from Radio Browser API mirrors without forbidden headers.
 */
export async function fetchStations(): Promise<CityGroup[]> {
  // Strategy 1: Try local bundled snapshot first for instant, 100% reliable loading on GitHub Pages
  try {
    const snapshotUrl = `${import.meta.env.BASE_URL}data/stations.json`;
    const snapshotRes = await fetch(snapshotUrl);
    if (snapshotRes.ok) {
      const snapshotStations: Station[] = await snapshotRes.json();
      if (Array.isArray(snapshotStations) && snapshotStations.length > 0) {
        console.log(`[RadioEarth] Loaded ${snapshotStations.length} stations from bundled snapshot.`);
        return groupStations(snapshotStations);
      }
    }
  } catch (snapshotErr) {
    console.warn('[RadioEarth] Local snapshot load failed, trying live API...', snapshotErr);
  }

  // Strategy 2: Fetch live stations from Radio Browser API
  try {
    let rawData: RawApiStation[] | null = null;
    let lastError: unknown = null;

    for (const server of RADIO_API_SERVERS) {
      try {
        const response = await fetch(`${server}/json/stations/search?${SEARCH_PARAMS}`);
        if (response.ok) {
          rawData = await response.json();
          break;
        }
      } catch (err) {
        lastError = err;
        console.warn(`[RadioEarth] Radio API mirror ${server} failed:`, err);
      }
    }

    if (!rawData) {
      throw lastError || new Error('Failed to fetch from all Radio API mirrors');
    }

    // 1. Filter: must have valid latitude, longitude, and stream url starting with https://
    const validStations: Station[] = rawData
      .filter((item) => {
        const streamUrl = item.url_resolved || item.url;
        const hasValidCoords =
          item.geo_lat !== null &&
          item.geo_long !== null &&
          !isNaN(Number(item.geo_lat)) &&
          !isNaN(Number(item.geo_long)) &&
          (item.geo_lat !== 0 || item.geo_long !== 0);

        const hasSecureUrl =
          typeof streamUrl === 'string' && streamUrl.trim().toLowerCase().startsWith('https://');

        const hasName = typeof item.name === 'string' && item.name.trim().length > 0;

        return hasValidCoords && hasSecureUrl && hasName;
      })
      .map((item) => {
        const streamUrl = (item.url_resolved || item.url).trim();
        const tags = item.tags
          ? item.tags
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
          : [];

        return {
          id: item.stationuuid,
          name: item.name.trim(),
          url: item.url,
          streamUrl,
          favicon: item.favicon || '',
          country: item.country?.trim() || 'Unknown Country',
          countryCode: item.countrycode?.trim().toUpperCase() || '',
          state: item.state?.trim() || '',
          tags: tags.slice(0, 5),
          codec: item.codec || 'MP3',
          bitrate: item.bitrate || 128,
          votes: item.votes || 0,
          clickCount: item.clickcount || 0,
          isHls: item.hls === 1 || streamUrl.includes('.m3u8'),
          lat: Number(item.geo_lat),
          lng: Number(item.geo_long),
        };
      });

    return groupStations(validStations);
  } catch (error) {
    console.error('Failed to fetch and group radio stations:', error);
    throw error;
  }
}
