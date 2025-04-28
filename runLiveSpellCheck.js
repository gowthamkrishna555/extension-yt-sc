/**
 * Performs live spell checking as user types
 * @param {HTMLElement} box - The input element to check
 * @param {HTMLElement} [button] - Optional button element associated with this box
 */
async function runLiveSpellCheck(box, button) {
  try {
    if (!window.spellChecker.isEnabled || !box) return;

    const originalText = box.innerText || box.value || "";
    if (!originalText.trim()) {
      // Reset loading state if button exists
      if (button) {
        setButtonLoadingState(button, false);
      }
      return;
    }

    // Now get enhanced analysis with different types of issues
    const analysis = await ApiService.fetchEnhancedAnalysis(originalText);

    // Reset loading state if button exists
    if (button) {
      setButtonLoadingState(button, false);
    }

    if (!analysis) return;

    // Apply style-based filtering to the analysis results
    const styledAnalysis = applyStyleFilters(analysis, originalText);
    // Only support contenteditable for now
    if (!box.isContentEditable) return;

    // Save cursor position
    const offset = DomUtils.getCaretCharacterOffsetWithin(box);

    // Replace incorrect words with highlighted spans
    let modifiedHTML = box.innerText;
    const replacements = [];
    // Process spelling errors (red underline)
    styledAnalysis.spelling.forEach(({ word, suggestions }) => {
      processReplacement(word, suggestions, "spelling", "#ff6b6b");
    });

    // Process grammar errors (green underline)
    styledAnalysis.grammar.forEach(({ word, suggestions }) => {
       processReplacement(word, suggestions, "grammar", "#4caf50");
    });

    // Process style issues (blue underline)
    styledAnalysis.style.forEach(({ word, suggestions }) => {
      processReplacement(word, suggestions, "style", "#2196f3");
    });

    // function processReplacement(word, suggList, type, color) {
    //   if (!word || !Array.isArray(suggList)) return;

    //   try {
    //     const regex = new RegExp(`\\b(${word})\\b`, "gi");
    //     console.log("modifiedHTML", modifiedHTML);
    //     modifiedHTML = modifiedHTML.replace(regex, (match) => {
    //       const ssbuss = `sugg-${Math.random().toString(36).substr(2, 9)}`;
    //       replacements.push({ ssbuss, original: match, suggList, type });
    //       return `<span id="${ssbuss}" class="highlight-suggest" data-type="${type}" style="border-bottom: 2px dotted ${color}; cursor: pointer; padding: 0 2px; border-radius: 2px; transition: background 0.2s ease;">${match}</span>`;
    //     });
    //   } catch (regexError) {
    //     console.warn("Error with regex replacement:", regexError);
    //   }
    // }
    function processReplacement(word, suggList, type, color) {
      if (!word || !Array.isArray(suggList)) return;

      try {
        const regex = new RegExp(`\\b(${word})\\b`, "gi");

        // Create a temporary div to safely handle HTML content
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = modifiedHTML;

        // Walk through all text nodes and apply replacements
        const walker = document.createTreeWalker(
          tempDiv,
          NodeFilter.SHOW_TEXT,
          null,
          false
        );

        while (walker.nextNode()) {
          const node = walker.currentNode;
          const parent = node.parentNode;

          // Skip if this text node is already inside a highlight span
          if (
            parent.classList &&
            parent.classList.contains("highlight-suggest")
          )
            continue;

          const parts = node.nodeValue.split(regex);
          if (parts.length === 1) continue; // No match

          const frag = document.createDocumentFragment();

          // Create a new fragment with the replacements
          parts.forEach((part, index) => {
            if (index % 2 === 0) {
              frag.appendChild(document.createTextNode(part));
            } else {
              const id = `sugg-${Math.random().toString(36).substr(2, 9)}`;
              const span = document.createElement("span");
              span.id = id;
              span.className = "highlight-suggest";
              span.dataset.type = type;
              span.style.cssText = `border-bottom: 2px dotted ${color}; cursor: pointer; padding: 0 2px; border-radius: 2px; transition: background 0.2s ease;`;
              span.textContent = part;
              replacements.push({ ssbuss: id, original: part, suggList, type });
              frag.appendChild(span);
            }
          });

          // Replace the text node with the new fragment
          parent.replaceChild(frag, node);
        }

        // Update the modifiedHTML with the new HTML from the temp div
        modifiedHTML = tempDiv.innerHTML;

        // Update the box innerHTML only if changed
        if (box.innerHTML !== modifiedHTML) {
          box.innerHTML = modifiedHTML;
          DomUtils.restoreCursor(box, offset);

          // Attach event listeners to the highlighted words
          replacements.forEach(({ ssbuss, original, suggList }) => {
            const span = box.querySelector(`#${ssbuss}`);
            if (span) {
              let hoverTimeout;
              span.addEventListener("mouseenter", () => {
                hoverTimeout = setTimeout(() => {
                  SuggestionDropdown.showSuggestionDropdown(
                    span,
                    original,
                    suggList,
                    box
                  );
                }, 300);
              });
              span.addEventListener("mouseleave", () =>
                clearTimeout(hoverTimeout)
              );
            }
          });
        }
      } catch (regexError) {
        console.warn("Error with regex replacement:", regexError);
      }
    }

    // Avoid replacing with same innerHTML (avoid blinking)
    if (box.innerHTML !== modifiedHTML) {
      box.innerHTML = modifiedHTML;
      DomUtils.restoreCursor(box, offset);

      // Add event listeners to highlighted words
      replacements.forEach(({ id, original, suggList }) => {
        try {
          const span = box.querySelector(`#${id}`);
          if (span) {
            let hoverTimeout;
            span.addEventListener("mouseenter", () => {
              hoverTimeout = setTimeout(
                () =>
                  SuggestionDropdown.showSuggestionDropdown(
                    span,
                    original,
                    suggList,
                    box
                  ),
                300
              );
            });
            span.addEventListener("mouseleave", () =>
              clearTimeout(hoverTimeout)
            );
          }
        } catch (spanError) {
          console.warn("Error setting up span event listeners:", spanError);
        }
      });
    }
  } catch (error) {
    // Reset loading state if button exists
    if (button) {
      setButtonLoadingState(button, false);
    }
    console.error("Error in runLiveSpellCheck:", error);
  }
}

// Create a debounced version of runLiveSpellCheck
const debouncedRunLiveSpellCheck = debounce(runLiveSpellCheck, 500);

// Update the event listeners to use the debounced version
document.addEventListener("DOMContentLoaded", function () {
  const inputBox = document.getElementById("inputBox");
  if (inputBox) {
    inputBox.addEventListener("input", debouncedRunLiveSpellCheck);
  }
});

window.runLiveSpellCheck = runLiveSpellCheck;
