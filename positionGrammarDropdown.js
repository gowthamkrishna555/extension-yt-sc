/**
 * Positions the grammar suggestion dropdown near the target element
 * @param {HTMLElement} dropdown - The dropdown element
 * @param {HTMLElement} targetElement - The element with the error
 */
function positionGrammarDropdown(dropdown, targetElement) {
  try {
    const rect = targetElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Initial positioning below the target
    dropdown.style.top = `${window.scrollY + rect.bottom + 5}px`;
    dropdown.style.left = `${window.scrollX + rect.left}px`;
    
    // Get dropdown dimensions after it's in the DOM
    setTimeout(() => {
      const dropdownRect = dropdown.getBoundingClientRect();
      
      // Horizontal adjustment
      if (dropdownRect.right > viewportWidth - 10) {
        // If dropdown is wider than viewport, align to left edge
        if (dropdownRect.width > viewportWidth - 20) {
          dropdown.style.left = `${window.scrollX + 10}px`;
          dropdown.style.width = `${viewportWidth - 20}px`;
        } else {
          // Otherwise, align to right edge
          dropdown.style.left = `${window.scrollX + viewportWidth - dropdownRect.width - 10}px`;
        }
      }
      
      // Vertical adjustment
      if (dropdownRect.bottom > viewportHeight - 10) {
        // Check if there's enough space above the target
        if (rect.top > dropdownRect.height + 10) {
          // Place above the target
          dropdown.style.top = `${window.scrollY + rect.top - dropdownRect.height - 5}px`;
        } else {
          // Not enough space above, place at the bottom of the viewport
          dropdown.style.top = `${window.scrollY + viewportHeight - dropdownRect.height - 10}px`;
          
          // If the dropdown is taller than the available space, enable scrolling
          if (dropdownRect.height > viewportHeight - 20) {
            dropdown.style.maxHeight = `${viewportHeight - 40}px`;
            dropdown.style.overflowY = 'auto';
          }
        }
      }
    }, 0);
  } catch (error) {
    console.error("Error positioning grammar dropdown:", error);
  }
}

window.positionGrammarDropdown = positionGrammarDropdown;