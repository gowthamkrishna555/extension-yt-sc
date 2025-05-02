// Enhance YouTube transcript extraction with more fallback methods
class YouTubeTranscript {
  constructor() {
    this.baseUrl = 'https://www.youtube.com';
  }

  async fetchTranscript(videoId) {
    try {        
      // First try to extract from the page
      const inPageTranscript = await this.extractTranscriptFromPage();
      if (inPageTranscript && inPageTranscript.length > 0) {
        console.log('Successfully extracted transcript from page');
        return inPageTranscript;
      }
      
      // Then try various API methods
      try {
        return await this.fetchTranscriptFromApi(videoId);
      } catch (apiError) {
        console.error('API transcript fetch failed:', apiError);
        
        try {
          return await this.extractFromVideoInfo(videoId);
        } catch (videoInfoError) {
          console.error('Video info transcript fetch failed:', videoInfoError);
          
          try {
            return await this.fetchFromTimedText(videoId);
          } catch (timedTextError) {
            console.error('Timed text transcript fetch failed:', timedTextError);
            throw new Error('All transcript extraction methods failed');
          }
        }
      }
    } catch (error) {
      console.error('Error fetching transcript:', error);
      throw new Error('Failed to fetch transcript. This video might not have captions available.');
    }
  }

  async extractTranscriptFromPage() {
    try {
      // Method 1: Try the transcript panel elements
      const transcriptElements = document.querySelectorAll('.ytd-transcript-segment-renderer');
      if (transcriptElements.length > 0) {
        console.log('Found transcript panel elements');
        const transcriptSegments = [];
        
        // Find timestamp elements
        const timestampElements = document.querySelectorAll('.ytd-transcript-segment-timestamp-renderer');
        
        for (let i = 0; i < transcriptElements.length; i++) {
          const text = transcriptElements[i].textContent.trim();
          let timestamp = '00:00';
          let startSeconds = 0;
          
          if (timestampElements[i]) {
            timestamp = timestampElements[i].textContent.trim();
            startSeconds = this.convertTimestampToSeconds(timestamp);
          }
          
          transcriptSegments.push({
            text,
            startSeconds,
            timestamp,
            duration: 5, // Default duration
            offset: startSeconds,
            language: 'en'
          });
        }
        
        return transcriptSegments;
      }
      
      // Method 2: Try transcript button and extract
      const transcriptButton = document.querySelector('button[aria-label*="transcript" i], [aria-label*="Transcript" i]');
      if (transcriptButton) {
        console.log('Found transcript button, clicking to open transcript panel');
        transcriptButton.click();
        
        // Wait for transcript panel to load
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Try again with the panel open
        const segments = document.querySelectorAll('.ytd-transcript-segment-renderer, .segment-text');
        const timestamps = document.querySelectorAll('.ytd-transcript-segment-timestamp-renderer, .segment-timestamp');
        
        if (segments.length > 0) {
          console.log('Found transcript segments after opening panel');
          const transcriptSegments = [];
          
          for (let i = 0; i < segments.length; i++) {
            const text = segments[i].textContent.trim();
            let timestamp = '00:00';
            let startSeconds = 0;
            
            if (timestamps[i]) {
              timestamp = timestamps[i].textContent.trim();
              startSeconds = this.convertTimestampToSeconds(timestamp);
            }
            
            transcriptSegments.push({
              text,
              startSeconds,
              timestamp,
              duration: 5, // Default duration
              offset: startSeconds,
              language: 'en'
            });
          }
          
          // Close the transcript panel
          const closeButton = document.querySelector('[aria-label="Close transcript"]');
          if (closeButton) closeButton.click();
          
          return transcriptSegments;
        }
        
        // Close the panel if we didn't find anything
        const closeButton = document.querySelector('[aria-label="Close transcript"]');
        if (closeButton) closeButton.click();
      }
      
      return null;
    } catch (error) {
      console.error('Error extracting transcript from page:', error);
      return null;
    }
  }

  async fetchTranscriptFromApi(videoId) {
    try {
      const response = await fetch(`${this.baseUrl}/watch?v=${videoId}&gl=US`);
      const html = await response.text();
      
      // Try multiple ways to extract the player config
      const playerConfigMatches = [
        html.match(/"playerConfig":(.+?),"miniplayer/),
        html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/),
        html.match(/"player_response":"(.+?)"/),
        html.match(/"captionTracks":(\[.+?\])/)
      ];
      
      let playerConfig = null;
      let captionsTrack = null;
      
      // Try each match pattern
      for (const match of playerConfigMatches) {
        if (match && match[1]) {
          try {
            // For the escaped JSON case
            if (match[0].includes('player_response')) {
              const jsonStr = match[1].replace(/\\(.)/g, '$1');
              playerConfig = JSON.parse(jsonStr);
              captionsTrack = this.findCaptionsTrack(playerConfig);
              if (captionsTrack) break;
            } else {
              playerConfig = JSON.parse(match[1]);
              captionsTrack = this.findCaptionsTrack(playerConfig);
              if (captionsTrack) break;
              
              // Direct captions track array
              if (match[0].includes('captionTracks')) {
                const captionTracks = JSON.parse(match[1]);
                if (captionTracks && captionTracks.length > 0) {
                  captionsTrack = captionTracks[0].baseUrl;
                  break;
                }
              }
            }
          } catch (e) {
            console.error('Failed to parse match:', e);
          }
        }
      }
      
      if (!captionsTrack) {
        throw new Error('No captions track found for this video');
      }
      
      const captionsResponse = await fetch(captionsTrack);
      const captionsXml = await captionsResponse.text();
      
      return this.parseCaptionsXml(captionsXml);
    } catch (error) {
      console.error('Error in fetchTranscriptFromApi:', error);
      throw error;
    }
  }
  
  async extractFromVideoInfo(videoId) {
    const videoInfoUrl = `${this.baseUrl}/get_video_info?video_id=${videoId}`;
    
    try {
      const response = await fetch(videoInfoUrl);
      const data = await response.text();
      
      const params = new URLSearchParams(data);
      let playerResponse;
      
      try {
        playerResponse = JSON.parse(params.get('player_response') || '{}');
      } catch (e) {
        // Try to find a different pattern for the player response
        const playerResponseMatch = data.match(/player_response=(.+?)&/);
        if (playerResponseMatch) {
          const decoded = decodeURIComponent(playerResponseMatch[1]);
          playerResponse = JSON.parse(decoded);
        } else {
          throw new Error('Could not parse player response');
        }
      }
      
      const captionTracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
      
      if (!captionTracks || captionTracks.length === 0) {
        throw new Error('No caption tracks found');
      }
      
      const captionTrack = captionTracks[0];
      const captionUrl = captionTrack.baseUrl;
      const language = captionTrack.languageCode || 'en';
      
      const captionsResponse = await fetch(captionUrl);
      const captionsXml = await captionsResponse.text();
      
      return this.parseCaptionsXml(captionsXml, language);
    } catch (error) {
      console.error('Error extracting from video info:', error);
      throw error;
    }
  }
  
  async fetchFromTimedText(videoId) {
    try {
      // Try direct timedtext URL which sometimes works
      const timedTextUrl = `${this.baseUrl}/api/timedtext?v=${videoId}&lang=en`;
      const response = await fetch(timedTextUrl);
      
      if (!response.ok) {
        throw new Error(`Timed text API returned status ${response.status}`);
      }
      
      const captionsXml = await response.text();
      
      if (!captionsXml || captionsXml.trim() === '' || !captionsXml.includes('<text')) {
        throw new Error('No captions found in timed text API response');
      }
      
      return this.parseCaptionsXml(captionsXml, 'en');
    } catch (error) {
      console.error('Error fetching from timed text API:', error);
      throw error;
    }
  }
  
  findCaptionsTrack(playerConfig) {
    try {
      // Method 1: modern player config
      const captions = playerConfig?.captions;
      if (captions?.playerCaptionsTracklistRenderer?.captionTracks) {
        const captionTracks = captions.playerCaptionsTracklistRenderer.captionTracks;
        if (captionTracks && captionTracks.length > 0) {
          return captionTracks[0].baseUrl;
        }
      }
      
      // Method 2: direct captionTracks array
      if (playerConfig?.captionTracks && playerConfig.captionTracks.length > 0) {
        return playerConfig.captionTracks[0].baseUrl;
      }
      
      // Method 3: legacy structure
      const args = playerConfig?.args;
      if (args && args.caption_tracks) {
        const tracks = args.caption_tracks.split(',');
        if (tracks && tracks.length > 0) {
          const track = tracks[0].split('&');
          for (const param of track) {
            if (param.startsWith('u=')) {
              return decodeURIComponent(param.substring(2));
            }
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error finding captions track:', error);
      return null;
    }
  }
  
  parseCaptionsXml(xml, lang = 'en') {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xml, 'text/xml');
      const textNodes = xmlDoc.getElementsByTagName('text');
  
      const transcript = [];
      let totalDuration = 0;
  
      for (let i = 0; i < textNodes.length; i++) {
        const node = textNodes[i];
        const text = node.textContent || '';
        const start = parseFloat(node.getAttribute('start') || '0');
        const duration = parseFloat(node.getAttribute('dur') || '0');
        const timestamp = this.formatTimestamp(start);
        
        transcript.push({
          text: text.trim(),
          startSeconds: start,
          timestamp: timestamp,
          duration: duration,
          offset: start,
          language: lang
        });
        
        totalDuration = Math.max(totalDuration, start + duration);
      }
      
      if (transcript.length > 0) {
        transcript[transcript.length - 1].totalDuration = totalDuration;
      }
  
      return transcript;
    } catch (error) {
      console.error('Error parsing captions XML:', error);
      
      // Fallback to regex parsing if DOM parsing fails
      try {
        return this.parseXmlWithRegex(xml, lang);
      } catch (regexError) {
        throw new Error('Failed to parse captions');
      }
    }
  }
  
  parseXmlWithRegex(xml, lang = 'en') {
    const transcript = [];
    let totalDuration = 0;
    
    // Simple regex to extract text elements
    const regex = /<text[^>]*start="([^"]*)"[^>]*dur="([^"]*)"[^>]*>([\s\S]*?)<\/text>/g;
    
    let match;
    while ((match = regex.exec(xml)) !== null) {
      const start = parseFloat(match[1]);
      const duration = parseFloat(match[2]);
      const text = match[3]
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
      
      transcript.push({
        text: text.trim(),
        startSeconds: start,
        timestamp: this.formatTimestamp(start),
        duration: duration,
        offset: start,
        language: lang
      });
      
      totalDuration = Math.max(totalDuration, start + duration);
    }
    
    if (transcript.length > 0) {
      transcript[transcript.length - 1].totalDuration = totalDuration;
    }
    
    return transcript;
  }
  
  formatTimestamp(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
  }
  
  convertTimestampToSeconds(timestamp) {
    const parts = timestamp.split(':').map(Number);
    
    if (parts.length === 3) { // HH:MM:SS
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) { // MM:SS
      return parts[0] * 60 + parts[1];
    } else {
      return parts[0];
    }
  }
}

window.YouTubeTranscript = new YouTubeTranscript();