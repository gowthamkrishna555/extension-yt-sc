# 📝 YouTube Summarizer & Spell Checker Chrome Extension

A powerful Chrome Extension with two main functionalities:
1. Detects and corrects spelling errors in real-time across any webpage — including platforms like **Google Chat**, **Gmail**, and more — using the **OpenAI API**.
2. Summarizes YouTube videos using the Gemini API by extracting video transcripts and generating concise summaries.

---

## 🚀 Features

- Real-time spell checking
- Works on Google Chat, Gmail, and any editable website
- YouTube video summarization
- Uses OpenAI's GPT model for accurate corrections
- Uses Gemini API for video summarization
- Lightweight and fast
- Backend powered by Node.js and Express
- Secure API key handling with `.env` file

---

## ⚙️ Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/gowthamkrishna555/extension-yt-sc.git
cd extension-yt-sc
```

### 2. Create a `.env` File

Add your API keys:

```env
# backend/.env
OPENAI_API_KEY=your_openai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Install Server Dependencies

```bash
cd backend
npm install express cors axios youtube-transcript dotenv
node server.js
```

### 4. Load the Extension in Chrome

- Open Chrome and go to `chrome://extensions/`
- Enable **Developer Mode** in the top right
- Click **Load unpacked**
- Select the folder where your extension files are located

### 5. Use the Extension

For YouTube Summarization:
- Navigate to any YouTube video
- Click the extension icon in the toolbar
- Click the **"Summarize"** button to get a summary of the video

For Spell Checking:
- Type in any editable field on websites
- The extension automatically checks and corrects spelling in real-time

Make sure the backend server is running before using the extension.