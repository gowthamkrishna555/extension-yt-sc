// build.js
require('dotenv').config();
const fs = require('fs');

// Inject the key into contentScript template
const content = fs.readFileSync('contentScript.js', 'utf-8');
const injected = content.replace('process.env.OPENAI_API_KEY', `"${process.env.OPENAI_API_KEY}"`);
fs.writeFileSync('contentScript.js', injected);

// Same for background
const bgContent = fs.readFileSync('background.js', 'utf-8');
const bgInjected = bgContent.replace('process.env.OPENAI_API_KEY', `"${process.env.OPENAI_API_KEY}"`);
fs.writeFileSync('background.js', bgInjected);
