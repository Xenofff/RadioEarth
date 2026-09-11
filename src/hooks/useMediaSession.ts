import { useEffect } from 'react';
import { CityGroup, Station } from '../types/radio';
import { nativeBackgroundAudio } from '../services/nativeBackgroundAudio';

interface UseMediaSessionProps {
  station: Station | null;
  city: CityGroup | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onPrevStation?: () => void;
  onNextStation?: () => void;
}

/**
 * Integrates playback with the OS MediaSession API:
 * - Lock screen controls on iOS & Android
 * - macOS Control Center & Windows Action Center
 * - Headphone media buttons & keyboard media keys
 */
export function useMediaSession({
  station,
  city,
  isPlaying,
  onTogglePlay,
  onPrevStation,
  onNextStation,
}: UseMediaSessionProps) {
  // Update metadata (Title, Artist, Album, Artwork)
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    if (!station) {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = 'none';
      return;
    }

    const artist = city?.cityName
      ? `${city.cityName}, ${station.country} • Radio Earth`
      : `${station.state ? `${station.state}, ` : ''}${station.country} • Radio Earth`;

    const artwork: MediaImage[] = [];
    if (station.favicon) {
      artwork.push(
        { src: station.favicon, sizes: '96x96', type: 'image/png' },
        { src: station.favicon, sizes: '128x128', type: 'image/png' },
        { src: station.favicon, sizes: '192x192', type: 'image/png' },
        { src: station.favicon, sizes: '256x256', type: 'image/png' },
        { src: station.favicon, sizes: '512x512', type: 'image/png' }
      );
    }

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: station.name,
        artist,
        album: 'Radio Earth — Global Web Tuner',
        artwork,
      });
    } catch (err) {
      console.warn('Failed to set MediaMetadata:', err);
    }
  }, [station, city]);

  // Update playback state and native foreground service
  useEffect(() => {
    if (station && isPlaying) {
      const artist = city?.cityName
        ? `${city.cityName}, ${station.country}`
        : `${station.state ? `${station.state}, ` : ''}${station.country}`;
      nativeBackgroundAudio.start(station.name, artist);
    } else {
      nativeBackgroundAudio.stop();
    }

    if (!('mediaSession' in navigator)) return;

    if (!station) {
      navigator.mediaSession.playbackState = 'none';
    } else {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }, [station, city, isPlaying]);

  // Register hardware & headphone action handlers
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    const setHandler = (action: MediaSessionAction, handler: MediaSessionActionHandler | null) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {
        // Some browsers don't support all action types
      }
    };

    setHandler('play', () => onTogglePlay());
    setHandler('pause', () => onTogglePlay());
    setHandler('stop', () => onTogglePlay());

    if (onPrevStation) {
      setHandler('previoustrack', () => onPrevStation());
    } else {
      setHandler('previoustrack', null);
    }

    if (onNextStation) {
      setHandler('nexttrack', () => onNextStation());
    } else {
      setHandler('nexttrack', null);
    }

    return () => {
      setHandler('play', null);
      setHandler('pause', null);
      setHandler('stop', null);
      setHandler('previoustrack', null);
      setHandler('nexttrack', null);
    };
  }, [onTogglePlay, onPrevStation, onNextStation]);
}
