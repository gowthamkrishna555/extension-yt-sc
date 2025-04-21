function showCorrectionUI(originalText, correctedText, textElement, anchorElement) {
    try {
      // Remove any existing correction UIs
      document.querySelectorAll(".spell-correction-ui")?.forEach(el => el.remove());
      
      const ui = document.createElement("div");
      ui.className = "spell-correction-ui";
      
      // Create header
      const header = document.createElement("div");
      header.className = "header";
      
      const headerLeft = document.createElement("div");
      headerLeft.className = "header-left";
      
      const headerRight = document.createElement("div");
      headerRight.className = "header-right";
      
      // Add color indicator and text to header left
      const colorIndicator = document.createElement("span");
      colorIndicator.className = "color-indicator";
      
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
      
      // Create close button in header right
      const closeBtn = document.createElement("button");
      closeBtn.className = "close-button";
      closeBtn.innerHTML = "&#10005;"; // X symbol
      closeBtn.addEventListener("click", () => ui.remove());
      
      headerRight.appendChild(closeBtn);
      
      header.appendChild(headerLeft);
      header.appendChild(headerRight);
      ui.appendChild(header);
      
      // Original text section
      const originalSection = document.createElement("div");
      originalSection.className = "original-section";
      originalSection.textContent = originalText;
      ui.appendChild(originalSection);
      
      // Corrected text section
      const correctedSection = document.createElement("div");
      correctedSection.className = "corrected-section";
      correctedSection.textContent = correctedText;
      ui.appendChild(correctedSection);
      
      // Action buttons section
      const actionSection = document.createElement("div");
      actionSection.className = "action-section";
      
      // Button group on the left (Accept & Dismiss)
      const buttonGroup = document.createElement("div");
      buttonGroup.className = "button-group";
      
      // Accept button
      const acceptBtn = document.createElement("button");
      acceptBtn.className = "accept-button";
      acceptBtn.textContent = "Accept";
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
      dismissBtn.className = "dismiss-button";
      dismissBtn.textContent = "Dismiss";
      dismissBtn.addEventListener("click", () => ui.remove());
      
      buttonGroup.appendChild(acceptBtn);
      buttonGroup.appendChild(dismissBtn);
      
      // Right side container for settings
      const actionRight = document.createElement("div");
      actionRight.className = "action-right";
      
      // Settings button
      const settingsBtn = document.createElement("button");
      settingsBtn.className = "settings-button";
      settingsBtn.innerHTML = "&#9881;"; // Gear icon
      settingsBtn.addEventListener("click", () => {
        // Show settings dropdown/menu
        showSettingsMenu(settingsBtn);
      });
      
      actionRight.appendChild(settingsBtn);
      actionSection.appendChild(buttonGroup);
      actionSection.appendChild(actionRight);
      ui.appendChild(actionSection);
      
      // Position the UI
      document.body.appendChild(ui);
      const rect = anchorElement.getBoundingClientRect();
      const uiRect = ui.getBoundingClientRect();
      
      // Calculate position to ensure UI stays within viewport
      let top = window.scrollY + rect.bottom + 5;
      let left = window.scrollX + rect.left;
      
      // Adjust horizontal position if UI would go off-screen
      if (left + uiRect.width > window.innerWidth) {
        left = window.innerWidth - uiRect.width - 10;
      }
      
      // Adjust vertical position if UI would go off-screen
      if (top + uiRect.height > window.innerHeight + window.scrollY) {
        top = window.scrollY + rect.top - uiRect.height - 5;
      }
      
      ui.style.top = `${Math.max(window.scrollY + 5, top)}px`;
      ui.style.left = `${Math.max(10, left)}px`;
      
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
  
  window.showCorrectionUI = showCorrectionUI;