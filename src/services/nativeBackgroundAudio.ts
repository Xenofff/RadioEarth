import { registerPlugin, Capacitor } from '@capacitor/core';

interface RadioMediaPluginInterface {
  startForeground(options: { title: string; artist: string }): Promise<void>;
  stopForeground(): Promise<void>;
}

const RadioMedia = registerPlugin<RadioMediaPluginInterface>('RadioMedia');

export const nativeBackgroundAudio = {
  start: async (title: string, artist: string) => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await RadioMedia.startForeground({ title, artist });
    } catch (err) {
      console.warn('[nativeBackgroundAudio] startForeground failed:', err);
    }
  },
  stop: async () => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await RadioMedia.stopForeground();
    } catch (err) {
      console.warn('[nativeBackgroundAudio] stopForeground failed:', err);
    }
  },
};
