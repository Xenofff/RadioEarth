/**
 * Astronomical calculations for the Solar Terminator (Day/Night dividing line)
 * and nocturnal shadow GeoJSON generation.
 */

export interface SubsolarPoint {
  lat: number; // Declination in degrees [-23.5, 23.5]
  lng: number; // Subsolar longitude in degrees [-180, 180]
}

/**
 * Calculates the exact subsolar point (latitude and longitude where the sun is directly overhead)
 * for any given UTC Date.
 */
export function computeSubsolarPoint(date: Date = new Date()): SubsolarPoint {
  const time = date.getTime();
  const julianDay = time / 86400000 + 2440587.5;
  const D = julianDay - 2451545.0; // Days since J2000.0

  // Mean solar anomaly
  const g = (357.529 + 0.98560028 * D) % 360;
  const gRad = (g * Math.PI) / 180;

  // Mean solar longitude
  const q = (280.459 + 0.98564736 * D) % 360;

  // Sun's ecliptic longitude
  const L = (q + 1.915 * Math.sin(gRad) + 0.02 * Math.sin(2 * gRad)) % 360;
  const LRad = (L * Math.PI) / 180;

  // Obliquity of the ecliptic
  const e = 23.439 - 0.00000036 * D;
  const eRad = (e * Math.PI) / 180;

  // Sun's declination (subsolar latitude)
  const sinDec = Math.sin(eRad) * Math.sin(LRad);
  const sunLat = (Math.asin(sinDec) * 180) / Math.PI;

  // Equation of Time (EoT) calculation
  const y = Math.tan(eRad / 2) * Math.tan(eRad / 2);
  const qRad = (q * Math.PI) / 180;
  const eot =
    y * Math.sin(2 * qRad) -
    2 * 0.0167 * Math.sin(gRad) +
    4 * 0.0167 * y * Math.sin(gRad) * Math.cos(2 * qRad) -
    0.5 * y * y * Math.sin(4 * qRad) -
    1.25 * 0.0167 * 0.0167 * Math.sin(2 * gRad);
  const eotMinutes = (eot * 4 * 180) / Math.PI;

  // Greenwich Mean Time in decimal hours
  const utcHours =
    date.getUTCHours() +
    date.getUTCMinutes() / 60 +
    date.getUTCSeconds() / 3600 +
    date.getUTCMilliseconds() / 3600000;

  // Subsolar longitude (at solar noon, sun is overhead at the meridian)
  let sunLng = -((utcHours - 12) * 15 + eotMinutes / 4);

  // Normalize to [-180, 180]
  while (sunLng > 180) sunLng -= 360;
  while (sunLng < -180) sunLng += 360;

  return {
    lat: sunLat,
    lng: sunLng,
  };
}

/**
 * Checks if a specific coordinate (lat, lng) is currently on the night side of Earth.
 */
export function isCoordinateInNight(
  lat: number,
  lng: number,
  subsolar: SubsolarPoint
): boolean {
  const phi1 = (lat * Math.PI) / 180;
  const phi2 = (subsolar.lat * Math.PI) / 180;
  const deltaLambda = ((lng - subsolar.lng) * Math.PI) / 180;

  // Spherical angular distance from subsolar point
  const cosDistance =
    Math.sin(phi1) * Math.sin(phi2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

  // If distance > 90° (cosDistance < 0), the location is in the night hemisphere
  return cosDistance < 0;
}

/**
 * Generates GeoJSON for:
 * 1. `terminator-shadow`: Polygon covering the night hemisphere of the Earth
 * 2. `terminator-twilight`: LineString marking the sunset/sunrise boundary
 */
export function buildTerminatorGeoJson(date: Date = new Date()): GeoJSON.FeatureCollection {
  const subsolar = computeSubsolarPoint(date);
  const tanDec = Math.tan((subsolar.lat * Math.PI) / 180);

  const points: [number, number][] = [];
  const step = 1; // High resolution (1 degree step) for smooth curvature on 3D globe

  for (let lon = -180; lon <= 180; lon += step) {
    const deltaLonRad = ((lon - subsolar.lng) * Math.PI) / 180;

    let lat: number;
    if (Math.abs(tanDec) < 1e-6) {
      // Near equinox, terminator is perpendicular to the equator
      lat = deltaLonRad > 0 ? 89.9 : -89.9;
    } else {
      const tanLat = -Math.cos(deltaLonRad) / tanDec;
      lat = (Math.atan(tanLat) * 180) / Math.PI;
    }

    // Clamp latitude to [-89.9, 89.9]
    lat = Math.max(-89.9, Math.min(89.9, lat));
    points.push([lon, lat]);
  }

  // Determine which polar cap is in continuous darkness
  // When sun is in northern hemisphere (subsolar.lat >= 0), South Pole is in night
  const isSouthPoleNight = subsolar.lat >= 0;

  // Assemble the closed night polygon ring
  const polygonRing: [number, number][] = [];

  if (isSouthPoleNight) {
    // Follow the terminator from -180 to +180
    for (const pt of points) {
      polygonRing.push(pt);
    }
    // Close along the South Pole
    polygonRing.push([180, -90]);
    polygonRing.push([-180, -90]);
    polygonRing.push(points[0]);
  } else {
    // North Pole is in night
    for (const pt of points) {
      polygonRing.push(pt);
    }
    // Close along the North Pole
    polygonRing.push([180, 90]);
    polygonRing.push([-180, 90]);
    polygonRing.push(points[0]);
  }

  return {
    type: 'FeatureCollection',
    features: [
      // 1. Night hemisphere shadow polygon
      {
        type: 'Feature',
        id: 'terminator-shadow-poly',
        geometry: {
          type: 'Polygon',
          coordinates: [polygonRing],
        },
        properties: {
          subsolarLat: subsolar.lat,
          subsolarLng: subsolar.lng,
        },
      },
      // 2. Glowing twilight boundary line
      {
        type: 'Feature',
        id: 'terminator-twilight-line',
        geometry: {
          type: 'LineString',
          coordinates: points,
        },
        properties: {
          subsolarLat: subsolar.lat,
          subsolarLng: subsolar.lng,
        },
      },
    ],
  };
}
