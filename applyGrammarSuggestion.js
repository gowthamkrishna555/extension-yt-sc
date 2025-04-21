  /**
   * Applies a grammar suggestion to the text
   * @param {HTMLElement} element - The element containing the text
   * @param {string} suggestion - The corrected text to apply
   */
  function applyGrammarSuggestion(element, suggestion) {
    // Get the current content
    const content = element.innerText || element.value || "";
    
    // Find the text with error - in this case assuming the element highlighted is the entire error
    const errorText = element.innerText || element.textContent;
    
    if (element.isContentEditable) {
      // For contenteditable elements
      element.innerText = content.replace(errorText, suggestion);
    } else {
      // For input/textarea elements
      element.value = content.replace(errorText, suggestion);
    }
  }

window.applyGrammarSuggestion = applyGrammarSuggestion;