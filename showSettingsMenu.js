function showSettingsMenu(anchorElement) {
  try {
    // Remove any existing settings menus
    document.querySelectorAll(".spell-settings-menu")?.forEach(el => el.remove());
    
    const menu = document.createElement("div");
    menu.className = "spell-settings-menu";
    
    // Settings options - Fixed: Use getter functions to access module variables
    const options = [
      { id: "toggle-enabled", text: "Spell Checker", state: window.SpellChecker.isEnabled() },
      { id: "toggle-icons", text: "Spell Check Icons", state: window.SpellChecker.iconsVisible() },
      { id: "toggle-live", text: "Live Checking", state: true }, // Assuming live checking is always available
    ];
    
    // Get active writing style to display in menu
    let activeStyleName = "Default";
    if (window.getActiveStyle && typeof window.getActiveStyle === 'function') {
      const activeStyle = window.getActiveStyle();
      activeStyleName = activeStyle.name || "Default";
    }
    
    // Add current style info
    const styleInfo = document.createElement("div");
    styleInfo.className = "style-info";
    styleInfo.textContent = `Current style: ${activeStyleName}`;
    menu.appendChild(styleInfo);
    
    // Add CSS for toggle switches to the document
    const toggleStyles = document.createElement("style");
    toggleStyles.textContent = `
      .toggle-switch {
        position: relative;
        display: inline-block;
        width: 60px;
        height: 30px;
        cursor: pointer;
      }
      
      .toggle-switch-track {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #ccc;
        border-radius: 15px;
        transition: background-color 0.3s;
      }
      
      .toggle-switch.active .toggle-switch-track {
        background-color: #4CAF50;
      }
      
      .toggle-switch-thumb {
        position: absolute;
        height: 26px;
        width: 26px;
        left: 2px;
        bottom: 2px;
        background-color: white;
        border-radius: 50%;
        transition: transform 0.3s;
      }
      
      .toggle-switch.active .toggle-switch-thumb {
        transform: translateX(30px);
      }
      
      .toggle-switch.active .toggle-switch-track:before {
        content: "✓";
        color: white;
        position: absolute;
        left: 10px;
        top: 5px;
        font-size: 16px;
      }
    `;
    document.head.appendChild(toggleStyles);
    
    options.forEach(option => {
      const item = document.createElement("div");
      item.className = "menu-item";
      
      const label = document.createElement("span");
      label.textContent = option.text;
      
      const toggleSwitch = document.createElement("div");
      toggleSwitch.className = "toggle-switch";
      if (option.state) {
        toggleSwitch.classList.add("active");
      }
      
      toggleSwitch.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent item click from firing
        
        // Toggle active state visually
        const newState = !toggleSwitch.classList.contains('active');
        toggleSwitch.classList.toggle('active');
        
        switch (option.id) {
          case "toggle-enabled":
            window.SpellChecker.setEnabled(newState);
            // If disabled, also disable icons and live checking
            if (!newState) {
              // Find and update the icons toggle
              const iconsToggle = menu.querySelector(`[data-id="toggle-icons"]`);
              if (iconsToggle && iconsToggle.classList.contains('active')) {
                iconsToggle.classList.remove('active');
                window.SpellChecker.setIconsVisible(false);
              }
            }
            break;
          case "toggle-icons":
            // Only allow toggling icons if spell checker is enabled
            const spellCheckerEnabled = menu.querySelector(`[data-id="toggle-enabled"]`)?.classList.contains('active');
            if (spellCheckerEnabled) {
              window.SpellChecker.setIconsVisible(newState);
            } else {
              // Reset the toggle if spell checker is disabled
              toggleSwitch.classList.remove('active');
              return;
            }
            break;
          case "toggle-live":
            // Toggle live checking logic
            const liveEnabled = newState && window.SpellChecker.isEnabled(); // Live checking should only work if enabled
            // Add your live checking toggle logic here
            break;
        }
      });
      
      // Add a data attribute for later selection
      toggleSwitch.setAttribute('data-id', option.id);
      
      item.appendChild(label);
      item.appendChild(toggleSwitch);
      menu.appendChild(item);
    });
    
    // Position and show menu
    document.body.appendChild(menu);
    positionElement(menu, anchorElement);
    
    // Close when clicking outside
    document.addEventListener("click", function clickOutside(e) {
      if (!menu.contains(e.target) && e.target !== anchorElement) {
        menu.remove();
        document.removeEventListener("click", clickOutside);
      }
    });
  } catch (error) {
    console.error("Error showing settings menu:", error);
  }
}

window.showSettingsMenu = showSettingsMenu;