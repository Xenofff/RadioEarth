import { useState, useRef, useEffect, useCallback } from 'react';
import Hls from 'hls.js';
import { PlaybackStatus, Station } from '../types/radio';

interface UseRadioPlayerReturn {
  currentStation: Station | null;
  playbackStatus: PlaybackStatus;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  errorMessage: string | null;
  playStation: (station: Station) => void;
  togglePlay: () => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  stop: () => void;
}

export function useRadioPlayer(): UseRadioPlayerReturn {
  const [currentStation, setCurrentStation] = useState<Station | null>(null);
  const [playbackStatus, setPlaybackStatus] = useState<PlaybackStatus>('idle');
  const [volume, setVolumeState] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const prevVolumeRef = useRef<number>(0.8);

  // Initialize Audio element once
  useEffect(() => {
    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.preload = 'none';
    audioRef.current = audio;

    const handleWaiting = () => setPlaybackStatus('loading');
    const handleLoadStart = () => setPlaybackStatus('loading');
    const handlePlaying = () => {
      setPlaybackStatus('playing');
      setErrorMessage(null);
    };
    const handlePause = () => {
      setPlaybackStatus((prev) => (prev === 'loading' || prev === 'error' ? prev : 'paused'));
    };
    const handleError = () => {
      setPlaybackStatus('error');
      setErrorMessage('Audio stream unavailable or blocked by CORS');
    };

    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
      audio.pause();
      audio.src = '';
    };
  }, []);

  // Synchronize audio volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Clean up existing HLS instance
  const cleanupHls = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  }, []);

  // Play a specific station
  const playStation = useCallback(
    (station: Station) => {
      const audio = audioRef.current;
      if (!audio) return;

      cleanupHls();
      setCurrentStation(station);
      setPlaybackStatus('loading');
      setErrorMessage(null);

      const streamUrl = station.streamUrl;
      const isM3u8 = streamUrl.toLowerCase().includes('.m3u8') || station.isHls;

      if (isM3u8 && Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90,
        });

        hls.loadSource(streamUrl);
        hls.attachMedia(audio);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          audio.play().catch((err) => {
            console.warn('HLS play was prevented:', err);
            setPlaybackStatus('paused');
          });
        });

        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                cleanupHls();
                setPlaybackStatus('error');
                setErrorMessage('Stream offline or incompatible');
                break;
            }
          }
        });

        hlsRef.current = hls;
      } else {
        // Native audio or Safari native HLS
        audio.src = streamUrl;
        audio.load();
        audio
          .play()
          .then(() => {
            setPlaybackStatus('playing');
          })
          .catch((err) => {
            console.warn('Playback initiation error:', err);
            setPlaybackStatus('error');
            setErrorMessage('Playback restricted or stream unreachable');
          });
      }
    },
    [cleanupHls]
  );

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentStation) return;

    if (playbackStatus === 'playing') {
      audio.pause();
      setPlaybackStatus('paused');
    } else if (playbackStatus === 'paused' || playbackStatus === 'idle') {
      audio
        .play()
        .then(() => setPlaybackStatus('playing'))
        .catch(() => playStation(currentStation));
    } else if (playbackStatus === 'error') {
      playStation(currentStation);
    }
  }, [playbackStatus, currentStation, playStation]);

  // Set Volume
  const setVolume = useCallback((val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    setVolumeState(clamped);
    if (clamped > 0) {
      setIsMuted(false);
    }
  }, []);

  // Toggle Mute
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      if (!prev) {
        prevVolumeRef.current = volume;
        return true;
      } else {
        if (volume === 0) setVolumeState(prevVolumeRef.current || 0.8);
        return false;
      }
    });
  }, [volume]);

  // Stop playback completely
  const stop = useCallback(() => {
    cleanupHls();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    setPlaybackStatus('idle');
    setCurrentStation(null);
  }, [cleanupHls]);

  const isPlaying = playbackStatus === 'playing';

  return {
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
    stop,
  };
}
