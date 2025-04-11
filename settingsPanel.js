window.SettingsPanel = (function() {
    // Default settings
    const defaultSettings = {
      enabled: true,
      checkSpelling: true,
      checkGrammar: true,
      checkStyle: true,
      checkPlagiarism: false,
      suggestionDelay: 1000,
      autoCorrect: false,
      strictnessLevel: 'medium',
      personalDictionary: []
    };
    
    let currentSettings = Object.assign({}, defaultSettings);
    
    function loadSettings() {
      return new Promise((resolve) => {
        chrome.storage.sync.get('spellchecker_settings', (data) => {
          if (data.spellchecker_settings) {
            currentSettings = Object.assign({}, defaultSettings, data.spellchecker_settings);
          }
          resolve(currentSettings);
        });
      });
    }
    
    function saveSettings(settings) {
      currentSettings = Object.assign({}, currentSettings, settings);
      chrome.storage.sync.set({ 'spellchecker_settings': currentSettings });
      
      // Notify other components about settings change
      document.dispatchEvent(new CustomEvent('spellchecker:settingsChanged', {
        detail: currentSettings
      }));
      
      return currentSettings;
    }
    
    function addToPersonalDictionary(word) {
      if (!word || typeof word !== 'string') return;
      
      const normalizedWord = word.trim().toLowerCase();
      if (!normalizedWord) return;
      
      if (!currentSettings.personalDictionary.includes(normalizedWord)) {
        currentSettings.personalDictionary.push(normalizedWord);
        saveSettings(currentSettings);
      }
    }
    
    function removeFromPersonalDictionary(word) {
      if (!word || typeof word !== 'string') return;
      
      const normalizedWord = word.trim().toLowerCase();
      if (!normalizedWord) return;
      
      const index = currentSettings.personalDictionary.indexOf(normalizedWord);
      if (index !== -1) {
        currentSettings.personalDictionary.splice(index, 1);
        saveSettings(currentSettings);
      }
    }
    
    function createSettingsPanel() {
      // Create panel container
      const panel = document.createElement('div');
      panel.id = 'spell-checker-settings';
      Object.assign(panel.style, {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '450px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        zIndex: '10000',
        padding: '24px',
        fontFamily: 'Arial, sans-serif',
        maxHeight: '90vh',
        overflowY: 'auto'
      });
      
      loadSettings().then(() => {
        panel.innerHTML = `
          <h2 style="margin-top: 0; color: #333; font-size: 18px;">Spell Checker Settings</h2>
          
          <div class="settings-section">
            <label class="switch-container">
              <span>Enable Spell Checker</span>
              <input type="checkbox" id="setting-enabled" ${currentSettings.enabled ? 'checked' : ''}>
              <span class="slider"></span>
            </label>
          </div>
          
          <div class="settings-section">
            <h3>Check Types</h3>
            <label class="switch-container">
              <span>Spelling</span>
              <input type="checkbox" id="setting-spell" ${currentSettings.checkSpelling ? 'checked' : ''}>
              <span class="slider"></span>
            </label>
            <label class="switch-container">
              <span>Grammar</span>
              <input type="checkbox" id="setting-grammar" ${currentSettings.checkGrammar ? 'checked' : ''}>
              <span class="slider"></span>
            </label>
            <label class="switch-container">
              <span>Style</span>
              <input type="checkbox" id="setting-style" ${currentSettings.checkStyle ? 'checked' : ''}>
              <span class="slider"></span>
            </label>
            <label class="switch-container">
              <span>Plagiarism</span>
              <input type="checkbox" id="setting-plagiarism" ${currentSettings.checkPlagiarism ? 'checked' : ''}>
              <span class="slider"></span>
            </label>
          </div>
          
          <div class="settings-section">
            <h3>Strictness Level</h3>
            <select id="setting-strictness">
              <option value="low" ${currentSettings.strictnessLevel === 'low' ? 'selected' : ''}>Low - Basic Errors Only</option>
              <option value="medium" ${currentSettings.strictnessLevel === 'medium' ? 'selected' : ''}>Medium - Standard Checking</option>
              <option value="high" ${currentSettings.strictnessLevel === 'high' ? 'selected' : ''}>High - Comprehensive Checking</option>
            </select>
          </div>
          
          <div class="settings-section">
            <h3>Preferences</h3>
            <label class="switch-container">
              <span>Auto-Correct Common Errors</span>
              <input type="checkbox" id="setting-autocorrect" ${currentSettings.autoCorrect ? 'checked' : ''}>
              <span class="slider"></span>
            </label>
            
            <div>
              <label for="setting-delay">Suggestion Delay (ms)</label>
              <input type="range" id="setting-delay" min="0" max="2000" step="100" value="${currentSettings.suggestionDelay}">
              <span id="delay-value">${currentSettings.suggestionDelay}</span>
            </div>
          </div>
          
          <div class="settings-section">
            <h3>Personal Dictionary</h3>
            <div class="dictionary-list">
              ${currentSettings.personalDictionary.map(word => 
                `<div class="dict-word">
                  <span>${word}</span>
                  <button class="remove-word" data-word="${word}">×</button>
                </div>`
              ).join('') || '<div class="empty-dict">No words in personal dictionary</div>'}
            </div>
            <div class="add-word-container">
              <input type="text" id="new-dict-word" placeholder="Add a word...">
              <button id="add-dict-word">Add</button>
            </div>
          </div>
          
          <div class="button-row">
            <button id="settings-cancel">Cancel</button>
            <button id="settings-save" class="primary-button">Save Changes</button>
          </div>
        `;
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
          #spell-checker-settings .settings-section {
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 1px solid #eee;
          }
          #spell-checker-settings h3 {
            font-size: 16px;
            margin: 12px 0 8px 0;
            color: #444;
          }
          #spell-checker-settings .switch-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 8px 0;
          }
          #spell-checker-settings .slider {
            position: relative;
            display: inline-block;
            width: 40px;
            height: 24px;
            background-color: #ccc;
            border-radius: 12px;
            transition: .4s;
          }
          #spell-checker-settings .slider:before {
            position: absolute;
            content: "";
            height: 16px;
            width: 16px;
            left: 4px;
            bottom: 4px;
            background-color: white;
            border-radius: 50%;
            transition: .4s;
          }
          #spell-checker-settings input:checked + .slider {
            background-color: #2196F3;
          }
          #spell-checker-settings input:checked + .slider:before {
            transform: translateX(16px);
          }
          #spell-checker-settings input[type="checkbox"] {
            opacity: 0;
            width: 0;
            height: 0;
          }
          #spell-checker-settings select, 
          #spell-checker-settings input[type="text"],
          #spell-checker-settings input[type="range"] {
            width: 100%;
            padding: 8px;
            border-radius: 4px;
            border: 1px solid #ddd;
            margin: 5px 0;
          }
          #spell-checker-settings .dictionary-list {
            max-height: 150px;
            overflow-y: auto;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 8px;
            margin-bottom: 10px;
          }
          #spell-checker-settings .dict-word {
            display: flex;
            justify-content: space-between;
            padding: 4px 0;
            border-bottom: 1px solid #f0f0f0;
          }
          #spell-checker-settings .remove-word {
            background: none;
            border: none;
            color: #f44336;
            cursor: pointer;
            font-size: 18px;
          }
          #spell-checker-settings .add-word-container {
            display: flex;
            gap: 10px;
          }
          #spell-checker-settings .button-row {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            margin-top: 20px;
          }
          #spell-checker-settings button {
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            background: #f5f5f5;
            border: 1px solid #ddd;
          }
          #spell-checker-settings .primary-button {
            background: #2196F3;
            color: white;
            border: 1px solid #1976D2;
          }
          #spell-checker-settings .empty-dict {
            color: #999;
            font-style: italic;
            text-align: center;
            padding: 10px;
          }
        `;
        
        panel.appendChild(style);
        document.body.appendChild(panel);
        
        // Event listeners
        document.getElementById('setting-delay').addEventListener('input', function() {
          document.getElementById('delay-value').textContent = this.value;
        });
        
        document.getElementById('add-dict-word').addEventListener('click', function() {
          const input = document.getElementById('new-dict-word');
          const word = input.value.trim();
          if (word) {
            addToPersonalDictionary(word);
            input.value = '';
            
            // Refresh panel
            panel.remove();
            createSettingsPanel();
          }
        });
        
        document.querySelectorAll('.remove-word').forEach(btn => {
          btn.addEventListener('click', function() {
            const word = this.getAttribute('data-word');
            removeFromPersonalDictionary(word);
            
            // Refresh panel
            panel.remove();
            createSettingsPanel();
          });
        });
        
        document.getElementById('settings-cancel').addEventListener('click', function() {
          panel.remove();
        });
        
        document.getElementById('settings-save').addEventListener('click', function() {
          const newSettings = {
            enabled: document.getElementById('setting-enabled').checked,
            checkSpelling: document.getElementById('setting-spell').checked,
            checkGrammar: document.getElementById('setting-grammar').checked,
            checkStyle: document.getElementById('setting-style').checked,
            checkPlagiarism: document.getElementById('setting-plagiarism').checked,
            strictnessLevel: document.getElementById('setting-strictness').value,
            autoCorrect: document.getElementById('setting-autocorrect').checked,
            suggestionDelay: parseInt(document.getElementById('setting-delay').value)
          };
          
          saveSettings(newSettings);
          panel.remove();
        });
        
        // Add close button
        const closeBtn = document.createElement('div');
        closeBtn.textContent = '×';
        Object.assign(closeBtn.style, {
          position: 'absolute',
          top: '10px',
          right: '15px',
          fontSize: '24px',
          cursor: 'pointer',
          color: '#666'
        });
        closeBtn.onclick = () => panel.remove();
        panel.appendChild(closeBtn);
      });
    }
    
    return {
      loadSettings,
      saveSettings,
      createSettingsPanel,
      addToPersonalDictionary,
      removeFromPersonalDictionary
    };
  })();