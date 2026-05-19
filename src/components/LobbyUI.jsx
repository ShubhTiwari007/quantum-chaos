// src/components/LobbyUI.jsx
// Premium Glassmorphic Space Cockpit Lobby UI for Quantum Chaos

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { initAudio, playBounce, playHit, setMute as setMuteUtil } from '../utils/audio';
import { requestRewardedAd, loadData, saveData, removeData, BASIC_LAUNCH } from '../utils/crazyGamesSDK';
import AdOverlay from './AdOverlay';

const SECTOR_COLORS = [
  '#1e1b4b', '#312e81', '#1e1b4b', '#312e81',
  '#1e1b4b', '#312e81', '#1e1b4b', '#4c1d95'
];

const SECTORS = [
  { label: '15 💎', val: 15 },
  { label: '30 💎', val: 30 },
  { label: '50 💎', val: 50 },
  { label: '100 💎', val: 100 },
  { label: '15 💎', val: 15 },
  { label: '20 💎', val: 20 },
  { label: '40 💎', val: 40 },
  { label: 'JACKPOT!', val: 250 }
];

function LobbyUI({ highScore, unlockedLevel, gems, setGems, upgrades, onUpgrade, onLaunch, mute, setMute }) {
  const [activeTab, setActiveTab] = useState('levels');
  const [wheelSpinning, setWheelSpinning] = useState(false);
  const [wheelClaimed, setWheelClaimed] = useState(() => loadData('qc_wheel_claimed') === new Date().toDateString());
  const [prizeMsg, setPrizeMsg] = useState(null);

  // Rewarded Ad states
  const [adRunning, setAdRunning] = useState(false);
  const [adReason, setAdReason] = useState(null);

  const wheelCanvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const currentAngleRef = useRef(0);

  const levelData = [
    { id: 1, name: "Singularity Launch", desc: "Basic gravity trajectory. Simple curve paths." },
    { id: 2, name: "Double Bouncers", desc: "Orange energy bumpers block direct shots." },
    { id: 3, name: "Vortex Crossfire", desc: "Dual black holes pull particles symmetrically." },
    { id: 4, name: "Shattered Orbitals", desc: "Bumpers placed next to black holes. Swing shots!" },
    { id: 5, name: "Singularity Maze", desc: "Intense black hole gravity grid. Extreme bends." },
    { id: 6, name: "Drifting Vortices", desc: "Gravity wells drift slowly! Anticipate movement." },
    { id: 7, name: "Quantum Pinball", desc: "Packed moving bumpers and floating obstacles." },
    { id: 8, name: "Chaos Helix", desc: "Moving gravity wells and orange target walls." },
    { id: 9, name: "Black Hole Blitz", desc: "5 black holes create a gravitational labyrinth." },
    { id: 10, name: "Cosmic Singularity", desc: "The ultimate physics showdown. Complete chaos." }
  ];

  const honors = [
    { title: "VORTEX SWINGER", desc: "Complete level 3 with all lives intact.", unlocked: unlockedLevel >= 4 },
    { title: "BLACK HOLE SURVIVOR", desc: "Stabilize sector 5 singularity maze.", unlocked: unlockedLevel >= 6 },
    { title: "BULLSEYE SNIPER", desc: "Unlock stage 8 drifting helix orbit.", unlocked: unlockedLevel >= 9 },
    { title: "QUANTUM MASTERY", desc: "Conquer the ultimate Cosmic Singularity.", unlocked: unlockedLevel >= 10 }
  ];

  // --- CANVAS WHEEL DRAWING ---
  const drawWheel = useCallback((angleDeg) => {
    const canvas = wheelCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 16;
    const numSectors = SECTORS.length;
    const arcAngle = (2 * Math.PI) / numSectors;
    const angleRad = (angleDeg * Math.PI) / 180;

    ctx.clearRect(0, 0, size, size);

    // Outer glow ring
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 10, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.35)';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Draw each sector as a pie slice
    for (let i = 0; i < numSectors; i++) {
      const startAngle = i * arcAngle + angleRad - Math.PI / 2;
      const endAngle = startAngle + arcAngle;

      // Sector fill
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = SECTOR_COLORS[i];
      ctx.fill();

      // Sector border
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Text label along the mid-angle
      ctx.save();
      const midAngle = startAngle + arcAngle / 2;
      ctx.translate(cx, cy);
      ctx.rotate(midAngle);
      ctx.fillStyle = i === 7 ? '#fbbf24' : '#c4b5fd';
      ctx.font = `bold ${i === 7 ? 12 : 11}px Orbitron, monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(SECTORS[i].label, radius * 0.6, 0);
      ctx.restore();
    }

    // Inner hub circle
    ctx.beginPath();
    ctx.arc(cx, cy, 24, 0, Math.PI * 2);
    ctx.fillStyle = '#10b981';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 9px Orbitron, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SPIN', cx, cy);

    // Top pointer triangle
    ctx.beginPath();
    ctx.moveTo(cx, 6);
    ctx.lineTo(cx - 10, -10);
    ctx.lineTo(cx + 10, -10);
    ctx.closePath();
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur = 0;
  }, []);

  // Draw wheel when tab activates
  useEffect(() => {
    if (activeTab === 'wheel') {
      const t = setTimeout(() => drawWheel(currentAngleRef.current), 50);
      return () => clearTimeout(t);
    }
  }, [activeTab, drawWheel]);

  const handleSpinWheel = () => {
    if (wheelSpinning || wheelClaimed) return;
    initAudio();
    setWheelSpinning(true);
    setPrizeMsg(null);

    const numSectors = SECTORS.length;
    const degPerSector = 360 / numSectors;

    // Pick random winning sector
    const winnerIdx = Math.floor(Math.random() * numSectors);

    // Calculate target rotation so pointer lands on winnerIdx sector
    const fullSpins = 6 * 360;
    const sectorMidOffset = winnerIdx * degPerSector + degPerSector / 2;
    const targetAngle = currentAngleRef.current + fullSpins + (360 - sectorMidOffset);

    const startAngle = currentAngleRef.current;
    const totalDelta = targetAngle - startAngle;
    const duration = 4200;
    const startTime = performance.now();
    let lastTickSector = -1;

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Cubic ease-out for smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentDeg = startAngle + totalDelta * eased;
      currentAngleRef.current = currentDeg;

      drawWheel(currentDeg);

      // Click sound on sector boundary crossings
      const normalizedAngle = ((currentDeg % 360) + 360) % 360;
      const currentSector = Math.floor(normalizedAngle / degPerSector) % numSectors;
      if (currentSector !== lastTickSector) {
        lastTickSector = currentSector;
        playBounce();
      }

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Spin complete
        setWheelSpinning(false);
        setWheelClaimed(true);
        saveData('qc_wheel_claimed', new Date().toDateString());

        const prize = SECTORS[winnerIdx];
        setGems(prev => prev + prize.val);
        playHit();
        setPrizeMsg(`✦ You won ${prize.val} Quantum Gems! ✦`);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, []);

  const handleTabChange = (tabName) => {
    initAudio();
    playBounce();
    setActiveTab(tabName);
  };

  const handleWatchRewardedAdForSpin = () => {
    setAdReason('spin');
    setAdRunning(true);
    setMuteUtil(true);

    requestRewardedAd({
      adStarted: () => {},
      adFinished: () => {
        setAdRunning(false);
        setMuteUtil(mute);
        
        // Unlock wheel spin
        setWheelClaimed(false);
        removeData('qc_wheel_claimed');
        setPrizeMsg("✦ Energy restored! You have 1 free Spin! ✦");
      },
      adError: (error) => {
        setAdRunning(false);
        setMuteUtil(mute);
        setPrizeMsg("✦ Transmission failed. Try again later. ✦");
      }
    });
  };

  const handleWatchRewardedAdForGems = () => {
    setAdReason('gems');
    setAdRunning(true);
    setMuteUtil(true);

    requestRewardedAd({
      adStarted: () => {},
      adFinished: () => {
        setAdRunning(false);
        setMuteUtil(mute);
        
        setGems(prev => {
          const newGems = prev + 100;
          saveData('qc_gems', newGems);
          return newGems;
        });
        playHit();
      },
      adError: (error) => {
        setAdRunning(false);
        setMuteUtil(mute);
      }
    });
  };

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 10,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      background: 'radial-gradient(circle at center, #0f0a28 0%, #03030b 100%)',
      padding: '30px 20px', overflowY: 'auto'
    }}>
      {adRunning && (
        <AdOverlay mode="rewarded" />
      )}
      
      {/* Lobby Header */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="neon-title" style={{ fontSize: 'clamp(28px, 6vw, 44px)', marginBottom: '4px' }}>QUANTUM CHAOS</h1>
        <p style={{ color: '#6366f1', letterSpacing: '3px', fontSize: '10px' }}>PHYSICS VECTOR CORE</p>
      </div>

      {/* Stats Quickbar */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <div className="glass-panel" style={{ padding: '6px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '9px', color: '#64748b' }}>HIGH RECORD</span>
          <span style={{ fontFamily: 'Orbitron', fontSize: '18px', color: '#a78bfa' }}>{highScore} pts</span>
        </div>
        <div className="glass-panel" style={{ padding: '6px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '9px', color: '#64748b' }}>QUANTUM GEMS</span>
          <span style={{ fontFamily: 'Orbitron', fontSize: '18px', color: '#10b981' }}>💎 {gems}</span>
        </div>
        <button 
          className="glass-panel" 
          onClick={() => setMute(!mute)}
          style={{ padding: '6px 14px', border: 'none', color: '#a0a0ff', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          {mute ? '🔇 MUTED' : '🔊 ACTIVE'}
        </button>
      </div>

      {/* Glass Navigation Tabs */}
      <div className="glass-panel" style={{
        display: 'flex', padding: '6px', gap: '8px', width: '100%', maxWidth: '680px', marginBottom: '22px'
      }}>
        {['levels', 'upgrades', 'honors', 'wheel'].map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            style={{
              flex: 1, padding: '10px 4px', borderRadius: '8px',
              fontFamily: 'inherit', fontSize: '11px', fontWeight: 'bold', letterSpacing: '1px',
              background: activeTab === tab ? 'rgba(139, 92, 246, 0.25)' : 'transparent',
              color: activeTab === tab ? '#c084fc' : '#64748b',
              border: activeTab === tab ? '1px solid rgba(139, 92, 246, 0.35)' : '1px solid transparent',
              cursor: 'pointer', transition: 'all 0.2s ease'
            }}
          >
            {tab === 'wheel' ? '🎰 WHEEL' : tab.toUpperCase()}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      <div style={{ width: '100%', maxWidth: '680px', flex: 1, minHeight: '340px' }}>

        {/* A. LEVELS TAB */}
        {activeTab === 'levels' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
            {levelData.map((lvl) => {
              const isLocked = lvl.id > unlockedLevel;
              return (
                <div key={lvl.id} className="glass-panel" style={{
                  padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  opacity: isLocked ? 0.45 : 1,
                  borderLeft: lvl.id === unlockedLevel ? '4px solid #8b5cf6' : '1px solid var(--border-glow)'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: isLocked ? '#64748b' : '#c084fc', fontFamily: 'Orbitron' }}>
                      LEVEL {lvl.id} - {lvl.name}
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>{lvl.desc}</span>
                  </div>
                  {isLocked ? (
                    <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 'bold' }}>🔒 LOCKED</span>
                  ) : (
                    <button className="btn-cyber" onClick={() => onLaunch(lvl.id)} style={{ padding: '8px 20px', fontSize: '11px' }}>
                      STABILIZE
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* B. UPGRADES TAB */}
        {activeTab === 'upgrades' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#3b82f6', fontFamily: 'Orbitron' }}>AIM ACCURACY SIGHT</span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Extends trajectory prediction dot guides.</span>
                <span style={{ fontSize: '12px', color: '#8b5cf6' }}>Multiplier: {upgrades.aimLength}x</span>
              </div>
              <button className="btn-cyber" onClick={() => onUpgrade('aimLength', 100)} disabled={gems < 100}
                style={{ fontSize: '11px', opacity: gems >= 100 ? 1 : 0.4 }}>UPGRADE 💎100</button>
            </div>
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#ef4444', fontFamily: 'Orbitron' }}>CELL STARTING BATTERY</span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Adds starting life capacitors.</span>
                <span style={{ fontSize: '12px', color: '#8b5cf6' }}>Capacity: {upgrades.maxLives} Cells</span>
              </div>
              <button className="btn-cyber" onClick={() => onUpgrade('maxLives', 120)} disabled={gems < 120}
                style={{ fontSize: '11px', opacity: gems >= 120 ? 1 : 0.4 }}>UPGRADE 💎120</button>
            </div>
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#10b981', fontFamily: 'Orbitron' }}>ORB THERMAL REBOUND</span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Conserves speed on bounces.</span>
                <span style={{ fontSize: '12px', color: '#8b5cf6' }}>Bounciness: {upgrades.bounciness}x</span>
              </div>
              <button className="btn-cyber" onClick={() => onUpgrade('bounciness', 80)} disabled={gems < 80}
                style={{ fontSize: '11px', opacity: gems >= 80 ? 1 : 0.4 }}>UPGRADE 💎80</button>
            </div>

            {/* Rewarded Ad Gems Synthesizer - Hidden in Basic Launch */}
            {!BASIC_LAUNCH && (
              <div className="glass-panel" style={{
                padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                border: '1px solid rgba(16, 185, 129, 0.4)', background: 'rgba(16, 185, 129, 0.05)'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#10b981', fontFamily: 'Orbitron' }}>QUANTUM GEMS HARVEST</span>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Synthesize 100 free gems via telemetry sync.</span>
                  <span style={{ fontSize: '12px', color: '#8b5cf6' }}>Cooldown: Instant</span>
                </div>
                <button className="btn-cyber" onClick={handleWatchRewardedAdForGems}
                  style={{ fontSize: '11px', borderColor: '#10b981', color: '#10b981', boxShadow: '0 0 15px rgba(16,185,129,0.3)' }}>FREE 💎100</button>
              </div>
            )}
          </div>
        )}

        {/* C. HONORS TAB */}
        {activeTab === 'honors' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {honors.map((h, idx) => (
              <div key={idx} className="glass-panel" style={{
                padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
                border: h.unlocked ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(239,68,68,0.2)',
                background: h.unlocked ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.02)'
              }}>
                <div style={{
                  width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: h.unlocked ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.1)',
                  color: h.unlocked ? '#10b981' : '#ef4444', fontSize: '20px', marginBottom: '12px', fontFamily: 'Orbitron'
                }}>
                  {h.unlocked ? '✦' : '🔒'}
                </div>
                <span style={{ fontSize: '13px', fontWeight: 'bold', fontFamily: 'Orbitron', color: h.unlocked ? '#10b981' : '#64748b' }}>
                  {h.title}
                </span>
                <span style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>{h.desc}</span>
              </div>
            ))}
          </div>
        )}

        {/* D. SPIN WHEEL TAB (Canvas-Rendered) */}
        {activeTab === 'wheel' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <p style={{ color: '#8888b5', fontSize: '12px', textAlign: 'center' }}>
              ✦ Spin the cosmic stabilizer daily to claim free Quantum Gems! ✦
            </p>
            
            <div style={{ position: 'relative', width: '280px', height: '280px' }}>
              <canvas ref={wheelCanvasRef} width={280} height={280} style={{ width: '280px', height: '280px' }} />
            </div>

            {/* Prize Result Banner */}
            {prizeMsg && (
              <div className="glass-panel" style={{
                padding: '14px 28px', textAlign: 'center',
                border: '1px solid rgba(16,185,129,0.5)',
                background: 'rgba(16,185,129,0.1)'
              }}>
                <span style={{ fontFamily: 'Orbitron', fontSize: '14px', color: '#10b981', fontWeight: 'bold' }}>
                  {prizeMsg}
                </span>
              </div>
            )}

            <button className="btn-cyber" onClick={() => handleSpinWheel()}
              disabled={wheelSpinning || wheelClaimed}
              style={{
                fontSize: '12px',
                opacity: (wheelSpinning || wheelClaimed) ? 0.4 : 1,
                boxShadow: (wheelSpinning || wheelClaimed) ? 'none' : '0 0 20px rgba(139,92,246,0.4)'
              }}
            >
              {wheelClaimed ? '✓ CLAIMED TODAY' : wheelSpinning ? 'SPINNING...' : '🎰 ACTIVATE SPIN'}
            </button>

            {wheelClaimed && !wheelSpinning && !BASIC_LAUNCH && (
              <button className="btn-cyber" onClick={handleWatchRewardedAdForSpin}
                style={{
                  fontSize: '11px',
                  borderColor: '#10b981',
                  color: '#10b981',
                  marginTop: '10px',
                  boxShadow: '0 0 15px rgba(16,185,129,0.3)'
                }}
              >
                🎰 WATCH AD FOR EXTRA SPIN
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default LobbyUI;
