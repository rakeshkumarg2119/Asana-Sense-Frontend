// Web Audio synthesized chimes + speech-synthesis coach.
// Every sound is rate-limited so a per-frame caller can never pile up audio.

const CHIME_GAP_MS = 500;
const ALERT_GAP_MS = 3000;
const ACK_GAP_MS = 600;
const SPEAK_MIN_GAP_MS = 3500;   // min time between two spoken cues
const SAME_TEXT_GAP_MS = 8000;   // same sentence is not repeated inside this window
const SPEAK_WATCHDOG_MS = 12000; // Chrome sometimes never fires onend

export class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted = false;
  private lastPlayed: Record<string, number> = {};

  private lastSpoken = '';
  private lastSpokenAt = 0;
  private speaking = false;
  private speechEndedAt = 0;
  private speakToken = 0;
  private watchdog: ReturnType<typeof setTimeout> | null = null;

  setMuted(isMuted: boolean) {
    this.muted = isMuted;
    if (isMuted) this.stopAll();
  }

  isMuted(): boolean {
    return this.muted;
  }

  /** Cancel any speech now and invalidate anything still waiting to be spoken. */
  stopAll() {
    this.speakToken++;
    this.speaking = false;
    this.speechEndedAt = Date.now();
    if (this.watchdog) {
      clearTimeout(this.watchdog);
      this.watchdog = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  /** True while the coach voice is talking (used to ignore our own audio in the mic). */
  isSpeaking(): boolean {
    return this.speaking;
  }

  msSinceSpeechEnded(): number {
    return Date.now() - this.speechEndedAt;
  }

  getLastSpoken(): string {
    return this.lastSpoken;
  }

  private canPlay(key: string, minGapMs: number): boolean {
    const now = Date.now();
    if (now - (this.lastPlayed[key] ?? 0) < minGapMs) return false;
    this.lastPlayed[key] = now;
    return true;
  }

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private cleanup(...nodes: AudioNode[]) {
    for (const n of nodes) {
      try { n.disconnect(); } catch { /* already disconnected */ }
    }
  }

  // Peaceful singing-bowl chime
  playChime(frequency: number = 432, duration: number = 1.6) {
    if (this.muted || !this.canPlay('chime', CHIME_GAP_MS)) return;
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(frequency * 1.5, ctx.currentTime);

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc2.onended = () => this.cleanup(osc, osc2, gain);

      osc.start();
      osc2.start();
      osc.stop(ctx.currentTime + duration);
      osc2.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio chime notice:', e);
    }
  }

  // Gentle posture-correction tone. Max once per ALERT_GAP_MS no matter how often called.
  playAlertTone() {
    if (this.muted || !this.canPlay('alert', ALERT_GAP_MS)) return;
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(528, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(396, ctx.currentTime + 0.35);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.onended = () => this.cleanup(osc, gain);

      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      console.warn('Alert tone notice:', e);
    }
  }

  private cleanText(text: string): string {
    // "R A K E S H" -> "Rakesh"
    let clean = text.replace(/\b([A-Za-z])(?:\s+([A-Za-z])\b)+/g, (match) => {
      const merged = match.replace(/\s+/g, '');
      return merged.charAt(0).toUpperCase() + merged.slice(1).toLowerCase();
    });
    // ALL-CAPS -> Title Case
    clean = clean.replace(/\b([A-Z]{2,})\b/g, (match) => {
      if (match === 'AI' || match === 'UI' || match === 'ID' || match === 'OK') return match;
      return match.charAt(0).toUpperCase() + match.slice(1).toLowerCase();
    });
    return clean.trim();
  }

  /**
   * Speak a cue. Safe to call every frame:
   *  - ignored while already speaking
   *  - ignored if another cue started < SPEAK_MIN_GAP_MS ago
   *  - same sentence not repeated within SAME_TEXT_GAP_MS
   *  - never queues: at most one utterance exists at a time
   * opts.force: interrupt current speech (use for user-triggered replies only).
   */
  speak(text: string, opts: { force?: boolean } = {}) {
    if (this.muted || typeof window === 'undefined' || !('speechSynthesis' in window) || !text) return;
    const clean = this.cleanText(text);
    if (!clean) return;

    const synth = window.speechSynthesis;
    const now = Date.now();

    if (!opts.force) {
      if (this.speaking || synth.speaking || synth.pending) return;
      if (now - this.lastSpokenAt < SPEAK_MIN_GAP_MS) return;
      if (clean === this.lastSpoken && now - this.lastSpokenAt < SAME_TEXT_GAP_MS) return;
    }

    this.lastSpoken = clean;
    this.lastSpokenAt = now;
    const token = ++this.speakToken;
    this.speaking = true; // block overlaps during the short start delay

    if (synth.speaking || synth.pending) synth.cancel();

    // Small delay: Chrome drops speak() issued in the same tick as cancel().
    setTimeout(() => {
      if (token !== this.speakToken) return; // superseded or stopAll()
      if (this.muted) {
        this.speaking = false;
        return;
      }
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = 0.95;
      utterance.pitch = 1.05;

      const done = () => {
        if (token !== this.speakToken) return; // stale utterance from a cancelled cue
        this.speaking = false;
        this.speechEndedAt = Date.now();
        if (this.watchdog) {
          clearTimeout(this.watchdog);
          this.watchdog = null;
        }
      };
      utterance.onend = done;
      utterance.onerror = done;

      if (this.watchdog) clearTimeout(this.watchdog);
      this.watchdog = setTimeout(done, SPEAK_WATCHDOG_MS);

      synth.speak(utterance);
    }, 80);
  }

  // Soft chime confirming a recognised voice command
  playVoiceAckChime() {
    if (this.muted || !this.canPlay('ack', ACK_GAP_MS)) return;
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(880, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);

      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc2.onended = () => this.cleanup(osc, osc2, gain);

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