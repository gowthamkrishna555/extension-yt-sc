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
        model: "gpt-3.5-turbo",
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
        model: "gpt-3.5-turbo",
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

// Endpoint for tone analysis
app.post('/api/analyze-tone', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text parameter is required' });
    }

    const prompt = `Analyze the tone of the following text and provide a detailed assessment. Return the response as JSON with the following structure:
    {
      "primaryTone": "formal|informal|casual|professional|academic|friendly|urgent|neutral",
      "emotions": ["confident", "hesitant", "angry", "happy", etc.],
      "formality": 1-10 scale (1 being very informal, 10 being extremely formal),
      "suggestions": ["suggestion 1", "suggestion 2"] (ways to improve or alter the tone if needed)
    }
    
    Text to analyze: "${text}"`;
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
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
      const toneAnalysis = JSON.parse(data.choices?.[0]?.message?.content);
      res.json(toneAnalysis);
    } catch (parseError) {
      console.error("Error parsing JSON from OpenAI:", parseError);
      res.status(500).json({ error: 'Invalid response format from OpenAI' });
    }
  } catch (error) {
    console.error('Error in /api/analyze-tone:', error);
    res.status(500).json({ error: 'Server error processing tone analysis request' });
  }
});

// Endpoint for readability analysis
app.post('/api/readability', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text parameter is required' });
    }

    const prompt = `Analyze the readability of the following text. Return the response as a JSON object with the following structure:
    {
      "fleschKincaidGrade": numeric value (approximate reading grade level),
      "readabilityScore": 1-100 (higher is more readable),
      "averageSentenceLength": numeric value,
      "complexWordPercentage": percentage as numeric value,
      "suggestions": ["suggestion 1", "suggestion 2"] (specific ways to improve readability)
    }
    
    Text to analyze: "${text}"`;
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
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
      const readabilityResults = JSON.parse(data.choices?.[0]?.message?.content);
      res.json(readabilityResults);
    } catch (parseError) {
      console.error("Error parsing JSON from OpenAI:", parseError);
      res.status(500).json({ error: 'Invalid response format from OpenAI' });
    }
  } catch (error) {
    console.error('Error in /api/readability:', error);
    res.status(500).json({ error: 'Server error processing readability request' });
  }
});

// Endpoint for plagiarism check
app.post('/api/plagiarism', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text parameter is required' });
    }

    const prompt = `Analyze the following text for signs of potential plagiarism or unoriginal content. This is a simulation - don't actually check the internet, but estimate based on your knowledge of common phrases, writing patterns, and notable published works.
    
    Return your response as a JSON object with the following structure:
    {
      "originalityScore": 0-100 (higher is more original),
      "potentialIssues": [
        {"fragment": "text excerpt that may be unoriginal", "concern": "description of concern"}
      ],
      "recommendations": ["recommendation 1", "recommendation 2"]
    }
    
    Text to analyze: "${text}"`;
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      }),
    });

    const data = await response.json();
    
    if (data.error) {
      console.error("OpenAI API error:", data.error);
      return res.status(500).json({ error: data.error.message });
    }

    try {
      const plagiarismResults = JSON.parse(data.choices?.[0]?.message?.content);
      res.json(plagiarismResults);
    } catch (parseError) {
      console.error("Error parsing JSON from OpenAI:", parseError);
      res.status(500).json({ error: 'Invalid response format from OpenAI' });
    }
  } catch (error) {
    console.error('Error in /api/plagiarism:', error);
    res.status(500).json({ error: 'Server error processing plagiarism check request' });
  }
});

// Endpoint for synonym suggestions
app.post('/api/synonyms', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text parameter is required' });
    }

    const prompt = `Identify potentially repetitive or common words in the following text and suggest synonyms to enhance the vocabulary.
    
    Return your response as a JSON object with the following structure:
    {
      "suggestions": [
        {
          "word": "original word",
          "position": approximate character position,
          "synonyms": ["synonym1", "synonym2", "synonym3"],
          "context": "... text surrounding the word ..."
        }
      ]
    }
    
    Only include words that would benefit from synonym replacement - focus on repetitive words, overused words, or words where a more precise or sophisticated alternative might improve the text.
    
    Text to analyze: "${text}"`;
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      }),
    });

    const data = await response.json();
    
    if (data.error) {
      console.error("OpenAI API error:", data.error);
      return res.status(500).json({ error: data.error.message });
    }

    try {
      const synonymResults = JSON.parse(data.choices?.[0]?.message?.content);
      res.json(synonymResults);
    } catch (parseError) {
      console.error("Error parsing JSON from OpenAI:", parseError);
      res.status(500).json({ error: 'Invalid response format from OpenAI' });
    }
  } catch (error) {
    console.error('Error in /api/synonyms:', error);
    res.status(500).json({ error: 'Server error processing synonym request' });
  }
});

// Endpoint for language detection
app.post('/api/detect-language', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text parameter is required' });
    }

    const prompt = `Detect the language of the following text. Return a JSON object with the following structure:
    {
      "detectedLanguage": "The full name of the language",
      "languageCode": "ISO language code (e.g., en, es, fr, de, etc.)",
      "confidence": 0-100 (how confident you are in the detection)
    }
    
    Text to analyze: "${text}"`;
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
      }),
    });

    const data = await response.json();
    
    if (data.error) {
      console.error("OpenAI API error:", data.error);
      return res.status(500).json({ error: data.error.message });
    }

    try {
      const languageResults = JSON.parse(data.choices?.[0]?.message?.content);
      res.json(languageResults);
    } catch (parseError) {
      console.error("Error parsing JSON from OpenAI:", parseError);
      res.status(500).json({ error: 'Invalid response format from OpenAI' });
    }
  } catch (error) {
    console.error('Error in /api/detect-language:', error);
    res.status(500).json({ error: 'Server error processing language detection request' });
  }
});

// Endpoint for text translation
app.post('/api/translate', async (req, res) => {
  try {
    const { text, targetLanguage } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text parameter is required' });
    }
    
    if (!targetLanguage) {
      return res.status(400).json({ error: 'Target language parameter is required' });
    }

    const prompt = `Translate the following text into ${targetLanguage}. Maintain the original tone, style, and formatting as much as possible. Return a JSON object with the following structure:
    {
      "sourceLanguage": "detected source language",
      "targetLanguage": "${targetLanguage}",
      "translatedText": "the translated text"
    }
    
    Text to translate: "${text}"`;
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
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
      const translationResults = JSON.parse(data.choices?.[0]?.message?.content);
      res.json(translationResults);
    } catch (parseError) {
      console.error("Error parsing JSON from OpenAI:", parseError);
      res.status(500).json({ error: 'Invalid response format from OpenAI' });
    }
  } catch (error) {
    console.error('Error in /api/translate:', error);
    res.status(500).json({ error: 'Server error processing translation request' });
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
        model: "gpt-3.5-turbo",
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