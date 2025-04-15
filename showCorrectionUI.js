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
window.showCorrectionUI = showCorrectionUI;