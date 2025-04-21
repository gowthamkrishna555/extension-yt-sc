// settings-manager.js - Manages spell checker settings and their persistence

window.SpellCheckerSettings = (function() {
    // Default settings
    const DEFAULT_SETTINGS = {
      enabled: true,
      iconsVisible: true,
      liveCheckingEnabled: true,
      checkSpelling: true,
      checkGrammar: true,
      checkStyle: true,
      autoCorrectCommon: false,
      ignoreUppercase: true,
      customDictionary: []
    };
    
    // Current settings (initialized with defaults and then potentially overridden from storage)
    let currentSettings = { ...DEFAULT_SETTINGS };
    
    /**
     * Initialize settings from storage
     * @returns {Promise} Promise that resolves when settings are loaded
     */
    async function initSettings() {
      try {
        // Try to load settings from chrome.storage
        if (chrome.storage && chrome.storage.sync) {
          const storedSettings = await new Promise(resolve => {
            chrome.storage.sync.get('spellCheckerSettings', (result) => {
              resolve(result.spellCheckerSettings || {});
            });
          });
          
          // Merge stored settings with defaults (preserving defaults for any missing settings)
          currentSettings = { ...DEFAULT_SETTINGS, ...storedSettings };
        }
        return currentSettings;
      } catch (error) {
        console.error("Error initializing settings:", error);
        return DEFAULT_SETTINGS;
      }
    }
    
    /**
     * Save settings to storage
     * @returns {Promise} Promise that resolves when settings are saved
     */
    async function saveSettings() {
      try {
        if (chrome.storage && chrome.storage.sync) {
          await new Promise(resolve => {
            chrome.storage.sync.set({ 'spellCheckerSettings': currentSettings }, resolve);
          });
        }
        return true;
      } catch (error) {
        console.error("Error saving settings:", error);
        return false;
      }
    }
    
    /**
     * Update a single setting
     * @param {string} key - The setting key
     * @param {any} value - The setting value
     * @returns {Promise} Promise that resolves when setting is updated and saved
     */
    async function updateSetting(key, value) {
      if (key in currentSettings) {
        currentSettings[key] = value;
        return await saveSettings();
      }
      return false;
    }
    
    /**
     * Update multiple settings at once
     * @param {Object} settings - Object containing setting key/value pairs
     * @returns {Promise} Promise that resolves when settings are updated and saved
     */
    async function updateSettings(settings) {
      Object.keys(settings).forEach(key => {
        if (key in currentSettings) {
          currentSettings[key] = settings[key];
        }
      });
      return await saveSettings();
    }
    
    /**
     * Reset settings to defaults
     * @returns {Promise} Promise that resolves when settings are reset and saved
     */
    async function resetSettings() {
      currentSettings = { ...DEFAULT_SETTINGS };
      return await saveSettings();
    }
    
    /**
     * Get the current value of a setting
     * @param {string} key - The setting key
     * @returns {any} The setting value
     */
    function getSetting(key) {
      return currentSettings[key];
    }
    
    /**
     * Get all current settings
     * @returns {Object} All current settings
     */
    function getAllSettings() {
      return { ...currentSettings };
    }
    
    /**
     * Add a word to the custom dictionary
     * @param {string} word - Word to add
     * @returns {Promise} Promise that resolves when word is added and settings are saved
     */
    async function addToCustomDictionary(word) {
      if (word && typeof word === 'string') {
        const normalizedWord = word.trim().toLowerCase();
        if (!currentSettings.customDictionary.includes(normalizedWord)) {
          currentSettings.customDictionary.push(normalizedWord);
          return await saveSettings();
        }
      }
      return false;
    }
    
    /**
     * Remove a word from the custom dictionary
     * @param {string} word - Word to remove
     * @returns {Promise} Promise that resolves when word is removed and settings are saved
     */
    async function removeFromCustomDictionary(word) {
      if (word && typeof word === 'string') {
        const normalizedWord = word.trim().toLowerCase();
        const index = currentSettings.customDictionary.indexOf(normalizedWord);
        if (index !== -1) {
          currentSettings.customDictionary.splice(index, 1);
          return await saveSettings();
        }
      }
      return false;
    }
    
    // Initialize settings when this module loads
    initSettings();
    
    // Public API
    return {
      initSettings,
      getSetting,
      getAllSettings,
      updateSetting,
      updateSettings,
      resetSettings,
      addToCustomDictionary,
      removeFromCustomDictionary
    };
  })();