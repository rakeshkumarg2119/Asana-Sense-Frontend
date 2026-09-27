// Web Audio API pure synthesized Tibetan singing bowl & chime feedback sounds
class SoundEngine {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Play peaceful meditation singing bowl harmonic chime
  playChime(frequency: number = 432, duration: number = 1.6) {
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(frequency * 1.5, ctx.currentTime); // Perfect fifth harmonic

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc2.start();
      osc.stop(ctx.currentTime + duration);
      osc2.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio chime notice:', e);
    }
  }

  // Gentle posture correction alert (soft double pulse)
  playAlertTone() {
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(528, ctx.currentTime); // 528 Hz DNA repair frequency
      osc.frequency.exponentialRampToValueAtTime(396, ctx.currentTime + 0.35);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      console.warn('Alert tone notice:', e);
    }
  }

  private lastSpoken = '';
  private lastSpokenAt = 0;

  // Speak voice instruction via browser speech synthesis
  speak(text: string) {
    if (!('speechSynthesis' in window) || !text) return;

    // 1. Collapse stray single-letter spacing ("R A K E S H" -> "Rakesh")
    let clean = text
      .replace(/\b([A-Za-z])(?:\s+([A-Za-z])\b)+/g, (match) => {
        const merged = match.replace(/\s+/g, '');
        return merged.charAt(0).toUpperCase() + merged.slice(1).toLowerCase();
      });

    // 2. Convert ALL-CAPS words (length >= 2) into Title Case (e.g. "PRAVEEN" -> "Praveen", "YOGI" -> "Yogi")
    // Browser SpeechSynthesis treats uppercase words as acronyms and spells out each letter.
    // Title Case ensures it is naturally spoken as a whole word.
    clean = clean.replace(/\b([A-Z]{2,})\b/g, (match) => {
      // Keep acronyms that should be pronounced as acronyms if any, but general words/names become Title Case
      if (match === 'AI' || match === 'UI' || match === 'ID' || match === 'OK') return match;
      return match.charAt(0).toUpperCase() + match.slice(1).toLowerCase();
    }).trim();

    // block duplicate/overlapping utterance fired again inside 3s window
    const now = Date.now();
    if (clean === this.lastSpoken && now - this.lastSpokenAt < 3000) return;
    this.lastSpoken = clean;
    this.lastSpokenAt = now;

    window.speechSynthesis.cancel();
    // Chrome/WebKit bug: speak() called in the same tick right after
    // cancel() can clip or merge with whatever was still finishing.
    // A tiny delay lets the cancel actually land before the new utterance starts.
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = 0.95;
      utterance.pitch = 1.05;
      window.speechSynthesis.speak(utterance);
    }, 60);
  }

  // Soft audio chime for successful voice command recognition (immediate non-visual confirmation)
  playVoiceAckChime() {
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // Gentle upward chime

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(880, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.12); // Harmonic resonance

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.03); // Soft attack
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35); // Gentle decay

      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc2.start();
      osc.stop(ctx.currentTime + 0.35);
      osc2.stop(ctx.currentTime + 0.35);
    } catch (e) {
      console.warn('Voice ack chime notice:', e);
    }
  }
}

export const soundEngine = new SoundEngine();