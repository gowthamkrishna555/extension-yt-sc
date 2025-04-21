// /**
//  * Customization settings for the spell checker
//  * This file allows users to adjust how corrections are applied based on writing context
//  */

// // Available writing style presets
// const WRITING_STYLES = {
//     FORMAL: {
//       id: 'formal',
//       name: 'Formal Writing',
//       description: 'Strict grammar and spelling for professional documents',
//       settings: {
//         checkSlang: true,
//         checkContractions: true,
//         checkCasualPhrases: true,
//         suggestFormalAlternatives: true,
//         strictPunctuation: true,
//         strictGrammar: true
//       }
//     },
//     BUSINESS: {
//       id: 'business',
//       name: 'Business Email',
//       description: 'Professional but less rigid than formal writing',
//       settings: {
//         checkSlang: true,
//         checkContractions: false,
//         checkCasualPhrases: true,
//         suggestFormalAlternatives: true,
//         strictPunctuation: true,
//         strictGrammar: true
//       }
//     },
//     CASUAL: {
//       id: 'casual',
//       name: 'Casual Communication',
//       description: 'Relaxed rules for everyday messages',
//       settings: {
//         checkSlang: false,
//         checkContractions: false,
//         checkCasualPhrases: false,
//         suggestFormalAlternatives: false,
//         strictPunctuation: false,
//         strictGrammar: false
//       }
//     },
//     ACADEMIC: {
//       id: 'academic',
//       name: 'Academic Writing',
//       description: 'Rules for academic papers and research',
//       settings: {
//         checkSlang: true,
//         checkContractions: true,
//         checkCasualPhrases: true,
//         suggestFormalAlternatives: true,
//         strictPunctuation: true,
//         strictGrammar: true,
//         checkCitations: true
//       }
//     },
//     CREATIVE: {
//       id: 'creative',
//       name: 'Creative Writing',
//       description: 'Focus on spelling but flexible with style',
//       settings: {
//         checkSlang: false,
//         checkContractions: false,
//         checkCasualPhrases: false,
//         suggestFormalAlternatives: false,
//         strictPunctuation: false,
//         strictGrammar: false
//       }
//     },
//     CUSTOM: {
//       id: 'custom',
//       name: 'Custom',
//       description: 'Your personalized settings',
//       settings: {
//         // Will be populated by user preferences
//       }
//     }
//   };
  
//   // Current active style
//   let activeStyle = WRITING_STYLES.CASUAL;
//   let userCustomSettings = null;
  
//   /**
//    * Opens the customization panel for spell checker settings
//    */
//   function openCustomizationPanel() {
//     try {
//       // Remove any existing panels
//       document.querySelectorAll(".spell-customization-panel")?.forEach(el => el.remove());
      
//       const panel = document.createElement("div");
//       panel.className = "spell-customization-panel";
//       Object.assign(panel.style, {
//         position: "fixed",
//         top: "50%",
//         left: "50%",
//         transform: "translate(-50%, -50%)",
//         background: "#ffffff",
//         border: "1px solid #ddd",
//         borderRadius: "8px",
//         zIndex: "10002",
//         boxShadow: "0 6px 24px rgba(0,0,0,0.2)",
//         width: "500px",
//         maxWidth: "90%",
//         maxHeight: "90vh",
//         overflow: "auto",
//         padding: "20px",
//         fontFamily: "system-ui, -apple-system, sans-serif"
//       });
      
//       // Header
//       const header = document.createElement("div");
//       header.innerHTML = `<h2 style="margin-top:0">Customize Spell Checker</h2>
//                           <p>Select a writing style or customize your own settings.</p>`;
//       panel.appendChild(header);
      
//       // Style selector
//       const styleSelector = document.createElement("div");
//       styleSelector.style.marginBottom = "20px";
      
//       const styleLabel = document.createElement("label");
//       styleLabel.textContent = "Writing Style:";
//       styleLabel.style.display = "block";
//       styleLabel.style.marginBottom = "8px";
//       styleLabel.style.fontWeight = "600";
      
//       const styleSelect = document.createElement("select");
//       styleSelect.style.width = "100%";
//       styleSelect.style.padding = "8px";
//       styleSelect.style.borderRadius = "4px";
//       styleSelect.style.border = "1px solid #ccc";
      
//       Object.values(WRITING_STYLES).forEach(style => {
//         const option = document.createElement("option");
//         option.value = style.id;
//         option.textContent = style.name;
//         option.selected = (activeStyle.id === style.id);
//         styleSelect.appendChild(option);
//       });
      
//       styleSelector.appendChild(styleLabel);
//       styleSelector.appendChild(styleSelect);
//       panel.appendChild(styleSelector);
      
//       // Description of selected style
//       const styleDescription = document.createElement("div");
//       styleDescription.style.marginBottom = "20px";
//       styleDescription.style.padding = "10px";
//       styleDescription.style.backgroundColor = "#f5f5f5";
//       styleDescription.style.borderRadius = "4px";
//       styleDescription.textContent = activeStyle.description;
//       panel.appendChild(styleDescription);
      
//       // Settings section
//       const settingsSection = document.createElement("div");
//       settingsSection.style.marginTop = "20px";
      
//       const settingsHeader = document.createElement("h3");
//       settingsHeader.textContent = "Settings";
//       settingsHeader.style.marginBottom = "10px";
//       settingsSection.appendChild(settingsHeader);
      
//       // Create toggle switches for each setting
//       const createToggleSetting = (id, label, isChecked) => {
//         const settingContainer = document.createElement("div");
//         settingContainer.style.display = "flex";
//         settingContainer.style.justifyContent = "space-between";
//         settingContainer.style.alignItems = "center";
//         settingContainer.style.padding = "8px 0";
//         settingContainer.style.borderBottom = "1px solid #eee";
        
//         const settingLabel = document.createElement("label");
//         settingLabel.textContent = label;
//         settingLabel.htmlFor = id;
        
//         const toggleWrapper = document.createElement("div");
//         toggleWrapper.style.position = "relative";
        
//         const toggleInput = document.createElement("input");
//         toggleInput.type = "checkbox";
//         toggleInput.id = id;
//         toggleInput.checked = isChecked;
//         toggleInput.style.opacity = "0";
//         toggleInput.style.width = "0";
//         toggleInput.style.height = "0";
        
//         const toggleSlider = document.createElement("span");
//         Object.assign(toggleSlider.style, {
//           position: "absolute",
//           cursor: "pointer",
//           top: "0",
//           left: "0",
//           right: "0",
//           bottom: "0",
//           backgroundColor: isChecked ? "#00a67d" : "#ccc",
//           transition: ".4s",
//           borderRadius: "34px",
//           width: "50px",
//           height: "24px"
//         });
        
//         const toggleDot = document.createElement("span");
//         Object.assign(toggleDot.style, {
//           position: "absolute",
//           content: '""',
//           height: "16px",
//           width: "16px",
//           left: isChecked ? "30px" : "4px",
//           bottom: "4px",
//           backgroundColor: "white",
//           transition: ".4s",
//           borderRadius: "50%"
//         });
        
//         toggleSlider.appendChild(toggleDot);
//         toggleWrapper.appendChild(toggleInput);
//         toggleWrapper.appendChild(toggleSlider);
        
//         toggleInput.addEventListener("change", function() {
//           toggleSlider.style.backgroundColor = this.checked ? "#00a67d" : "#ccc";
//           toggleDot.style.left = this.checked ? "30px" : "4px";
          
//           // If any setting is changed, switch to custom mode
//           styleSelect.value = 'custom';
//           styleDescription.textContent = WRITING_STYLES.CUSTOM.description;
//           updateCustomSettings();
//         });
        
//         settingContainer.appendChild(settingLabel);
//         settingContainer.appendChild(toggleWrapper);
        
//         return settingContainer;
//       };
      
//       // Add toggle settings based on active style
//       const settingsToggles = document.createElement("div");
//       settingsToggles.style.marginTop = "10px";
      
//       const allSettings = {
//         checkSlang: "Check for slang words",
//         checkContractions: "Flag contractions (don't, can't, etc.)",
//         checkCasualPhrases: "Check for casual phrases",
//         suggestFormalAlternatives: "Suggest formal alternatives",
//         strictPunctuation: "Strict punctuation rules",
//         strictGrammar: "Strict grammar rules",
//         checkCitations: "Check for proper citations (academic)"
//       };
      
//       // Create all possible settings
//       for (const [key, label] of Object.entries(allSettings)) {
//         const isChecked = activeStyle.settings[key] === true;
//         const toggle = createToggleSetting(key, label, isChecked);
//         settingsToggles.appendChild(toggle);
//       }
      
//       settingsSection.appendChild(settingsToggles);
//       panel.appendChild(settingsSection);
      
//       // Buttons
//       const buttonContainer = document.createElement("div");
//       buttonContainer.style.display = "flex";
//       buttonContainer.style.justifyContent = "flex-end";
//       buttonContainer.style.marginTop = "20px";
//       buttonContainer.style.gap = "10px";
      
//       const cancelButton = document.createElement("button");
//       cancelButton.textContent = "Cancel";
//       Object.assign(cancelButton.style, {
//         padding: "8px 16px",
//         border: "1px solid #ddd",
//         borderRadius: "4px",
//         backgroundColor: "#f5f5f5",
//         cursor: "pointer"
//       });
      
//       const saveButton = document.createElement("button");
//       saveButton.textContent = "Save";
//       Object.assign(saveButton.style, {
//         padding: "8px 16px",
//         border: "none",
//         borderRadius: "4px",
//         backgroundColor: "#00a67d",
//         color: "white",
//         cursor: "pointer"
//       });
      
//       buttonContainer.appendChild(cancelButton);
//       buttonContainer.appendChild(saveButton);
//       panel.appendChild(buttonContainer);
      
//       // Event listeners for the style selector
//       styleSelect.addEventListener("change", function() {
//         const selectedStyleId = this.value;
//         let selectedStyle;
        
//         // Find the selected style
//         for (const style of Object.values(WRITING_STYLES)) {
//           if (style.id === selectedStyleId) {
//             selectedStyle = style;
//             break;
//           }
//         }
        
//         if (selectedStyle) {
//           styleDescription.textContent = selectedStyle.description;
          
//           // Update toggles to match selected style
//           if (selectedStyleId !== 'custom') {
//             for (const [key, label] of Object.entries(allSettings)) {
//               const toggle = document.getElementById(key);
//               if (toggle) {
//                 const isChecked = selectedStyle.settings[key] === true;
//                 toggle.checked = isChecked;
                
//                 // Update the toggle appearance
//                 const toggleSlider = toggle.nextElementSibling;
//                 toggleSlider.style.backgroundColor = isChecked ? "#00a67d" : "#ccc";
//                 toggleSlider.querySelector("span").style.left = isChecked ? "30px" : "4px";
//               }
//             }
//           } else if (userCustomSettings) {
//             // Restore custom settings if available
//             for (const [key, value] of Object.entries(userCustomSettings)) {
//               const toggle = document.getElementById(key);
//               if (toggle) {
//                 toggle.checked = value;
                
//                 // Update the toggle appearance
//                 const toggleSlider = toggle.nextElementSibling;
//                 toggleSlider.style.backgroundColor = value ? "#00a67d" : "#ccc";
//                 toggleSlider.querySelector("span").style.left = value ? "30px" : "4px";
//               }
//             }
//           }
//         }
//       });
      
//       // Save button event
//       saveButton.addEventListener("click", function() {
//         const selectedStyleId = styleSelect.value;
        
//         if (selectedStyleId === 'custom') {
//           // Save custom settings
//           updateCustomSettings();
//           activeStyle = {
//             ...WRITING_STYLES.CUSTOM,
//             settings: { ...userCustomSettings }
//           };
//         } else {
//           // Use predefined style
//           for (const style of Object.values(WRITING_STYLES)) {
//             if (style.id === selectedStyleId) {
//               activeStyle = style;
//               break;
//             }
//           }
//         }
        
//         // Save settings to localStorage
//         saveSettings();
        
//         // Close the panel
//         panel.remove();
        
//         // Apply new settings to spell checker
//         applySpellCheckSettings();
//       });
      
//       // Cancel button event
//       cancelButton.addEventListener("click", function() {
//         panel.remove();
//       });
      
//       // Function to update custom settings based on current toggle states
//       function updateCustomSettings() {
//         userCustomSettings = {};
//         for (const key of Object.keys(allSettings)) {
//           const toggle = document.getElementById(key);
//           if (toggle) {
//             userCustomSettings[key] = toggle.checked;
//           }
//         }
        
//         // Update CUSTOM preset with these settings
//         WRITING_STYLES.CUSTOM.settings = { ...userCustomSettings };
//       }
      
//       // Add the panel to the document
//       document.body.appendChild(panel);
      
//       // Add overlay
//       const overlay = document.createElement("div");
//       overlay.className = "spell-customization-overlay";
//       Object.assign(overlay.style, {
//         position: "fixed",
//         top: "0",
//         left: "0",
//         width: "100%",
//         height: "100%",
//         background: "rgba(0,0,0,0.5)",
//         zIndex: "10001"
//       });
      
//       document.body.appendChild(overlay);
      
//       // Close on overlay click
//       overlay.addEventListener("click", function() {
//         panel.remove();
//         overlay.remove();
//       });
      
//     } catch (error) {
//       console.error("Error opening customization panel:", error);
//     }
//   }
  
//   /**
//    * Saves the current settings to localStorage
//    */
//   function saveSettings() {
//     try {
//       localStorage.setItem('spellCheckerStyle', activeStyle.id);
      
//       if (activeStyle.id === 'custom') {
//         localStorage.setItem('spellCheckerCustomSettings', JSON.stringify(userCustomSettings));
//       }
//     } catch (error) {
//       console.error("Error saving settings:", error);
//     }
//   }
  
//   /**
//    * Loads saved settings from localStorage
//    */
//   function loadSettings() {
//     try {
//       const savedStyleId = localStorage.getItem('spellCheckerStyle');
      
//       if (savedStyleId) {
//         // Find the saved style
//         for (const style of Object.values(WRITING_STYLES)) {
//           if (style.id === savedStyleId) {
//             activeStyle = style;
            
//             // If custom, load custom settings
//             if (savedStyleId === 'custom') {
//               const savedCustomSettings = localStorage.getItem('spellCheckerCustomSettings');
//               if (savedCustomSettings) {
//                 userCustomSettings = JSON.parse(savedCustomSettings);
//                 WRITING_STYLES.CUSTOM.settings = { ...userCustomSettings };
//                 activeStyle = {
//                   ...WRITING_STYLES.CUSTOM,
//                   settings: { ...userCustomSettings }
//                 };
//               }
//             }
            
//             break;
//           }
//         }
//       }
//     } catch (error) {
//       console.error("Error loading settings:", error);
//     }
//   }
  
//   /**
//    * Applies the current spell check settings to the checker
//    */
//   function applySpellCheckSettings() {
//     // This function connects to the main spell checker
//     // and modifies its behavior based on the active style
//     try {
//       // Make active style settings available to the spell checker
//       window.spellCheckerSettings = {
//         ...activeStyle.settings,
//         styleType: activeStyle.id,
//         styleName: activeStyle.name
//       };
      
//       // Trigger a re-check if the spell checker is already active
//       if (typeof refreshSpellCheck === 'function') {
//         refreshSpellCheck();
//       }
      
//       // Show notification to user
//       showStyleChangeNotification(activeStyle.name);
//     } catch (error) {
//       console.error("Error applying spell check settings:", error);
//     }
//   }
  
//   /**
//    * Shows a notification when style is changed
//    * @param {string} styleName - Name of the active style
//    */
//   function showStyleChangeNotification(styleName) {
//     const notification = document.createElement("div");
//     Object.assign(notification.style, {
//       position: "fixed",
//       bottom: "20px",
//       right: "20px",
//       backgroundColor: "#00a67d",
//       color: "white",
//       padding: "12px 20px",
//       borderRadius: "6px",
//       boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
//       zIndex: "10003",
//       opacity: "0",
//       transform: "translateY(10px)",
//       transition: "opacity 0.3s, transform 0.3s"
//     });
    
//     notification.textContent = `Spell checker style set to: ${styleName}`;
//     document.body.appendChild(notification);
    
//     // Show with animation
//     setTimeout(() => {
//       notification.style.opacity = "1";
//       notification.style.transform = "translateY(0)";
//     }, 10);
    
//     // Auto remove after a timeout
//     setTimeout(() => {
//       notification.style.opacity = "0";
//       notification.style.transform = "translateY(10px)";
      
//       setTimeout(() => {
//         notification.remove();
//       }, 300);
//     }, 3000);
//   }
  
//   /**
//    * Gets current correction rules based on active style
//    * @param {string} text - The text being checked
//    * @param {Object} detectedIssue - The detected spelling/grammar issue
//    * @returns {Object} Modified correction suggestions based on style
//    */
//   function getStyleBasedCorrections(text, detectedIssue) {
//     // This function modifies correction suggestions based on the active style
//     const corrections = { ...detectedIssue };
    
//     // Apply style-specific logic
//     switch (activeStyle.id) {
//       case 'formal':
//         // Enhance formal suggestions
//         if (detectedIssue.type === 'casual_language') {
//           corrections.priority = 'high';
//         }
//         if (detectedIssue.type === 'contraction') {
//           corrections.suggestions = expandContractions(detectedIssue.word);
//         }
//         break;
        
//       case 'casual':
//         // Relax certain rules for casual writing
//         if (detectedIssue.type === 'informal_word' || 
//             detectedIssue.type === 'slang' ||
//             detectedIssue.type === 'contraction') {
//           corrections.ignore = true;
//         }
//         break;
        
//       case 'business':
//         // Middle ground between formal and casual
//         if (detectedIssue.type === 'slang') {
//           corrections.priority = 'high';
//         }
//         break;
        
//       case 'academic':
//         // Academic additions
//         if (detectedIssue.type === 'passive_voice') {
//           corrections.priority = 'medium';
//         }
//         break;
//     }
    
//     // Apply custom settings if using custom style
//     if (activeStyle.id === 'custom') {
//       const settings = activeStyle.settings;
      
//       // Slang checking
//       if (!settings.checkSlang && 
//           (detectedIssue.type === 'slang' || detectedIssue.type === 'informal_word')) {
//         corrections.ignore = true;
//       }
      
//       // Contraction checking
//       if (!settings.checkContractions && detectedIssue.type === 'contraction') {
//         corrections.ignore = true;
//       }
      
//       // Casual phrases
//       if (!settings.checkCasualPhrases && detectedIssue.type === 'casual_language') {
//         corrections.ignore = true;
//       }
//     }
    
//     return corrections;
//   }
  
//   /**
//    * Expands contractions to formal alternatives
//    * @param {string} word - Contraction to expand
//    * @returns {Array} - Array of formal alternatives
//    */
//   function expandContractions(word) {
//     const contractionMap = {
//       "don't": ["do not"],
//       "can't": ["cannot"],
//       "won't": ["will not"],
//       "shouldn't": ["should not"],
//       "couldn't": ["could not"],
//       "wouldn't": ["would not"],
//       "isn't": ["is not"],
//       "aren't": ["are not"],
//       "wasn't": ["was not"],
//       "weren't": ["were not"],
//       "hasn't": ["has not"],
//       "haven't": ["have not"],
//       "hadn't": ["had not"],
//       "doesn't": ["does not"],
//       "don't": ["do not"],
//       "didn't": ["did not"],
//       "I'm": ["I am"],
//       "you're": ["you are"],
//       "he's": ["he is", "he has"],
//       "she's": ["she is", "she has"],
//       "it's": ["it is", "it has"],
//       "we're": ["we are"],
//       "they're": ["they are"],
//       "I've": ["I have"],
//       "you've": ["you have"],
//       "we've": ["we have"],
//       "they've": ["they have"],
//       "I'll": ["I will", "I shall"],
//       "you'll": ["you will"],
//       "he'll": ["he will"],
//       "she'll": ["she will"],
//       "it'll": ["it will"],
//       "we'll": ["we will"],
//       "they'll": ["they will"],
//       "I'd": ["I would", "I had"],
//       "you'd": ["you would", "you had"],
//       "he'd": ["he would", "he had"],
//       "she'd": ["she would", "she had"],
//       "it'd": ["it would", "it had"],
//       "we'd": ["we would", "we had"],
//       "they'd": ["they would", "they had"]
//     };
    
//     return contractionMap[word.toLowerCase()] || [word];
//   }
  
//   /**
//    * Initialize customization module
//    */
//   function initCustomization() {
//     // Load saved settings
//     loadSettings();
    
//     // Apply settings to spell checker
//     applySpellCheckSettings();
    
//     console.log("Spell checker customization initialized with style:", activeStyle.name);
//   }
  
//   // Initialize on load
//   if (document.readyState === 'loading') {
//     document.addEventListener('DOMContentLoaded', initCustomization);
//   } else {
//     initCustomization();
//   }
  
//   // Export functions for use in main spell checker
//   window.openCustomizationPanel = openCustomizationPanel;
//   window.getStyleBasedCorrections = getStyleBasedCorrections;
//   window.getActiveStyle = () => activeStyle;