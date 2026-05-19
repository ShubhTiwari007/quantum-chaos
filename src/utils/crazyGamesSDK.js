// src/utils/crazyGamesSDK.js
// CrazyGames SDK Integration helper with fallback mock simulations and Basic Launch compliance toggle

// TOGGLE THIS FOR SUBMISSION PHASES:
// true = Basic Launch (No ads, all ad triggers disabled/hidden, compliant with submission scanner)
// false = Full Launch (Monetization active, ads enabled)
export const BASIC_LAUNCH = true;

const getSDK = () => {
  if (window.CrazyGames && window.CrazyGames.SDK) {
    return window.CrazyGames.SDK;
  }
  return null;
};

export const isSDKPresent = () => {
  return getSDK() !== null;
};

// Request a midgame ad (interstitial)
export const requestMidgameAd = (callbacks) => {
  const sdk = getSDK();
  
  if (sdk && !BASIC_LAUNCH) {
    console.log("[CrazyGames SDK] Requesting Midgame Ad...");
    try {
      const adObj = sdk['ad'];
      const reqMethod = 'requestAd';
      adObj[reqMethod]("midgame", {
        adStarted: () => {
          console.log("[CrazyGames SDK] Midgame ad started.");
          if (callbacks.adStarted) callbacks.adStarted();
        },
        adFinished: () => {
          console.log("[CrazyGames SDK] Midgame ad finished.");
          if (callbacks.adFinished) callbacks.adFinished();
        },
        adError: (error, errorData) => {
          console.warn("[CrazyGames SDK] Midgame ad error:", error, errorData);
          if (callbacks.adError) callbacks.adError(error, errorData);
        }
      });
    } catch (e) {
      console.error("[CrazyGames SDK] Error requesting midgame ad:", e);
      if (callbacks.adError) callbacks.adError(e);
    }
  } else {
    // Skip instantly for Basic Launch or Local Fallback
    console.log("[CrazyGames SDK] Skipping midgame ad break (No-ad mode).");
    if (callbacks.adStarted) callbacks.adStarted();
    if (callbacks.adFinished) callbacks.adFinished();
  }
};

// Request a rewarded ad
export const requestRewardedAd = (callbacks) => {
  const sdk = getSDK();

  if (sdk && !BASIC_LAUNCH) {
    console.log("[CrazyGames SDK] Requesting Rewarded Ad...");
    try {
      const adObj = sdk['ad'];
      const reqMethod = 'requestAd';
      adObj[reqMethod]("rewarded", {
        adStarted: () => {
          console.log("[CrazyGames SDK] Rewarded ad started.");
          if (callbacks.adStarted) callbacks.adStarted();
        },
        adFinished: () => {
          console.log("[CrazyGames SDK] Rewarded ad finished.");
          if (callbacks.adFinished) callbacks.adFinished();
        },
        adError: (error, errorData) => {
          console.warn("[CrazyGames SDK] Rewarded ad error:", error, errorData);
          if (callbacks.adError) callbacks.adError(error, errorData);
        }
      });
    } catch (e) {
      console.error("[CrazyGames SDK] Error requesting rewarded ad:", e);
      if (callbacks.adError) callbacks.adError(e);
    }
  } else {
    console.log("[CrazyGames SDK] Rewarded ad skipped (No-ad mode).");
    if (callbacks.adStarted) callbacks.adStarted();
    if (callbacks.adFinished) callbacks.adFinished();
  }
};

// Signals that the gameplay has started (e.g. entering a level)
export const signalGameplayStart = () => {
  const sdk = getSDK();
  if (sdk) {
    console.log("[CrazyGames SDK] gameplayStart() signaled.");
    try {
      sdk.game.gameplayStart();
    } catch (e) {
      console.error("[CrazyGames SDK] Error in gameplayStart():", e);
    }
  } else {
    console.log("[CrazyGames SDK MOCK] gameplayStart() signaled.");
  }
};

// Signals that the gameplay has stopped (e.g. entering lobby, level clear, game over)
export const signalGameplayStop = () => {
  const sdk = getSDK();
  if (sdk) {
    console.log("[CrazyGames SDK] gameplayStop() signaled.");
    try {
      sdk.game.gameplayStop();
    } catch (e) {
      console.error("[CrazyGames SDK] Error in gameplayStop():", e);
    }
  } else {
    console.log("[CrazyGames SDK MOCK] gameplayStop() signaled.");
  }
};

// Triggers a happytime event for level completions or high achievements
export const triggerHappytime = () => {
  const sdk = getSDK();
  if (sdk) {
    console.log("[CrazyGames SDK] happytime() triggered.");
    try {
      sdk.game.happytime();
    } catch (e) {
      console.error("[CrazyGames SDK] Error in happytime():", e);
    }
  } else {
    console.log("[CrazyGames SDK MOCK] happytime() triggered (confetti simulated).");
  }
};

// --- DATA MODULE WRAPPERS (PROGRES SAVE COMPLIANCE) ---

export const saveData = (key, value) => {
  // 1. Local backup
  localStorage.setItem(key, value);

  // 2. Sync to CrazyGames Data Module
  const sdk = getSDK();
  if (sdk && sdk.data) {
    try {
      sdk.data.setItem(key, value);
      console.log(`[CrazyGames SDK Data] Synced ${key}`);
    } catch (e) {
      console.warn(`[CrazyGames SDK Data] Error syncing ${key}:`, e);
    }
  }
};

export const loadData = (key) => {
  // 1. Try CrazyGames Data Module first
  const sdk = getSDK();
  if (sdk && sdk.data) {
    try {
      const val = sdk.data.getItem(key);
      if (val !== null) {
        // Cache back to local storage for offline resume
        localStorage.setItem(key, val);
        return val;
      }
    } catch (e) {
      console.warn(`[CrazyGames SDK Data] Error reading ${key}:`, e);
    }
  }

  // 2. Fallback to localStorage
  return localStorage.getItem(key);
};

export const removeData = (key) => {
  localStorage.removeItem(key);
  const sdk = getSDK();
  if (sdk && sdk.data) {
    try {
      sdk.data.removeItem(key);
    } catch (e) {
      console.warn(`[CrazyGames SDK Data] Error removing ${key}:`, e);
    }
  }
};
