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
        button.style.display =
          visible && button.currentTarget ? "block" : "none";
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
      boxes.forEach((box) => {
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
                const boxId =
                  box.id || `input-${Math.random().toString(36).substr(2, 9)}`;
                if (!box.id) box.id = boxId;

                // Find the associated button
                const associatedButton = img;
                if (
                  associatedButton &&
                  associatedButton.style.display === "block"
                ) {
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
                    const correctedText = await ApiService.fetchFullCorrection(
                      originalText
                    );

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
        transition: "opacity 0.3s ease",
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
  // Return public methods
  return {
    insertSpellCheckButtons,
    setEnabled,
    setIconsVisible,
    refreshSpellCheck,
    isEnabled: () => isEnabled,
    iconsVisible: () => iconsVisible,
  };
})();

// Expose refreshSpellCheck function globally for the customization panel
window.refreshSpellCheck = window.SpellChecker.refreshSpellCheck;
window.insertSpellCheckButton = window.SpellChecker.insertSpellCheckButtons;
window.showNoCorrectionsNeededMessage =
  window.SpellChecker.showNoCorrectionsNeededMessage;
window.spellChecker = window.SpellChecker;

function initializeSpellChecker() {
  // Create spell checker container
  const container = document.createElement('div');
  container.className = 'spell-checker-container';
  document.body.appendChild(container);

  // Add active class to body
  document.body.classList.add('spell-checker-active');

  // Initialize spell checker
  if (window.SpellChecker) {
    window.SpellChecker.setEnabled(true);
  }
}

// Call initialization when document is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeSpellChecker);
} else {
  initializeSpellChecker();
}
