import { AudioThemeId } from '../types/bumper';

class BumperAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeNodes: { stop?: () => void; disconnect?: () => void }[] = [];
  private customAudio: HTMLAudioElement | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getContext(): AudioContext | null {
    this.initContext();
    return this.ctx;
  }

  /**
   * Stop all active playing sounds immediately (for pause, seek, restart)
   */
  public stop() {
    this.activeNodes.forEach((node) => {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch {
        // Already stopped
      }
    });
    this.activeNodes = [];
  }

  /**
   * Play live procedural sound effects for preview
   */
  public play(theme: AudioThemeId, volume: number = 0.8, offsetSeconds: number = 0, customUrl?: string) {
    if (theme === 'none' || volume <= 0) {
      this.stop();
      return;
    }

    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    this.stop();

    if ((theme === 'custom' || customUrl) && customUrl) {
      if (!this.customAudio || this.customAudio.src !== customUrl) {
        this.customAudio = new Audio(customUrl);
        this.customAudio.loop = true;
        this.customAudio.crossOrigin = 'anonymous';
      }
      this.customAudio.volume = Math.max(0, Math.min(1, volume));
      this.customAudio.currentTime = Math.max(0, offsetSeconds);
      this.customAudio.play().catch(() => {});
      return;
    }

    this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), this.ctx.currentTime);
    this.synthesizeTheme(this.ctx, this.masterGain, theme, this.ctx.currentTime - offsetSeconds);
  }

  /**
   * Synthesize sound effects for offline video recording into a destination node
   */
  public synthesizeToDestination(
    destinationCtx: AudioContext | OfflineAudioContext,
    destinationNode: AudioNode,
    theme: AudioThemeId,
    volume: number = 0.8,
    startTime: number = 0
  ) {
    if (theme === 'none' || volume <= 0) return;
    const gainNode = destinationCtx.createGain();
    gainNode.gain.setValueAtTime(volume, startTime);
    gainNode.connect(destinationNode);
    this.synthesizeTheme(destinationCtx, gainNode, theme, startTime);
  }

  private synthesizeTheme(
    ctx: BaseAudioContext,
    target: AudioNode,
    theme: AudioThemeId,
    startTime: number
  ) {
    const t0 = Math.max(ctx.currentTime, startTime);

    switch (theme) {
      case 'sfx_kso_official':
        this.renderKsoOfficialSfx(ctx, target, t0);
        break;
      case 'sfx_cinematic_impact':
        this.renderCinematicImpactSfx(ctx, target, t0);
        break;
      case 'sfx_modern_tech':
        this.renderModernTechSfx(ctx, target, t0);
        break;
      case 'sfx_minimal_tactile':
        this.renderMinimalTactileSfx(ctx, target, t0);
        break;
      case 'lofi_chill':
        this.renderLofiChill(ctx, target, t0);
        break;
      case 'lofi_rhodes':
        this.renderLofiRhodes(ctx, target, t0);
        break;
      case 'cinematic':
        this.renderCinematicImpactSfx(ctx, target, t0);
        break;
      default:
        this.renderKsoOfficialSfx(ctx, target, t0);
        break;
    }
  }

  private registerNode(node: { stop?: () => void; disconnect?: () => void }) {
    this.activeNodes.push(node);
  }

  /**
   * ==============================================================================
   * SOUND EFFECT RESMI KSO (Sinkron Penuh dengan Kemunculan Logo & Teks)
   * Sesuai Arahan: "REVISI BACKSOUND HARUSNYA SOUND EFFECT KETIKA LOGO DAN TULISAN MUNCUL"
   *
   * Timeline Sinkron:
   * 1. 0.10s : Logo 1 (Nusa Konstruksi Enjiniring) muncul -> Whoosh & Tactile Pop 1
   * 2. 0.75s : Logo 2 (Jaya Konstruksi) muncul           -> Whoosh & Harmonic Pop 2
   * 3. 1.35s : Logo 3 (Wiswakharman) muncul             -> Whoosh & Triad Chime Pop 3
   * 4. 1.88s : 3 Logo bersatu di tengah + Lens Flare   -> Shimmering Crystalline Flare Sweep
   * 5. 2.15s : Logo bergeser mulus ke kiri (Slide Left) -> Smooth Air Slide Whoosh
   * 6. 2.38s : Garis divider & Tulisan Judul muncul     -> Resonant Sub Boom Impact & Metallic Strike
   * 7. 2.85s : Kilau emas (Glint) menyapu huruf teks    -> Majestic Celestial Chime Glint
   * ==============================================================================
   */
  private renderKsoOfficialSfx(ctx: BaseAudioContext, target: AudioNode, t0: number) {
    // --------------------------------------------------------------------------
    // SFX 1: Logo 1 (Nusa Konstruksi Enjiniring) muncul pada t = 0.10s
    // --------------------------------------------------------------------------
    this.createLogoEntranceSfx(ctx, target, t0 + 0.10, 480, 200, 0.45);

    // --------------------------------------------------------------------------
    // SFX 2: Logo 2 (Jaya Konstruksi) muncul pada t = 0.75s
    // --------------------------------------------------------------------------
    this.createLogoEntranceSfx(ctx, target, t0 + 0.75, 620, 260, 0.50);

    // --------------------------------------------------------------------------
    // SFX 3: Logo 3 (Wiswakharman) muncul pada t = 1.35s
    // --------------------------------------------------------------------------
    this.createLogoEntranceSfx(ctx, target, t0 + 1.35, 780, 320, 0.55);

    // --------------------------------------------------------------------------
    // SFX 4: Anamorphic Lens Flare menyapu ketiga logo di tengah pada t = 1.88s
    // --------------------------------------------------------------------------
    const flareTime = t0 + 1.88;
    this.createFlareGlintSfx(ctx, target, flareTime);

    // --------------------------------------------------------------------------
    // SFX 5: Logo bergeser mulus ke kiri pada t = 2.15s
    // --------------------------------------------------------------------------
    const slideTime = t0 + 2.15;
    this.createSlideAirWhooshSfx(ctx, target, slideTime);

    // --------------------------------------------------------------------------
    // SFX 6: Teks Judul "NUSA JAYA WISWAKHARMAN, KSO" & Divider Beam muncul pada t = 2.38s
    // Solid authoritative sub boom impact + crisp divider impact
    // --------------------------------------------------------------------------
    const titleTime = t0 + 2.38;
    this.createTitleImpactSfx(ctx, target, titleTime);

    // --------------------------------------------------------------------------
    // SFX 7: Kilau Emas Menyapu Huruf Teks (Specular Glint) pada t = 2.85s - 3.8s
    // --------------------------------------------------------------------------
    const shineTime = t0 + 2.85;
    this.createLetterShimmerSfx(ctx, target, shineTime);
  }

  /**
   * Helper: Sound effect kemunculan logo (Whoosh naik + Tactile Pop empuk)
   */
  private createLogoEntranceSfx(
    ctx: BaseAudioContext,
    target: AudioNode,
    time: number,
    startFreq: number,
    endFreq: number,
    gainLevel: number
  ) {
    // 1. Air swoosh whoosh
    const bufferSize = Math.floor(ctx.sampleRate * 0.28);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.08));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(startFreq * 0.7, time);
    filter.frequency.exponentialRampToValueAtTime(startFreq * 2.2, time + 0.15);
    filter.Q.setValueAtTime(2.2, time);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.001, time);
    noiseGain.gain.exponentialRampToValueAtTime(gainLevel * 0.45, time + 0.06);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(target);
    noise.start(time);
    noise.stop(time + 0.25);
    this.registerNode(noise);

    // 2. Resonant Pop / Harmonic Chime Hit
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, time + 0.02);
    osc.frequency.exponentialRampToValueAtTime(endFreq, time + 0.14);

    oscGain.gain.setValueAtTime(0.001, time + 0.02);
    oscGain.gain.exponentialRampToValueAtTime(gainLevel * 0.65, time + 0.05);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.28);

    osc.connect(oscGain);
    oscGain.connect(target);
    osc.start(time + 0.02);
    osc.stop(time + 0.30);
    this.registerNode(osc);

    // Harmonic bell tine
    const tine = ctx.createOscillator();
    const tineGain = ctx.createGain();
    tine.type = 'triangle';
    tine.frequency.setValueAtTime(startFreq * 2, time + 0.03);

    tineGain.gain.setValueAtTime(0.001, time + 0.03);
    tineGain.gain.exponentialRampToValueAtTime(gainLevel * 0.2, time + 0.06);
    tineGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.45);

    tine.connect(tineGain);
    tineGain.connect(target);
    tine.start(time + 0.03);
    tine.stop(time + 0.48);
    this.registerNode(tine);
  }

  /**
   * Helper: Sound effect flare kilau cahaya anamorphic (t = 1.88s)
   */
  private createFlareGlintSfx(ctx: BaseAudioContext, target: AudioNode, time: number) {
    const sweep = ctx.createOscillator();
    const sweepFilter = ctx.createBiquadFilter();
    const sweepGain = ctx.createGain();

    sweep.type = 'sawtooth';
    sweep.frequency.setValueAtTime(880, time);
    sweep.frequency.exponentialRampToValueAtTime(2600, time + 0.35);

    sweepFilter.type = 'bandpass';
    sweepFilter.frequency.setValueAtTime(1400, time);
    sweepFilter.frequency.exponentialRampToValueAtTime(3200, time + 0.4);
    sweepFilter.Q.setValueAtTime(3.5, time);

    sweepGain.gain.setValueAtTime(0.001, time);
    sweepGain.gain.exponentialRampToValueAtTime(0.25, time + 0.18);
    sweepGain.gain.exponentialRampToValueAtTime(0.001, time + 0.55);

    sweep.connect(sweepFilter);
    sweepFilter.connect(sweepGain);
    sweepGain.connect(target);

    sweep.start(time);
    sweep.stop(time + 0.6);
    this.registerNode(sweep);

    // Crystalline star ping
    [1046.5, 1318.5, 2093].forEach((f, idx) => {
      const ping = ctx.createOscillator();
      const pGain = ctx.createGain();
      const pTime = time + 0.15 + idx * 0.06;

      ping.type = 'sine';
      ping.frequency.setValueAtTime(f, pTime);
      pGain.gain.setValueAtTime(0.12, pTime);
      pGain.gain.exponentialRampToValueAtTime(0.0001, pTime + 0.7);

      ping.connect(pGain);
      pGain.connect(target);
      ping.start(pTime);
      ping.stop(pTime + 0.75);
      this.registerNode(ping);
    });
  }

  /**
   * Helper: Sound effect transisi geser ke kiri (Slide Whoosh pada t = 2.15s)
   */
  private createSlideAirWhooshSfx(ctx: BaseAudioContext, target: AudioNode, time: number) {
    const bufferSize = Math.floor(ctx.sampleRate * 0.65);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(260, time);
    filter.frequency.exponentialRampToValueAtTime(950, time + 0.3);
    filter.frequency.exponentialRampToValueAtTime(180, time + 0.6);
    filter.Q.setValueAtTime(1.8, time);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, time);
    gain.gain.exponentialRampToValueAtTime(0.35, time + 0.25);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.62);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(target);
    noise.start(time);
    noise.stop(time + 0.65);
    this.registerNode(noise);
  }

  /**
   * Helper: Sound effect kemunculan tulisan & divider (Sub Boom megah + Metallic Strike pada t = 2.38s)
   */
  private createTitleImpactSfx(ctx: BaseAudioContext, target: AudioNode, time: number) {
    // 1. Authoritative Sub Boom (Infrastructure Foundation)
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();

    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(115, time);
    subOsc.frequency.exponentialRampToValueAtTime(32, time + 0.75);

    subGain.gain.setValueAtTime(0.001, time);
    subGain.gain.exponentialRampToValueAtTime(0.95, time + 0.04);
    subGain.gain.exponentialRampToValueAtTime(0.001, time + 1.8);

    subOsc.connect(subGain);
    subGain.connect(target);
    subOsc.start(time);
    subOsc.stop(time + 1.9);
    this.registerNode(subOsc);

    // 2. Metallic Divider Beam Expansion Strike
    const strike = ctx.createOscillator();
    const sFilter = ctx.createBiquadFilter();
    const sGain = ctx.createGain();

    strike.type = 'sawtooth';
    strike.frequency.setValueAtTime(520, time);
    strike.frequency.exponentialRampToValueAtTime(120, time + 0.25);

    sFilter.type = 'lowpass';
    sFilter.frequency.setValueAtTime(1800, time);
    sFilter.frequency.exponentialRampToValueAtTime(300, time + 0.35);

    sGain.gain.setValueAtTime(0.35, time);
    sGain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);

    strike.connect(sFilter);
    sFilter.connect(sGain);
    sGain.connect(target);
    strike.start(time);
    strike.stop(time + 0.45);
    this.registerNode(strike);

    // 3. Warm Harmonic Reverberation
    const warmOsc = ctx.createOscillator();
    const warmGain = ctx.createGain();
    warmOsc.type = 'triangle';
    warmOsc.frequency.setValueAtTime(130.81, time + 0.05); // C3 chord root

    warmGain.gain.setValueAtTime(0.001, time + 0.05);
    warmGain.gain.linearRampToValueAtTime(0.3, time + 0.2);
    warmGain.gain.exponentialRampToValueAtTime(0.0001, time + 2.2);

    warmOsc.connect(warmGain);
    warmGain.connect(target);
    warmOsc.start(time + 0.05);
    warmOsc.stop(time + 2.3);
    this.registerNode(warmOsc);
  }

  /**
   * Helper: Sound effect kilau cahaya menyapu huruf teks (Specular Glint Shimmer pada t = 2.85s)
   */
  private createLetterShimmerSfx(ctx: BaseAudioContext, target: AudioNode, time: number) {
    const glintFrequencies = [1046.5, 1318.51, 1567.98, 2093.0]; // C6, E6, G6, C7
    glintFrequencies.forEach((freq, idx) => {
      const glintTime = time + idx * 0.12;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, glintTime);

      gain.gain.setValueAtTime(0.001, glintTime);
      gain.gain.exponentialRampToValueAtTime(0.14, glintTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, glintTime + 1.2);

      osc.connect(gain);
      gain.connect(target);
      osc.start(glintTime);
      osc.stop(glintTime + 1.3);
      this.registerNode(osc);
    });
  }

  /**
   * ==============================================================================
   * SOUND EFFECT SUITE 2: CINEMATIC IMPACT
   * Heavy impacts on logos & deep Hollywood blockbuster sub drop on title reveal
   * ==============================================================================
   */
  private renderCinematicImpactSfx(ctx: BaseAudioContext, target: AudioNode, t0: number) {
    // Logo 1 Impact
    this.createHeavySubHit(ctx, target, t0 + 0.10, 140, 45, 0.5);
    // Logo 2 Impact
    this.createHeavySubHit(ctx, target, t0 + 0.75, 160, 50, 0.55);
    // Logo 3 Impact
    this.createHeavySubHit(ctx, target, t0 + 1.35, 180, 55, 0.6);
    // Flare sweep
    this.createFlareGlintSfx(ctx, target, t0 + 1.88);
    // Slide Whoosh
    this.createSlideAirWhooshSfx(ctx, target, t0 + 2.15);
    // Title Massive Impact
    this.createHeavySubHit(ctx, target, t0 + 2.38, 90, 24, 1.0);
    // Gold glint
    this.createLetterShimmerSfx(ctx, target, t0 + 2.85);
  }

  private createHeavySubHit(
    ctx: BaseAudioContext,
    target: AudioNode,
    time: number,
    startFreq: number,
    endFreq: number,
    gainLevel: number
  ) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(endFreq, time + 0.6);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.exponentialRampToValueAtTime(gainLevel * 0.9, time + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 1.6);

    osc.connect(gain);
    gain.connect(target);
    osc.start(time);
    osc.stop(time + 1.7);
    this.registerNode(osc);
  }

  /**
   * ==============================================================================
   * SOUND EFFECT SUITE 3: MODERN TECH (Cyber Sci-Fi Swishes & Digital Risers)
   * ==============================================================================
   */
  private renderModernTechSfx(ctx: BaseAudioContext, target: AudioNode, t0: number) {
    // Tech blips on each logo
    [0.10, 0.75, 1.35].forEach((t, i) => {
      const blip = ctx.createOscillator();
      const bGain = ctx.createGain();
      blip.type = 'square';
      blip.frequency.setValueAtTime(500 + i * 280, t0 + t);
      bGain.gain.setValueAtTime(0.18, t0 + t);
      bGain.gain.exponentialRampToValueAtTime(0.001, t0 + t + 0.12);

      blip.connect(bGain);
      bGain.connect(target);
      blip.start(t0 + t);
      blip.stop(t0 + t + 0.14);
      this.registerNode(blip);
    });

    // Tech Riser on slide
    const sweep = ctx.createOscillator();
    const sGain = ctx.createGain();
    sweep.type = 'sawtooth';
    sweep.frequency.setValueAtTime(300, t0 + 2.15);
    sweep.frequency.exponentialRampToValueAtTime(1400, t0 + 2.38);
    sGain.gain.setValueAtTime(0.18, t0 + 2.15);
    sGain.gain.exponentialRampToValueAtTime(0.001, t0 + 2.45);
    sweep.connect(sGain);
    sGain.connect(target);
    sweep.start(t0 + 2.15);
    sweep.stop(t0 + 2.5);
    this.registerNode(sweep);

    // Title 808 Drop
    this.createHeavySubHit(ctx, target, t0 + 2.38, 160, 38, 0.9);
    this.createLetterShimmerSfx(ctx, target, t0 + 2.85);
  }

  /**
   * ==============================================================================
   * SOUND EFFECT SUITE 4: MINIMAL TACTILE (Studio Acoustic Pops & Pure Glass Tones)
   * ==============================================================================
   */
  private renderMinimalTactileSfx(ctx: BaseAudioContext, target: AudioNode, t0: number) {
    // Tactile wooden pop on each logo
    [
      { t: 0.10, f: 550 },
      { t: 0.75, f: 680 },
      { t: 1.35, f: 820 },
    ].forEach((item) => {
      const pop = ctx.createOscillator();
      const pGain = ctx.createGain();
      pop.type = 'sine';
      pop.frequency.setValueAtTime(item.f, t0 + item.t);
      pop.frequency.exponentialRampToValueAtTime(110, t0 + item.t + 0.05);

      pGain.gain.setValueAtTime(0.45, t0 + item.t);
      pGain.gain.exponentialRampToValueAtTime(0.001, t0 + item.t + 0.09);

      pop.connect(pGain);
      pGain.connect(target);
      pop.start(t0 + item.t);
      pop.stop(t0 + item.t + 0.1);
      this.registerNode(pop);
    });

    // Gentle glass chimes on title reveal
    [523.25, 659.25, 783.99].forEach((freq, idx) => {
      const cTime = t0 + 2.38 + idx * 0.08;
      const chime = ctx.createOscillator();
      const cGain = ctx.createGain();
      chime.type = 'triangle';
      chime.frequency.setValueAtTime(freq, cTime);
      cGain.gain.setValueAtTime(0.28, cTime);
      cGain.gain.exponentialRampToValueAtTime(0.001, cTime + 1.8);

      chime.connect(cGain);
      cGain.connect(target);
      chime.start(cTime);
      chime.stop(cTime + 1.9);
      this.registerNode(chime);
    });
  }

  /**
   * Optional Lo-Fi Music generator
   */
  private renderLofiChill(ctx: BaseAudioContext, target: AudioNode, t0: number) {
    const chords = [
      { time: t0 + 0.2, dur: 2.1, root: 73.42, notes: [146.83, 220.0, 261.63, 329.63] },
      { time: t0 + 2.2, dur: 2.0, root: 49.00, notes: [98.0, 164.81, 196.0, 246.94] },
      { time: t0 + 4.1, dur: 2.3, root: 65.41, notes: [130.81, 196.0, 246.94, 261.63] },
    ];

    chords.forEach((chord) => {
      chord.notes.forEach((freq, idx) => {
        const start = chord.time + idx * 0.04;
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1100, start);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.001, start);
        gain.gain.exponentialRampToValueAtTime(0.18, start + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + chord.dur);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(target);
        osc.start(start);
        osc.stop(start + chord.dur + 0.1);
        this.registerNode(osc);
      });
    });
  }

  private renderLofiRhodes(ctx: BaseAudioContext, target: AudioNode, t0: number) {
    this.renderLofiChill(ctx, target, t0);
  }
}

export const audioEngine = new BumperAudioEngine();
