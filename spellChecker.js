// Modify the SpellChecker module to include both correction UI and live spell checking
window.SpellChecker = (function () {
  // Track if the extension is enabled
  let isEnabled = true;
  
  // Track visibility of spell checker icons
  let iconsVisible = true;
  
  // Track ongoing spell checks
  let activeChecks = new Map();

  /**
   * Set the enabled state of the spell checker
   * @param {boolean} enabled - Whether the spell checker should be enabled
   */
  function setEnabled(enabled) {
    isEnabled = enabled;

    if (!enabled) {
      // Hide all spell check buttons
      document
        .querySelectorAll('[data-spell-button="true"]')
        .forEach((button) => {
          button.style.display = "none";
        });
    }
  }

  /**
   * Set the visibility state of the spell checker icons
   * @param {boolean} visible - Whether the spell checker icons should be visible
   */
  function setIconsVisible(visible) {
    iconsVisible = visible;
    
    // Update visibility of all spell check buttons
    document
      .querySelectorAll('[data-spell-button="true"]')
      .forEach((button) => {
        button.style.display = visible && button.currentTarget ? "block" : "none";
      });
  }

  /**
   * Refreshes spell checking on all text inputs
   * Called when style settings change
   */
  function refreshSpellCheck() {
    try {
      if (!isEnabled) return;
      
      // Find all text inputs with spell checking attached
      const boxes = document.querySelectorAll('[data-spell-attached="true"]');
      
      // Run spell check on each one
      boxes.forEach(box => {
        // Clear any existing timeout to prevent multiple checks
        if (box._spellCheckTimeout) {
          clearTimeout(box._spellCheckTimeout);
        }
        
        // Run spell check immediately
        runLiveSpellCheck(box);
      });
      
      console.log("Spell check refreshed with new style settings");
    } catch (error) {
      console.error("Error refreshing spell check:", error);
    }
  }

  /**
   * Set loading state for spell check button
   * @param {HTMLElement} button - The button element
   * @param {boolean} isLoading - Whether the button should show loading state
   */
  function setButtonLoadingState(button, isLoading) {
    if (!button) return;
    
    if (isLoading) {
      // Store original image source
      if (!button.hasAttribute('data-original-src')) {
        button.setAttribute('data-original-src', button.src);
      }
      
      // Apply loading spinner effect
      button.classList.add('spinner-active');
      
      // Create or update loading spinner
      if (!button.querySelector('.loading-spinner')) {
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        Object.assign(spinner.style, {
          position: 'absolute',
          top: '0',
          left: '0',
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          border: '2px solid rgba(0,0,0,0.1)',
          borderTopColor: '#00a67d',
          animation: 'spell-check-spin 0.8s linear infinite'
        });
        
        // Add animation keyframes if they don't exist
        if (!document.getElementById('spell-check-spinner-style')) {
          const styleSheet = document.createElement('style');
          styleSheet.id = 'spell-check-spinner-style';
          styleSheet.textContent = `
            @keyframes spell-check-spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            .spinner-active {
              opacity: 0.7;
            }
          `;
          document.head.appendChild(styleSheet);
        }
        
        button.appendChild(spinner);
      }
    } else {
      // Remove loading spinner
      button.querySelectorAll('.loading-spinner').forEach(spinner => spinner.remove());
      button.classList.remove('spinner-active');
      
      // Restore original appearance
      if (button.hasAttribute('data-original-src')) {
        button.src = button.getAttribute('data-original-src');
      }
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
          // Use the helper function to get input elements
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

              // Show icon on hover if extension is enabled and icons are visible
              box.addEventListener("mouseenter", () => {
                if (!isEnabled || !iconsVisible) return;
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

              // Run spell check after user stops typing - runs regardless of icon visibility
              let timeout;
              box.addEventListener("input", () => {
                if (!isEnabled) return;
                clearTimeout(timeout);
                
                // Show loading state if the box has a button and is visible
                const boxId = box.id || `input-${Math.random().toString(36).substr(2, 9)}`;
                if (!box.id) box.id = boxId;
                
                // Find the associated button
                const associatedButton = img;
                if (associatedButton && (associatedButton.style.display === "block")) {
                  setButtonLoadingState(associatedButton, true);
                }
                
                // Store timeout reference for potential refresh
                box._spellCheckTimeout = setTimeout(() => {
                  runLiveSpellCheck(box, associatedButton);
                }, 1000);
              });

              // Handle button click to show correction UI instead of auto-applying
              img.onclick = async () => {
                try {
                  if (!isEnabled) return;
                  
                  // Get original text
                  const originalText = box.innerText || box.value || "";
                  if (!originalText.trim()) return;
                  
                  // Show loading state
                  setButtonLoadingState(img, true);
                  
                  try {
                    // Get the corrected version
                    const correctedText = await ApiService.fetchFullCorrection(originalText);
                    
                    // Reset loading state
                    setButtonLoadingState(img, false);
                    
                    // No corrections needed
                    if (!correctedText || correctedText === originalText) {
                      showNoCorrectionsNeededMessage(img);
                      return;
                    }
                    
                    // Show correction UI
                    showCorrectionUI(originalText, correctedText, box, img);
                  } catch (apiError) {
                    // Reset loading state
                    setButtonLoadingState(img, false);
                    console.error("API error:", apiError);
                  }
                  
                } catch (error) {
                  setButtonLoadingState(img, false);
                  console.error("Error showing correction UI:", error);
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
   * Shows a message when no corrections are needed
   * @param {HTMLElement} anchorElement - Element to position the message near
   */
  function showNoCorrectionsNeededMessage(anchorElement) {
    try {
      const message = document.createElement("div");
      message.textContent = "No corrections needed";
      Object.assign(message.style, {
        position: "absolute",
        padding: "8px 12px",
        backgroundColor: "#f0f7ff",
        border: "1px solid #d0e3ff",
        borderRadius: "6px",
        fontSize: "14px",
        color: "#1a73e8",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        zIndex: "10000",
        transition: "opacity 0.3s ease"
      });
      
      const rect = anchorElement.getBoundingClientRect();
      message.style.top = `${window.scrollY + rect.bottom + 5}px`;
      message.style.left = `${window.scrollX + rect.left - 50}px`;
      
      document.body.appendChild(message);
      
      // Auto-remove after 2 seconds
      setTimeout(() => {
        message.style.opacity = "0";
        setTimeout(() => message.remove(), 300);
      }, 2000);
    } catch (error) {
      console.error("Error showing message:", error);
    }
  }
  
  /**
   * Shows the correction UI for the whole text
   * @param {string} originalText - The original text
   * @param {string} correctedText - The corrected text
   * @param {HTMLElement} textElement - The text input element
   * @param {HTMLElement} anchorElement - Element to position the UI near
   */
  function showCorrectionUI(originalText, correctedText, textElement, anchorElement) {
    try {
      // Remove any existing correction UIs
      document.querySelectorAll(".spell-correction-ui")?.forEach(el => el.remove());
      
      const ui = document.createElement("div");
      ui.className = "spell-correction-ui";
      Object.assign(ui.style, {
        position: "absolute",
        background: "#ffffff",
        border: "1px solid #ccc",
        borderRadius: "8px",
        zIndex: "10000",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        maxWidth: "450px",
        minWidth: "300px",
        fontSize: "14px",
        fontFamily: "Arial, sans-serif",
        overflow: "hidden"
      });
      
      // Header section with title and close button
      const header = document.createElement("div");
      Object.assign(header.style, {
        padding: "12px 16px",
        borderBottom: "1px solid #eee",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#f9f9f9"
      });
      
      const headerLeft = document.createElement("div");
      headerLeft.style.display = "flex";
      headerLeft.style.alignItems = "center";
      
      // Color indicator for correctness
      const colorIndicator = document.createElement("span");
      Object.assign(colorIndicator.style, {
        width: "20px",
        height: "20px",
        borderRadius: "50%",
        backgroundColor: "#ff6b6b", // Red for spelling/grammar
        marginRight: "8px",
        display: "inline-block"
      });
      
      // Get active writing style name to display
      let activeStyleName = "Unknown";
      if (window.getActiveStyle && typeof window.getActiveStyle === 'function') {
        const activeStyle = window.getActiveStyle();
        activeStyleName = activeStyle.name || "Default";
      }
      
      const headerText = document.createElement("span");
      headerText.textContent = `Correct your text (${activeStyleName})`;
      headerText.style.fontWeight = "500";
      
      headerLeft.appendChild(colorIndicator);
      headerLeft.appendChild(headerText);
      
      // Close button
      const closeBtn = document.createElement("button");
      closeBtn.innerHTML = "&#10005;"; // X symbol
      Object.assign(closeBtn.style, {
        background: "none",
        border: "none",
        cursor: "pointer",
        fontSize: "16px",
        color: "#666"
      });
      closeBtn.addEventListener("click", () => ui.remove());
      
      header.appendChild(headerLeft);
      header.appendChild(closeBtn);
      ui.appendChild(header);
      
      // Original text section
      const originalSection = document.createElement("div");
      originalSection.textContent = originalText;
      Object.assign(originalSection.style, {
        padding: "12px 16px",
        borderBottom: "1px solid #eee",
        color: "#666",
        textDecoration: "line-through",
        lineHeight: "1.5",
        maxHeight: "100px",
        overflowY: "auto"
      });
      ui.appendChild(originalSection);
      
      // Corrected text section
      const correctedSection = document.createElement("div");
      correctedSection.textContent = correctedText;
      Object.assign(correctedSection.style, {
        padding: "12px 16px",
        lineHeight: "1.5",
        maxHeight: "100px",
        overflowY: "auto",
        color: "#333",
        borderBottom: "1px solid #eee"
      });
      ui.appendChild(correctedSection);
      
      // Action buttons section
      const actionSection = document.createElement("div");
      Object.assign(actionSection.style, {
        padding: "12px 16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#f9f9f9"
      });
      
      // Button group on the left (Accept & Dismiss)
      const buttonGroup = document.createElement("div");
      buttonGroup.style.display = "flex";
      
      // Accept button
      const acceptBtn = document.createElement("button");
      acceptBtn.textContent = "Accept";
      Object.assign(acceptBtn.style, {
        backgroundColor: "#00a67d",
        color: "white",
        border: "none",
        borderRadius: "4px",
        padding: "8px 12px",
        cursor: "pointer",
        marginRight: "8px",
        fontWeight: "500"
      });
      acceptBtn.addEventListener("click", () => {
        // Apply the correction
        if (textElement.isContentEditable) {
          textElement.innerText = correctedText;
        } else {
          textElement.value = correctedText;
        }
        ui.remove();
      });
      
      // Dismiss button
      const dismissBtn = document.createElement("button");
      dismissBtn.textContent = "Dismiss";
      Object.assign(dismissBtn.style, {
        backgroundColor: "transparent",
        color: "#666",
        border: "1px solid #ddd",
        borderRadius: "4px",
        padding: "8px 12px",
        cursor: "pointer"
      });
      dismissBtn.addEventListener("click", () => ui.remove());
      
      buttonGroup.appendChild(acceptBtn);
      buttonGroup.appendChild(dismissBtn);
      
      // Settings button on the right
      const settingsBtn = document.createElement("button");
      settingsBtn.innerHTML = "&#9881;"; // Gear icon
      Object.assign(settingsBtn.style, {
        backgroundColor: "transparent",
        color: "#666",
        border: "1px solid #ddd",
        borderRadius: "4px",
        padding: "8px 12px",
        cursor: "pointer"
      });
      settingsBtn.addEventListener("click", () => {
        // Show settings dropdown/menu
        showSettingsMenu(settingsBtn);
      });
      
      actionSection.appendChild(buttonGroup);
      actionSection.appendChild(settingsBtn);
      ui.appendChild(actionSection);
      
      // Position the UI
      document.body.appendChild(ui);
      positionElement(ui, anchorElement);
      
      // Close when clicking outside
      document.addEventListener("click", function clickOutside(e) {
        if (!ui.contains(e.target) && e.target !== anchorElement) {
          ui.remove();
          document.removeEventListener("click", clickOutside);
        }
      });
    } catch (error) {
      console.error("Error showing correction UI:", error);
    }
  }
  
 /**
 * Shows settings menu
 * @param {HTMLElement} anchorElement - Element to position the menu near
 */
function showSettingsMenu(anchorElement) {
  try {
    // Remove any existing settings menus
    document.querySelectorAll(".spell-settings-menu")?.forEach(el => el.remove());
    
    const menu = document.createElement("div");
    menu.className = "spell-settings-menu";
    Object.assign(menu.style, {
      position: "absolute",
      background: "#ffffff",
      border: "1px solid #ccc",
      borderRadius: "6px",
      zIndex: "10001", // Above correction UI
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      minWidth: "200px",
      fontSize: "14px",
      overflow: "hidden"
    });
    
    // Settings options
    const options = [
      { id: "toggle-enabled", text: "Spell Checker", state: isEnabled },
      { id: "toggle-icons", text: "Spell Check Icons", state: iconsVisible },
      { id: "toggle-live", text: "Live Checking", state: true }, // Assuming live checking is always available
      { id: "customize", text: "Customize checks..." }
    ];
    
    // Get active writing style to display in menu
    let activeStyleName = "Default";
    if (window.getActiveStyle && typeof window.getActiveStyle === 'function') {
      const activeStyle = window.getActiveStyle();
      activeStyleName = activeStyle.name || "Default";
    }
    
    // Add current style info
    const styleInfo = document.createElement("div");
    styleInfo.style.padding = "8px 16px";
    styleInfo.style.backgroundColor = "#f5f5f5";
    styleInfo.style.borderBottom = "1px solid #eee";
    styleInfo.style.fontSize = "12px";
    styleInfo.style.color = "#666";
    styleInfo.textContent = `Current style: ${activeStyleName}`;
    menu.appendChild(styleInfo);
    
    options.forEach(option => {
      const item = document.createElement("div");
      item.style.display = "flex";
      item.style.justifyContent = "space-between";
      item.style.alignItems = "center";
      item.style.padding = "10px 16px";
      item.style.cursor = "pointer";
      item.style.borderBottom = "1px solid #eee";
      
      const label = document.createElement("span");
      label.textContent = option.text;
      
      if (option.id === "customize") {
        // For the customize option, make the entire row clickable
        item.addEventListener("click", () => {
          // Close the menu
          menu.remove();
          
          // Check if customization panel exists
          if (typeof window.openCustomizationPanel === 'function') {
            window.openCustomizationPanel();
          } else {
            console.error("Customization panel function not found");
            alert("Customization panel is not available");
          }
        });
        
        item.appendChild(label);
        menu.appendChild(item);
        return;
      }
      
      const toggle = document.createElement("button");
      toggle.textContent = option.state ? "Yes" : "No";
      toggle.style.backgroundColor = option.state ? "#00a67d" : "#ff6b6b";
      toggle.style.color = "white";
      toggle.style.border = "none";
      toggle.style.borderRadius = "4px";
      toggle.style.padding = "4px 8px";
      toggle.style.cursor = "pointer";
      
      toggle.addEventListener("click", () => {
        switch (option.id) {
          case "toggle-enabled":
            setEnabled(!isEnabled);
            toggle.textContent = !isEnabled ? "No" : "Yes";
            toggle.style.backgroundColor = !isEnabled ? "#ff6b6b" : "#00a67d";
            // If disabled, also disable icons and live checking
            if (!isEnabled) {
              setIconsVisible(false);
              // You may want to add logic to stop live checking if needed
            }
            break;
          case "toggle-icons":
            setIconsVisible(!iconsVisible);
            toggle.textContent = !iconsVisible ? "No" : "Yes";
            toggle.style.backgroundColor = !iconsVisible ? "#ff6b6b" : "#00a67d";
            break;
          case "toggle-live":
            // Toggle live checking logic
            const liveEnabled = !isEnabled; // Live checking should only work if enabled
            if (liveEnabled) {
              // If enabling live checking, ensure it's allowed
              toggle.textContent = "Yes";
              toggle.style.backgroundColor = "#00a67d";
            } else {
              // If disabling live checking, ensure it's not active
              toggle.textContent = "No";
              toggle.style.backgroundColor = "#ff6b6b";
            }
            break;
        }
      });
      
      item.appendChild(label);
      item.appendChild(toggle);
      menu.appendChild(item);
    });
    
    // Position and show menu
    document.body.appendChild(menu);
    
    // Position smartly to ensure visibility
    positionElement(menu, anchorElement);
    
    // Close when clicking outside
    document.addEventListener("click", function clickOutside(e) {
      if (!menu.contains(e.target) && e.target !== anchorElement) {
        menu.remove();
        document.removeEventListener("click", clickOutside);
      }
    });
  } catch (error) {
    console.error("Error showing settings menu:", error);
  }
}
  
  /**
   * Positions an element near an anchor element
   * @param {HTMLElement} element - Element to position
   * @param {HTMLElement} anchor - Anchor element
   */
  function positionElement(element, anchor) {
    try {
      const rect = anchor.getBoundingClientRect();
      
      // Initial positioning
      element.style.top = `${window.scrollY + rect.bottom + 5}px`;
      element.style.left = `${window.scrollX + rect.left - 50}px`;
      
      // First, make sure the element is in the viewport initially to get its dimensions
      ensureElementInViewport(element);
      
      // Now check and adjust to make sure it's fully visible
      function ensureElementInViewport(elem) {
        // Get current dimensions and positions
        const elemRect = elem.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Horizontal adjustment
        if (elemRect.right > viewportWidth) {
          const newLeft = Math.max(10, window.scrollX + viewportWidth - elemRect.width - 10);
          elem.style.left = `${newLeft}px`;
        } else if (elemRect.left < 0) {
          elem.style.left = `${window.scrollX + 10}px`;
        }
        
        // Vertical adjustment - if it doesn't fit below, place it above
        if (elemRect.bottom > viewportHeight) {
          // Check if enough room above the anchor
          if (rect.top > elemRect.height) {
            // Place above the anchor
            elem.style.top = `${window.scrollY + rect.top - elemRect.height - 5}px`;
          } else {
            // Not enough room above either, place at the maximum available space from the top
            elem.style.top = `${window.scrollY + Math.max(10, viewportHeight - elemRect.height - 10)}px`;
            
            // If the element is taller than the viewport, set a max-height and enable scrolling
            if (elemRect.height > viewportHeight - 20) {
              elem.style.maxHeight = `${viewportHeight - 40}px`;
              elem.style.overflowY = 'auto';
            }
          }
        }
      }
    } catch (error) {
      console.error("Error positioning element:", error);
    }
  }

  /**
   * Performs live spell checking as user types
   * @param {HTMLElement} box - The input element to check
   * @param {HTMLElement} [button] - Optional button element associated with this box
   */
  async function runLiveSpellCheck(box, button) {
    try {
      if (!isEnabled || !box) return;  // Run regardless of icon visibility
  
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
  
  /**
   * Applies style-specific filters to analysis results based on active writing style
   * @param {Object} analysis - The original analysis from the API
   * @param {string} text - The original text
   * @returns {Object} - Filtered analysis according to style settings
   */
  function applyStyleFilters(analysis, text) {
    try {
      // Create a copy of the analysis to modify
      const filteredAnalysis = {
        spelling: [...analysis.spelling],
        grammar: [...analysis.grammar],
        style: [...analysis.style]
      };
      
      // Check if style-based corrections function is available from customization.js
      if (window.getStyleBasedCorrections && typeof window.getStyleBasedCorrections === 'function') {
        // Apply style-based filtering to each issue
        
        // Process spelling issues
        filteredAnalysis.spelling = filteredAnalysis.spelling.filter(issue => {
          const styledCorrection = window.getStyleBasedCorrections(text, {
            ...issue,
            type: 'spelling'
          });
          
          // Skip if the style says to ignore this issue
          return !styledCorrection.ignore;
        });
        
        // Process grammar issues
        filteredAnalysis.grammar = filteredAnalysis.grammar.filter(issue => {
          const styledCorrection = window.getStyleBasedCorrections(text, {
            ...issue,
            type: issue.type || 'grammar'  
          });
          
          // Skip if the style says to ignore this issue
          return !styledCorrection.ignore;
        });
        
        // Process style issues
        filteredAnalysis.style = filteredAnalysis.style.filter(issue => {
          const styledCorrection = window.getStyleBasedCorrections(text, {
            ...issue,
            type: issue.type || 'style'
          });
          
          // Skip if the style says to ignore this issue
          return !styledCorrection.ignore;
        });
      }
      
      return filteredAnalysis;
    } catch (error) {
      console.error("Error applying style filters:", error);
      return analysis; // Return original analysis if there's an error
    }
  }

  // Return public methods
  return {
    insertSpellCheckButtons,
    runLiveSpellCheck,
    setEnabled,
    setIconsVisible,
    refreshSpellCheck,
    isEnabled: () => isEnabled,
    iconsVisible: () => iconsVisible
  };
})();

// Expose refreshSpellCheck function globally for the customization panel
window.refreshSpellCheck = window.SpellChecker.refreshSpellCheck;