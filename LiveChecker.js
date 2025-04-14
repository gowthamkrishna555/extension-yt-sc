// live-checker.js - Handles live spell checking functionality

window.LiveSpellChecker = (function() {
    // Keep track of active check timeouts
    const timeouts = new Map();
  
    /**
     * Run live spell check on an element
     * @param {HTMLElement} element - The element to check
     * @param {number} delay - Delay in ms before checking after user stops typing
     */
    function registerElement(element, delay = 1000) {
      if (!element) return;
      
      // Cancel previous listener if it exists
      unregisterElement(element);
      
      // Add input listener
      const inputHandler = () => {
        if (!SpellCheckerSettings.getSetting('enabled') || 
            !SpellCheckerSettings.getSetting('liveCheckingEnabled')) {
          return;
        }
        
        // Clear previous timeout
        if (timeouts.has(element)) {
          clearTimeout(timeouts.get(element));
        }
        
        // Set new timeout
        const timeoutId = setTimeout(() => runCheck(element), delay);
        timeouts.set(element, timeoutId);
      };
      
      // Store the handler reference for later removal
      element._liveCheckHandler = inputHandler;
      element.addEventListener('input', inputHandler);
      
      // Set data attribute for tracking
      element.setAttribute('data-live-check-registered', 'true');
    }
    
    /**
     * Remove spell check from an element
     * @param {HTMLElement} element - The element to unregister
     */
    function unregisterElement(element) {
      if (!element) return;
      
      // Clear any pending timeout
      if (timeouts.has(element)) {
        clearTimeout(timeouts.get(element));
        timeouts.delete(element);
      }
      
      // Remove event listener if it exists
      if (element._liveCheckHandler) {
        element.removeEventListener('input', element._liveCheckHandler);
        delete element._liveCheckHandler;
      }
      
      // Remove data attribute
      element.removeAttribute('data-live-check-registered');
    }
    
    /**
     * Perform actual spell check on an element
     * @param {HTMLElement} element - The element to check
     */
    async function runCheck(element) {
      try {
        if (!element || !SpellCheckerSettings.getSetting('enabled') || 
            !SpellCheckerSettings.getSetting('liveCheckingEnabled')) {
          return;
        }
        
        const originalText = element.innerText || element.value || "";
        if (!originalText.trim()) return;
        
        // Get settings to know which checks to perform
        const settings = SpellCheckerSettings.getAllSettings();
        
        // Request analysis based on enabled checks
        const analysisOptions = {
          checkSpelling: settings.checkSpelling,
          checkGrammar: settings.checkGrammar,
          checkStyle: settings.checkStyle,
          ignoreUppercase: settings.ignoreUppercase,
          customDictionary: settings.customDictionary
        };
        
        // Now get enhanced analysis with different types of issues
        const analysis = await ApiService.fetchEnhancedAnalysis(originalText, analysisOptions);
        if (!analysis) return;
        
        // Only support contenteditable for now (can be extended later)
        if (!element.isContentEditable) return;
        
        // Save cursor position
        const offset = DomUtils.getCaretCharacterOffsetWithin(element);
        
        // Replace incorrect words with highlighted spans
        let modifiedHTML = element.innerText;
        const replacements = [];
        
        // Process issues based on enabled settings
        if (settings.checkSpelling && analysis.spelling) {
          // Process spelling errors (red underline)
          analysis.spelling.forEach(({ word, suggestions }) => {
            processReplacement(word, suggestions, "spelling", "#ff6b6b");
          });
        }
        
        if (settings.checkGrammar && analysis.grammar) {
          // Process grammar errors (green underline)
          analysis.grammar.forEach(({ word, suggestions }) => {
            processReplacement(word, suggestions, "grammar", "#4caf50");
          });
        }
        
        if (settings.checkStyle && analysis.style) {
          // Process style issues (blue underline)
          analysis.style.forEach(({ word, suggestions }) => {
            processReplacement(word, suggestions, "style", "#2196f3");
          });
        }
        
        function processReplacement(word, suggList, type, color) {
          if (!word || !Array.isArray(suggList)) return;
          
          try {
            const regex = new RegExp(`\\b(${word})\\b`, "gi");
            modifiedHTML = modifiedHTML.replace(regex, (match) => {
              const id = `sugg-${Math.random().toString(36).substr(2, 9)}`;
              replacements.push({ id, original: match, suggList, type });
              return `<span id="${id}" class="highlight-suggest" data-type="${type}" style="border-bottom: 2px dotted ${color}; cursor: pointer; padding: 0 2px; border-radius: 2px; transition: background 0.2s ease;">${match}</span>`;
            });
          } catch (regexError) {
            console.warn("Error with regex replacement:", regexError);
          }
        }
        
        // Avoid replacing with same innerHTML (avoid blinking)
        if (element.innerHTML !== modifiedHTML) {
          element.innerHTML = modifiedHTML;
          DomUtils.restoreCursor(element, offset);
          
          // Add event listeners to highlighted words
          replacements.forEach(({ id, original, suggList, type }) => {
            try {
              const span = element.querySelector(`#${id}`);
              if (span) {
                let hoverTimeout;
                span.addEventListener("mouseenter", () => {
                  hoverTimeout = setTimeout(
                    () => UIComponents.SuggestionDropdown.showSuggestionDropdown(
                      span,
                      original,
                      suggList,
                      element,
                      type
                    ),
                    300
                  );
                });
                span.addEventListener("mouseleave", () => clearTimeout(hoverTimeout));
              }
            } catch (spanError) {
              console.warn("Error setting up span event listeners:", spanError);
            }
          });
        }
      } catch (error) {
        console.error("Error in runLiveSpellCheck:", error);
      }
    }
    
    /**
     * Update all registered elements based on current settings
     */
    function refreshAllElements() {
      document.querySelectorAll('[data-live-check-registered="true"]').forEach(element => {
        if (SpellCheckerSettings.getSetting('liveCheckingEnabled')) {
          runCheck(element);
        }
      });
    }
    
    /**
     * Enable or disable live checking globally
     * @param {boolean} enabled - Whether live checking should be enabled
     */
    async function setLiveCheckingEnabled(enabled) {
      await SpellCheckerSettings.updateSetting('liveCheckingEnabled', enabled);
      
      if (enabled) {
        // Refresh all registered elements
        refreshAllElements();
      } else {
        // Clean up any highlighting on registered elements
        document.querySelectorAll('[data-live-check-registered="true"]').forEach(element => {
          if (element.isContentEditable && element.innerHTML) {
            // Save cursor position
            const offset = DomUtils.getCaretCharacterOffsetWithin(element);
            
            // Remove all highlight spans
            const cleanText = element.innerText;
            element.innerHTML = cleanText;
            
            // Restore cursor
            DomUtils.restoreCursor(element, offset);
          }
        });
      }
    }
    
    // Public API
    return {
      registerElement,
      unregisterElement,
      runCheck,
      refreshAllElements,
      setLiveCheckingEnabled
    };
  })();