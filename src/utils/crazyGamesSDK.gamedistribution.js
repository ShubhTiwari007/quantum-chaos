// src/utils/crazyGamesSDK.js
// GameDistribution SDK Implementation for Quantum Chaos

export const BASIC_LAUNCH = false;

export const initSDK = (onMuteChange) => {
  console.log("[GameDistribution SDK] initSDK() mock called.");
};

let activeAdCallbacks = null;

export const isSDKPresent = () => {
  return typeof gdsdk !== 'undefined';
};

// Request a midgame ad (interstitial)
export const requestMidgameAd = (callbacks) => {
  if (typeof gdsdk !== 'undefined' && gdsdk.showAd) {
    console.log("[GameDistribution SDK] Requesting Midgame Ad...");
    activeAdCallbacks = {
      onAdStarted: callbacks.adStarted,
      onAdFinished: callbacks.adFinished
    };
    gdsdk.showAd('interstitial')
      .catch((e) => {
        console.warn("[GameDistribution SDK] Midgame ad error or blocked:", e);
        if (callbacks.adFinished) callbacks.adFinished();
        activeAdCallbacks = null;
      });
  } else {
    console.log("[GameDistribution SDK Mock] Skipping midgame ad break.");
    if (callbacks.adStarted) callbacks.adStarted();
    if (callbacks.adFinished) callbacks.adFinished();
  }
};

// Request a rewarded ad
export const requestRewardedAd = (callbacks) => {
  if (typeof gdsdk !== 'undefined' && gdsdk.showAd) {
    console.log("[GameDistribution SDK] Requesting Rewarded Ad...");
    activeAdCallbacks = {
      onAdStarted: callbacks.adStarted,
      onAdFinished: callbacks.adFinished
    };
    gdsdk.showAd('rewarded')
      .catch((e) => {
        console.warn("[GameDistribution SDK] Rewarded ad error or blocked:", e);
        if (callbacks.adFinished) callbacks.adFinished();
        activeAdCallbacks = null;
      });
  } else {
    console.log("[GameDistribution SDK Mock] Rewarded ad skipped.");
    if (callbacks.adStarted) callbacks.adStarted();
    if (callbacks.adFinished) callbacks.adFinished();
  }
};

// Hook up global events to communicate with GD_OPTIONS
if (typeof window !== 'undefined') {
  window.gdsdkCallbacks = {
    onAdStarted: () => {
      console.log("[GameDistribution SDK] Ad started. Pausing game.");
      if (activeAdCallbacks && typeof activeAdCallbacks.onAdStarted === 'function') {
        activeAdCallbacks.onAdStarted();
      }
    },
    onAdFinished: () => {
      console.log("[GameDistribution SDK] Ad finished. Resuming game.");
      if (activeAdCallbacks && typeof activeAdCallbacks.onAdFinished === 'function') {
        activeAdCallbacks.onAdFinished();
      }
      activeAdCallbacks = null;
    }
  };
}

export const signalGameplayStart = () => {
  console.log("[GameDistribution SDK] gameplayStart() signaled.");
};

export const signalGameplayStop = () => {
  console.log("[GameDistribution SDK] gameplayStop() signaled.");
};

export const triggerHappytime = () => {
  console.log("[GameDistribution SDK] happytime() signaled.");
};

export const saveData = (key, value) => {
  try {
    localStorage.setItem(key, value);
    console.log(`[GameDistribution SDK] Saved ${key}`);
  } catch (e) {
    console.warn(`[GameDistribution SDK] Error saving ${key}:`, e);
  }
};

export const loadData = (key) => {
  return localStorage.getItem(key);
};

export const removeData = (key) => {
  localStorage.removeItem(key);
};
