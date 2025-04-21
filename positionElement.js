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


window.positionElement = positionElement; 
