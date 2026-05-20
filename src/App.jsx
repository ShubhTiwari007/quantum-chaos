// src/App.jsx
// Master React Coordinator for Quantum Chaos
// Orchestrates state transitions, high scores, unlocked levels, upgrades lab, and CrazyGames SDK integrations.

import React, { useState, useEffect } from 'react';
import LobbyUI from './components/LobbyUI';
import HUDOverlay from './components/HUDOverlay';
import GameCanvas from './components/GameCanvas';
import AdOverlay from './components/AdOverlay';
import { initAudio, setMute, playLevelUp } from './utils/audio';
import {
  initSDK,
  requestMidgameAd,
  signalGameplayStart,
  signalGameplayStop,
  triggerHappytime,
  saveData,
  loadData
} from './utils/crazyGamesSDK';

function App() {
  const [gameState, setGameState] = useState('menu'); // 'menu' | 'playing' | 'clear' | 'over'
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const [gems, setGems] = useState(() => parseInt(loadData('qc_gems') || '150'));
  const [highScore, setHighScore] = useState(() => parseInt(loadData('qc_hs') || '0'));
  const [unlockedLevel, setUnlockedLevel] = useState(() => parseInt(loadData('qc_lvl_unlocked') || '1'));
  const [mute, setMuteState] = useState(() => loadData('qc_mute') === 'true');
  const [levelBonus, setLevelBonus] = useState(0);

  // CrazyGames Ad Integration States
  const [adActive, setAdActive] = useState(false);
  const [adMode, setAdMode] = useState('midgame');

  // Stats Upgrades purchased using Gems
  const [upgrades, setUpgrades] = useState(() => {
    const saved = loadData('qc_upgrades');
    return saved ? JSON.parse(saved) : {
      aimLength: 1, // multiplier
      maxLives: 3,  // starting base lives
      bounciness: 1 // bounce conservation modifier
    };
  });

  useEffect(() => {
    saveData('qc_gems', gems);
  }, [gems]);

  // Initialize the SDK platform APIs
  useEffect(() => {
    initSDK((muted) => setMuteState(muted));
  }, []);

  // GameMonetize SDK global pause/resume hooks
  useEffect(() => {
    window.onSDKPause = () => {
      console.log('[QuantumChaos] SDK Pause - game paused for ad');
    };
    window.onSDKResume = () => {
      console.log('[QuantumChaos] SDK Resume - game resumed after ad');
    };
    return () => {
      window.onSDKPause = null;
      window.onSDKResume = null;
    };
  }, []);

  useEffect(() => {
    saveData('qc_upgrades', JSON.stringify(upgrades));
  }, [upgrades]);

  useEffect(() => {
    // Only apply the user's mute state if there is no active ad break
    if (!adActive) {
      setMute(mute);
    }
    saveData('qc_mute', mute);
  }, [mute, adActive]);

  const handleLaunchGame = (selectedLevel = 1) => {
    initAudio();
    setScore(0);
    setLevel(selectedLevel);
    setLives(upgrades.maxLives);
    setLevelBonus(0);
    setGameState('playing');
    
    // Signal CrazyGames that active gameplay has started
    signalGameplayStart();
  };

  const handleLevelClear = (gainedScore) => {
    // Signal CrazyGames that active gameplay has stopped
    signalGameplayStop();

    // Trigger CrazyGames Happytime celebration effect
    triggerHappytime();

    setScore(prev => {
      const nextScore = prev + gainedScore;
      if (nextScore > highScore) {
        setHighScore(nextScore);
        saveData('qc_hs', nextScore);
      }
      return nextScore;
    });

    setLevelBonus(gainedScore);
    setGems(prev => prev + 25); // Award 25 gems on clear!

    // Unlock next level if relevant
    if (level === unlockedLevel && unlockedLevel < 10) {
      setUnlockedLevel(prev => {
        const nextLvl = prev + 1;
        saveData('qc_lvl_unlocked', nextLvl);
        return nextLvl;
      });
    }

    setGameState('clear');
  };

  const handleGameOver = () => {
    // Signal CrazyGames that gameplay has stopped
    signalGameplayStop();
    setGameState('over');
  };

  const handleNextLevel = () => {
    playLevelUp();

    const loadNextSector = () => {
      setLevel(prev => prev + 1);
      setLives(upgrades.maxLives);
      setGameState('playing');
      signalGameplayStart();
    };

    // Trigger CrazyGames Midgame Interstitial Ad Break
    setAdMode('midgame');
    setAdActive(true);
    setMute(true); // Always mute audio during ads

    requestMidgameAd({
      adStarted: () => {
        console.log("Midgame Ad Started callback.");
      },
      adFinished: () => {
        console.log("Midgame Ad Finished callback.");
        setAdActive(false);
        setMute(mute); // Restore user mute setting
        loadNextSector();
      },
      adError: (error) => {
        console.warn("Midgame Ad Error callback:", error);
        setAdActive(false);
        setMute(mute); // Restore user mute setting
        loadNextSector();
      }
    });
  };

  const handleUpgrade = (statName, cost) => {
    if (gems >= cost) {
      setGems(prev => prev - cost);
      setUpgrades(prev => {
        const nextVal = statName === 'maxLives' ? prev[statName] + 1 : prev[statName] + 0.25;
        return { ...prev, [statName]: nextVal };
      });
    }
  };

  const handleQuitGame = () => {
    signalGameplayStop();
    setGameState('menu');
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      
      {/* 1. Core WebGL / 2D Engine Viewport */}
      {gameState === 'playing' && !adActive && (
        <GameCanvas 
          level={level}
          lives={lives}
          setLives={setLives}
          upgrades={upgrades}
          onLevelClear={handleLevelClear}
          onGameOver={handleGameOver}
        />
      )}

      {/* 2. Responsive UI HUD overlays */}
      {gameState === 'playing' && !adActive && (
        <HUDOverlay 
          score={score}
          highScore={highScore}
          level={level}
          lives={lives}
          maxLives={upgrades.maxLives}
          onQuit={handleQuitGame}
        />
      )}

      {/* 3. Futuristic Main Cockpit Lobby */}
      {gameState === 'menu' && !adActive && (
        <LobbyUI 
          highScore={highScore}
          unlockedLevel={unlockedLevel}
          gems={gems}
          setGems={setGems}
          upgrades={upgrades}
          onUpgrade={handleUpgrade}
          onLaunch={handleLaunchGame}
          mute={mute}
          setMute={setMuteState}
        />
      )}

      {/* 4. LEVEL CLEAR OVERLAY */}
      {gameState === 'clear' && !adActive && (
        <div className="screen" style={{ background: 'rgba(3, 3, 11, 0.94)', zIndex: 100 }}>
          <h1 className="neon-title" style={{ fontSize: 'clamp(28px, 6vw, 48px)', color: '#10b981', filter: 'drop-shadow(0 0 25px rgba(16,185,129,0.5))' }}>
            QUANTUM CLEAR!
          </h1>
          <div className="level-pill" style={{ background: 'rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.4)', color: '#10b981' }}>
            LEVEL {level} METRIC RESOLVED
          </div>
          <div className="score-big" style={{ fontSize: 'clamp(38px, 8vw, 64px)', color: '#a78bfa' }}>
            +{levelBonus} SECURED
          </div>
          <p style={{ color: '#8888b5', fontSize: '12px' }}>
            ✦ Received 25 Quantum Gems for sector stabilization! ✦
          </p>
          <button className="btn-cyber" onClick={handleNextLevel}>
            NEXT LEVEL →
          </button>
        </div>
      )}

      {/* 5. GAME OVER OVERLAY */}
      {gameState === 'over' && !adActive && (
        <div className="screen" style={{ background: 'rgba(4, 4, 15, 0.96)', zIndex: 100 }}>
          <h2 className="neon-title-secondary" style={{ fontSize: 'clamp(32px, 7vw, 48px)' }}>
            SECTOR LOST
          </h2>
          <div className="score-big" style={{ color: '#ef4444', textShadow: '0 0 20px rgba(239,68,68,0.4)' }}>
            {score}
          </div>
          <div className="score-row">
            <div className="score-item">
              <div className="lbl">LEVEL REACHED</div>
              <div className="val" style={{ color: '#f97316' }}>{level}</div>
            </div>
            <div className="score-item">
              <div className="lbl">HIGH SCORE</div>
              <div className="val" style={{ color: '#8b5cf6' }}>{highScore}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '14px', marginTop: '10px' }}>
            <button className="btn-cyber" onClick={() => handleLaunchGame(level)}>
              RE-LAUNCH
            </button>
            <button className="btn-cyber secondary" onClick={() => setGameState('menu')}>
              COCKPIT
            </button>
          </div>
        </div>
      )}

      {/* 6. ADVANCED SCI-FI AD BREAK OVERLAY */}
      {adActive && (
        <AdOverlay mode={adMode} />
      )}

    </div>
  );
}

export default App;
