// Create a namespace for API services
window.ApiService = (function () {
  // Base URL for the spell check API service
  const API_BASE_URL = "https://extension-yt-sc.vercel.app/";

  /**
   * Fetches full text correction from the server
   * @param {string} input - Text to correct
   * @returns {Promise<string|null>} Corrected text or null on error
   */
  async function fetchFullCorrection(input) {
    try {
      if (!input || !input.trim()) {
        return null;
      }

      const serverUrl = `${API_BASE_URL}/correct`;

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
      alert(
        "❌ Error connecting to spell check server. Please make sure the server is running."
      );
      return null;
    }
  }

  /**
   * Fetches spelling suggestions for problematic words
   * @param {string} input - Text to analyze
   * @returns {Promise<Array|null>} Array of suggestions or null on error
   */
  async function fetchSuggestions(input) {
    try {
      if (!input || !input.trim()) {
        return null;
      }

      const serverUrl = `${API_BASE_URL}/suggestions`;

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
  /**
   * Fetches enhanced analysis with different types of issues
   * @param {string} input - Text to analyze
   * @returns {Promise<Object|null>} Analysis object with spelling, grammar, and style suggestions
   */
  async function fetchEnhancedAnalysis(input) {
    try {
      if (!input || !input.trim()) {
        return null;
      }

      const serverUrl = `${API_BASE_URL}/enhanced-analysis`;

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
      return data;
    } catch (err) {
      
      return null;
    }
  }

  // Return public methods
  return {
    fetchFullCorrection,
    fetchSuggestions,
    fetchEnhancedAnalysis
  };
})();
