/**
   * Positions an element near an anchor element
   * @param {HTMLElement} element - Element to position
   * @param {HTMLElement} anchor - Anchor element
   */
function positionElement(element, anchor) {
    try {
      const rect = anchor.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Initial positioning below the anchor
      element.style.top = `${window.scrollY + rect.bottom + 5}px`;
      element.style.left = `${window.scrollX + rect.left}px`;
      
      // Get element dimensions after it's in the DOM
      setTimeout(() => {
        const elemRect = element.getBoundingClientRect();
        
        // Horizontal adjustment
        if (elemRect.right > viewportWidth - 10) {
          // If element is wider than viewport, align to left edge
          if (elemRect.width > viewportWidth - 20) {
            element.style.left = `${window.scrollX + 10}px`;
            element.style.width = `${viewportWidth - 20}px`;
          } else {
            // Otherwise, align to right edge
            element.style.left = `${window.scrollX + viewportWidth - elemRect.width - 10}px`;
          }
        }
        
        // Vertical adjustment
        if (elemRect.bottom > viewportHeight - 10) {
          // Check if there's enough space above the anchor
          if (rect.top > elemRect.height + 10) {
            // Place above the anchor
            element.style.top = `${window.scrollY + rect.top - elemRect.height - 5}px`;
          } else {
            // Not enough space above, place at the bottom of the viewport
            element.style.top = `${window.scrollY + viewportHeight - elemRect.height - 10}px`;
            
            // If the element is taller than the available space, enable scrolling
            if (elemRect.height > viewportHeight - 20) {
              element.style.maxHeight = `${viewportHeight - 40}px`;
              element.style.overflowY = 'auto';
            }
          }
        }
      }, 0);
    } catch (error) {
      console.error("Error positioning element:", error);
    }
  }


window.positionElement = positionElement; 
