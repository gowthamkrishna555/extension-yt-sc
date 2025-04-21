function showGrammarSuggestionDropdown(originalText, targetElement, suggestion) {
    try {
      // Remove any existing suggestion dropdowns
      document.querySelectorAll('.grammar-suggestion-dropdown').forEach(el => el.remove());
      
      const dropdown = document.createElement("div");
      dropdown.className = "grammar-suggestion-dropdown";
      Object.assign(dropdown.style, {
        position: "absolute",
        background: "#ffffff",
        border: "1px solid #ccc",
        borderRadius: "8px",
        zIndex: "10000",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        minWidth: "200px",
        maxWidth: "300px",
        fontSize: "14px",
        fontFamily: "Arial, sans-serif",
        overflow: "hidden"
      });
      
      // Header for suggestion type
      const header = document.createElement("div");
      Object.assign(header.style, {
        padding: "10px 16px",
        borderBottom: "1px solid #eee",
        color: "#666",
        fontSize: "13px"
      });
      header.textContent = suggestion.type || "Correct article usage";
      dropdown.appendChild(header);
      
      // Suggestion content
      const suggestionContent = document.createElement("div");
      Object.assign(suggestionContent.style, {
        padding: "10px 16px",
        display: "flex",
        alignItems: "center",
        cursor: "pointer",
        transition: "background-color 0.2s",
        fontWeight: "500",
        color: "#4285f4"
      });
      
      // Highlight the actual change
      suggestionContent.innerHTML = suggestion.correction || `<span>the</span> capital`;
      
      // Add hover effect
      suggestionContent.addEventListener("mouseenter", () => {
        suggestionContent.style.backgroundColor = "#f5f9ff";
      });
      suggestionContent.addEventListener("mouseleave", () => {
        suggestionContent.style.backgroundColor = "transparent";
      });
      
      // Apply the suggestion when clicked
      suggestionContent.addEventListener("click", () => {
        applyGrammarSuggestion(targetElement, suggestion.correction || "the capital");
        dropdown.remove();
      });
      
      dropdown.appendChild(suggestionContent);
      
      // Action buttons (Dismiss and See more)
      const actionSection = document.createElement("div");
      Object.assign(actionSection.style, {
        padding: "10px 16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderTop: "1px solid #eee"
      });
      
      // Dismiss button
      const dismissBtn = document.createElement("div");
      dismissBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>';
      dismissBtn.title = "Dismiss";
      Object.assign(dismissBtn.style, {
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        color: "#666"
      });
      dismissBtn.addEventListener("click", () => dropdown.remove());
      
      // See more in Grammarly button
      const seeMoreBtn = document.createElement("div");
      seeMoreBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="#22c55e"><circle cx="12" cy="12" r="10"/></svg> See more in Grammarly';
      Object.assign(seeMoreBtn.style, {
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        color: "#666",
        fontSize: "13px"
      });
      
      // Add hover effects
      [dismissBtn, seeMoreBtn].forEach(btn => {
        btn.addEventListener("mouseenter", () => {
          btn.style.opacity = "0.7";
        });
        btn.addEventListener("mouseleave", () => {
          btn.style.opacity = "1";
        });
      });
      
      actionSection.appendChild(dismissBtn);
      actionSection.appendChild(seeMoreBtn);
      dropdown.appendChild(actionSection);
      
      // Position the dropdown
      document.body.appendChild(dropdown);
      positionGrammarDropdown(dropdown, targetElement);
      
      // Close when clicking outside
      document.addEventListener("click", function clickOutside(e) {
        if (!dropdown.contains(e.target) && e.target !== targetElement) {
          dropdown.remove();
          document.removeEventListener("click", clickOutside);
        }
      });
    } catch (error) {
      console.error("Error showing grammar suggestion dropdown:", error);
    }
  }
window.showGrammarSuggestionDropdown = showGrammarSuggestionDropdown;