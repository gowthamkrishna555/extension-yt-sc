// Create a namespace for spell checking functionality
window.SpellChecker = (function() {
    // Track if the extension is enabled
    let isEnabled = true;
    
    /**
     * Set the enabled state of the spell checker
     * @param {boolean} enabled - Whether the spell checker should be enabled
     */
    function setEnabled(enabled) {
      isEnabled = enabled;
      
      if (!enabled) {
        // Hide all spell check buttons
        document.querySelectorAll('[data-spell-button="true"]').forEach(button => {
          button.style.display = 'none';
        });
      }
    }
    
    /**
     * Inserts spell check buttons next to text input elements
     */
    function insertSpellCheckButtons() {
      try {
        if (!isEnabled) return;
        
        const docs = DomUtils.getAllDocuments();
  
        for (const doc of docs) {
          try {
            // Use the new helper function to get input elements
            const boxes = DomUtils.getTextInputElements(doc);
  
            boxes.forEach((box) => {
              try {
                // Skip if already processed
                if (box.getAttribute("data-spell-attached")) return;
  
                // Create spell check button
                const img = doc.createElement("img");
                img.src = chrome.runtime.getURL("icon.png");
                img.title = "Click to apply corrections";
                img.alt = "Spell check";
                img.setAttribute("data-spell-button", "true");
  
                // Style the button
                Object.assign(img.style, {
                  position: "absolute",
                  width: "22px",
                  height: "22px",
                  cursor: "pointer",
                  zIndex: "9999",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  backgroundColor: "#fff",
                  padding: "2px",
                  boxShadow: "0 0 3px rgba(0,0,0,0.1)",
                  opacity: "0.9",
                  display: "none",
                });
  
                doc.body.appendChild(img);
  
                // Update icon position relative to input box
                const updateIconPosition = () => {
                  try {
                    const rect = box.getBoundingClientRect();
                    img.style.top = `${window.scrollY + rect.top + 5}px`;
                    img.style.left = `${window.scrollX + rect.right - 30}px`;
                  } catch (error) {
                    console.warn("Error updating icon position:", error);
                  }
                };
  
                // Show icon on hover if extension is enabled
                box.addEventListener("mouseenter", () => {
                  if (!isEnabled) return;
                  updateIconPosition();
                  img.style.display = "block";
                  img.currentTarget = box;
                });
  
                // Hide icon when mouse leaves (with delay)
                box.addEventListener("mouseleave", () => {
                  setTimeout(() => {
                    try {
                      if (!img.matches(":hover")) img.style.display = "none";
                    } catch (error) {
                      console.warn("Error in mouseleave handler:", error);
                    }
                  }, 200);
                });
  
                img.addEventListener("mouseleave", () => {
                  img.style.display = "none";
                });
  
                // Run spell check after user stops typing
                let timeout;
                box.addEventListener("input", () => {
                  if (!isEnabled) return;
                  clearTimeout(timeout);
                  timeout = setTimeout(() => runLiveSpellCheck(box), 1000);
                });
  
                // Handle button click to apply full correction
                img.onclick = async () => {
                  try {
                    if (!isEnabled) return;
                    
                    const originalText = box.innerText || box.value || "";
                    const corrected = await ApiService.fetchFullCorrection(originalText);
                    
                    if (corrected) {
                      if (box.isContentEditable) {
                        box.innerText = corrected;
                      } else {
                        box.value = corrected;
                      }
                    }
                  } catch (error) {
                    console.error("Error applying corrections:", error);
                  }
                };
  
                // Mark as processed
                box.setAttribute("data-spell-attached", "true");
              } catch (boxError) {
                console.warn("Error processing input box:", boxError);
              }
            });
          } catch (docError) {
            console.warn("Error processing document:", docError);
          }
        }
      } catch (error) {
        console.error("Error in insertSpellCheckButtons:", error);
      }
    }
  
    /**
     * Performs live spell checking as user types
     * @param {HTMLElement} box - The input element to check
     */
    async function runLiveSpellCheck(box) {
      try {
        if (!isEnabled || !box) return;
        
        const originalText = box.innerText || box.value || "";
        if (!originalText.trim()) return;
  
        const suggestions = await ApiService.fetchSuggestions(originalText);
        if (!suggestions || suggestions.length === 0) return;
  
        // Only support contenteditable for now
        if (!box.isContentEditable) return; 
  
        // Save cursor position
        const offset = DomUtils.getCaretCharacterOffsetWithin(box);
  
        // Replace incorrect words with highlighted spans
        let modifiedHTML = box.innerText;
        const replacements = [];
  
        suggestions.forEach(({ word, suggestions: suggList }) => {
          if (!word || !Array.isArray(suggList)) return;
          
          try {
            const regex = new RegExp(`\\b(${word})\\b`, "gi");
            modifiedHTML = modifiedHTML.replace(regex, (match) => {
              const id = `sugg-${Math.random().toString(36).substr(2, 9)}`;
              replacements.push({ id, original: match, suggList });
              return `<span id="${id}" class="highlight-suggest" style="background: rgba(255, 255, 0, 0.3); cursor: pointer; border-bottom: 1px dashed #ff6b6b; padding: 0 2px; border-radius: 2px; transition: background 0.2s ease;">${match}</span>`;
            });
          } catch (regexError) {
            console.warn("Error with regex replacement:", regexError);
          }
        });
  
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
                    () => SuggestionDropdown.showSuggestionDropdown(span, original, suggList, box),
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
  
    // Return public methods
    return {
      insertSpellCheckButtons,
      runLiveSpellCheck,
      setEnabled
    };
  })();