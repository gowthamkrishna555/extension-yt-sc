(function() {
  // Extension state
  let initialized = false;
  
  // Add global styles for highlighting suggestions
  function addGlobalStyles() {
    try {
      const styleEl = document.createElement('style');
      styleEl.textContent = `
        .highlight-suggest:hover {
          background: rgba(255, 255, 150, 0.5) !important;
          box-shadow: 0 0 3px rgba(0,0,0,0.1);
        }
      `;
      document.head.appendChild(styleEl);
    } catch (error) {
      console.error("Error adding global styles:", error);
    }
  }

  // Initialize the extension
  function initialize() {
    if (initialized) return;
    
    try {
      console.log("Smart Spell Checker: Initializing");
      
      // Check if extension is enabled
      chrome.storage.sync.get('enabled', function(data) {
        const isEnabled = data.enabled !== undefined ? data.enabled : true;
        SpellChecker.setEnabled(isEnabled);
        
        addGlobalStyles();
        SpellChecker.insertSpellCheckButtons();
        ObserverUtils.setupMutationObserver();
        
        initialized = true;
      });
      
      // Listen for messages from popup
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'toggleExtension') {
          SpellChecker.setEnabled(message.enabled);
          sendResponse({ success: true });
        }
      });
    } catch (error) {
      console.error("Error initializing extension:", error);
    }
  }

  // Run the extension when DOM is fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();