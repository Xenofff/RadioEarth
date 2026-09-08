export interface WorldLabel {
  text: string;
  lat: number;
  lng: number;
  size: number;
  color: string;
  type: 'country' | 'city';
}

export const WORLD_LABELS: WorldLabel[] = [
  // --- Countries (Uppercase, crisp muted-silver/mint tint) ---
  { text: 'NORWAY', lat: 60.47, lng: 8.46, size: 1.1, color: '#A1A7B4', type: 'country' },
  { text: 'SWEDEN', lat: 60.12, lng: 18.64, size: 1.1, color: '#A1A7B4', type: 'country' },
  { text: 'FINLAND', lat: 61.92, lng: 25.74, size: 1.1, color: '#A1A7B4', type: 'country' },
  { text: 'NETHERLANDS', lat: 52.13, lng: 5.29, size: 0.95, color: '#A1A7B4', type: 'country' },
  { text: 'UNITED KINGDOM', lat: 55.37, lng: -3.43, size: 1.1, color: '#A1A7B4', type: 'country' },
  { text: 'FRANCE', lat: 46.22, lng: 2.21, size: 1.2, color: '#A1A7B4', type: 'country' },
  { text: 'GERMANY', lat: 51.16, lng: 10.45, size: 1.2, color: '#A1A7B4', type: 'country' },
  { text: 'SPAIN', lat: 40.46, lng: -3.74, size: 1.1, color: '#A1A7B4', type: 'country' },
  { text: 'ITALY', lat: 41.87, lng: 12.56, size: 1.1, color: '#A1A7B4', type: 'country' },
  { text: 'POLAND', lat: 51.91, lng: 19.14, size: 1.1, color: '#A1A7B4', type: 'country' },
  { text: 'UKRAINE', lat: 48.37, lng: 31.16, size: 1.1, color: '#A1A7B4', type: 'country' },
  { text: 'RUSSIA', lat: 61.52, lng: 105.31, size: 1.6, color: '#A1A7B4', type: 'country' },
  { text: 'TURKEY', lat: 38.96, lng: 35.24, size: 1.1, color: '#A1A7B4', type: 'country' },
  { text: 'UNITED STATES', lat: 37.09, lng: -95.71, size: 1.6, color: '#A1A7B4', type: 'country' },
  { text: 'CANADA', lat: 56.13, lng: -106.34, size: 1.6, color: '#A1A7B4', type: 'country' },
  { text: 'MEXICO', lat: 23.63, lng: -102.55, size: 1.2, color: '#A1A7B4', type: 'country' },
  { text: 'BRAZIL', lat: -14.23, lng: -51.92, size: 1.5, color: '#A1A7B4', type: 'country' },
  { text: 'ARGENTINA', lat: -38.41, lng: -63.61, size: 1.2, color: '#A1A7B4', type: 'country' },
  { text: 'JAPAN', lat: 36.2, lng: 138.25, size: 1.0, color: '#A1A7B4', type: 'country' },
  { text: 'CHINA', lat: 35.86, lng: 104.19, size: 1.6, color: '#A1A7B4', type: 'country' },
  { text: 'INDIA', lat: 20.59, lng: 78.96, size: 1.4, color: '#A1A7B4', type: 'country' },
  { text: 'AUSTRALIA', lat: -25.27, lng: 133.77, size: 1.5, color: '#A1A7B4', type: 'country' },
  { text: 'SOUTH AFRICA', lat: -30.55, lng: 22.93, size: 1.1, color: '#A1A7B4', type: 'country' },
  { text: 'EGYPT', lat: 26.82, lng: 30.8, size: 1.1, color: '#A1A7B4', type: 'country' },
  { text: 'INDONESIA', lat: -0.78, lng: 113.92, size: 1.2, color: '#A1A7B4', type: 'country' },

  // --- Major Cities (Readable, distinctive white/mint accent) ---
  { text: 'London', lat: 51.5074, lng: -0.1278, size: 0.85, color: '#FFFFFF', type: 'city' },
  { text: 'Paris', lat: 48.8566, lng: 2.3522, size: 0.85, color: '#FFFFFF', type: 'city' },
  { text: 'Amsterdam', lat: 52.3676, lng: 4.9041, size: 0.8, color: '#FFFFFF', type: 'city' },
  { text: 'Berlin', lat: 52.52, lng: 13.405, size: 0.85, color: '#FFFFFF', type: 'city' },
  { text: 'Madrid', lat: 40.4168, lng: -3.7038, size: 0.85, color: '#FFFFFF', type: 'city' },
  { text: 'Rome', lat: 41.9028, lng: 12.4964, size: 0.85, color: '#FFFFFF', type: 'city' },
  { text: 'Oslo', lat: 59.9139, lng: 10.7522, size: 0.8, color: '#FFFFFF', type: 'city' },
  { text: 'Stockholm', lat: 59.3293, lng: 18.0686, size: 0.8, color: '#FFFFFF', type: 'city' },
  { text: 'Warsaw', lat: 52.2297, lng: 21.0122, size: 0.8, color: '#FFFFFF', type: 'city' },
  { text: 'Kyiv', lat: 50.4501, lng: 30.5234, size: 0.8, color: '#FFFFFF', type: 'city' },
  { text: 'Moscow', lat: 55.7558, lng: 37.6173, size: 0.85, color: '#FFFFFF', type: 'city' },
  { text: 'Istanbul', lat: 41.0082, lng: 28.9784, size: 0.85, color: '#FFFFFF', type: 'city' },
  { text: 'Dubai', lat: 25.2048, lng: 55.2708, size: 0.8, color: '#FFFFFF', type: 'city' },
  { text: 'Tokyo', lat: 35.6762, lng: 139.6503, size: 0.9, color: '#FFFFFF', type: 'city' },
  { text: 'Seoul', lat: 37.5665, lng: 126.978, size: 0.85, color: '#FFFFFF', type: 'city' },
  { text: 'Singapore', lat: 1.3521, lng: 103.8198, size: 0.8, color: '#FFFFFF', type: 'city' },
  { text: 'Sydney', lat: -33.8688, lng: 151.2093, size: 0.85, color: '#FFFFFF', type: 'city' },
  { text: 'New York', lat: 40.7128, lng: -74.006, size: 0.9, color: '#FFFFFF', type: 'city' },
  { text: 'Los Angeles', lat: 34.0522, lng: -118.2437, size: 0.85, color: '#FFFFFF', type: 'city' },
  { text: 'Chicago', lat: 41.8781, lng: -87.6298, size: 0.8, color: '#FFFFFF', type: 'city' },
  { text: 'Toronto', lat: 43.6532, lng: -79.3832, size: 0.85, color: '#FFFFFF', type: 'city' },
  { text: 'Rio de Janeiro', lat: -22.9068, lng: -43.1729, size: 0.85, color: '#FFFFFF', type: 'city' },
  { text: 'Buenos Aires', lat: -34.6037, lng: -58.3816, size: 0.85, color: '#FFFFFF', type: 'city' },
  { text: 'Cairo', lat: 30.0444, lng: 31.2357, size: 0.85, color: '#FFFFFF', type: 'city' },
];
