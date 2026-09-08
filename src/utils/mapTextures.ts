/**
 * Procedural texture generator for MapLibre GL JS globe landmasses.
 * Generates seamless organic micro-topographic and relief textures.
 */

export function createLandTexture(theme: 'dark' | 'light'): ImageData {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return new ImageData(size, size);
  }

  ctx.clearRect(0, 0, size, size);

  const isDark = theme === 'dark';

  // 1. Base Organic Elevation / Noise Field
  // Generate multi-octave smooth value noise
  const noiseGrid: number[][] = [];
  const gridSize = 16;
  for (let y = 0; y <= gridSize; y++) {
    noiseGrid[y] = [];
    for (let x = 0; x <= gridSize; x++) {
      // Deterministic pseudo-random values
      const val = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      noiseGrid[y][x] = val - Math.floor(val);
    }
  }

  // Smooth interpolation helper
  function smoothNoise(x: number, y: number): number {
    const gx = (x / size) * gridSize;
    const gy = (y / size) * gridSize;
    const x0 = Math.floor(gx) % gridSize;
    const y0 = Math.floor(gy) % gridSize;
    const x1 = (x0 + 1) % gridSize;
    const y1 = (y0 + 1) % gridSize;
    const fx = gx - Math.floor(gx);
    const fy = gy - Math.floor(gy);

    // Smoothstep curve
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);

    const top = noiseGrid[y0][x0] * (1 - sx) + noiseGrid[y0][x1] * sx;
    const bottom = noiseGrid[y1][x0] * (1 - sx) + noiseGrid[y1][x1] * sx;
    return top * (1 - sy) + bottom * sy;
  }

  // 2. Draw micro-relief pixel field
  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;

      // Multi-frequency noise: primary elevation + fine detail
      const n1 = smoothNoise(x, y);
      const n2 = smoothNoise(x * 2.5, y * 2.5);
      const elevation = n1 * 0.7 + n2 * 0.3;

      // Fine grain noise
      const grain = (Math.random() - 0.5) * 0.25;
      const combined = Math.min(1, Math.max(0, elevation + grain));

      if (isDark) {
        if (combined > 0.55) {
          // Highlight: subtle cool white/mint elevation
          const alpha = (combined - 0.55) * 160;
          data[idx] = 255;
          data[idx + 1] = 255;
          data[idx + 2] = 255;
          data[idx + 3] = Math.min(65, Math.floor(alpha));
        } else if (combined < 0.45) {
          // Shadow: subtle darker relief groove
          const alpha = (0.45 - combined) * 180;
          data[idx] = 0;
          data[idx + 1] = 0;
          data[idx + 2] = 0;
          data[idx + 3] = Math.min(75, Math.floor(alpha));
        } else {
          data[idx + 3] = 0;
        }
      } else {
        // Light Theme: subtle slate grain and highlights
        if (combined > 0.58) {
          data[idx] = 255;
          data[idx + 1] = 255;
          data[idx + 2] = 255;
          data[idx + 3] = Math.min(50, Math.floor((combined - 0.58) * 120));
        } else if (combined < 0.42) {
          data[idx] = 30;
          data[idx + 1] = 41;
          data[idx + 2] = 59;
          data[idx + 3] = Math.min(45, Math.floor((0.42 - combined) * 140));
        } else {
          data[idx + 3] = 0;
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);

  // 3. Draw fine organic topographic elevation contour lines
  ctx.lineWidth = 0.75;
  ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(71, 85, 105, 0.09)';

  // Contour curve 1
  ctx.beginPath();
  ctx.moveTo(0, size * 0.25);
  ctx.bezierCurveTo(size * 0.3, size * 0.15, size * 0.7, size * 0.4, size, size * 0.3);
  ctx.stroke();

  // Contour curve 2
  ctx.beginPath();
  ctx.moveTo(0, size * 0.65);
  ctx.bezierCurveTo(size * 0.25, size * 0.8, size * 0.65, size * 0.5, size, size * 0.75);
  ctx.stroke();

  // Contour curve 3
  ctx.beginPath();
  ctx.moveTo(size * 0.2, 0);
  ctx.bezierCurveTo(size * 0.35, size * 0.35, size * 0.15, size * 0.7, size * 0.4, size);
  ctx.stroke();

  // Contour curve 4
  ctx.beginPath();
  ctx.moveTo(size * 0.75, 0);
  ctx.bezierCurveTo(size * 0.6, size * 0.4, size * 0.85, size * 0.75, size * 0.7, size);
  ctx.stroke();

  // 4. Subtle tactical micro-stipple coordinate crosses at corners/center
  ctx.fillStyle = isDark ? 'rgba(22, 198, 131, 0.15)' : 'rgba(16, 185, 129, 0.15)';
  const dotPoints = [
    [16, 16],
    [size - 16, 16],
    [16, size - 16],
    [size - 16, size - 16],
    [size / 2, size / 2],
  ];
  dotPoints.forEach(([x, y]) => {
    ctx.fillRect(x - 1, y - 0.5, 2, 1);
    ctx.fillRect(x - 0.5, y - 1, 1, 2);
  });

  return ctx.getImageData(0, 0, size, size);
}

/**
 * Generates a GeoJSON feature collection of geographic graticule lines (meridians & parallels).
 * Adds tactical planetary coordinate grid lines to the 3D globe.
 */
export function buildGraticuleGeoJson(): GeoJSON.FeatureCollection<GeoJSON.LineString> {
  const features: GeoJSON.Feature<GeoJSON.LineString>[] = [];

  // Parallels (latitudes every 30 degrees: -60, -30, 0, 30, 60)
  for (let lat = -60; lat <= 60; lat += 30) {
    const coords: [number, number][] = [];
    for (let lng = -180; lng <= 180; lng += 5) {
      coords.push([lng, lat]);
    }
    features.push({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: coords,
      },
      properties: {
        type: 'parallel',
        isEquator: lat === 0,
      },
    });
  }

  // Meridians (longitudes every 30 degrees: -180 to 150)
  for (let lng = -180; lng < 180; lng += 30) {
    const coords: [number, number][] = [];
    for (let lat = -80; lat <= 80; lat += 5) {
      coords.push([lng, lat]);
    }
    features.push({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: coords,
      },
      properties: {
        type: 'meridian',
        isPrime: lng === 0,
      },
    });
  }

  return {
    type: 'FeatureCollection',
    features,
  };
}
