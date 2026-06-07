// Web Audio API Synthesizer to simulate respiratory sounds in real time
class RespiratoryAudioSynth {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private nodes: AudioNode[] = [];
  private isPlaying = false;
  private animationFrame: number | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      this.createNoiseBuffer();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private createNoiseBuffer() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds of noise
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
  }

  start(type: 'normal' | 'wheeze' | 'crackle' | 'stridor') {
    try {
      this.stop();
      this.initContext();
      if (!this.ctx || !this.masterGain) return;

      this.isPlaying = true;
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      // Soft fade-in
      this.masterGain.gain.linearRampToValueAtTime(0.4, this.ctx.currentTime + 0.15);

      const startTime = this.ctx.currentTime;

      if (type === 'normal') {
        // Normal sound: Low pitch rumbling wind representing vesicular murmur
        // We alternate inspiration (higher volume, slightly higher pitch) and expiration
        this.nodes = this.createVesicularBreath(startTime);
      } else if (type === 'wheeze') {
        // Wheeze: Continuous whistling musical tone superimposed on vesicular breath
        this.nodes = this.createWheeze(startTime);
      } else if (type === 'crackle') {
        // Crackle: Non-continuous explosive popping sounds (clicks) during inspiration
        this.nodes = this.createCrackle(startTime);
      } else if (type === 'stridor') {
        // Stridor: High-pitched crowing wind sound during inspiration
        this.nodes = this.createStridor(startTime);
      }
    } catch (e) {
      console.error('Failed to play synthesizer sound:', e);
    }
  }

  stop() {
    this.isPlaying = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    if (this.ctx && this.masterGain) {
      try {
        this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, this.ctx.currentTime);
        this.masterGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.15);
      } catch (e) {
        // ignore state issues
      }
    }

    // Delay node cleanup to allow fadeout
    const nodesToCleanup = [...this.nodes];
    this.nodes = [];
    setTimeout(() => {
      nodesToCleanup.forEach(node => {
        try {
          (node as any).stop?.();
          node.disconnect();
        } catch (e) {
          // already stopped
        }
      });
    }, 200);
  }

  // Vesicular Breath simulation (Filter-controlled white noise with LFO volume modulation)
  private createVesicularBreath(startTime: number): AudioNode[] {
    if (!this.ctx || !this.masterGain || !this.noiseBuffer) return [];

    // Noise Source
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = this.noiseBuffer;
    noiseSource.loop = true;

    // Filter to isolate vesicular hum (low frequencies around 100-300Hz)
    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.Q.setValueAtTime(0.8, startTime);
    bandpass.frequency.setValueAtTime(180, startTime);

    // Gain node for breathing amplitude
    const breathGain = this.ctx.createGain();
    breathGain.gain.setValueAtTime(0.1, startTime);

    // Modulation of breath filter frequency and gain using periodic LFO
    const breathCycle = () => {
      if (!this.isPlaying || !this.ctx) return;
      const now = this.ctx.currentTime;
      const cycleLength = 4; // 4 seconds total cycle (2s inspiration, 2s expiration)
      const phase = (now - startTime) % cycleLength;
      
      let targetFreq = 180;
      let targetGain = 0.08;
      
      if (phase < 1.8) {
        // Inspiration: higher pitch, louder
        const p = phase / 1.8;
        targetFreq = 180 + Math.sin(p * Math.PI) * 120;
        targetGain = 0.08 + Math.sin(p * Math.PI) * 0.28;
      } else if (phase >= 1.8 && phase < 2.0) {
        // Transition pause
        targetFreq = 180;
        targetGain = 0.04;
      } else {
        // Expiration: lower pitch, softer, longer decay
        const p = (phase - 2.0) / 2.0;
        targetFreq = 180 + Math.sin(p * Math.PI) * 40;
        targetGain = 0.04 + Math.sin(p * Math.PI) * 0.14;
      }

      bandpass.frequency.setValueAtTime(targetFreq, now);
      breathGain.gain.setValueAtTime(targetGain, now);

      this.animationFrame = requestAnimationFrame(breathCycle);
    };

    noiseSource.connect(bandpass);
    bandpass.connect(breathGain);
    breathGain.connect(this.masterGain);
    noiseSource.start(startTime);

    breathCycle();

    return [noiseSource, bandpass, breathGain];
  }

  // Wheeze: Continuous whistling musical tone
  private createWheeze(startTime: number): AudioNode[] {
    if (!this.ctx || !this.masterGain || !this.noiseBuffer) return [];

    // Base background breath
    const baseNodes = this.createVesicularBreath(startTime);

    // Whistling Tone (Sine Oscillator)
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(480, startTime); // 480Hz high pitched wheeze

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(620, startTime); // Polyphonic wheeze element

    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(0.01, startTime);

    // Modulate wheeze intensity with breathing cycle
    const modulateWheeze = () => {
      if (!this.isPlaying || !this.ctx) return;
      const now = this.ctx.currentTime;
      const cycleLength = 3.5;
      const phase = (now - startTime) % cycleLength;
      
      let activeGain = 0.01;
      
      if (phase < 1.5) {
        // Inspiration wheeze (subtle)
        activeGain = Math.sin((phase / 1.5) * Math.PI) * 0.04;
      } else if (phase >= 1.5 && phase < 3.2) {
        // Expiration wheeze (loud, characteristic of obstructive airways)
        const p = (phase - 1.5) / 1.7;
        activeGain = Math.sin(p * Math.PI) * 0.12;
        // Pitch slightly fluctuates
        osc1.frequency.setValueAtTime(480 + Math.sin(p * Math.PI * 2) * 15, now);
      }

      oscGain.gain.setValueAtTime(activeGain, now);
      this.animationFrame = requestAnimationFrame(modulateWheeze);
    };

    osc1.connect(oscGain);
    osc2.connect(oscGain);
    oscGain.connect(this.masterGain);

    osc1.start(startTime);
    osc2.start(startTime);

    modulateWheeze();

    return [...baseNodes, osc1, osc2, oscGain];
  }

  // Crackle: Non-continuous explosive popping clicks during inspiration
  private createCrackle(startTime: number): AudioNode[] {
    if (!this.ctx || !this.masterGain || !this.noiseBuffer) return [];

    // Base background breath
    const baseNodes = this.createVesicularBreath(startTime);

    // Gain node for crackle triggers
    const crackleGain = this.ctx.createGain();
    crackleGain.gain.setValueAtTime(0, startTime);
    crackleGain.connect(this.masterGain);

    // Crackle trigger scheduler
    const scheduleCrackles = () => {
      if (!this.isPlaying || !this.ctx) return;
      const now = this.ctx.currentTime;
      const cycleLength = 4.0;
      const phase = (now - startTime) % cycleLength;

      // Crackles predominantly occur in mid-to-late inspiration (phase between 0.4 and 1.6)
      if (phase > 0.4 && phase < 1.6) {
        // Random chance to trigger a click
        if (Math.random() < 0.22) {
          this.triggerSingleCrackle(now);
        }
      }

      // Schedule next check in 35ms
      setTimeout(scheduleCrackles, 35);
    };

    scheduleCrackles();

    return [...baseNodes, crackleGain];
  }

  private triggerSingleCrackle(time: number) {
    if (!this.ctx || !this.masterGain) return;

    // A crackle is synthesized as a very short decay envelope on a high-pass filtered noise burst
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(800 + Math.random() * 600, time);

    const decay = this.ctx.createGain();
    decay.gain.setValueAtTime(0, time);
    decay.gain.linearRampToValueAtTime(0.18 + Math.random() * 0.15, time + 0.002);
    decay.gain.exponentialRampToValueAtTime(0.001, time + 0.015 + Math.random() * 0.02);

    noise.connect(filter);
    filter.connect(decay);
    decay.connect(this.masterGain);

    noise.start(time);
    noise.stop(time + 0.05);

    this.nodes.push(noise, filter, decay);
  }

  // Stridor: Harsh, intense crowing sound mostly during inspiration
  private createStridor(startTime: number): AudioNode[] {
    if (!this.ctx || !this.masterGain || !this.noiseBuffer) return [];

    // Sawtooth base representing vocal cord / larynx vibration
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(260, startTime); // 260Hz harsh base frequency

    // Filter to isolate airway narrowing turbulence (medium high frequencies around 700Hz)
    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(750, startTime);
    bandpass.Q.setValueAtTime(1.5, startTime);

    // Noise for airway turbulence
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    noise.loop = true;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(1000, startTime);
    noiseFilter.Q.setValueAtTime(1.0, startTime);

    const mixGain = this.ctx.createGain();
    mixGain.gain.setValueAtTime(0, startTime);

    const modulateStridor = () => {
      if (!this.isPlaying || !this.ctx) return;
      const now = this.ctx.currentTime;
      const cycleLength = 3.8;
      const phase = (now - startTime) % cycleLength;

      let gain = 0.01;
      let pitch = 260;
      
      // Stridor is loudest during INSPIRATION (phase < 1.6)
      if (phase < 1.6) {
        const p = phase / 1.6;
        gain = Math.sin(p * Math.PI) * 0.35; // Very loud
        pitch = 260 + Math.sin(p * Math.PI) * 45; // Pitch sweeps up
        bandpass.frequency.setValueAtTime(750 + Math.sin(p * Math.PI) * 200, now);
      } else {
        // Expiration stridor (subtle or silent)
        const p = (phase - 1.6) / 2.2;
        gain = Math.sin(p * Math.PI) * 0.04;
      }

      osc.frequency.setValueAtTime(pitch, now);
      mixGain.gain.setValueAtTime(gain, now);

      this.animationFrame = requestAnimationFrame(modulateStridor);
    };

    osc.connect(bandpass);
    bandpass.connect(mixGain);

    noise.connect(noiseFilter);
    noiseFilter.connect(mixGain);

    mixGain.connect(this.masterGain);

    osc.start(startTime);
    noise.start(startTime);

    modulateStridor();

    return [osc, bandpass, noise, noiseFilter, mixGain];
  }
}

export const audioSynthInstance = new RespiratoryAudioSynth();
