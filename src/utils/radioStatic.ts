/**
 * Web Audio API synthesizer for authentic atmospheric radio static noise.
 * Generates an organic analog tuning hiss (bandpass filtered ether noise)
 * that smoothly fades in during globe rotation and fades out when stationary.
 */

class RadioStaticSynthesizer {
  private ctx: AudioContext | null = null;
  private noiseSource: AudioBufferSourceNode | null = null;
  private masterGain: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private tremoloGain: GainNode | null = null;
  private tremoloOsc: OscillatorNode | null = null;

  private isPlaying: boolean = false;
  private isMuted: boolean = false;
  private volume: number = 0.8; // 0 to 1
  private fadeTimer: ReturnType<typeof setTimeout> | null = null;

  private init() {
    if (this.ctx) return;

    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();

      // Generate 2 seconds of smooth organic noise buffer
      const sampleRate = this.ctx.sampleRate;
      const bufferSize = sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
      const data = buffer.getChannelData(0);

      // Pinkish/atmospheric noise generation with soft clipping
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        b6 = white * 0.115926;
        data[i] = pink * 0.12; // Moderate initial level
      }

      // Loop noise buffer
      this.noiseSource = this.ctx.createBufferSource();
      this.noiseSource.buffer = buffer;
      this.noiseSource.loop = true;

      // Bandpass filter to simulate analog shortwave/FM radio ether tuning
      this.filterNode = this.ctx.createBiquadFilter();
      this.filterNode.type = 'bandpass';
      this.filterNode.frequency.setValueAtTime(1600, this.ctx.currentTime);
      this.filterNode.Q.setValueAtTime(1.4, this.ctx.currentTime);

      // Subtle atmospheric flutter (tremolo) at ~7Hz
      this.tremoloGain = this.ctx.createGain();
      this.tremoloGain.gain.setValueAtTime(0.85, this.ctx.currentTime);

      this.tremoloOsc = this.ctx.createOscillator();
      this.tremoloOsc.frequency.setValueAtTime(6.5, this.ctx.currentTime);
      const tremoloDepth = this.ctx.createGain();
      tremoloDepth.gain.setValueAtTime(0.15, this.ctx.currentTime);
      this.tremoloOsc.connect(tremoloDepth);
      tremoloDepth.connect(this.tremoloGain.gain);
      this.tremoloOsc.start();

      // Master output gain (starts at 0.0)
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

      // Connect graph: noiseSource -> filter -> tremolo -> masterGain -> destination
      this.noiseSource.connect(this.filterNode);
      this.filterNode.connect(this.tremoloGain);
      this.tremoloGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.noiseSource.start();
    } catch (err) {
      console.warn('Web Audio API static noise initialization failed:', err);
    }
  }

  public ensureContextRunning() {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.isMuted && this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    }
  }

  public setVolume(vol: number) {
    // vol: 0-100 or 0-1
    this.volume = Math.max(0, Math.min(1, vol > 1 ? vol / 100 : vol));
  }

  /**
   * Starts or increases static radio noise during globe movement.
   */
  public startNoise() {
    this.ensureContextRunning();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    if (this.fadeTimer) {
      clearTimeout(this.fadeTimer);
      this.fadeTimer = null;
    }

    this.isPlaying = true;
    const now = this.ctx.currentTime;
    const targetGain = Math.max(0.0001, 0.065 * this.volume); // Subtle, comfortable background level

    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    // Smooth fade in over 120ms
    this.masterGain.gain.linearRampToValueAtTime(targetGain, now + 0.12);
  }

  /**
   * Smoothly fades out static noise when movement stops or station locks.
   */
  public stopNoise(fadeDurationMs: number = 400) {
    if (!this.ctx || !this.masterGain || !this.isPlaying) return;

    if (this.fadeTimer) {
      clearTimeout(this.fadeTimer);
    }

    const now = this.ctx.currentTime;
    const durationSec = fadeDurationMs / 1000;

    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

    this.fadeTimer = setTimeout(() => {
      this.isPlaying = false;
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
      }
    }, fadeDurationMs);
  }
}

export const radioStaticEngine = new RadioStaticSynthesizer();
