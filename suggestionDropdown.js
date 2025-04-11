// Create a namespace for suggestion dropdown functionality
window.SuggestionDropdown = (function() {
    /**
     * Creates and displays a dropdown with spelling suggestions
     * @param {HTMLElement} span - The highlighted word element
     * @param {string} original - The original misspelled word
     * @param {string[]} suggestions - List of suggested corrections
     * @param {HTMLElement} container - The container element
     */
    function showSuggestionDropdown(span, original, suggestions, container) {
      try {
        if (!span || !Array.isArray(suggestions) || suggestions.length === 0) {
          return;
        }
        
        // Remove any existing dropdowns
        document
          .querySelectorAll(".spell-suggestion-dropdown")
          ?.forEach((el) => el.remove());
  
        const dropdown = document.createElement("div");
        dropdown.classList.add("spell-suggestion-dropdown");
        Object.assign(dropdown.style, {
          position: "absolute",
          background: "#ffffff",
          border: "none",
          borderRadius: "6px",
          zIndex: "9999",
          padding: "6px 0",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          maxWidth: "200px",
          minWidth: "120px",
          fontSize: "14px",
          opacity: "0",
          transform: "translateY(-5px)",
          transition: "opacity 0.2s ease, transform 0.2s ease"
        });
  
        // Add title at the top of dropdown
        const titleDiv = document.createElement("div");
        titleDiv.textContent = "Suggestions:";
        Object.assign(titleDiv.style, {
          padding: "4px 12px 8px 12px",
          borderBottom: "1px solid #eee",
          color: "#666",
          fontSize: "12px",
          fontWeight: "bold"
        });
        dropdown.appendChild(titleDiv);
  
        // Add each suggestion as a clickable item
        suggestions.forEach((s) => {
          if (!s || typeof s !== 'string') return;
          
          const item = document.createElement("div");
          item.textContent = s;
          Object.assign(item.style, {
            padding: "6px 12px",
            cursor: "pointer",
            transition: "background 0.1s ease, color 0.1s ease",
            color: "#333"
          });
          
          item.addEventListener("mouseover", () => {
            item.style.background = "#f0f7ff";
            item.style.color = "#1a73e8";
          });
          
          item.addEventListener("mouseout", () => {
            item.style.background = "transparent";
            item.style.color = "#333";
          });
          
          item.addEventListener("click", () => {
            try {
              span.outerHTML = s;
            } catch (error) {
              console.error("Error replacing text:", error);
            }
            dropdown.remove();
          });
          
          dropdown.appendChild(item);
        });
  
        // Position the dropdown below the word
        try {
          const rect = span.getBoundingClientRect();
          dropdown.style.top = `${window.scrollY + rect.bottom + 5}px`;
          dropdown.style.left = `${window.scrollX + rect.left}px`;
        } catch (error) {
          console.warn("Error positioning dropdown:", error);
          dropdown.style.top = '100px';
          dropdown.style.left = '100px';
        }
  
        document.body.appendChild(dropdown);
        
        // Animate dropdown appearance
        setTimeout(() => {
          dropdown.style.opacity = "1";
          dropdown.style.transform = "translateY(0)";
        }, 10);
  
        // Close dropdown when clicking outside
        const removeDropdown = (e) => {
          if (!dropdown.contains(e.target)) {
            dropdown.style.opacity = "0";
            dropdown.style.transform = "translateY(-5px)";
            
            setTimeout(() => {
              try {
                if (dropdown.parentNode) {
                  dropdown.remove();
                }
              } catch (error) {
                console.warn("Error removing dropdown:", error);
              }
            }, 200);
            
            document.removeEventListener("click", removeDropdown);
          }
        };
  
        setTimeout(() => {
          document.addEventListener("click", removeDropdown);
        }, 10);
      } catch (error) {
        console.error("Error showing suggestion dropdown:", error);
      }
    }
  
    // Return public methods
    return {
      showSuggestionDropdown
    };
  })();