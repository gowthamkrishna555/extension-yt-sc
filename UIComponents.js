// ui-components.js - UI components for the spell checker

window.UIComponents = (function() {
    // Utility for positioning elements
    function positionElement(element, anchor) {
      try {
        const rect = anchor.getBoundingClientRect();
        element.style.top = `${window.scrollY + rect.bottom + 5}px`;
        element.style.left = `${window.scrollX + rect.left - 50}px`;
        
        // Ensure element is fully visible in viewport
        setTimeout(() => {
          const elemRect = element.getBoundingClientRect();
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          
          // Adjust horizontal position if needed
          if (elemRect.right > viewportWidth) {
            element.style.left = `${window.scrollX + viewportWidth - elemRect.width - 10}px`;
          }
          
          // Adjust vertical position if needed
          if (elemRect.bottom > viewportHeight) {
            element.style.top = `${window.scrollY + rect.top - elemRect.height - 5}px`;
          }
        }, 0);
      } catch (error) {
        console.error("Error positioning element:", error);
      }
    }
    
    // SuggestionDropdown Component
    const SuggestionDropdown = {
      /**
       * Show suggestion dropdown for a highlighted word
       * @param {HTMLElement} spanElement - The span containing the highlighted word
       * @param {string} original - Original text
       * @param {Array} suggestions - List of suggestions
       * @param {HTMLElement} targetElement - The element to apply corrections to
       * @param {string} type - Type of suggestion (spelling, grammar, style)
       */
      showSuggestionDropdown(spanElement, original, suggestions, targetElement, type) {
        try {
          // Remove any existing dropdowns
          document.querySelectorAll('.spell-suggestion-dropdown').forEach(el => el.remove());
          
          if (!Array.isArray(suggestions) || !suggestions.length) return;
          
          const dropdown = document.createElement('div');
          dropdown.className = 'spell-suggestion-dropdown';
          Object.assign(dropdown.style, {
            position: 'absolute',
            background: '#ffffff',
            border: '1px solid #ddd',
            borderRadius: '6px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: '10000',
            minWidth: '180px',
            maxWidth: '300px',
            fontSize: '14px',
            overflow: 'hidden'
          });
          
          // Header with type indicator
          const header = document.createElement('div');
          Object.assign(header.style, {
            padding: '8px 12px',
            borderBottom: '1px solid #eee',
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#f9f9f9',
            fontSize: '13px',
            color: '#666'
          });
          
          // Color indicator based on type
          const typeColors = {
            spelling: '#ff6b6b',
            grammar: '#4caf50',
            style: '#2196f3'
          };
          
          const typeLabels = {
            spelling: 'Spelling',
            grammar: 'Grammar',
            style: 'Style'
          };
          
          const colorIndicator = document.createElement('span');
          Object.assign(colorIndicator.style, {
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: typeColors[type] || '#666',
            marginRight: '6px',
            display: 'inline-block'
          });
          
          header.appendChild(colorIndicator);
          header.appendChild(document.createTextNode(typeLabels[type] || 'Suggestion'));
          dropdown.appendChild(header);
          
          // Create suggestions list
          suggestions.slice(0, 5).forEach((suggestion, index) => {
            const item = document.createElement('div');
            item.textContent = suggestion;
            Object.assign(item.style, {
              padding: '8px 12px',
              cursor: 'pointer',
              borderBottom: index < suggestions.length - 1 ? '1px solid #f0f0f0' : 'none'
            });
            
            item.addEventListener('mouseenter', () => {
              item.style.backgroundColor = '#f5f5f5';
            });
            
            item.addEventListener('mouseleave', () => {
              item.style.backgroundColor = 'transparent';
            });
            
            item.addEventListener('click', () => {
              this.applySuggestion(spanElement, suggestion, targetElement);
              dropdown.remove();
            });
            
            dropdown.appendChild(item);
          });
          
          // Add options at the bottom
          const footer = document.createElement('div');
          Object.assign(footer.style, {
            display: 'flex',
            borderTop: '1px solid #eee',
            backgroundColor: '#f9f9f9'
          });
          
          // Add to dictionary option for spelling errors
          if (type === 'spelling') {
            const addToDictBtn = document.createElement('div');
            addToDictBtn.textContent = 'Add to dictionary';
            Object.assign(addToDictBtn.style, {
              padding: '8px 12px',
              fontSize: '13px',
              color: '#1a73e8',
              cursor: 'pointer',
              flex: '1',
              textAlign: 'center'
            });
            
            addToDictBtn.addEventListener('mouseenter', () => {
              addToDictBtn.style.backgroundColor = '#f0f0f0';
            });
            
            addToDictBtn.addEventListener('mouseleave', () => {
              addToDictBtn.style.backgroundColor = 'transparent';
            });
            
            addToDictBtn.addEventListener('click', async () => {
              await SpellCheckerSettings.addToCustomDictionary(original);
              // Remove highlighting
              this.removeHighlighting(spanElement, targetElement);
              dropdown.remove();
            });
            
            footer.appendChild(addToDictBtn);
          }
          
          // Ignore option
          const ignoreBtn = document.createElement('div');
          ignoreBtn.textContent = 'Ignore';
          Object.assign(ignoreBtn.style, {
            padding: '8px 12px',
            fontSize: '13px',
            color: '#666',
            cursor: 'pointer',
            flex: '1',
            textAlign: 'center',
            borderLeft: type === 'spelling' ? '1px solid #eee' : 'none'
          });
          
          ignoreBtn.addEventListener('mouseenter', () => {
            ignoreBtn.style.backgroundColor = '#f0f0f0';
          });
          
          ignoreBtn.addEventListener('mouseleave', () => {
            ignoreBtn.style.backgroundColor = 'transparent';
          });
          
          ignoreBtn.addEventListener('click', () => {
            this.removeHighlighting(spanElement, targetElement);
            dropdown.remove();
          });
          
          footer.appendChild(ignoreBtn);
          dropdown.appendChild(footer);
          
          // Position and show dropdown
          document.body.appendChild(dropdown);
          positionElement(dropdown, spanElement);
          
          // Close when clicking outside
          document.addEventListener('click', function clickOutside(e) {
            if (!dropdown.contains(e.target) && !spanElement.contains(e.target)) {
              dropdown.remove();
              document.removeEventListener('click', clickOutside);
            }
          });
        } catch (error) {
          console.error("Error showing suggestion dropdown:", error);
        }
      },
      
      /**
       * Apply a suggestion to the text
       * @param {HTMLElement} spanElement - The highlighted span
       * @param {string} suggestion - The suggestion to apply
       * @param {HTMLElement} targetElement - The element containing the text
       */
      applySuggestion(spanElement, suggestion, targetElement) {
        try {
          if (!spanElement || !targetElement) return;
          
          // Save cursor position
          const offset = DomUtils.getCaretCharacterOffsetWithin(targetElement);
          
          // Replace the content of the span with the suggestion
          spanElement.textContent = suggestion;
          
          // Remove highlighting styling
          spanElement.style.borderBottom = 'none';
          spanElement.style.cursor = 'text';
          
          // Store original class for reference
          const originalClass = spanElement.className;
          
          // Schedule removal of the span element (unwrapping it)
          setTimeout(() => {
            if (targetElement.contains(spanElement)) {
              // Create text node with the suggestion
              const textNode = document.createTextNode(suggestion);
              // Replace the span with the text node
              spanElement.parentNode.replaceChild(textNode, spanElement);
              // Restore cursor position
              DomUtils.restoreCursor(targetElement, offset);
            }
          }, 100);
        } catch (error) {
          console.error("Error applying suggestion:", error);
        }
      },
      
      /**
       * Remove highlighting from a span
       * @param {HTMLElement} spanElement - The highlighted span
       * @param {HTMLElement} targetElement - The element containing the text
       */
      removeHighlighting(spanElement, targetElement) {
        try {
          if (!spanElement || !targetElement) return;
          
          // Save cursor position
          const offset = DomUtils.getCaretCharacterOffsetWithin(targetElement);
          
          // Get the original text
          const originalText = spanElement.textContent;
          
          // Create text node with the original text
          const textNode = document.createTextNode(originalText);
          
          // Replace the span with the text node
          if (spanElement.parentNode) {
            spanElement.parentNode.replaceChild(textNode, spanElement);
            
            // Restore cursor position
            DomUtils.restoreCursor(targetElement, offset);
          }
        } catch (error) {
          console.error("Error removing highlighting:", error);
        }
      }
    };
    
    // Notification Component
    const Notification = {
      /**
       * Shows a temporary notification message
       * @param {string} message - The message to display
       * @param {HTMLElement} anchorElement - Element to position near (optional)
       * @param {string} type - Notification type (info, success, warning, error)
       * @param {number} duration - How long to show the notification in ms
       */
      show(message, anchorElement = null, type = 'info', duration = 2000) {
        try {
          const notification = document.createElement("div");
          notification.textContent = message;
          
          // Define colors based on type
          const colors = {
            info: { bg: '#f0f7ff', border: '#d0e3ff', text: '#1a73e8' },
            success: { bg: '#e6f4ea', border: '#ceead6', text: '#1e8e3e' },
            warning: { bg: '#fef7e0', border: '#feefc3', text: '#b06000' },
            error: { bg: '#fce8e6', border: '#fadbd9', text: '#c5221f' }
          };
          
          const color = colors[type] || colors.info;
          
          Object.assign(notification.style, {
            position: "absolute",
            padding: "8px 12px",
            backgroundColor: color.bg,
            border: `1px solid ${color.border}`,
            borderRadius: "6px",
            fontSize: "14px",
            color: color.text,
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            zIndex: "10000",
            transition: "opacity 0.3s ease"
          });
          
          if (anchorElement) {
            const rect = anchorElement.getBoundingClientRect();
            notification.style.top = `${window.scrollY + rect.bottom + 5}px`;
            notification.style.left = `${window.scrollX + rect.left - 50}px`;
          } else {
            // Position in the bottom right if no anchor
            notification.style.bottom = "20px";
            notification.style.right = "20px";
          }
          
          document.body.appendChild(notification);
          
          // Auto-remove after duration
          setTimeout(() => {
            notification.style.opacity = "0";
            setTimeout(() => notification.remove(), 300);
          }, duration);
          
          return notification;
        } catch (error) {
          console.error("Error showing notification:", error);
        }
      }
    };
    
    // Correction UI Component
    const CorrectionUI = {
      /**
       * Shows the correction UI for the whole text
       * @param {string} originalText - The original text
       * @param {string} correctedText - The corrected text
       * @param {HTMLElement} textElement - The text input element
       * @param {HTMLElement} anchorElement - Element to position the UI near
       */
      show(originalText, correctedText, textElement, anchorElement) {
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
          
          const headerText = document.createElement("span");
          headerText.textContent = "Correct your text";
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
            SettingsMenu.show(settingsBtn);
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
    };
    
    // Settings Menu Component
    const SettingsMenu = {
      /**
       * Shows settings menu
       * @param {HTMLElement} anchorElement - Element to position the menu near
       */
      show(anchorElement) {
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
          
          // Get current settings
          const isEnabled = SpellCheckerSettings.getSetting('enabled');
          const iconsVisible = SpellCheckerSettings.getSetting('iconsVisible');
          const liveCheckingEnabled = SpellCheckerSettings.getSetting('liveCheckingEnabled');
          
          // Settings options
          const options = [
            { id: "toggle-enabled", text: isEnabled ? "Disable spell checker" : "Enable spell checker" },
            { id: "toggle-icons", text: iconsVisible ? "Hide spell check icons" : "Show spell check icons" },
            { id: "toggle-live", text: liveCheckingEnabled ? "Disable live checking" : "Enable live checking" },
            { id: "customize", text: "Customize checks..." }
          ];
          
          options.forEach(option => {
            const item = document.createElement("div");
            item.textContent = option.text;
            Object.assign(item.style, {
              padding: "10px 16px",
              cursor: "pointer",
              borderBottom: "1px solid #eee"
            });
            
            item.addEventListener("mouseenter", () => {
              item.style.backgroundColor = "#f5f5f5";
            });
            
            item.addEventListener("mouseleave", () => {
              item.style.backgroundColor = "transparent";
            });
            
            item.addEventListener("click", async () => {
              // Handle setting option click
              switch (option.id) {
                case "toggle-enabled":
                  await SpellCheckerSettings.updateSetting('enabled', !isEnabled);
                  window.SpellChecker.setEnabled(!isEnabled); // Call to main module
                  break;
                case "toggle-icons":
                  await SpellCheckerSettings.updateSetting('iconsVisible', !iconsVisible);
                  window.SpellChecker.setIconsVisible(!iconsVisible); // Call to main module
                  break;
                case "toggle-live":
                  await SpellCheckerSettings.updateSetting('liveCheckingEnabled', !liveCheckingEnabled);
                  window.LiveSpellChecker.setLiveCheckingEnabled(!liveCheckingEnabled);
                  break;
                case "customize":
                  menu.remove();
                  window.CustomizationUI.showCustomizationPanel();
                  return;
              }
              
              // Show feedback
              Notification.show(
                `${option.text.replace('Disable', 'Disabled').replace('Enable', 'Enabled')}`, 
                anchorElement, 
                'success'
              );
              
              menu.remove();
            });
            
            menu.appendChild(item);
          });
          
          // Position and show menu
          document.body.appendChild(menu);
          const rect = anchorElement.getBoundingClientRect();
          menu.style.top = `${window.scrollY + rect.bottom + 5}px`;
          menu.style.left = `${window.scrollX + rect.left - menu.offsetWidth + rect.width}px`;
          
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
    };
    
    // Export public interfaces
    return {
      positionElement,
      SuggestionDropdown,
      Notification,
      CorrectionUI,
      SettingsMenu
    };
  })();