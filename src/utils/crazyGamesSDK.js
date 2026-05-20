// src/utils/crazyGamesSDK.js
// Direct integration layer with official CrazyGames SDK v3.
import { setMute } from './audio';

let sdkInstance = null;

export const BASIC_LAUNCH = false;

export function initSDK(onMuteChange) {
  if (window.CrazyGames && window.CrazyGames.SDK) {
    try {
      sdkInstance = window.CrazyGames.SDK;
      sdkInstance.init();
      console.log("[CrazyGames SDK] Official SDK v3 initialized successfully.");

      // Synchronize initial mute state and listen to configuration updates
      if (sdkInstance.game && typeof sdkInstance.game.addSettingsChangeListener === 'function') {
        sdkInstance.game.addSettingsChangeListener((newSettings) => {
          if (newSettings && typeof newSettings.muteAudio !== 'undefined') {
            console.log(`[CrazyGames SDK] Audio mute setting changed: ${newSettings.muteAudio}`);
            setMute(newSettings.muteAudio);
            if (onMuteChange) {
              onMuteChange(newSettings.muteAudio);
            }
          }
        });
      }
    } catch (err) {
      console.error("[CrazyGames SDK] Failed to initialize official SDK:", err);
    }
  } else {
    console.log("[CrazyGames SDK] SDK script not detected. Running in local standalone/mock mode.");
  }
}

export function requestMidgameAd(callbacks) {
  if (sdkInstance && sdkInstance.ad && !BASIC_LAUNCH) {
    console.log("[CrazyGames SDK] Requesting midgame ad...");
    sdkInstance.ad.requestAd("midgame", {
      adStarted: () => {
        setMute(true);
        if (callbacks && typeof callbacks.adStarted === 'function') callbacks.adStarted();
      },
      adFinished: () => {
        setMute(false);
        if (callbacks && typeof callbacks.adFinished === 'function') callbacks.adFinished();
      },
      adError: (error) => {
        console.warn("[CrazyGames SDK] Midgame ad error:", error);
        setMute(false);
        if (callbacks && typeof callbacks.adFinished === 'function') callbacks.adFinished();
      }
    });
  } else {
    if (callbacks && typeof callbacks.adFinished === 'function') callbacks.adFinished();
  }
}

export function requestRewardedAd(callbacks) {
  if (sdkInstance && sdkInstance.ad && !BASIC_LAUNCH) {
    console.log("[CrazyGames SDK] Requesting rewarded ad...");
    sdkInstance.ad.requestAd("rewarded", {
      adStarted: () => {
        setMute(true);
        if (callbacks && typeof callbacks.adStarted === 'function') callbacks.adStarted();
      },
      adFinished: () => {
        setMute(false);
        if (callbacks && typeof callbacks.adFinished === 'function') callbacks.adFinished();
      },
      adError: (error) => {
        console.warn("[CrazyGames SDK] Rewarded ad error:", error);
        setMute(false);
        if (callbacks && typeof callbacks.adFinished === 'function') callbacks.adFinished();
      }
    });
  } else {
    if (callbacks && typeof callbacks.adFinished === 'function') callbacks.adFinished();
  }
}

export function signalGameplayStart() {
  if (sdkInstance && sdkInstance.game) {
    try {
      sdkInstance.game.gameplayStart();
      console.log("[CrazyGames SDK] gameplayStart() signaled.");
    } catch (err) {
      console.warn("[CrazyGames SDK] Error calling gameplayStart:", err);
    }
  } else {
    console.log("[CrazyGames SDK Mock] gameplayStart() simulated.");
  }
}

export function signalGameplayStop() {
  if (sdkInstance && sdkInstance.game) {
    try {
      sdkInstance.game.gameplayStop();
      console.log("[CrazyGames SDK] gameplayStop() signaled.");
    } catch (err) {
      console.warn("[CrazyGames SDK] Error calling gameplayStop:", err);
    }
  } else {
    console.log("[CrazyGames SDK Mock] gameplayStop() simulated.");
  }
}

export function triggerHappytime() {
  if (sdkInstance && sdkInstance.game) {
    try {
      sdkInstance.game.happytime();
      console.log("[CrazyGames SDK] happytime() signaled.");
    } catch (err) {
      console.warn("[CrazyGames SDK] Error calling happytime:", err);
    }
  } else {
    console.log("[CrazyGames SDK Mock] happytime() simulated.");
  }
}

export function saveData(key, value) {
  try {
    localStorage.setItem(key, value.toString());
  } catch (e) {
    console.warn("Storage save failed:", e);
  }
}

export function loadData(key) {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    return null;
  }
}

export function removeData(key) {
  try {
    localStorage.removeItem(key);
  } catch (e) {}
}
