// src/components/HUDOverlay.jsx
// Responsive Glassmorphic HUD overlay for Quantum Chaos
// Houses level stats trackers, live score, maximum capacitor battery cells, and exit controls.

import React from 'react';
import { playBounce } from '../utils/audio';

function HUDOverlay({ score, highScore, level, lives, maxLives, onQuit }) {
  const levelNames = [
    "Singularity Launch", "Double Bouncers", "Vortex Crossfire", 
    "Shattered Orbitals", "Singularity Maze", "Drifting Vortices", 
    "Quantum Pinball", "Chaos Helix", "Black Hole Blitz", "Cosmic Singularity"
  ];

  const handleQuitClick = () => {
    playBounce();
    onQuit();
  };

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      pointerEvents: 'none', zIndex: 5,
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      padding: '14px 20px'
    }}>
      
      {/* Top HUD Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', pointerEvents: 'auto' }}>
        
        {/* Left Stats Grid */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <div className="glass-panel" style={{ padding: '6px 16px', minWidth: '85px', textAlign: 'center' }}>
            <div style={{ fontSize: '8px', letterSpacing: '1px', color: '#64748b' }}>STABILIZED</div>
            <div style={{ fontFamily: 'Orbitron', fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>{score}</div>
          </div>
          <div className="glass-panel" style={{ padding: '6px 16px', minWidth: '85px', textAlign: 'center' }}>
            <div style={{ fontSize: '8px', letterSpacing: '1px', color: '#64748b' }}>HIGH RECORD</div>
            <div style={{ fontFamily: 'Orbitron', fontSize: '18px', fontWeight: 'bold', color: '#a78bfa' }}>{highScore}</div>
          </div>
        </div>

        {/* Right Level & Lives */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <div className="glass-panel" style={{ padding: '6px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: '8px', letterSpacing: '1px', color: '#64748b' }}>SECTOR</div>
            <div style={{ fontFamily: 'Orbitron', fontSize: '16px', fontWeight: 'bold', color: '#3b82f6' }}>
              LVL {level}
            </div>
          </div>
          <div className="glass-panel" style={{ padding: '6px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: '8px', letterSpacing: '1px', color: '#64748b' }}>LIFE BATTERIES</div>
            <div style={{ 
              fontFamily: 'Orbitron', fontSize: '14px', fontWeight: 'bold', 
              color: lives <= 1 ? '#ef4444' : '#10b981', 
              letterSpacing: '1.5px', marginTop: '2px' 
            }}>
              {'♥'.repeat(Math.max(lives, 0)) + '♡'.repeat(Math.max(maxLives - lives, 0))}
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Floating Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%' }}>
        
        {/* Left Sector Title Description */}
        <div className="glass-panel" style={{ padding: '8px 18px', pointerEvents: 'auto' }}>
          <div style={{ fontSize: '8px', color: '#64748b', letterSpacing: '1.5px' }}>CURRENT METRIC</div>
          <div style={{ fontFamily: 'Orbitron', fontSize: '12px', color: '#c084fc', fontWeight: 'bold', marginTop: '2px' }}>
            {levelNames[level - 1] || "Sector Anomalies"}
          </div>
        </div>

        {/* Right Quit button */}
        <button 
          className="btn-cyber secondary" 
          onClick={handleQuitClick}
          style={{ pointerEvents: 'auto', padding: '6px 16px', fontSize: '10px' }}
        >
          QUIT MISSION
        </button>

      </div>

    </div>
  );
}

export default HUDOverlay;
