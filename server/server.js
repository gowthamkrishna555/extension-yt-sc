const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const port = 3000;

// Middleware
app.use(cors({
  origin: '*',  // In production, restrict this to your extension's origin
}));
app.use(bodyParser.json());

// Get API key from environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('Error: OpenAI API key not found. Please set it in .env file');
}

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
    
    if (!text) {
      return res.status(400).json({ error: 'Text parameter is required' });
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
    
    if (data.error) {
      console.error("OpenAI API error:", data.error);
      return res.status(500).json({ error: data.error.message });
    }

    try {
      const enhancedAnalysis = JSON.parse(data.choices?.[0]?.message?.content);
      res.json(enhancedAnalysis);
    } catch (parseError) {
      console.error("Error parsing JSON from OpenAI:", parseError);
      res.status(500).json({ error: 'Invalid response format from OpenAI' });
    }
  } catch (error) {
    console.error('Error in /api/enhanced-analysis:', error);
    res.status(500).json({ error: 'Server error processing enhanced analysis request' });
  }
});

// Simple health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Spell check server is running' });
});

app.listen(port, () => {
  console.log(`Spell check server running at http://localhost:${port}`);
});