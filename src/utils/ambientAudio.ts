// Web Audio API Generative Meditative Ambient Sound Engine
// 100% zero external assets or MP3 network dependencies - synthesizes organic calming drones and nature soundscapes directly in browser.

export type SoundscapeType = 'forest-rain' | 'mountain-zen' | 'singing-bowls' | 'ocean-waves';

class AmbientSoundEngine {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private masterGain: GainNode | null = null;
  private currentMode: SoundscapeType = 'forest-rain';
  private activeNodes: (AudioNode | number)[] = [];
  private timerId: number | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (!this.masterGain && this.ctx) {
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.55, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
  }

  public setVolume(vol: number) {
    if (this.masterGain && this.ctx) {
      const clamped = Math.max(0, Math.min(1, vol));
      this.masterGain.gain.setTargetAtTime(clamped, this.ctx.currentTime, 0.05);
    }
  }

  public setMode(mode: SoundscapeType) {
    this.currentMode = mode;
    if (this.isPlaying) {
      this.stop();
      this.start(mode);
    }
  }

  public getMode(): SoundscapeType {
    return this.currentMode;
  }

  public getIsPlaying() {
    return this.isPlaying;
  }

  public toggle(mode?: SoundscapeType): boolean {
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      this.start(mode || this.currentMode);
      return true;
    }
  }

  public start(mode?: SoundscapeType) {
    try {
      this.initContext();
      if (!this.ctx || !this.masterGain) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      if (mode) this.currentMode = mode;
      this.stop(); // clear any prior nodes

      this.isPlaying = true;

      if (this.currentMode === 'forest-rain') {
        this.playForestRain();
      } else if (this.currentMode === 'mountain-zen') {
        this.playMountainZen();
      } else if (this.currentMode === 'singing-bowls') {
        this.playSingingBowls();
      } else if (this.currentMode === 'ocean-waves') {
        this.playOceanWaves();
      }
    } catch (e) {
      console.warn('Ambient sound engine start error:', e);
    }
  }

  public stop() {
    this.isPlaying = false;
    if (this.timerId) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }

    this.activeNodes.forEach((node) => {
      if (typeof node === 'number') {
        window.clearTimeout(node);
      } else {
        try {
          if ('stop' in node && typeof (node as AudioScheduledSourceNode).stop === 'function') {
            (node as AudioScheduledSourceNode).stop();
          }
          node.disconnect();
        } catch {
          // ignore disconnect errors on stopped nodes
        }
      }
    });
    this.activeNodes = [];
  }

  // 1. 'Forest Rain' - Deep rain shower, soothing canopy drops, and gentle running stream
  private playForestRain() {
    if (!this.ctx || !this.masterGain) return;
    const sampleRate = this.ctx.sampleRate;
    const bufferDuration = 3; // 3 seconds looped buffer
    const bufferSize = sampleRate * bufferDuration;

    // Layer A: Pink Noise Rain Shower
    const rainBuffer = this.ctx.createBuffer(2, bufferSize, sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const channelData = rainBuffer.getChannelData(channel);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        channelData[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.28;
        b6 = white * 0.115926;
      }
    }

    const rainSource = this.ctx.createBufferSource();
    rainSource.buffer = rainBuffer;
    rainSource.loop = true;

    const rainFilter = this.ctx.createBiquadFilter();
    rainFilter.type = 'lowpass';
    rainFilter.frequency.setValueAtTime(1600, this.ctx.currentTime);

    const rainGain = this.ctx.createGain();
    rainGain.gain.setValueAtTime(0.42, this.ctx.currentTime);

    rainSource.connect(rainFilter);
    rainFilter.connect(rainGain);
    rainGain.connect(this.masterGain);

    rainSource.start();
    this.activeNodes.push(rainSource, rainFilter, rainGain);

    // Layer B: Forest Stream & High Canopy Droplets
    const dropletBuffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const dropData = dropletBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      dropData[i] = (Math.random() * 2 - 1) * 0.35;
    }

    const dropSource = this.ctx.createBufferSource();
    dropSource.buffer = dropletBuffer;
    dropSource.loop = true;

    const dropFilter = this.ctx.createBiquadFilter();
    dropFilter.type = 'bandpass';
    dropFilter.frequency.setValueAtTime(2600, this.ctx.currentTime);
    dropFilter.Q.setValueAtTime(1.8, this.ctx.currentTime);

    const dropGain = this.ctx.createGain();
    dropGain.gain.setValueAtTime(0.18, this.ctx.currentTime);

    dropSource.connect(dropFilter);
    dropFilter.connect(dropGain);
    dropGain.connect(this.masterGain);

    dropSource.start();
    this.activeNodes.push(dropSource, dropFilter, dropGain);
  }

  // 2. 'Mountain Zen' - High Himalayan meditation drone (Om 136.1Hz & Tanpura harmonics with wind sweep)
  private playMountainZen() {
    if (!this.ctx || !this.masterGain) return;
    const droneFreqs = [108.0, 136.1, 204.15, 272.2]; // Sacred Om frequency and fifth harmonic
    droneFreqs.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, this.ctx.currentTime);
      filter.Q.setValueAtTime(2.0, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.08 / (idx + 1), this.ctx.currentTime);

      // Subtle Mountain Wind LFO pulse
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(0.06 + idx * 0.02, this.ctx.currentTime);
      lfoGain.gain.setValueAtTime(freq * 0.03, this.ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start();
      this.activeNodes.push(lfo, lfoGain);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      this.activeNodes.push(osc, filter, gain);
    });
  }

  // 3. 'Tibetan Singing Bowls' - Harmonic Tibetan Singing Bowls & Healing Solfeggio 432Hz / 528Hz Drones
  private playSingingBowls() {
    if (!this.ctx || !this.masterGain) return;

    const baseFreqs = [108, 216, 432, 528]; // Sacred healing frequencies
    baseFreqs.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;

      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq + (Math.random() * 0.4 - 0.2), this.ctx.currentTime);

      // Low frequency modulation (LFO) for natural breathing pulse
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(0.08 + idx * 0.03, this.ctx.currentTime);
      lfoGain.gain.setValueAtTime(freq * 0.02, this.ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start();
      this.activeNodes.push(lfo, lfoGain);

      const baseGainLevel = 0.09 / (idx + 1);
      gain.gain.setValueAtTime(baseGainLevel, this.ctx.currentTime);

      if (panner) {
        panner.pan.setValueAtTime((idx % 2 === 0 ? -0.4 : 0.4), this.ctx.currentTime);
        osc.connect(gain);
        gain.connect(panner);
        panner.connect(this.masterGain);
        this.activeNodes.push(panner);
      } else {
        osc.connect(gain);
        gain.connect(this.masterGain);
      }

      osc.start();
      this.activeNodes.push(osc, gain);
    });

    // Occasional gentle singing bowl chime ring
    const triggerBowlChime = () => {
      if (!this.ctx || !this.masterGain || !this.isPlaying) return;
      const chimeOsc = this.ctx.createOscillator();
      const chimeGain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      const chimeFreq = [432, 528, 648, 864][Math.floor(Math.random() * 4)];
      chimeOsc.type = 'sine';
      chimeOsc.frequency.setValueAtTime(chimeFreq, this.ctx.currentTime);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(chimeFreq, this.ctx.currentTime);
      filter.Q.setValueAtTime(6, this.ctx.currentTime);

      chimeGain.gain.setValueAtTime(0, this.ctx.currentTime);
      chimeGain.gain.linearRampToValueAtTime(0.14, this.ctx.currentTime + 0.6);
      chimeGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 6.0);

      chimeOsc.connect(filter);
      filter.connect(chimeGain);
      chimeGain.connect(this.masterGain);

      chimeOsc.start();
      chimeOsc.stop(this.ctx.currentTime + 6.2);
      this.activeNodes.push(chimeOsc, chimeGain, filter);
    };

    triggerBowlChime();
    this.timerId = window.setInterval(triggerBowlChime, 7000);
  }

  // 4. 'Ocean Waves' - Rhythmic Surging Ocean Waves with Organic Swell & Spray
  private playOceanWaves() {
    if (!this.ctx || !this.masterGain) return;
    const sampleRate = this.ctx.sampleRate;
    const bufferDuration = 4;
    const bufferSize = sampleRate * bufferDuration;

    // Rich Brown/Pink oceanic noise
    const noiseBuffer = this.ctx.createBuffer(2, bufferSize, sampleRate);
    for (let c = 0; c < 2; c++) {
      const output = noiseBuffer.getChannelData(c);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Brown noise integration
        lastOut = (lastOut + 0.02 * white) / 1.02;
        output[i] = (lastOut * 3.5 + white * 0.15) * 0.6;
      }
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    // Dynamic Filter modulated by Wave Rise & Fall
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, this.ctx.currentTime);
    filter.Q.setValueAtTime(2.2, this.ctx.currentTime);

    // Wave swell LFO (Frequency & Gain modulation ~8.5 second wave period)
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime); // ~8.3 sec per wave

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(320, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    // Wave Volume Swell Modulation (surges during wave crest)
    const swellGain = this.ctx.createGain();
    swellGain.gain.setValueAtTime(0.35, this.ctx.currentTime);

    const ampLfoGain = this.ctx.createGain();
    ampLfoGain.gain.setValueAtTime(0.22, this.ctx.currentTime);
    lfo.connect(ampLfoGain);
    ampLfoGain.connect(swellGain.gain);

    lfo.start();

    // Ocean sub-bass tide floor (adds physical depth)
    const subOsc = this.ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(55, this.ctx.currentTime);
    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.04, this.ctx.currentTime);
    subOsc.connect(subGain);
    subGain.connect(this.masterGain);
    subOsc.start();

    noise.connect(filter);
    filter.connect(swellGain);
    swellGain.connect(this.masterGain);

    noise.start();
    this.activeNodes.push(noise, filter, lfo, lfoGain, ampLfoGain, swellGain, subOsc, subGain);
  }
}

export const ambientSound = new AmbientSoundEngine();

