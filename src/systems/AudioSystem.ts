type SoundName = "shoot" | "heavyShoot" | "enemyHit" | "destroyed" | "pickup" | "playerHit" | "shieldHit" | "warning" | "boss" | "upgrade" | "ultimate" | "gameover";

export const MUSIC_SEQUENCE = [220, 261.63, 329.63, 392, 329.63, 261.63, 196, 246.94, 293.66, 369.99, 293.66, 246.94, 174.61, 220, 261.63, 329.63] as const;
const BASS_SEQUENCE = [55, 55, 65.41, 65.41, 49, 49, 43.65, 49] as const;

export class AudioSystem {
  enabled = false;
  private context?: AudioContext;
  private lastShot = 0;
  private ambient?: { oscillators: OscillatorNode[]; gain: GainNode };
  private music?: { gain: GainNode; timer: number; step: number };

  start(): void {
    if (this.enabled) return;
    this.enabled = true; this.context ??= new AudioContext(); void this.context.resume();
    this.startAmbient(); this.startMusic();
  }

  toggle(): boolean {
    this.enabled = !this.enabled;
    if (this.enabled) {
      this.context ??= new AudioContext();
      void this.context.resume();
      this.startAmbient(); this.startMusic();
      this.play("upgrade");
    } else { this.stopMusic(); this.stopAmbient(); }
    return this.enabled;
  }

  play(name: SoundName): void {
    if (!this.enabled || !this.context) return;
    const now = this.context.currentTime;
    if (name === "shoot" && now - this.lastShot < 0.07) return;
    if (name === "shoot") this.lastShot = now;
    const settings: Record<SoundName, [number, number, OscillatorType, number, number]> = {
      shoot: [520, 270, "square", 0.035, 0.025], heavyShoot: [270, 90, "sawtooth", 0.08, 0.05],
      enemyHit: [190, 130, "square", 0.035, 0.025], destroyed: [100, 42, "sawtooth", 0.19, 0.075],
      pickup: [520, 920, "sine", 0.16, 0.055], playerHit: [120, 48, "sawtooth", 0.22, 0.095],
      shieldHit: [390, 150, "triangle", 0.17, 0.06], warning: [690, 510, "square", 0.16, 0.05],
      boss: [72, 42, "sawtooth", 0.75, 0.12], upgrade: [430, 780, "sine", 0.28, 0.06],
      ultimate: [110, 880, "sawtooth", 0.7, 0.1], gameover: [180, 48, "triangle", 0.85, 0.09],
    };
    const [start, end, type, duration, volume] = settings[name];
    const oscillator = this.context.createOscillator(); const gain = this.context.createGain();
    oscillator.type = type; oscillator.frequency.setValueAtTime(start, now); oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, end), now + duration);
    gain.gain.setValueAtTime(volume, now); gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain).connect(this.context.destination); oscillator.start(now); oscillator.stop(now + duration);
  }

  private startAmbient(): void {
    if (!this.context || this.ambient) return;
    const gain = this.context.createGain(); const filter = this.context.createBiquadFilter();
    gain.gain.value = 0.011; filter.type = "lowpass"; filter.frequency.value = 260;
    const oscillators = [55, 82.5].map((frequency, index) => {
      const oscillator = this.context!.createOscillator(); oscillator.type = index ? "sine" : "triangle"; oscillator.frequency.value = frequency; oscillator.detune.value = index ? 4 : -3; oscillator.connect(filter); oscillator.start(); return oscillator;
    });
    filter.connect(gain).connect(this.context.destination); this.ambient = { oscillators, gain };
  }

  private startMusic(): void {
    if (!this.context || this.music) return;
    const gain = this.context.createGain(); gain.gain.value = 0.075; gain.connect(this.context.destination);
    this.music = { gain, timer: 0, step: 0 };
    const tick = (): void => {
      if (!this.context || !this.music || !this.enabled) return;
      const step = this.music.step; const now = this.context.currentTime;
      this.musicNote(MUSIC_SEQUENCE[step % MUSIC_SEQUENCE.length], now, 0.16, 0.42, "triangle");
      this.musicNote(MUSIC_SEQUENCE[(step + 7) % MUSIC_SEQUENCE.length] * 2, now, 0.065, 0.13, "square");
      if (step % 2 === 0) this.musicNote(MUSIC_SEQUENCE[(step + 5) % MUSIC_SEQUENCE.length] * 2, now, 0.055, 0.14, "sine");
      if (step % 4 === 0) {
        this.musicNote(BASS_SEQUENCE[Math.floor(step / 4) % BASS_SEQUENCE.length], now, 0.32, 0.58, "sawtooth");
        this.musicNote(92, now, 0.085, 0.54, "sine", 38);
      }
      if (step % 4 === 2) this.musicNote(182, now, 0.045, 0.3, "square", 96);
      if (step % 2 === 1) this.musicNote(7200, now, 0.018, 0.11, "square", 5200);
      this.music.step = (step + 1) % 32;
    };
    tick(); this.music.timer = window.setInterval(tick, 150);
  }

  private musicNote(frequency: number, start: number, duration: number, volume: number, type: OscillatorType, endFrequency = frequency): void {
    if (!this.context || !this.music) return;
    const oscillator = this.context.createOscillator(); const envelope = this.context.createGain();
    oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, start); oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), start + duration);
    envelope.gain.setValueAtTime(0.0001, start); envelope.gain.exponentialRampToValueAtTime(volume, start + 0.012); envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(envelope).connect(this.music.gain); oscillator.start(start); oscillator.stop(start + duration + 0.02);
  }

  private stopMusic(): void {
    if (!this.music || !this.context) return;
    window.clearInterval(this.music.timer); const now = this.context.currentTime;
    this.music.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12); this.music = undefined;
  }

  private stopAmbient(): void {
    if (!this.ambient || !this.context) return;
    const now = this.context.currentTime; this.ambient.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    for (const oscillator of this.ambient.oscillators) oscillator.stop(now + 0.14);
    this.ambient = undefined;
  }
}
