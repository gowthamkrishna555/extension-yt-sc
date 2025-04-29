const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const ytTranscript = require('youtube-transcript');
require('dotenv').config();

global.DOMParser = require('xmldom').DOMParser;

const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      'chrome-extension://',
      'https://www.youtube.com',
      'https://mail.google.com', 
      'https://www.google.com'
    ];
    
    // For development or if no origin provided (like postman)
    if (!origin || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    // For production, check if the origin starts with any allowed origin
    let isAllowed = false;
    for (const allowedOrigin of allowedOrigins) {
      if (origin.startsWith(allowedOrigin)) {
        isAllowed = true;
        break;
      }
    }
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(bodyParser.json());

// Get API keys from environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.0-flash";


// Detect if running on Vercel
const isVercel = process.env.VERCEL === '1';

if (!OPENAI_API_KEY) {
  console.error('Error: OpenAI API key not found. Please set it in .env file');
}

if (!GEMINI_API_KEY) {
  console.error('Error: OpenAI API key not found. Please set it in .env file');
}

// Spell Check API Endpoints

// Endpoint for full text correction
app.post('/api/correct', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text parameter is required' });
    }

    const prompt = `Correct all grammar and spelling mistakes in the following text. Detect the language automatically and return only the corrected version in the same language, donot translate to other language:\n\n"${text}"`;
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-nano",
        messages: [{ role: "user", content: prompt }],
        temperature: 0,
      }),
    });

    const data = await response.json();
    
    if (data.error) {
      console.error("OpenAI API error:", data.error);
      return res.status(500).json({ error: data.error.message });
    }

    const correctedText = data.choices?.[0]?.message?.content.trim();
    res.json({ correctedText });
  } catch (error) {
    console.error('Error in /api/correct:', error);
    res.status(500).json({ error: 'Server error processing correction request' });
  }
});

// Endpoint for word suggestions
app.post('/api/suggestions', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text parameter is required' });
    }

    const prompt = `Detect the language and identify incorrect words in the following sentence. Return a JSON array of objects with the incorrect word and a list of suggestions in the same language. Do not include explanations.\n\nInput: "${text}"\n\nFormat: [{"word": "incorect", "suggestions": ["incorrect", "in correct"]}]`;
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-nano",
        messages: [{ role: "user", content: prompt }],
        temperature: 0,
      }),
    });

    const data = await response.json();
    
    if (data.error) {
      console.error("OpenAI API error:", data.error);
      return res.status(500).json({ error: data.error.message });
    }

    try {
      const suggestions = JSON.parse(data.choices?.[0]?.message?.content);
      res.json({ suggestions });
    } catch (parseError) {
      console.error("Error parsing JSON from OpenAI:", parseError);
      res.status(500).json({ error: 'Invalid response format from OpenAI' });
    }
  } catch (error) {
    console.error('Error in /api/suggestions:', error);
    res.status(500).json({ error: 'Server error processing suggestions request' });
  }
});

// Endpoint for enhanced text analysis with multiple types of issues
app.post('/api/enhanced-analysis', async (req, res) => {
  try {
    const { text } = req.body;

    console.log("📩 Received text:", text);

    if (!text || text.trim().length < 10) {
      console.warn("⚠️ Insufficient text provided.");
      return res.status(400).json({ error: 'Text parameter is required and must be at least 10 characters long' });
    }

    const prompt = `Perform a comprehensive analysis of the following text, identifying issues related to spelling, grammar, and style/clarity. Return your analysis as a JSON object with the following structure:
    {
      "spelling": [
        {"word": "misspelled word", "position": approximate position, "suggestions": ["correct1", "correct2", "correct3"]}
      ],
      "grammar": [
        {"word": "grammatical issue or phrase", "position": approximate position, "suggestions": ["correction1", "correction2"]}
      ],
      "style": [
        {"word": "problematic word or phrase", "position": approximate position, "issue": "description of style issue", "suggestions": ["alternative1", "alternative2"]}
      ]
    }

    Text to analyze: "${text}"`;

    console.log("📤 Sending prompt to OpenAI API...");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-nano",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
      }),
    });

    const data = await response.json();
    console.log("✅ OpenAI response received.");

    if (data.error) {
      console.error("❌ OpenAI API error:", data.error);
      return res.status(500).json({ error: data.error.message });
    }

    const content = data.choices?.[0]?.message?.content;
    console.log("📨 Raw content from OpenAI:\n", content);

    if (!content || !content.trim().startsWith('{')) {
      console.error("⚠️ OpenAI response is not valid JSON.");
      return res.status(500).json({ error: 'OpenAI did not return a valid JSON structure.' });
    }

    try {
      const enhancedAnalysis = JSON.parse(content);
      console.log("✅ Parsed JSON:", enhancedAnalysis);
      res.json(enhancedAnalysis);
    } catch (parseError) {
      console.error("❌ Error parsing JSON from OpenAI:", parseError);
      res.status(500).json({ error: 'Invalid response format from OpenAI' });
    }
  } catch (error) {
    console.error('🔥 Error in /api/enhanced-analysis:', error);
    res.status(500).json({ error: 'Server error processing enhanced analysis request' });
  }
});

// YouTube Transcript API Endpoints

app.get('/transcript', async (req, res) => {
  try {
    const { videoId } = req.query;
    console.log("ytTranscript keys:", Object.keys(ytTranscript));

    if (!videoId) {
      return res.status(400).json({ error: "Video ID is required" });
    }

    const transcriptArray = await ytTranscript.YouTubeTranscript.fetchTranscript(videoId);

    const plainTranscript = transcriptArray.map(item => item.text).join(' ');
    
    const duration = transcriptArray.reduce((max, item) => {
      const end = item.offset + (item.duration || 0);
      return end > max ? end : max;
    }, 0);    

    
    const lang = transcriptArray.length > 0 && transcriptArray[0].language ? 
      transcriptArray[0].language : 'en';

    res.json({
      transcript: plainTranscript,
      timestampedTranscript: transcriptArray,
      duration: duration,
      lang: lang
    });

    console.log("Transcript response sent");
  } catch (error) {
    console.error('Error fetching transcript:', error);
    res.status(500).json({ 
      error: "Failed to fetch transcript",
      message: error.message,
      stack: error.stack
    });
  }
});

app.post('/summarize', async (req, res) => {
  console.log("Received POST request to summarize"); 
  try {
    const { transcript, videoTitle, existingTimestamps, duration, lang, timestampedTranscript } = req.body;
    console.log("Video Title:", videoTitle);
    console.log("Video Duration:", duration, "seconds");
    console.log("existingTimestamps:", existingTimestamps);
    
    if (!transcript) {
      return res.status(400).json({ error: "Transcript is required" });
    }
    
    const videoDuration = duration || Math.ceil(transcript.split(/\s+/).length / 150) * 60;
    
    const timestampReferences = [];
    if (timestampedTranscript && timestampedTranscript.length > 0) {
      const interval = Math.floor(timestampedTranscript.length / 15);
      for (let i = 0; i < timestampedTranscript.length; i += interval) {
        if (i < timestampedTranscript.length) {
          const item = timestampedTranscript[i];
          timestampReferences.push({
            time: formatTimestamp(item.offset),
            text: item.text.substring(0, 50) + (item.text.length > 50 ? '...' : '')
          });
        }
      }
    }
    
    let prompt = `
      You are a summarization expert. I need a **structured summary** of a YouTube video based on the transcript provided.

      **Format your response EXACTLY as follows:**

      ---

      1. **SUMMARY POINTS (8-12 total):**  
      Summarize the core ideas and insights from the video.  
      Each bullet should express one distinct, complete thought. Be concise and informative.

      - [Key idea or insight #1]  
      - [Key idea or insight #2]  
      - …  
      - [Key idea or insight #8-12]

      2. **HIGHLIGHTS (with timestamps):**  
      Select **exactly 10-12 key moments** that span the **entire video duration**. This is CRITICAL.

      **MANDATORY Coverage & Distribution Rules (100% coverage):**
      - Use **real timestamps** based on the transcript data I'm providing.
      - Your first highlight MUST occur within the **first 10%** of the video.  
      - Your last highlight MUST be within the **final 10%** of the video.  
      - The remaining highlights MUST be **evenly distributed** across the rest of the timeline.
      - Each timestamp must be matched with a **clear, specific description** of what is being said or discussed.
      - The video is exactly ${Math.ceil(videoDuration/60)} minutes long (${formatTimestamp(videoDuration)}).
      - DO NOT generate timestamps beyond ${formatTimestamp(videoDuration)}.

      **Quality Requirements:**
      - ONLY use timestamps that actually exist in the transcript.
      - Highlights must reflect real events, quotes, or key insights — avoid vague or generalized descriptions.
      - Each timestamp should correspond to something specifically said at that moment.

      Then list your highlights:

      - [MM:SS] - [Brief but precise description of what is discussed or shown at this moment]  
      - [MM:SS] - […]  
      - … (10-12 total, evenly distributed)

      ---

      **Video Title:** "${videoTitle}"  
      **Video Duration:** ${formatTimestamp(videoDuration)}
    `;

    if (timestampReferences.length > 0) {
      prompt += `\n\n**Available Timestamp Reference Points:**\n`;
      timestampReferences.forEach(ref => {
        prompt += `- ${ref.time} - "${ref.text}"\n`;
      });
      prompt += `\nUse ONLY these timestamps or times very close to them in your highlights.`;
    }

    if (existingTimestamps && existingTimestamps.length > 0) {
      prompt += `\n\nThe video already contains these timestamps in its description. Please incorporate them into your highlights when relevant:\n`;
      existingTimestamps.forEach(ts => {
        prompt += `- ${ts.time} - ${ts.description}\n`;
      });
    }

    prompt += `\n\n**Transcript:**\n${transcript}\n\nRemember to include timestamp and description for each highlight, formatted exactly as "MM:SS - Description". Your highlights MUST be within the video duration of ${formatTimestamp(videoDuration)}.`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1200
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY
        }
      }
    );
    
    const rawResponse = response.data.candidates[0].content.parts[0].text;
    console.log("Raw Gemini response:", rawResponse); 
    
    const structuredData = parseStructuredResponse(rawResponse, videoDuration);
    console.log("Parsed structured data:", JSON.stringify(structuredData, null, 2)); 
    
    res.json(structuredData);
  } catch (error) {
    console.error('Error generating summary:', error);
    res.status(500).json({ error: "Failed to generate summary" });
  }
});

function parseStructuredResponse(response, videoDuration) {
  const structuredData = {
    title: "",
    summaryPoints: [],
    highlights: []
  };
  
  try {
    const titleMatch = response.match(/TITLE:?\s*\n?(.*?)(?=\n\s*\d+\.|$)/s);
    if (titleMatch && titleMatch[1]) {
      structuredData.title = titleMatch[1].replace(/\*\*/g, '').trim();
    }

    const summaryMatch = response.match(/SUMMARY POINTS:?\s*\n?([\s\S]*?)(?=\n\s*\d+\.|$)/s);
    if (summaryMatch && summaryMatch[1]) {
      const points = summaryMatch[1].split('\n').filter(line => 
        line.trim().startsWith('-') || line.trim().startsWith('•')
      );
      structuredData.summaryPoints = points.map(point => 
        point.replace(/^[-•]\s*/, '').trim()
      );
    }
    
    const highlightsMatch = response.match(/HIGHLIGHTS:?\s*\n?([\s\S]*?)(?=\n\s*\d+\.|$)/s);
    if (highlightsMatch && highlightsMatch[1]) {
      const highlightLines = highlightsMatch[1].split('\n').filter(line => 
        (line.trim().startsWith('-') || line.trim().startsWith('•')) && 
        /\d+:\d+/.test(line) 
      );
      
      highlightLines.forEach(line => {
        const highlightMatch = line.match(/(\d+:\d+(?::\d+)?)\s*-\s*(.*)/);
        if (highlightMatch) {
          const timestamp = highlightMatch[1].trim();
          const description = highlightMatch[2].trim();
          
          const timeInSeconds = convertTimestampToSeconds(timestamp);

          if (timeInSeconds <= videoDuration) {
            structuredData.highlights.push({
              timestamp,
              description
            });
          }
        }
      });
      
      if (videoDuration && structuredData.highlights.length > 0) {
        const firstTimestampSeconds = convertTimestampToSeconds(structuredData.highlights[0].timestamp);
        const lastTimestampSeconds = convertTimestampToSeconds(structuredData.highlights[structuredData.highlights.length - 1].timestamp);
        
        if (firstTimestampSeconds > videoDuration * 0.05) {
          const earlyTimestamp = formatTimestamp(Math.floor(videoDuration * 0.03));
          structuredData.highlights.unshift({
            timestamp: earlyTimestamp,
            description: "Video introduction"
          });
        }
        
        if (lastTimestampSeconds < videoDuration * 0.95) {
          const lateTimestamp = formatTimestamp(Math.floor(videoDuration * 0.97));
          structuredData.highlights.push({
            timestamp: lateTimestamp,
            description: "Video conclusion"
          });
        }
        
        const targetHighlightCount = 12;
        if (structuredData.highlights.length < targetHighlightCount) {
          const currentHighlights = [...structuredData.highlights];
          const newHighlights = [];
          
          currentHighlights.sort((a, b) => {
            return convertTimestampToSeconds(a.timestamp) - convertTimestampToSeconds(b.timestamp);
          });
          
          for (let i = 0; i < currentHighlights.length - 1; i++) {
            const currentSeconds = convertTimestampToSeconds(currentHighlights[i].timestamp);
            const nextSeconds = convertTimestampToSeconds(currentHighlights[i + 1].timestamp);
            const gap = nextSeconds - currentSeconds;
            
            if (gap > videoDuration / targetHighlightCount * 2) { 
              const numIntermediatePoints = Math.floor(gap / (videoDuration / targetHighlightCount)) - 1;
              for (let j = 1; j <= numIntermediatePoints; j++) {
                const intermediateSeconds = currentSeconds + gap * j / (numIntermediatePoints + 1);
                newHighlights.push({
                  timestamp: formatTimestamp(Math.floor(intermediateSeconds)),
                  description: `Key point at ${formatTimestamp(Math.floor(intermediateSeconds))}`
                });
              }
            }
          }
          
          structuredData.highlights = [...currentHighlights, ...newHighlights].sort((a, b) => {
            return convertTimestampToSeconds(a.timestamp) - convertTimestampToSeconds(b.timestamp);
          });
        }
      }
    }
  } catch (error) {
    console.error("Error parsing Gemini response:", error);
  }
  
  structuredData.highlights = structuredData.highlights.filter(h => 
    h.timestamp && h.description
  );
  
  return structuredData;
}

function convertTimestampToSeconds(timestamp) {
  const parts = timestamp.split(':').map(Number);
  
  if (parts.length === 3) { 
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) { 
    return parts[0] * 60 + parts[1];
  } else {
    return parts[0];
  }
}

function formatTimestamp(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}

// Health check endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Spell check server is running' });
});

app.get('/ping', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Start the server
// app.listen(port, () => {
//   console.log(`Server running on port ${port}`);
// });

if (!isVercel) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

// Make sure you export the app
module.exports = app;