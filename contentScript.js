function getAllDocuments(doc = document) {
  const documents = [doc];
  const iframes = doc.querySelectorAll("iframe");
  for (const iframe of iframes) {
    try {
      const childDoc = iframe.contentDocument || iframe.contentWindow.document;
      if (childDoc) {
        documents.push(...getAllDocuments(childDoc));
      }
    } catch (e) {
      console.warn("Can't access iframe:", e);
    }
  }
  return documents;
}

function insertSpellCheckButtons() {
  const docs = getAllDocuments();

  for (const doc of docs) {
    const boxes = doc.querySelectorAll(
      '[aria-label="Message Body"], textarea, input[type="text"], [contenteditable="true"]'
    );

    boxes.forEach((box) => {
      if (box.getAttribute("data-spell-attached")) return;

      const img = doc.createElement("img");
      img.src = chrome.runtime.getURL("icon.png");
      img.title = "Click to apply corrections";
      img.alt = "Spell check";

      Object.assign(img.style, {
        position: "absolute",
        width: "22px",
        height: "22px",
        cursor: "pointer",
        zIndex: "9999",
        border: "1px solid #ccc",
        borderRadius: "4px",
        backgroundColor: "#fff",
        padding: "2px",
        boxShadow: "0 0 3px rgba(0,0,0,0.1)",
        opacity: "0.9",
        display: "none",
      });

      doc.body.appendChild(img);

      const updateIconPosition = () => {
        const rect = box.getBoundingClientRect();
        img.style.top = `${window.scrollY + rect.top + 5}px`;
        img.style.left = `${window.scrollX + rect.right - 30}px`;
      };

      box.addEventListener("mouseenter", () => {
        updateIconPosition();
        img.style.display = "block";
        img.currentTarget = box;
      });

      box.addEventListener("mouseleave", () => {
        setTimeout(() => {
          if (!img.matches(":hover")) img.style.display = "none";
        }, 200);
      });

      img.addEventListener("mouseleave", () => {
        img.style.display = "none";
      });

      let timeout;
      box.addEventListener("input", () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => runLiveSpellCheck(box), 1000);
      });

      img.onclick = async () => {
        const originalText = box.innerText || box.value || "";
        const corrected = await fetchFullCorrection(originalText);
        if (corrected) {
          if (box.isContentEditable) {
            box.innerText = corrected;
          } else {
            box.value = corrected;
          }
        }
      };

      box.setAttribute("data-spell-attached", "true");
    });
  }
}

async function runLiveSpellCheck(box) {
  const originalText = box.innerText || box.value || "";
  if (!originalText.trim()) return;

  const suggestions = await fetchSuggestions(originalText);
  if (!suggestions || suggestions.length === 0) return;

  if (!box.isContentEditable) return; // Only support contenteditable for now

  // Save cursor position
  const offset = getCaretCharacterOffsetWithin(box);

  // Replace incorrect words with highlighted spans
  let modifiedHTML = box.innerText;
  const replacements = [];

  suggestions.forEach(({ word, suggestions: suggList }) => {
    const regex = new RegExp(`\\b(${word})\\b`, "gi");
    modifiedHTML = modifiedHTML.replace(regex, (match) => {
      const id = `sugg-${Math.random().toString(36).substr(2, 9)}`;
      replacements.push({ id, original: match, suggList });
      return `<span id="${id}" class="highlight-suggest" style="background: rgba(255, 255, 0, 0.3); cursor: pointer; border-bottom: 1px dashed #ff6b6b; padding: 0 2px; border-radius: 2px; transition: background 0.2s ease;">${match}</span>`;
    });
  });

  // Avoid replacing with same innerHTML (avoid blinking)
  if (box.innerHTML !== modifiedHTML) {
    box.innerHTML = modifiedHTML;
    restoreCursor(box, offset);

    replacements.forEach(({ id, original, suggList }) => {
      const span = box.querySelector(`#${id}`);
      if (span) {
        let hoverTimeout;
        span.addEventListener("mouseenter", () => {
          hoverTimeout = setTimeout(
            () => showSuggestionDropdown(span, original, suggList, box),
            300
          );
        });
        span.addEventListener("mouseleave", () => clearTimeout(hoverTimeout));
      }
    });
  }
}

function showSuggestionDropdown(span, original, suggestions, container) {
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

  suggestions.forEach((s) => {
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
      span.outerHTML = s;
      dropdown.remove();
    });
    
    dropdown.appendChild(item);
  });

  const rect = span.getBoundingClientRect();
  dropdown.style.top = `${window.scrollY + rect.bottom + 5}px`;
  dropdown.style.left = `${window.scrollX + rect.left}px`;

  document.body.appendChild(dropdown);
  
  // Animate dropdown appearance
  setTimeout(() => {
    dropdown.style.opacity = "1";
    dropdown.style.transform = "translateY(0)";
  }, 10);

  const removeDropdown = (e) => {
    if (!dropdown.contains(e.target)) {
      dropdown.style.opacity = "0";
      dropdown.style.transform = "translateY(-5px)";
      
      setTimeout(() => {
        dropdown.remove();
      }, 200);
      
      document.removeEventListener("click", removeDropdown);
    }
  };

  setTimeout(() => {
    document.addEventListener("click", removeDropdown);
  }, 10);
}

// Modified to call server endpoint instead of OpenAI directly
async function fetchFullCorrection(input) {
  try {
    // Replace with your server URL
    const serverUrl = "http://localhost:3000/api/correct";
    
    const response = await fetch(serverUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: input }),
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    const data = await response.json();
    return data.correctedText;
  } catch (err) {
    console.error("Server request failed:", err);
    alert("❌ Error connecting to spell check server. Please make sure the server is running.");
    return null;
  }
}

// Modified to call server endpoint for suggestions
async function fetchSuggestions(input) {
  try {
    // Replace with your server URL
    const serverUrl = "http://localhost:3000/api/suggestions";
    
    const response = await fetch(serverUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: input }),
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    const data = await response.json();
    return data.suggestions;
  } catch (err) {
    console.error("Suggestions fetch failed:", err);
    return null;
  }
}

function getCaretCharacterOffsetWithin(element) {
  let caretOffset = 0;
  const doc = element.ownerDocument || element.document;
  const win = doc.defaultView || doc.parentWindow;
  const sel = win.getSelection();
  if (sel.rangeCount > 0) {
    const range = sel.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(element);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    caretOffset = preCaretRange.toString().length;
  }
  return caretOffset;
}

function restoreCursor(element, offset) {
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
}

// Improve the highlighted word on mouseover
function addGlobalStyles() {
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    .highlight-suggest:hover {
      background: rgba(255, 255, 150, 0.5) !important;
      box-shadow: 0 0 3px rgba(0,0,0,0.1);
    }
  `;
  document.head.appendChild(styleEl);
}

// Initial run
addGlobalStyles();
insertSpellCheckButtons();

const observer = new MutationObserver(() => {
  insertSpellCheckButtons();
});
observer.observe(document.body, { childList: true, subtree: true });