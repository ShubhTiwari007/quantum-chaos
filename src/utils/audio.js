// src/utils/audio.js
// Advanced zero-dependency HTML5 Web Audio API Sound Synthesizer
// Generates tactical laser sweeps, square-wave bounces, and proximity-based deep gravity drones.

let ctx = null;
let isMuted = false;
let droneOsc = null;
let droneGain = null;

export const initAudio = () => {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    setupContinuousDrone();
  }
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
};

export const setMute = (muted) => {
  isMuted = muted;
  if (droneGain) {
    droneGain.gain.setValueAtTime(muted ? 0 : 0.02, ctx ? ctx.currentTime : 0);
  }
};

export const getMute = () => isMuted;

const setupContinuousDrone = () => {
  if (!ctx || isMuted) return;
  try {
    // Deep atmospheric low-frequency gravity hum
    droneOsc = ctx.createOscillator();
    droneGain = ctx.createGain();
    
    droneOsc.type = 'sine';
    droneOsc.frequency.value = 55; // Low bass note A
    
    droneGain.gain.setValueAtTime(0.02, ctx.currentTime);
    
    droneOsc.connect(droneGain);
    droneGain.connect(ctx.destination);
    
    droneOsc.start(0);
  } catch (e) {
    console.warn("Continuous drone setup blocked or unsupported", e);
  }
};

// Dynamically adjust the gravity well drone hum pitch & intensity
export const updateDroneProximity = (minDist) => {
  if (!ctx || !droneOsc || !droneGain || isMuted) return;
  try {
    const t = ctx.currentTime;
    if (minDist < 250) {
      // Scale intensity based on proximity
      const pct = 1.0 - (minDist / 250); // 0 at far, 1 at extremely close
      const targetFreq = 55 + pct * 65;  // sweep frequency up to 120Hz
      const targetVol = 0.02 + pct * 0.16; // increase volume as ball approaches
      
      droneOsc.frequency.setTargetAtTime(targetFreq, t, 0.1);
      droneGain.gain.setTargetAtTime(targetVol, t, 0.1);
    } else {
      droneOsc.frequency.setTargetAtTime(55, t, 0.3);
      droneGain.gain.setTargetAtTime(0.02, t, 0.3);
    }
  } catch (e) {}
};

const beep = (freq, type, dur, vol, delay = 0) => {
  if (!ctx || isMuted) return;
  try {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    
    o.type = type;
    o.frequency.value = freq;
    
    const t = ctx.currentTime + delay;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    
    o.start(t);
    o.stop(t + dur + 0.05);
  } catch (e) {}
};

export const playShoot = () => {
  initAudio();
  beep(180, 'sawtooth', 0.15, 0.15);
  beep(360, 'sine', 0.1, 0.08, 0.04);
};

export const playBounce = () => {
  initAudio();
  beep(520, 'square', 0.08, 0.1);
};

export const playHit = () => {
  initAudio();
  // Arpeggiating major triad victory sweep
  const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
  notes.forEach((f, idx) => {
    beep(f, 'sine', 0.25, 0.16, idx * 0.06);
  });
};

export const playDie = () => {
  initAudio();
  beep(180, 'sawtooth', 0.2, 0.18);
  beep(120, 'sawtooth', 0.25, 0.15, 0.08);
};

export const playLevelUp = () => {
  initAudio();
  // Ascending arpeggio sweeps
  const notes = [329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
  notes.forEach((f, idx) => {
    beep(f, 'sine', 0.18, 0.15, idx * 0.05);
  });
};
