// src/components/AdOverlay.jsx
// Premium Glassmorphic Sci-Fi Ad Break Screen for Quantum Chaos

import React, { useEffect, useState } from 'react';

function AdOverlay({ mode, onCompletedMock }) {
  const [countdown, setCountdown] = useState(3);
  const isMock = !window.CrazyGames || !window.CrazyGames.SDK;

  useEffect(() => {
    if (!isMock) return;

    // Countdown timer for Mock mode
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          if (onCompletedMock) onCompletedMock();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isMock, onCompletedMock]);

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: 'rgba(3, 3, 11, 0.95)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      zIndex: 10000,
      padding: '20px',
      color: '#e0e0ff',
      fontFamily: "'Share Tech Mono', monospace"
    }}>
      {/* Decorative neon background grids */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'linear-gradient(rgba(139, 92, 246, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 92, 246, 0.05) 1px, transparent 1px)',
        backgroundSize: '30px 30px',
        pointerEvents: 'none'
      }} />

      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '460px',
        padding: '40px 30px',
        textAlign: 'center',
        border: '1px solid rgba(139, 92, 246, 0.35)',
        boxShadow: '0 0 35px rgba(139, 92, 246, 0.2), inset 0 0 15px rgba(139, 92, 246, 0.1)',
        background: 'rgba(8, 8, 24, 0.9)'
      }}>
        {/* Pulsing Core Icon */}
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          border: '2px solid #8b5cf6',
          boxShadow: '0 0 20px rgba(139, 92, 246, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          color: '#8b5cf6',
          margin: '0 auto 24px auto',
          animation: 'pulseGlow 1.5s infinite alternate'
        }}>
          🛰️
        </div>

        <span style={{
          fontFamily: "'Orbitron', sans-serif",
          fontSize: '10px',
          color: '#8b5cf6',
          letterSpacing: '4px',
          textTransform: 'uppercase',
          display: 'block',
          marginBottom: '8px'
        }}>
          QUANTUM SYNC LINK
        </span>

        <h2 style={{
          fontFamily: "'Orbitron', sans-serif",
          fontSize: '22px',
          fontWeight: '900',
          letterSpacing: '1px',
          color: '#fff',
          marginBottom: '16px',
          textShadow: '0 0 10px rgba(255,255,255,0.2)'
        }}>
          {mode === 'rewarded' ? 'SYNCHRONIZING REWARD' : 'AD BREAK ACTIVE'}
        </h2>

        <p style={{
          color: '#8888b5',
          fontSize: '12px',
          lineHeight: '1.6',
          marginBottom: '32px',
          padding: '0 10px'
        }}>
          {isMock
            ? "Simulating CrazyGames ad integration break. The game will resume automatically after synchronization completes."
            : "CrazyGames SDK is loading and displaying the video ad. Your gameplay is paused, and audio is muted."}
        </p>

        {/* Action Status Indicator */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px'
        }}>
          {isMock ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#3b82f6',
              fontSize: '13px',
              fontFamily: "'Orbitron', sans-serif",
              fontWeight: 'bold'
            }}>
              🔄 RESUMING SECTOR IN {countdown}S...
            </div>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#10b981',
              fontSize: '13px',
              fontFamily: "'Orbitron', sans-serif",
              fontWeight: 'bold'
            }}>
              ⚡ AD IN PROGRESS...
            </div>
          )}

          {/* Progress bar */}
          <div style={{
            width: '200px',
            height: '4px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '2px',
            overflow: 'hidden',
            marginTop: '4px'
          }}>
            <div style={{
              width: isMock ? `${(countdown / 3) * 100}%` : '100%',
              height: '100%',
              background: '#8b5cf6',
              boxShadow: '0 0 8px #8b5cf6',
              transition: isMock ? 'width 1s linear' : 'none',
              animation: isMock ? 'none' : 'shimmer 1.5s infinite linear'
            }} />
          </div>
        </div>

        {/* Developer Integration Badge */}
        <div style={{
          marginTop: '36px',
          paddingTop: '16px',
          borderTop: '1px solid rgba(139, 92, 246, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          color: '#10b981',
          fontSize: '10px',
          letterSpacing: '1px',
          fontFamily: "'Orbitron', sans-serif"
        }}>
          🛡️ SDK SLOT SYNCHRONIZED
        </div>
      </div>

      {/* Styled Animations */}
      <style>{`
        @keyframes pulseGlow {
          0% { transform: scale(0.95); box-shadow: 0 0 10px rgba(139, 92, 246, 0.4); }
          100% { transform: scale(1.05); box-shadow: 0 0 25px rgba(139, 92, 246, 0.8); }
        }
        @keyframes shimmer {
          0% { opacity: 0.4; }
          50% { opacity: 1; }
          100% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

export default AdOverlay;
