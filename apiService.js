
window.ApiService = (function () {
  // Base URL for the spell check API service
  const API_BASE_URL = "https://extension-yt-sck.vercel.app/api";

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

  // added client side transcipt extraction i.e. youtube-transcript in fetchTranscript function in apiService.js to handle errors better
async function fetchTranscript(videoId) {
  try {
    if (!videoId || !videoId.trim()) {
      return null;
    }
    console.log("Fetching transcript for videoId:", videoId);
  
    const serverUrl = `${API_BASE_URL}/transcript?videoId=${encodeURIComponent(videoId)}`;
      
    console.log("Server URL:", serverUrl);
    const response = await fetch(serverUrl);
  
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Transcript fetch error:", errorData);
      throw new Error(errorData.error || `Transcript server responded with status: ${response.status}`);
    }
  
    const data = await response.json();
    
    if (!data.transcript || data.transcript.trim() === '') {
      throw new Error("Received empty transcript from server");
    }
    
    return data; 
  } catch (err) {
    console.error("Failed to fetch transcript:", err);
    
    // Attempt fallback to YouTubeTranscript class if server fails
    try {
      const transcriptSegments = await window.YouTubeTranscript.fetchTranscript(videoId);
      
      if (transcriptSegments && transcriptSegments.length > 0) {
        // Extract full transcript text from segments
        const fullTranscript = transcriptSegments.map(segment => segment.text).join(' ');
        
        // Get video duration from the last segment if available
        const duration = transcriptSegments[transcriptSegments.length - 1]?.totalDuration || 
                        (transcriptSegments[transcriptSegments.length - 1]?.offset + 
                         transcriptSegments[transcriptSegments.length - 1]?.duration) || 0;
        
        const lang = transcriptSegments[0]?.language || 'en';
        
        return {
          transcript: fullTranscript,
          timestampedTranscript: transcriptSegments,
          duration: duration,
          lang: lang
        };
      }
      throw new Error("No transcript segments found");
    } catch (fallbackErr) {
      console.error("YouTubeTranscript extraction failed:", fallbackErr);
      alert("Unable to fetch video transcript. This video may not have captions available.");
      return null;
    }
  }
}

  async function fetchSummary({ transcript, videoTitle, existingTimestamps, duration, lang, timestampedTranscript  }) {
    try {
      if (!transcript || !transcript.trim()) {
        return null;
      }
  
      const serverUrl = `${API_BASE_URL}/summarize`;
  
      const response = await fetch(serverUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcript,
          videoTitle,
          existingTimestamps,
          duration,
          lang,
          timestampedTranscript 
        }),
      });
  
      if (!response.ok) {
        throw new Error(`Summary server responded with status: ${response.status}`);
      }
  
      const data = await response.json();
      return data; 
    } catch (err) {
      console.error("Failed to generate summary:", err);
      alert("Error generating summary. Please make sure the backend server is running.");
      return null;
    }
  }
  
  // Return public methods
  return {
    fetchFullCorrection,
    fetchSuggestions,
    fetchEnhancedAnalysis,
    fetchTranscript,
    fetchSummary
  };
})();
