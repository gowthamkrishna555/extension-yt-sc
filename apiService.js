// Create a namespace for API services
window.ApiService = (function () {
  // Base URL for the spell check API service
  const API_BASE_URL = "https://extension-yt-sck.vercel.app/api";
  const { convertTimestampToSeconds, formatTimestamp } = window.Utils;


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

  // Update the fetchTranscript function in apiService.js to handle errors better
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
    
    return data; // { transcript, timestampedTranscript, duration, lang }
  } catch (err) {
    console.error("Failed to fetch transcript:", err);
    
    // Attempt fallback to client-side extraction if server fails
    try {
      return await fallbackClientTranscriptExtraction(videoId);
    } catch (fallbackErr) {
      console.error("Fallback transcript extraction also failed:", fallbackErr);
      alert("Unable to fetch video transcript. This video may not have captions available.");
      return null;
    }
  }
}

// Add this new fallback function for client-side transcript extraction
async function fallbackClientTranscriptExtraction(videoId) {
  console.log("Attempting client-side fallback transcript extraction");
  
  // Try to use native YouTube transcript viewer if available
  const transcriptBtn = document.querySelector('button[aria-label*="transcript" i], [aria-label*="Transcript" i]');
  if (transcriptBtn) {
    transcriptBtn.click();
    
    // Wait for transcript to load
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const transcriptSegments = Array.from(document.querySelectorAll('.ytd-transcript-segment-renderer, .segment-text'));
    if (transcriptSegments && transcriptSegments.length > 0) {
      const transcript = transcriptSegments.map(segment => segment.textContent.trim()).join(' ');
      
      const timestampedTranscript = [];
      const timestamps = document.querySelectorAll('.ytd-transcript-segment-timestamp-renderer, .segment-timestamp');
      
      transcriptSegments.forEach((segment, index) => {
        const timestamp = timestamps[index]?.textContent.trim() || "00:00";
        const seconds = convertTimestampToSeconds(timestamp);
        
        timestampedTranscript.push({
          text: segment.textContent.trim(),
          startSeconds: seconds,
          timestamp: timestamp,
          duration: 5, // Assume 5 seconds as default duration
          offset: seconds,
          language: 'en'
        });
      });
      
      // Close transcript panel
      const closeBtn = document.querySelector('[aria-label="Close transcript"]');
      if (closeBtn) closeBtn.click();
      
      return {
        transcript,
        timestampedTranscript,
        duration: timestampedTranscript.length > 0 ? 
          timestampedTranscript[timestampedTranscript.length - 1].offset + 5 : 0,
        lang: 'en'
      };
    }
  }
  
  // If no transcript found, try YouTube's player data
  try {
    const playerData = window.ytInitialPlayerResponse || {};
    if (playerData.captions && 
        playerData.captions.playerCaptionsTracklistRenderer && 
        playerData.captions.playerCaptionsTracklistRenderer.captionTracks) {
      
      const captionTrack = playerData.captions.playerCaptionsTracklistRenderer.captionTracks[0];
      if (captionTrack && captionTrack.baseUrl) {
        const response = await fetch(captionTrack.baseUrl);
        const xmlText = await response.text();
        
        // Parse XML captions
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        const textNodes = xmlDoc.getElementsByTagName('text');
        
        const timestampedTranscript = [];
        let fullText = '';
        
        for (let i = 0; i < textNodes.length; i++) {
          const node = textNodes[i];
          const text = node.textContent || '';
          const start = parseFloat(node.getAttribute('start') || '0');
          const duration = parseFloat(node.getAttribute('dur') || '5');
          
          fullText += text + ' ';
          
          timestampedTranscript.push({
            text: text.trim(),
            startSeconds: start,
            timestamp: formatTimestamp(start),
            duration: duration,
            offset: start,
            language: captionTrack.languageCode || 'en'
          });
        }
        
        return {
          transcript: fullText.trim(),
          timestampedTranscript,
          duration: timestampedTranscript.length > 0 ? 
            timestampedTranscript[timestampedTranscript.length - 1].offset + 
            timestampedTranscript[timestampedTranscript.length - 1].duration : 0,
          lang: captionTrack.languageCode || 'en'
        };
      }
    }
  } catch (error) {
    console.error("Error extracting transcript from player data:", error);
  }
  
  throw new Error("No transcript found");
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
      return data; // { title, summaryPoints, highlights }
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
