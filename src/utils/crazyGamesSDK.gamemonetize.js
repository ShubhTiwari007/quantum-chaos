// src/utils/crazyGamesSDK.js
// GameMonetize SDK Implementation for Quantum Chaos

export const BASIC_LAUNCH = false;

let activeAdCallbacks = null;

export const isSDKPresent = () => {
  return typeof sdk !== 'undefined';
};

// Request a midgame ad (interstitial)
export const requestMidgameAd = (callbacks) => {
  if (typeof sdk !== 'undefined' && sdk.showBanner) {
    console.log("[GameMonetize SDK] Requesting Midgame Ad...");
    activeAdCallbacks = {
      onAdStarted: callbacks.adStarted,
      onAdFinished: callbacks.adFinished
    };
    sdk.showBanner();
  } else {
    console.log("[GameMonetize SDK Mock] Skipping midgame ad break.");
    if (callbacks.adStarted) callbacks.adStarted();
    if (callbacks.adFinished) callbacks.adFinished();
  }
};

// Request a rewarded ad
export const requestRewardedAd = (callbacks) => {
  if (typeof sdk !== 'undefined' && sdk.showBanner) {
    console.log("[GameMonetize SDK] Requesting Rewarded Ad...");
    activeAdCallbacks = {
      onAdStarted: callbacks.adStarted,
      onAdFinished: callbacks.adFinished
    };
    sdk.showBanner();
  } else {
    console.log("[GameMonetize SDK Mock] Rewarded ad skipped.");
    if (callbacks.adStarted) callbacks.adStarted();
    if (callbacks.adFinished) callbacks.adFinished();
  }
};

// Hook up global events to communicate with SDK_OPTIONS
if (typeof window !== 'undefined') {
  window.sdkCallbacks = {
    onAdStarted: () => {
      console.log("[GameMonetize SDK] Ad started. Pausing game.");
      if (activeAdCallbacks && typeof activeAdCallbacks.onAdStarted === 'function') {
        activeAdCallbacks.onAdStarted();
      }
    },
    onAdFinished: () => {
      console.log("[GameMonetize SDK] Ad finished. Resuming game.");
      if (activeAdCallbacks && typeof activeAdCallbacks.onAdFinished === 'function') {
        activeAdCallbacks.onAdFinished();
      }
      activeAdCallbacks = null;
    }
  };
}

export const signalGameplayStart = () => {
  console.log("[GameMonetize SDK] gameplayStart() signaled.");
};

export const signalGameplayStop = () => {
  console.log("[GameMonetize SDK] gameplayStop() signaled.");
};

export const triggerHappytime = () => {
  console.log("[GameMonetize SDK] happytime() signaled.");
};

export const saveData = (key, value) => {
  try {
    localStorage.setItem(key, value);
    console.log(`[GameMonetize SDK] Saved ${key}`);
  } catch (e) {
    console.warn(`[GameMonetize SDK] Error saving ${key}:`, e);
  }
};

export const loadData = (key) => {
  return localStorage.getItem(key);
};

export const removeData = (key) => {
  localStorage.removeItem(key);
};
