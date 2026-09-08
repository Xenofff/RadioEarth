export interface Station {
  id: string;
  name: string;
  url: string;
  streamUrl: string;
  favicon: string;
  country: string;
  countryCode: string;
  state: string;
  tags: string[];
  codec: string;
  bitrate: number;
  votes: number;
  clickCount: number;
  isHls: boolean;
  lat: number;
  lng: number;
}

export interface CityGroup {
  id: string;
  cityName: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
  stations: Station[];
}

export type PlaybackStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

export interface CameraCoordinates {
  lat: number;
  lng: number;
  altitude: number;
}
