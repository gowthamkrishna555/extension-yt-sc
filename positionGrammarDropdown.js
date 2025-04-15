 /**
   * Positions the grammar suggestion dropdown near the target element
   * @param {HTMLElement} dropdown - The dropdown element
   * @param {HTMLElement} targetElement - The element with the error
   */
 function positionGrammarDropdown(dropdown, targetElement) {
    const rect = targetElement.getBoundingClientRect();
    
    // Position dropdown below the error
    dropdown.style.top = `${window.scrollY + rect.bottom + 5}px`;
    dropdown.style.left = `${window.scrollX + rect.left}px`;
    
    // Ensure dropdown is in viewport
    setTimeout(() => {
      const dropdownRect = dropdown.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Horizontal adjustment
      if (dropdownRect.right > viewportWidth - 10) {
        dropdown.style.left = `${window.scrollX + viewportWidth - dropdownRect.width - 10}px`;
      }
      
      // Vertical adjustment - if it doesn't fit below, place it above
      if (dropdownRect.bottom > viewportHeight - 10) {
        dropdown.style.top = `${window.scrollY + rect.top - dropdownRect.height - 5}px`;
      }
    }, 0);
  }
window.positionGrammarDropdown = positionGrammarDropdown;