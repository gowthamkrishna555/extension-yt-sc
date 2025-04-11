// New file: dashboard.js
window.Dashboard = (function () {
  let stats = {
    spellingErrors: 0,
    grammarErrors: 0,
    styleIssues: 0,
    documentsChecked: 0,
    wordsChecked: 0,
  };

  function updateStats(newStats) {
    Object.assign(stats, newStats);
    saveStats();

    // If dashboard is open, update UI
    const dashboard = document.getElementById("spell-checker-dashboard");
    if (dashboard) {
      renderDashboard(dashboard);
    }
  }

  function saveStats() {
    chrome.storage.sync.set({ spellchecker_stats: stats });
  }

  function loadStats() {
    return new Promise((resolve) => {
      chrome.storage.sync.get("spellchecker_stats", (data) => {
        if (data.spellchecker_stats) {
          stats = data.spellchecker_stats;
        }
        resolve(stats);
      });
    });
  }

  function renderDashboard(container) {
    container.innerHTML = `
        <div class="dashboard-header">Writing Statistics</div>
        <div class="stats-container">
          <div class="stat-item">
            <div class="stat-value">${stats.spellingErrors}</div>
            <div class="stat-label">Spelling Errors</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${stats.grammarErrors}</div>
            <div class="stat-label">Grammar Errors</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${stats.styleIssues}</div>
            <div class="stat-label">Style Issues</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${stats.documentsChecked}</div>
            <div class="stat-label">Documents Checked</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${stats.wordsChecked}</div>
            <div class="stat-label">Words Checked</div>
          </div>
        </div>
      `;
  }

  function openDashboard() {
    // Create dashboard popup
    const dashboard = document.createElement("div");
    dashboard.id = "spell-checker-dashboard";
    Object.assign(dashboard.style, {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: "400px",
      backgroundColor: "#fff",
      borderRadius: "8px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
      zIndex: "10000",
      padding: "20px",
      fontFamily: "Arial, sans-serif",
    });

    loadStats().then(() => {
      renderDashboard(dashboard);
      document.body.appendChild(dashboard);

      // Add close button
      const closeBtn = document.createElement("div");
      closeBtn.textContent = "×";
      Object.assign(closeBtn.style, {
        position: "absolute",
        top: "10px",
        right: "15px",
        fontSize: "24px",
        cursor: "pointer",
        color: "#666",
      });
      closeBtn.onclick = () => dashboard.remove();
      dashboard.appendChild(closeBtn);
    });
  }

  // Add to dashboard.js
  function setGoals(newGoals) {
    chrome.storage.sync.get("spellchecker_goals", (data) => {
      const goals = data.spellchecker_goals || {};
      Object.assign(goals, newGoals);
      chrome.storage.sync.set({ spellchecker_goals: goals });
    });
  }

  function trackProgress() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(
        ["spellchecker_stats", "spellchecker_goals"],
        (data) => {
          const stats = data.spellchecker_stats || {};
          const goals = data.spellchecker_goals || {};

          const progress = {
            spelling: goals.maxSpellingErrors
              ? Math.min(
                  100,
                  100 - (stats.spellingErrors / goals.maxSpellingErrors) * 100
                )
              : 0,
            grammar: goals.maxGrammarErrors
              ? Math.min(
                  100,
                  100 - (stats.grammarErrors / goals.maxGrammarErrors) * 100
                )
              : 0,
            wordsGoal: goals.targetWords
              ? Math.min(100, (stats.wordsChecked / goals.targetWords) * 100)
              : 0,
          };

          resolve(progress);
        }
      );
    });
  }

  return {
    updateStats,
    loadStats,
    openDashboard,
    trackProgress
  };
})();
