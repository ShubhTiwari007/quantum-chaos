// src/components/GameCanvas.jsx
// Quantum Chaos — Ultra-Premium Physics Canvas Renderer
// Features: animated starfield, plasma trails, holographic gravity wells, premium particle bursts

import React, { useRef, useEffect, useState } from 'react';
import { playShoot, playBounce, playHit, playDie, updateDroneProximity } from '../utils/audio';

// ─── Particle System ────────────────────────────────────────────────────────
class Particle {
  constructor(x, y, color, vx, vy, life, r) {
    this.x = x; this.y = y; this.color = color;
    this.vx = vx; this.vy = vy; this.life = life; this.maxLife = life;
    this.r = r;
  }
  update() {
    this.x += this.vx; this.y += this.vy;
    this.vy += 0.04;
    this.vx *= 0.98;
    this.life -= 0.016;
  }
  draw(ctx) {
    const a = Math.max(0, this.life / this.maxLife);
    ctx.save();
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 8 * a;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r * a, 0, Math.PI * 2);
    ctx.fillStyle = `${this.color}${Math.floor(a * 255).toString(16).padStart(2, '0')}`;
    ctx.fill();
    ctx.restore();
  }
}

// ─── Stardust Orbiting Wells ────────────────────────────────────────────────
class StarDust {
  constructor(well, radius) {
    this.well = well;
    this.angle = Math.random() * Math.PI * 2;
    this.orbitRadius = radius * (1 + Math.random() * 1.8);
    this.speed = (0.015 + Math.random() * 0.025) * (Math.random() > 0.5 ? 1 : -1);
    this.size = Math.random() * 1.8 + 0.4;
    this.hue = 260 + Math.random() * 60; // purple to blue-violet
  }
  update() { this.angle += this.speed; }
  draw(ctx) {
    const x = this.well.x + Math.cos(this.angle) * this.orbitRadius;
    const y = this.well.y + Math.sin(this.angle) * this.orbitRadius;
    ctx.beginPath();
    ctx.arc(x, y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${this.hue}, 80%, 70%, 0.5)`;
    ctx.fill();
  }
}

// ─── Background Star ────────────────────────────────────────────────────────
class Star {
  constructor(W, H) {
    this.x = Math.random() * W;
    this.y = Math.random() * H;
    this.r = Math.random() * 1.2 + 0.2;
    this.speed = 0.03 + Math.random() * 0.08;
    this.alpha = Math.random();
    this.alphaDir = Math.random() > 0.5 ? 1 : -1;
  }
  update() {
    this.alpha += this.alphaDir * 0.005;
    if (this.alpha >= 1 || this.alpha <= 0.1) this.alphaDir *= -1;
  }
  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(220, 210, 255, ${this.alpha * 0.6})`;
    ctx.fill();
  }
}

// ─── Main Component ─────────────────────────────────────────────────────────
function GameCanvas({ level, lives, setLives, upgrades, onLevelClear, onGameOver }) {
  const canvasRef = useRef(null);
  const requestRef = useRef(null);
  const starsRef = useRef([]);

  const stateRef = useRef({
    active: false,
    score: 0,
    ball: { x: 100, y: 300, vx: 0, vy: 0, active: false, trail: [], r: 11 },
    target: { x: 500, y: 300, r: 20, pulse: 0 },
    wells: [],
    bumpers: [],
    particles: [],
    dust: [],
    dragA: null,
    dragB: null,
    isDrag: false,
    shakeIntensity: 0,
    timeScale: 1.0,
    clearPending: false
  });

  const [powerWidth, setPowerWidth] = useState('0%');
  const [powerVisible, setPowerVisible] = useState(false);

  const MAX_POWER = 16;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const triggerScreenShake = (val) => { stateRef.current.shakeIntensity = val; };

  const burstParticles = (x, y, color, count, speedMult = 1) => {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = (Math.random() * 3.5 + 1) * speedMult;
      stateRef.current.particles.push(
        new Particle(x, y, color, Math.cos(a) * s, Math.sin(a) * s, 1.0 + Math.random() * 0.4, Math.random() * 4 + 2)
      );
    }
  };

  // Draw premium holographic gravity well
  const drawGravityWell = (ctx, w, t) => {
    // Outer atmospheric rings (5 layers)
    for (let i = 5; i >= 0; i--) {
      const r = w.r + i * 22 + Math.sin(w.phase + t * 0.65 + i * 0.6) * 7;
      const a = 0.04 + (5 - i) * 0.02;
      const hue = 260 + i * 8;
      ctx.beginPath();
      ctx.arc(w.x, w.y, r, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(${hue}, 85%, 65%, ${a})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Gravitational lens distortion (concentric ellipses rotated)
    ctx.save();
    ctx.translate(w.x, w.y);
    for (let i = 0; i < 3; i++) {
      const angle = t * 0.4 + (i * Math.PI * 2 / 3);
      ctx.save();
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.ellipse(0, 0, w.r * 1.4, w.r * 0.6, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(167, 139, 250, 0.15)`;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();

    // Spiral arms (rotating)
    ctx.save();
    ctx.translate(w.x, w.y);
    ctx.rotate(t * 0.9 + w.phase);
    for (let i = 0; i < 5; i++) {
      const angle = (Math.PI * 2 / 5) * i;
      // Curved spiral using bezier
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * 6, Math.sin(angle) * 6);
      const cp1x = Math.cos(angle + 0.4) * w.r * 0.5;
      const cp1y = Math.sin(angle + 0.4) * w.r * 0.5;
      const ep = Math.cos(angle + 0.8) * w.r * 0.88;
      const ey = Math.sin(angle + 0.8) * w.r * 0.88;
      ctx.bezierCurveTo(cp1x * 0.6, cp1y * 0.6, cp1x, cp1y, ep, ey);
      ctx.strokeStyle = 'rgba(196, 181, 253, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.restore();

    // Event horizon gradient core
    const coreGrad = ctx.createRadialGradient(w.x, w.y, 0, w.x, w.y, w.r * 0.9);
    coreGrad.addColorStop(0, 'rgba(255,255,255,0.95)');
    coreGrad.addColorStop(0.25, 'rgba(216,180,254,0.85)');
    coreGrad.addColorStop(0.6, 'rgba(88,28,235,0.6)');
    coreGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath();
    ctx.arc(w.x, w.y, w.r * 0.9, 0, Math.PI * 2);
    ctx.fillStyle = coreGrad;
    ctx.fill();

    // Hard inner core
    ctx.beginPath();
    ctx.arc(w.x, w.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 14;
    ctx.fill();
    ctx.shadowBlur = 0;

    // "WELL" label
    ctx.fillStyle = 'rgba(196,181,253,0.7)';
    ctx.font = 'bold 7px Orbitron, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GRAVITY', w.x, w.y + w.r + 14);
  };

  // Draw premium orange energy bumper
  const drawBumper = (ctx, b) => {
    const glow = b.pulse * 14;
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.scale(b.squishX, b.squishY);

    // Outer halo ring
    ctx.beginPath();
    ctx.arc(0, 0, b.r + glow + 14, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(251, 146, 60, ${0.08 + b.pulse * 0.15})`;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Mid glow ring
    ctx.beginPath();
    ctx.arc(0, 0, b.r + glow + 4, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(249, 115, 22, ${0.3 + b.pulse * 0.4})`;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#f97316';
    ctx.shadowBlur = 12 + glow * 2;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Core fill gradient
    const bumperGrad = ctx.createRadialGradient(-b.r * 0.3, -b.r * 0.3, 0, 0, 0, b.r + glow);
    bumperGrad.addColorStop(0, `rgba(255, 200, 100, ${0.9 + b.pulse * 0.1})`);
    bumperGrad.addColorStop(0.5, `rgba(249, 115, 22, ${0.7 + b.pulse * 0.3})`);
    bumperGrad.addColorStop(1, `rgba(180, 60, 0, 0.4)`);
    ctx.beginPath();
    ctx.arc(0, 0, b.r + glow, 0, Math.PI * 2);
    ctx.fillStyle = bumperGrad;
    ctx.fill();

    // Inner diamond cross pattern
    ctx.strokeStyle = `rgba(255, 220, 150, ${0.5 + b.pulse * 0.4})`;
    ctx.lineWidth = 1.2;
    const cr = (b.r + glow) * 0.55;
    ctx.beginPath();
    ctx.moveTo(0, -cr); ctx.lineTo(cr, 0);
    ctx.lineTo(0, cr); ctx.lineTo(-cr, 0);
    ctx.closePath();
    ctx.stroke();

    ctx.restore();
  };

  // Draw premium target (quantum receptor)
  const drawTarget = (ctx, target) => {
    const t = Date.now() * 0.001;
    const pulse = target.pulse;

    // Outer halo rings
    for (let i = 4; i >= 0; i--) {
      const r = target.r + Math.sin(pulse + i * 0.7) * 5 + i * 12;
      const a = 0.05 + i * 0.03;
      ctx.beginPath();
      ctx.arc(target.x, target.y, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(16, 185, 129, ${a})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Rotating scanner arcs
    ctx.save();
    ctx.translate(target.x, target.y);
    ctx.rotate(t * 1.2);
    ctx.beginPath();
    ctx.arc(0, 0, target.r + 8, 0, Math.PI * 1.1);
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.7)';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();

    ctx.save();
    ctx.translate(target.x, target.y);
    ctx.rotate(-t * 0.8 + Math.PI);
    ctx.beginPath();
    ctx.arc(0, 0, target.r + 8, 0, Math.PI * 0.7);
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // Core gradient fill
    const targetGrad = ctx.createRadialGradient(target.x, target.y, 0, target.x, target.y, target.r);
    targetGrad.addColorStop(0, 'rgba(255,255,255,0.9)');
    targetGrad.addColorStop(0.3, 'rgba(52,211,153,0.8)');
    targetGrad.addColorStop(0.7, 'rgba(16,185,129,0.4)');
    targetGrad.addColorStop(1, 'rgba(16,185,129,0.05)');
    ctx.beginPath();
    ctx.arc(target.x, target.y, target.r, 0, Math.PI * 2);
    ctx.fillStyle = targetGrad;
    ctx.fill();

    // Crosshair lines
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.6)';
    ctx.lineWidth = 1;
    const ch = target.r - 5;
    const gap = 6;
    [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2].forEach(angle => {
      ctx.beginPath();
      ctx.moveTo(target.x + Math.cos(angle) * gap, target.y + Math.sin(angle) * gap);
      ctx.lineTo(target.x + Math.cos(angle) * ch, target.y + Math.sin(angle) * ch);
      ctx.stroke();
    });

    // CENTER DOT
    ctx.beginPath();
    ctx.arc(target.x, target.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#10b981';
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Label
    ctx.fillStyle = 'rgba(52,211,153,0.7)';
    ctx.font = 'bold 7px Orbitron, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TARGET', target.x, target.y + target.r + 13);
  };

  // Draw ultra-premium quantum orb (the player ball)
  const drawBall = (ctx, ball, isDragging) => {
    const t = Date.now() * 0.001;

    // Motion trail (premium plasma trail)
    ball.trail.forEach((pt, i) => {
      const prog = i / ball.trail.length;
      const r = ball.r * prog * 0.8;
      const hue = 260 + prog * 40;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${hue}, 85%, 65%, ${prog * 0.35})`;
      ctx.fill();
    });

    // Outer energy shield pulse
    const shieldR = ball.r + 10 + Math.sin(t * 2.5) * 3;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, shieldR, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.18)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Rotating arc segments (shield rings)
    ctx.save();
    ctx.translate(ball.x, ball.y);
    ctx.rotate(t * 2);
    ctx.beginPath();
    ctx.arc(0, 0, ball.r + 5, 0, Math.PI * 0.8);
    ctx.strokeStyle = 'rgba(196, 181, 253, 0.6)';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();

    ctx.save();
    ctx.translate(ball.x, ball.y);
    ctx.rotate(-t * 1.5 + Math.PI);
    ctx.beginPath();
    ctx.arc(0, 0, ball.r + 5, 0, Math.PI * 0.5);
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // Main orb gradient
    const ballGrad = ctx.createRadialGradient(
      ball.x - ball.r * 0.3, ball.y - ball.r * 0.3, 1,
      ball.x, ball.y, ball.r
    );
    ballGrad.addColorStop(0, '#e9d5ff');
    ballGrad.addColorStop(0.35, '#a855f7');
    ballGrad.addColorStop(0.7, '#6d28d9');
    ballGrad.addColorStop(1, '#1e1b4b');

    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fillStyle = ballGrad;
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 20;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Specular highlight
    const specGrad = ctx.createRadialGradient(
      ball.x - ball.r * 0.3, ball.y - ball.r * 0.4, 0,
      ball.x - ball.r * 0.2, ball.y - ball.r * 0.2, ball.r * 0.55
    );
    specGrad.addColorStop(0, 'rgba(255,255,255,0.6)');
    specGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fillStyle = specGrad;
    ctx.fill();

    // White center core
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;

    // "Tap to aim" pulsing ring when idle
    if (!ball.active && !isDragging) {
      const aidR = ball.r + 12 + Math.sin(t * 3) * 5;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, aidR, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(196, 181, 253, ${0.3 + Math.sin(t * 3) * 0.2})`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 6]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Aim label
      ctx.fillStyle = 'rgba(196, 181, 253, 0.6)';
      ctx.font = 'bold 7px Orbitron, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('DRAG', ball.x, ball.y + ball.r + 18);
    }
  };

  const generateLevel = (W, H) => {
    const state = stateRef.current;
    state.wells = []; state.bumpers = []; state.particles = [];
    state.dust = []; state.clearPending = false; state.timeScale = 1.0;
    const margin = 100;

    // Gravity Wells
    const wCount = clamp(1 + Math.floor(level / 2), 1, 5);
    for (let i = 0; i < wCount; i++) {
      const well = {
        x: rand(margin, W - margin),
        y: rand(margin + 70, H - margin),
        strength: rand(110, 210) * (level > 4 ? 1.5 : 1),
        r: 36, phase: rand(0, Math.PI * 2),
        moving: level > 5 && Math.random() > 0.45,
        vx: rand(-0.8, 0.8) * (level > 7 ? 1.5 : 1),
        vy: rand(-0.5, 0.5) * (level > 7 ? 1.5 : 1)
      };
      state.wells.push(well);
      for (let j = 0; j < 50; j++) state.dust.push(new StarDust(well, well.r));
    }

    // Bumpers
    const bCount = clamp(Math.floor(level / 2), 0, 6);
    for (let i = 0; i < bCount; i++) {
      state.bumpers.push({
        x: rand(margin, W - margin),
        y: rand(margin + 70, H - margin),
        r: 17, pulse: 0, squishX: 1.0, squishY: 1.0,
        moving: level > 8 && Math.random() > 0.5,
        vx: rand(-0.6, 0.6), vy: rand(-0.5, 0.5)
      });
    }

    // Ball & Target
    state.ball = { x: rand(80, W * 0.25), y: rand(H * 0.28, H * 0.72), vx: 0, vy: 0, active: false, trail: [], r: 11 };
    do {
      state.target = { x: rand(W * 0.6, W - 80), y: rand(H * 0.15, H - 80), r: 20, pulse: 0 };
    } while (dist(state.ball, state.target) < 220);
  };

  const handleLevelClearTransition = () => {
    stateRef.current.clearPending = true;
    playHit();
    triggerScreenShake(20);
    const bonus = 100 * level;
    stateRef.current.timeScale = 0.15;
    setTimeout(() => { onLevelClear(bonus); }, 1400);
  };

  const handleOrbLoss = (msg) => {
    playDie();
    triggerScreenShake(15);
    const state = stateRef.current;
    setLives(prev => {
      const nextLives = prev - 1;
      if (nextLives <= 0) {
        setTimeout(() => onGameOver(), 800);
      } else {
        state.ball.active = false;
        state.ball.vx = 0; state.ball.vy = 0;
        state.ball.x = rand(80, window.innerWidth * 0.25);
        state.ball.y = rand(window.innerHeight * 0.28, window.innerHeight * 0.72);
        state.ball.trail = [];
      }
      return nextLives;
    });
  };

  const handlePredict = (sx, sy, svx, svy, steps) => {
    let px = sx, py = sy, pvx = svx, pvy = svy;
    const pts = [];
    const state = stateRef.current;
    for (let i = 0; i < steps; i++) {
      for (const w of state.wells) {
        const dx = w.x - px, dy = w.y - py;
        const d = Math.hypot(dx, dy);
        if (d > 6) { const f = w.strength / (d * d + 300); pvx += dx * f; pvy += dy * f; }
      }
      pvx *= 0.9998; pvy *= 0.9998;
      px += pvx; py += pvy;
      pts.push({ x: px, y: py });
      if (px < -50 || px > window.innerWidth + 50 || py < -50 || py > window.innerHeight + 50) break;
    }
    return pts;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // Regenerate stars
      starsRef.current = Array.from({ length: 160 }, () => new Star(canvas.width, canvas.height));
      generateLevel(canvas.width, canvas.height);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    const runFrame = () => {
      const state = stateRef.current;
      const W = canvas.width;
      const H = canvas.height;
      const dt = 0.016 * state.timeScale;
      const t = Date.now() * 0.001;

      // Camera shake
      ctx.save();
      if (state.shakeIntensity > 0.1) {
        ctx.translate(
          rand(-state.shakeIntensity, state.shakeIntensity),
          rand(-state.shakeIntensity, state.shakeIntensity)
        );
        state.shakeIntensity *= 0.9;
      }

      // ── BACKGROUND ─────────────────────────────────────────────────
      ctx.fillStyle = '#02020a';
      ctx.fillRect(0, 0, W, H);

      // Nebula gradients
      const neb1 = ctx.createRadialGradient(W * 0.25, H * 0.2, 0, W * 0.25, H * 0.2, W * 0.45);
      neb1.addColorStop(0, 'rgba(88, 28, 235, 0.06)');
      neb1.addColorStop(1, 'rgba(88, 28, 235, 0)');
      ctx.fillStyle = neb1;
      ctx.fillRect(0, 0, W, H);

      const neb2 = ctx.createRadialGradient(W * 0.8, H * 0.7, 0, W * 0.8, H * 0.7, W * 0.4);
      neb2.addColorStop(0, 'rgba(6, 182, 212, 0.05)');
      neb2.addColorStop(1, 'rgba(6, 182, 212, 0)');
      ctx.fillStyle = neb2;
      ctx.fillRect(0, 0, W, H);

      // Animated starfield
      starsRef.current.forEach(s => { s.update(); s.draw(ctx); });

      // Subtle grid lines
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.04)';
      ctx.lineWidth = 0.5;
      const gs = 65;
      for (let x = 0; x < W; x += gs) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += gs) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      // ── STARDUST ───────────────────────────────────────────────────
      state.dust.forEach(d => { d.update(); d.draw(ctx); });

      // ── GRAVITY WELLS ──────────────────────────────────────────────
      let nearestDist = 99999;
      state.wells.forEach(w => {
        if (level > 5 && w.moving) {
          w.x += w.vx * (dt * 60);
          w.y += w.vy * (dt * 60);
          if (w.x < 80 || w.x > W - 80) w.vx *= -1;
          if (w.y < 80 || w.y > H - 80) w.vy *= -1;
        }
        drawGravityWell(ctx, w, t);
        const dToBall = dist(state.ball, w);
        if (dToBall < nearestDist) nearestDist = dToBall;
      });
      if (state.ball.active) updateDroneProximity(nearestDist);

      // ── BUMPERS ────────────────────────────────────────────────────
      state.bumpers.forEach(b => {
        if (level > 8 && b.moving) {
          b.x += b.vx * (dt * 60);
          b.y += b.vy * (dt * 60);
          if (b.x < 80 || b.x > W - 80) b.vx *= -1;
          if (b.y < 80 || b.y > H - 80) b.vy *= -1;
        }
        b.squishX += (1.0 - b.squishX) * 0.12;
        b.squishY += (1.0 - b.squishY) * 0.12;
        if (b.pulse > 0) b.pulse = Math.max(0, b.pulse - 0.04);
        drawBumper(ctx, b);
      });

      // ── TARGET ─────────────────────────────────────────────────────
      state.target.pulse += 0.04;
      drawTarget(ctx, state.target);

      // ── PARTICLES ──────────────────────────────────────────────────
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.update(); p.draw(ctx);
        if (p.life <= 0) state.particles.splice(i, 1);
      }

      // ── AIM PREDICTOR ──────────────────────────────────────────────
      if (state.isDrag && state.dragA && state.dragB) {
        const dx = state.dragA.x - state.dragB.x;
        const dy = state.dragA.y - state.dragB.y;
        const len = Math.hypot(dx, dy);
        if (len > 6) {
          const power = clamp(len / 10, 0, MAX_POWER);
          const vx = (dx / len) * power;
          const vy = (dy / len) * power;
          const stepsCount = Math.round(140 * upgrades.aimLength);
          const pts = handlePredict(state.ball.x, state.ball.y, vx, vy, stepsCount);

          // Glowing dotted trajectory
          ctx.shadowColor = '#a855f7';
          ctx.shadowBlur = 6;
          pts.forEach((p, i) => {
            if (i % 3 === 0) {
              const alpha = 1 - i / pts.length;
              const r = 2.5 * alpha;
              ctx.beginPath();
              ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
              const hue = 260 + (i / pts.length) * 60;
              ctx.fillStyle = `hsla(${hue}, 85%, 70%, ${alpha * 0.8})`;
              ctx.fill();
            }
          });
          ctx.shadowBlur = 0;

          // Arrow from ball
          ctx.beginPath();
          ctx.moveTo(state.ball.x, state.ball.y);
          ctx.lineTo(state.ball.x + vx * 3.5, state.ball.y + vy * 3.5);
          ctx.strokeStyle = '#e9d5ff';
          ctx.lineWidth = 2.5;
          ctx.shadowColor = '#a855f7';
          ctx.shadowBlur = 8;
          ctx.stroke();
          ctx.shadowBlur = 0;

          // End dot
          if (pts.length > 0) {
            const last = pts[pts.length - 1];
            ctx.beginPath();
            ctx.arc(last.x, last.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#22d3ee';
            ctx.shadowColor = '#22d3ee';
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
      }

      // ── BALL PHYSICS ───────────────────────────────────────────────
      if (state.ball.active && !state.clearPending) {
        state.wells.forEach(w => {
          const dx = w.x - state.ball.x, dy = w.y - state.ball.y;
          const d = Math.hypot(dx, dy);
          if (d > 6) {
            const f = w.strength / (d * d + 300);
            state.ball.vx += dx * f * (dt * 60);
            state.ball.vy += dy * f * (dt * 60);
          }
          if (d < w.r - 8) {
            burstParticles(state.ball.x, state.ball.y, '#f43f5e', 30, 1.5);
            burstParticles(w.x, w.y, '#a855f7', 20, 1.2);
            handleOrbLoss('Swallowed by gravity!');
          }
        });

        state.bumpers.forEach(b => {
          const dx = state.ball.x - b.x, dy = state.ball.y - b.y;
          const d = Math.hypot(dx, dy);
          if (d < state.ball.r + b.r + 2) {
            const nx = dx / d, ny = dy / d;
            const dot = state.ball.vx * nx + state.ball.vy * ny;
            const bounceK = 1.08 * upgrades.bounciness;
            state.ball.vx = (state.ball.vx - 2 * dot * nx) * bounceK;
            state.ball.vy = (state.ball.vy - 2 * dot * ny) * bounceK;
            state.ball.x = b.x + nx * (state.ball.r + b.r + 4);
            state.ball.y = b.y + ny * (state.ball.r + b.r + 4);
            b.squishX = 1.4; b.squishY = 0.6; b.pulse = 1.0;
            triggerScreenShake(8);
            burstParticles(state.ball.x, state.ball.y, '#f97316', 18);
            playBounce();
          }
        });

        const r = state.ball.r;
        if (state.ball.x < r)   { state.ball.x = r; state.ball.vx = Math.abs(state.ball.vx) * 0.8; triggerScreenShake(3); }
        if (state.ball.x > W-r) { state.ball.x = W-r; state.ball.vx = -Math.abs(state.ball.vx) * 0.8; triggerScreenShake(3); }
        if (state.ball.y < r)   { state.ball.y = r; state.ball.vy = Math.abs(state.ball.vy) * 0.8; triggerScreenShake(3); }
        if (state.ball.y > H-r) { state.ball.y = H-r; state.ball.vy = -Math.abs(state.ball.vy) * 0.8; triggerScreenShake(3); }

        state.ball.vx *= 0.9992; state.ball.vy *= 0.9992;
        state.ball.x += state.ball.vx * (dt * 60);
        state.ball.y += state.ball.vy * (dt * 60);
        state.ball.trail.push({ x: state.ball.x, y: state.ball.y });
        if (state.ball.trail.length > 40) state.ball.trail.shift();

        const speed = Math.hypot(state.ball.vx, state.ball.vy);
        if (speed < 0.22) {
          burstParticles(state.ball.x, state.ball.y, '#f43f5e', 18);
          handleOrbLoss('Kinetic decay!');
        }
        if (dist(state.ball, state.target) < state.ball.r + state.target.r + 2) {
          burstParticles(state.target.x, state.target.y, '#10b981', 60, 2.0);
          burstParticles(state.ball.x, state.ball.y, '#22d3ee', 25, 1.4);
          handleLevelClearTransition();
        }
      }

      // ── BALL RENDER ────────────────────────────────────────────────
      drawBall(ctx, state.ball, state.isDrag);

      // ── HUD ON CANVAS ──────────────────────────────────────────────
      // Level indicator top-left
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      ctx.roundRect(12, 12, 140, 36, 8);
      ctx.fill();
      ctx.strokeStyle = 'rgba(168,85,247,0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#a855f7';
      ctx.font = 'bold 9px Orbitron, monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`SECTOR ${String(level).padStart(2,'0')} / 10`, 22, 30);

      // Lives top-right
      const livsLabel = 'CELLS';
      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      ctx.roundRect(W - 140, 12, 128, 36, 8);
      ctx.fill();
      ctx.strokeStyle = 'rgba(16,185,129,0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 8px Orbitron, monospace';
      ctx.fillText(livsLabel, W - 22, 23);
      for (let i = 0; i < upgrades.maxLives; i++) {
        const alive = i < lives;
        const lx = W - 28 - i * 16;
        const ly = 33;
        ctx.beginPath();
        ctx.arc(lx, ly, 5, 0, Math.PI * 2);
        ctx.fillStyle = alive ? '#10b981' : 'rgba(100,100,120,0.4)';
        if (alive) { ctx.shadowColor = '#10b981'; ctx.shadowBlur = 8; }
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      ctx.restore();
      requestRef.current = requestAnimationFrame(runFrame);
    };

    requestRef.current = requestAnimationFrame(runFrame);
    return () => {
      cancelAnimationFrame(requestRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [level, upgrades]);

  // Input handlers
  const handleDown = (cx, cy) => {
    const state = stateRef.current;
    if (state.ball.active || state.clearPending) return;
    if (dist({ x: cx, y: cy }, state.ball) < 60) {
      state.isDrag = true;
      state.dragA = { x: cx, y: cy };
      state.dragB = { x: cx, y: cy };
      setPowerVisible(true);
    }
  };

  const handleMove = (cx, cy) => {
    const state = stateRef.current;
    if (!state.isDrag) return;
    state.dragB = { x: cx, y: cy };
    const len = dist(state.dragA, state.dragB);
    const power = clamp(len / 10, 0, MAX_POWER);
    setPowerWidth(`${(power / MAX_POWER) * 100}%`);
  };

  const handleUp = (cx, cy) => {
    const state = stateRef.current;
    if (!state.isDrag) return;
    state.isDrag = false;
    setPowerVisible(false);
    state.dragB = { x: cx, y: cy };
    const dx = state.dragA.x - state.dragB.x;
    const dy = state.dragA.y - state.dragB.y;
    const len = Math.hypot(dx, dy);
    if (len < 6) return;
    const power = clamp(len / 10, 0, MAX_POWER);
    state.ball.vx = (dx / len) * power;
    state.ball.vy = (dy / len) * power;
    state.ball.active = true;
    state.ball.trail = [];
    playShoot();
    burstParticles(state.ball.x, state.ball.y, '#a855f7', 14);
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
      <canvas
        ref={canvasRef}
        onMouseDown={e => handleDown(e.clientX, e.clientY)}
        onMouseMove={e => handleMove(e.clientX, e.clientY)}
        onMouseUp={e => handleUp(e.clientX, e.clientY)}
        onTouchStart={e => { const t = e.touches[0]; handleDown(t.clientX, t.clientY); }}
        onTouchMove={e => { const t = e.touches[0]; handleMove(t.clientX, t.clientY); }}
        onTouchEnd={e => { const t = e.changedTouches[0]; handleUp(t.clientX, t.clientY); }}
        style={{ cursor: 'crosshair', display: 'block', width: '100%', height: '100%' }}
      />

      {/* Power Meter */}
      <div
        style={{
          position: 'absolute', bottom: '70px', left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
          pointerEvents: 'none', opacity: powerVisible ? 1 : 0, transition: 'opacity 0.2s', zIndex: 10
        }}
      >
        <div style={{
          fontSize: '9px', letterSpacing: '3px', color: '#a855f7',
          fontFamily: 'Orbitron, monospace', textShadow: '0 0 8px rgba(168,85,247,0.5)'
        }}>LAUNCH POWER</div>
        <div style={{
          width: '200px', height: '8px',
          background: 'rgba(20,15,40,0.9)',
          border: '1px solid rgba(168,85,247,0.4)',
          borderRadius: '4px', overflow: 'hidden',
          boxShadow: '0 0 10px rgba(168,85,247,0.2)'
        }}>
          <div style={{
            height: '100%', width: powerWidth,
            background: 'linear-gradient(90deg, #6d28d9, #a855f7, #22d3ee)',
            borderRadius: '4px',
            boxShadow: '0 0 8px rgba(168,85,247,0.6)',
            transition: 'width 0.05s ease'
          }} />
        </div>
      </div>
    </div>
  );
}

export default GameCanvas;
