// src/components/GameCanvas.jsx
// High-Fidelity Physics mind core engine for Quantum Chaos
// Programmed with cosmic dust vortexes, spring bumper squish, screen-shaking, and slow-motion level clears.

import React, { useRef, useEffect, useState } from 'react';
import { playShoot, playBounce, playHit, playDie, updateDroneProximity } from '../utils/audio';

class Particle {
  constructor(x, y, color, vx, vy, life, r) {
    this.x = x; this.y = y; this.color = color;
    this.vx = vx; this.vy = vy; this.life = life; this.maxLife = life;
    this.r = r;
  }
  update() {
    this.x += this.vx; this.y += this.vy;
    this.vy += 0.05; // gravity falloff
    this.life -= 0.016;
  }
  draw(ctx) {
    const a = Math.max(0, this.life / this.maxLife);
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r * a, 0, Math.PI * 2);
    // Convert base hex color to rgba with opacity
    ctx.fillStyle = `${this.color}${Math.floor(a * 255).toString(16).padStart(2, '0')}`;
    ctx.fill();
  }
}

// Swirling cosmic stardust inside gravity well vortexes
class StarDust {
  constructor(well, radius) {
    this.well = well;
    this.angle = Math.random() * Math.PI * 2;
    this.orbitRadius = radius * (1 + Math.random() * 1.5);
    this.speed = (0.02 + Math.random() * 0.03) * (Math.random() > 0.5 ? 1 : -1);
    this.size = Math.random() * 1.5 + 0.5;
  }
  update() {
    this.angle += this.speed;
  }
  draw(ctx) {
    const x = this.well.x + Math.cos(this.angle) * this.orbitRadius;
    const y = this.well.y + Math.sin(this.angle) * this.orbitRadius;
    ctx.beginPath();
    ctx.arc(x, y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(180, 80, 255, 0.4)';
    ctx.fill();
  }
}

function GameCanvas({ level, lives, setLives, upgrades, onLevelClear, onGameOver }) {
  const canvasRef = useRef(null);
  const requestRef = useRef(null);

  // Gameplay state
  const stateRef = useRef({
    active: false,
    score: 0,
    ball: { x: 100, y: 300, vx: 0, vy: 0, active: false, trail: [], r: 10 },
    target: { x: 500, y: 300, r: 18, pulse: 0 },
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

  const triggerScreenShake = (val) => {
    stateRef.current.shakeIntensity = val;
  };

  const burstParticles = (x, y, color, count, speedMult = 1) => {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = (Math.random() * 3.5 + 1) * speedMult;
      stateRef.current.particles.push(
        new Particle(x, y, color, Math.cos(a) * s, Math.sin(a) * s, 1.0, Math.random() * 4 + 2)
      );
    }
  };

  const generateLevel = (W, H) => {
    const state = stateRef.current;
    state.wells = [];
    state.bumpers = [];
    state.particles = [];
    state.dust = [];
    state.clearPending = false;
    state.timeScale = 1.0;
    
    const margin = 100;

    // 1. Spawning Gravity Wells
    const wCount = clamp(1 + Math.floor(level / 2), 1, 5);
    for (let i = 0; i < wCount; i++) {
      const well = {
        x: rand(margin, W - margin),
        y: rand(margin + 70, H - margin),
        strength: rand(110, 210) * (level > 4 ? 1.5 : 1),
        r: 36,
        phase: rand(0, Math.PI * 2),
        moving: level > 5 && Math.random() > 0.45,
        vx: rand(-0.8, 0.8) * (level > 7 ? 1.5 : 1),
        vy: rand(-0.5, 0.5) * (level > 7 ? 1.5 : 1)
      };
      state.wells.push(well);

      // Spawn swirling cosmic dust around the gravity wells
      for (let j = 0; j < 40; j++) {
        state.dust.push(new StarDust(well, well.r));
      }
    }

    // 2. Spawning Orange Bumpers with squish mechanics
    const bCount = clamp(Math.floor(level / 2), 0, 6);
    for (let i = 0; i < bCount; i++) {
      state.bumpers.push({
        x: rand(margin, W - margin),
        y: rand(margin + 70, H - margin),
        r: 16,
        pulse: 0,
        squishX: 1.0,
        squishY: 1.0,
        moving: level > 8 && Math.random() > 0.5,
        vx: rand(-0.6, 0.6),
        vy: rand(-0.5, 0.5)
      });
    }

    // 3. Ball Spawn Coordinates
    state.ball = {
      x: rand(80, W * 0.25),
      y: rand(H * 0.28, H * 0.72),
      vx: 0, vy: 0, active: false,
      trail: [], r: 10
    };

    // 4. Target Spawn safely away from Ball
    do {
      state.target = {
        x: rand(W * 0.6, W - 80),
        y: rand(H * 0.15, H - 80),
        r: 18, pulse: 0
      };
    } while (dist(state.ball, state.target) < 220);
  };

  const handleLevelClearTransition = () => {
    stateRef.current.clearPending = true;
    playHit();
    triggerScreenShake(20);
    const bonus = 100 * level;
    
    // Animate slow motion Target clear sweep
    stateRef.current.timeScale = 0.15;

    setTimeout(() => {
      onLevelClear(bonus);
    }, 1400);
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
        // Reset ball placement
        state.ball.active = false;
        state.ball.vx = 0;
        state.ball.vy = 0;
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
        if (d > 6) {
          const f = w.strength / (d * d + 300);
          pvx += dx * f; pvy += dy * f;
        }
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
      generateLevel(canvas.width, canvas.height);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    // Loop Frame coordinator
    const runFrame = () => {
      const state = stateRef.current;
      const W = canvas.width;
      const H = canvas.height;
      const dt = 0.016 * state.timeScale; // Lerped delta time scaling

      // 1. Viewport camera shake matrix
      ctx.save();
      if (state.shakeIntensity > 0.1) {
        const sx = rand(-state.shakeIntensity, state.shakeIntensity);
        const sy = rand(-state.shakeIntensity, state.shakeIntensity);
        ctx.translate(sx, sy);
        state.shakeIntensity *= 0.92; // exponential decay
      }

      // Draw global space grids
      ctx.fillStyle = '#03030a';
      ctx.fillRect(0, 0, W, H);
      
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.06)';
      ctx.lineWidth = 0.5;
      const gridSpacing = 60;
      for (let x = 0; x < W; x += gridSpacing) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y < H; y += gridSpacing) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      // 2. Swirling stardust and black hole visual arrays
      state.dust.forEach(d => {
        d.update();
        d.draw(ctx);
      });

      // 3. Audio Proximity scan
      let nearestDist = 99999;
      state.wells.forEach(w => {
        // Outer pulsing glow rings
        const t = Date.now() * 0.0008;
        for (let i = 4; i >= 0; i--) {
          const r = w.r + i * 20 + Math.sin(w.phase + t * 0.75 + i * 0.5) * 6;
          const a = 0.05 + (4 - i) * 0.018;
          ctx.beginPath(); ctx.arc(w.x, w.y, r, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(139, 92, 246, ${a})`;
          ctx.stroke();
        }

        // Swirling gravitational spiral arms
        ctx.save();
        ctx.translate(w.x, w.y);
        ctx.rotate(t * 0.8 + w.phase);
        for (let i = 0; i < 4; i++) {
          const angle = (Math.PI * 2 / 4) * i;
          ctx.beginPath();
          ctx.moveTo(Math.cos(angle) * 7, Math.sin(angle) * 7);
          ctx.lineTo(Math.cos(angle) * w.r * 0.9, Math.sin(angle) * w.r * 0.9);
          ctx.strokeStyle = 'rgba(167, 139, 250, 0.55)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
        ctx.restore();

        // Dark singularity core
        ctx.beginPath(); ctx.arc(w.x, w.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(139, 92, 246, 0.9)';
        ctx.fill();
        ctx.beginPath(); ctx.arc(w.x, w.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();

        // Moving flag banner details
        if (level > 5 && w.moving) {
          w.x += w.vx * (dt * 60);
          w.y += w.vy * (dt * 60);
          if (w.x < 80 || w.x > W - 80) w.vx *= -1;
          if (w.y < 80 || w.y > H - 80) w.vy *= -1;
        }

        const dToBall = dist(state.ball, w);
        if (dToBall < nearestDist) nearestDist = dToBall;
      });

      if (state.ball.active) {
        updateDroneProximity(nearestDist);
      }

      // 4. Orange energy Bumpers squish & draw
      state.bumpers.forEach(b => {
        // Bumper linear movement
        if (level > 8 && b.moving) {
          b.x += b.vx * (dt * 60);
          b.y += b.vy * (dt * 60);
          if (b.x < 80 || b.x > W - 80) b.vx *= -1;
          if (b.y < 80 || b.y > H - 80) b.vy *= -1;
        }

        // Bumper squash lerping back to square rest position (Spring equation)
        b.squishX += (1.0 - b.squishX) * 0.12;
        b.squishY += (1.0 - b.squishY) * 0.12;
        if (b.pulse > 0) b.pulse = Math.max(0, b.pulse - 0.05);

        // Drawing compressed ellipse bumper
        const glow = b.pulse * 10;
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.scale(b.squishX, b.squishY);

        ctx.beginPath(); ctx.arc(0, 0, b.r + glow + 8, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(249, 115, 22, ${0.15 + b.pulse * 0.3})`;
        ctx.stroke();

        ctx.beginPath(); ctx.arc(0, 0, b.r + glow, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(249, 115, 22, ${0.75 + b.pulse * 0.25})`;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.beginPath(); ctx.arc(0, 0, (b.r + glow) * 0.45, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(249, 115, 22, ${0.4 + b.pulse * 0.4})`;
        ctx.fill();

        ctx.restore();
      });

      // 5. Target stable visual glows
      const tGlow = state.target.pulse + 0.04;
      state.target.pulse = tGlow;
      for (let i = 3; i >= 0; i--) {
        const r = state.target.r + Math.sin(tGlow + i * 0.6) * 5 + i * 9;
        ctx.beginPath(); ctx.arc(state.target.x, state.target.y, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(16, 185, 129, ${0.06 + i * 0.04})`;
        ctx.stroke();
      }

      ctx.beginPath(); ctx.arc(state.target.x, state.target.y, state.target.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(16, 185, 129, 0.22)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.9)';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.beginPath(); ctx.arc(state.target.x, state.target.y, state.target.r * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = '#10b981';
      ctx.fill();

      // Target Crosshairs
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
      ctx.lineWidth = 1;
      [0, Math.PI/2, Math.PI, 1.5*Math.PI].forEach(angle => {
        ctx.beginPath();
        ctx.moveTo(state.target.x + Math.cos(angle) * 8, state.target.y + Math.sin(angle) * 8);
        ctx.lineTo(state.target.x + Math.cos(angle) * (state.target.r - 2), state.target.y + Math.sin(angle) * (state.target.r - 2));
        ctx.stroke();
      });

      // 6. Particles Updates & Draws
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.update();
        p.draw(ctx);
        if (p.life <= 0) state.particles.splice(i, 1);
      }

      // 7. Aim dragging predictors
      if (state.isDrag && state.dragA && state.dragB) {
        const dx = state.dragA.x - state.dragB.x;
        const dy = state.dragA.y - state.dragB.y;
        const len = Math.hypot(dx, dy);
        
        if (len > 6) {
          const power = clamp(len / 10, 0, MAX_POWER);
          const vx = (dx / len) * power;
          const vy = (dy / len) * power;
          
          // Extends predict length based on stats multipliers!
          const stepsCount = Math.round(140 * upgrades.aimLength);
          const pts = handlePredict(state.ball.x, state.ball.y, vx, vy, stepsCount);

          ctx.beginPath();
          ctx.moveTo(state.ball.x, state.ball.y);
          pts.forEach((p, i) => {
            if (i % 2 === 0) ctx.lineTo(p.x, p.y);
          });
          
          // Aim line neon color gradient fade
          const gradient = ctx.createLinearGradient(state.ball.x, state.ball.y, pts[pts.length-1]?.x || 0, pts[pts.length-1]?.y || 0);
          gradient.addColorStop(0, '#8b5cf6');
          gradient.addColorStop(1, '#3b82f6');
          
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 2.0;
          ctx.setLineDash([4, 6]);
          ctx.stroke();
          ctx.setLineDash([]);

          if (pts.length > 0) {
            const last = pts[pts.length - 1];
            ctx.beginPath(); ctx.arc(last.x, last.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#3b82f6';
            ctx.fill();
          }

          // Launch power vector indicator arrow
          ctx.beginPath();
          ctx.moveTo(state.ball.x, state.ball.y);
          ctx.lineTo(state.ball.x + vx * 3.5, state.ball.y + vy * 3.5);
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }
      }

      // 8. Ball trails & coordinate loops
      if (state.ball.active && !state.clearPending) {
        // Apply gravitational pull vectors
        state.wells.forEach(w => {
          const dx = w.x - state.ball.x;
          const dy = w.y - state.ball.y;
          const d = Math.hypot(dx, dy);
          
          if (d > 6) {
            const f = w.strength / (d * d + 300);
            state.ball.vx += dx * f * (dt * 60);
            state.ball.vy += dy * f * (dt * 60);
          }

          // Swallowed by black hole
          if (d < w.r - 8) {
            burstParticles(state.ball.x, state.ball.y, '#f43f5e', 24, 1.5);
            burstParticles(w.x, w.y, '#8b5cf6', 16, 1.2);
            handleOrbLoss('Swallowed by gravity! 🌀');
          }
        });

        // Bumper collisions & Squish offsets
        state.bumpers.forEach(b => {
          const dx = state.ball.x - b.x;
          const dy = state.ball.y - b.y;
          const d = Math.hypot(dx, dy);

          if (d < state.ball.r + b.r + 2) {
            const nx = dx / d;
            const ny = dy / d;
            const dot = state.ball.vx * nx + state.ball.vy * ny;
            
            // Conserves velocity based on rebounds upgrade stats!
            const bounceK = 1.08 * upgrades.bounciness;
            state.ball.vx = (state.ball.vx - 2 * dot * nx) * bounceK;
            state.ball.vy = (state.ball.vy - 2 * dot * ny) * bounceK;

            // Push ball slightly out of bumper boundary
            state.ball.x = b.x + nx * (state.ball.r + b.r + 4);
            state.ball.y = b.y + ny * (state.ball.r + b.r + 4);

            // Trigger squash compression modifiers!
            b.squishX = 1.35;
            b.squishY = 0.65;
            b.pulse = 1.0;

            triggerScreenShake(8);
            burstParticles(state.ball.x, state.ball.y, '#f97316', 15);
            playBounce();
          }
        });

        // Wall rebounding bounces
        const r = state.ball.r;
        if (state.ball.x < r) { state.ball.x = r; state.ball.vx = Math.abs(state.ball.vx) * 0.8; triggerScreenShake(3); }
        if (state.ball.x > W - r) { state.ball.x = W - r; state.ball.vx = -Math.abs(state.ball.vx) * 0.8; triggerScreenShake(3); }
        if (state.ball.y < r) { state.ball.y = r; state.ball.vy = Math.abs(state.ball.vy) * 0.8; triggerScreenShake(3); }
        if (state.ball.y > H - r) { state.ball.y = H - r; state.ball.vy = -Math.abs(state.ball.vy) * 0.8; triggerScreenShake(3); }

        // Friction damping
        state.ball.vx *= 0.9992;
        state.ball.vy *= 0.9992;

        // Position coordinate translation
        state.ball.x += state.ball.vx * (dt * 60);
        state.ball.y += state.ball.vy * (dt * 60);

        // Appending trails
        state.ball.trail.push({ x: state.ball.x, y: state.ball.y });
        if (state.ball.trail.length > 35) state.ball.trail.shift();

        // Kinetic loss check
        const speed = Math.hypot(state.ball.vx, state.ball.vy);
        if (speed < 0.22) {
          burstParticles(state.ball.x, state.ball.y, '#f43f5e', 18);
          handleOrbLoss('Kinetic decay! Orb stopped. 🔋');
        }

        // TARGET HIT SCAN!
        if (dist(state.ball, state.target) < state.ball.r + state.target.r + 2) {
          burstParticles(state.target.x, state.target.y, '#10b981', 50, 2.0);
          burstParticles(state.ball.x, state.ball.y, '#3b82f6', 20, 1.4);
          handleLevelClearTransition();
        }
      }

      // Draw Ball Viewport Trails
      state.ball.trail.forEach((t, i) => {
        const prog = i / state.ball.trail.length;
        ctx.beginPath(); ctx.arc(t.x, t.y, state.ball.r * prog * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139, 92, 246, ${prog * 0.4})`;
        ctx.fill();
      });

      // Draw Ball Core
      ctx.beginPath(); ctx.arc(state.ball.x, state.ball.y, state.ball.r + 6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(139, 92, 246, 0.12)';
      ctx.fill();
      ctx.beginPath(); ctx.arc(state.ball.x, state.ball.y, state.ball.r, 0, Math.PI * 2);
      ctx.fillStyle = '#8b5cf6';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2.0;
      ctx.stroke();

      // Drag aim helper indicator overlays
      if (!state.ball.active) {
        const time = Date.now() * 0.0035;
        ctx.beginPath(); ctx.arc(state.ball.x, state.ball.y, state.ball.r + 8 + Math.sin(time) * 4, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(167, 139, 250, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.restore(); // Restore Viewport Camera Shakes
      requestRef.current = requestAnimationFrame(runFrame);
    };

    requestRef.current = requestAnimationFrame(runFrame);

    return () => {
      cancelAnimationFrame(requestRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [level, upgrades]);

  // Touch Gesture Listeners
  const handleDown = (cx, cy) => {
    const state = stateRef.current;
    if (state.ball.active || state.clearPending) return;
    
    if (dist({ x: cx, y: cy }, state.ball) < 55) {
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
    burstParticles(state.ball.x, state.ball.y, '#8b5cf6', 12);
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

      {/* Real-time Dotted power indicator wrap */}
      <div 
        id="powerWrap" 
        className={powerVisible ? 'visible' : ''}
        style={{
          position: 'absolute', bottom: '70px', left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
          pointerEvents: 'none', opacity: powerVisible ? 1 : 0, transition: 'opacity 0.2s', zIndex: 10
        }}
      >
        <div id="powerLabel" style={{ fontSize: '10px', letterSpacing: '2px', color: '#64748b', textAlign: 'center' }}>POWER METRIC</div>
        <div id="powerBarOuter" style={{ width: '180px', height: '6px', background: 'rgba(30,30,60,0.8)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '3px', overflow: 'hidden' }}>
          <div id="powerBarInner" style={{ height: '100%', width: powerWidth, background: 'linear-gradient(90deg, #8b5cf6, #3b82f6)', borderRadius: '3px' }} />
        </div>
      </div>
    </div>
  );
}

export default GameCanvas;
