function showGrammarSuggestionDropdown(originalText, targetElement, suggestion) {
    try {
      // Remove any existing suggestion dropdowns
      document.querySelectorAll('.grammar-suggestion-dropdown').forEach(el => el.remove());
      
      const dropdown = document.createElement("div");
      dropdown.className = "grammar-suggestion-dropdown";
      
      // Header for suggestion type
      const header = document.createElement("div");
      header.className = "header";
      header.textContent = suggestion.type || "Correct article usage";
      dropdown.appendChild(header);
      
      // Suggestion content
      const suggestionContent = document.createElement("div");
      suggestionContent.className = "suggestion-content";
      suggestionContent.innerHTML = suggestion.correction || `<span>the</span> capital`;
      
      // Apply the suggestion when clicked
      suggestionContent.addEventListener("click", () => {
        applyGrammarSuggestion(targetElement, suggestion.correction || "the capital");
        dropdown.remove();
      });
      
      dropdown.appendChild(suggestionContent);
      
      // Action buttons (Dismiss and See more)
      const actionSection = document.createElement("div");
      actionSection.className = "action-section";
      
      // Dismiss button
      const dismissBtn = document.createElement("div");
      dismissBtn.className = "action-button";
      dismissBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>';
      dismissBtn.title = "Dismiss";
      dismissBtn.addEventListener("click", () => dropdown.remove());
      
      // See more in Grammarly button
      const seeMoreBtn = document.createElement("div");
      seeMoreBtn.className = "action-button";
      seeMoreBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="#22c55e"><circle cx="12" cy="12" r="10"/></svg> See more in Grammarly';
      
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