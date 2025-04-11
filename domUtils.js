// Create a namespace for DOM utilities
window.DomUtils = (function() {
    /** 
     * Finds all document objects, including those in iframes that we can access
     * @param {Document} doc - Starting document 
     * @returns {Document[]} Array of document objects 
     */
    function getAllDocuments(doc = document) {
      try {
        const documents = [doc];
        const iframes = doc.querySelectorAll("iframe");
        
        for (const iframe of iframes) {
          try {
            // Check if we can access the iframe content
            if (iframe.contentDocument) {
              documents.push(iframe.contentDocument);
              
              // Only try to get nested iframes if we have access
              const nestedDocs = getAllDocuments(iframe.contentDocument);
              documents.push(...nestedDocs.slice(1)); // Skip the first one as it's already included
            }
          } catch (e) {
            // This is expected for cross-origin iframes, silently continue
          }
        }
        
        return documents;
      } catch (error) {
        console.error("Error in getAllDocuments:", error);
        return [document]; // Return at least the main document
      }
    }
  
    /**
     * Gets accessible text input elements from the document
     * @param {Document} doc - Document to search within
     * @returns {NodeList} Collection of text input elements
     */
    function getTextInputElements(doc) {
      try {
        return doc.querySelectorAll(
          '[aria-label="Message Body"], textarea, input[type="text"], [contenteditable="true"]'
        );
      } catch (e) {
        console.warn("Error accessing elements:", e);
        return [];
      }
    }
  
    /**
     * Gets the current caret position within an element
     * @param {Element} element - The element containing the caret
     * @returns {number} The caret offset
     */
    function getCaretCharacterOffsetWithin(element) {
      try {
        let caretOffset = 0;
        const doc = element.ownerDocument || element.document;
        const win = doc.defaultView || doc.parentWindow;
        const sel = win.getSelection();
        
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          const preCaretRange = range.cloneRange();
          preCaretRange.selectNodeContents(element);
          preCaretRange.setEnd(range.endContainer, range.endOffset);
          caretOffset = preCaretRange.toString().length;
        }
        
        return caretOffset;
      } catch (error) {
        console.warn("Error getting caret position:", error);
        return 0;
      }
    }
  
    /**
     * Restores cursor position after HTML content changes
     * @param {Element} element - The element to restore cursor in
     * @param {number} offset - The character offset to place the cursor
     */
    function restoreCursor(element, offset) {
      try {
        if (!element || typeof offset !== 'number') {
          return;
        }
        
        const range = document.createRange();
        const sel = window.getSelection();
        let currentNode = null;
        let currentOffset = 0;
  
        const walker = document.createTreeWalker(
          element,
          NodeFilter.SHOW_TEXT,
          null,
          false
        );
        
        while (walker.nextNode()) {
          const node = walker.currentNode;
          if (offset <= node.length) {
            currentNode = node;
            currentOffset = offset;
            break;
          } else {
            offset -= node.length;
          }
        }
  
        if (currentNode) {
          range.setStart(currentNode, currentOffset);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      } catch (error) {
        console.warn("Error restoring cursor:", error);
      }
    }
  
    // Return public methods
    return {
      getAllDocuments,
      getTextInputElements,
      getCaretCharacterOffsetWithin,
      restoreCursor
    };
  })();