// Create a namespace for the mutation observer
window.ObserverUtils = (function() {
    let observer = null;
    
    /**
     * Sets up a mutation observer to watch for DOM changes
     * and apply spell check functionality to new elements
     */
    function setupMutationObserver() {
      try {
        // If an observer already exists, disconnect it
        if (observer) {
          observer.disconnect();
        }
        
        observer = new MutationObserver((mutations) => {
          try {
            // Use a debounce mechanism to avoid excessive calls
            if (observer.timeout) {
              clearTimeout(observer.timeout);
            }
            
            observer.timeout = setTimeout(() => {
              SpellChecker.insertSpellCheckButtons();
            }, 500);
          } catch (error) {
            console.error("Error in mutation observer callback:", error);
          }
        });
        
        observer.observe(document.body, { 
          childList: true, 
          subtree: true 
        });
        
        return observer;
      } catch (error) {
        console.error("Error setting up mutation observer:", error);
        return null;
      }
    }
  
    // Return public methods
    return {
      setupMutationObserver
    };
  })();