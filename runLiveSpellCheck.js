 /**
   * Performs live spell checking as user types
   * @param {HTMLElement} box - The input element to check
   * @param {HTMLElement} [button] - Optional button element associated with this box
   */
 async function runLiveSpellCheck(box, button) {
    try {
      if (!window.spellChecker.isEnabled || !box) return;  // Run regardless of icon visibility
  
      const originalText = box.innerText || box.value || "";
      if (!originalText.trim()) {
        // Reset loading state if button exists
        if (button) {
          setButtonLoadingState(button, false);
        }
        return;
      }
  
      // Now get enhanced analysis with different types of issues
      const analysis = await ApiService.fetchEnhancedAnalysis(originalText);
      
      // Reset loading state if button exists
      if (button) {
        setButtonLoadingState(button, false);
      }
      
      if (!analysis) return;
      
      // Apply style-based filtering to the analysis results
      const styledAnalysis = applyStyleFilters(analysis, originalText);
  
      // Only support contenteditable for now
      if (!box.isContentEditable) return;
  
      // Save cursor position
      const offset = DomUtils.getCaretCharacterOffsetWithin(box);
  
      // Replace incorrect words with highlighted spans
      let modifiedHTML = box.innerText;
      const replacements = [];
  
      // Process spelling errors (red underline)
      styledAnalysis.spelling.forEach(({ word, suggestions }) => {
        processReplacement(word, suggestions, "spelling", "#ff6b6b");
      });
  
      // Process grammar errors (green underline)
      styledAnalysis.grammar.forEach(({ word, suggestions }) => {
        processReplacement(word, suggestions, "grammar", "#4caf50");
      });
  
      // Process style issues (blue underline)
      styledAnalysis.style.forEach(({ word, suggestions }) => {
        processReplacement(word, suggestions, "style", "#2196f3");
      });
  
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
      if (box.innerHTML !== modifiedHTML) {
        box.innerHTML = modifiedHTML;
        DomUtils.restoreCursor(box, offset);
  
        // Add event listeners to highlighted words
        replacements.forEach(({ id, original, suggList }) => {
          try {
            const span = box.querySelector(`#${id}`);
            if (span) {
              let hoverTimeout;
              span.addEventListener("mouseenter", () => {
                hoverTimeout = setTimeout(
                  () =>
                    SuggestionDropdown.showSuggestionDropdown(
                      span,
                      original,
                      suggList,
                      box
                    ),
                  300
                );
              });
              span.addEventListener("mouseleave", () =>
                clearTimeout(hoverTimeout)
              );
            }
          } catch (spanError) {
            console.warn("Error setting up span event listeners:", spanError);
          }
        });
      }
    } catch (error) {
      // Reset loading state if button exists
      if (button) {
        setButtonLoadingState(button, false);
      }
      console.error("Error in runLiveSpellCheck:", error);
    }
  }

window.runLiveSpellCheck = runLiveSpellCheck; 