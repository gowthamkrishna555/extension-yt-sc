chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: 'spellcheck',
      title: 'Check Spelling',
      contexts: ['selection']
    });
  });
  
  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === 'spellcheck' && info.selectionText) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: spellCheckText,
        args: [info.selectionText]
      });
    }
  });
  
  async function spellCheckText(text) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`, // Replace this
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a grammar and spelling corrector." },
          { role: "user", content: `Correct this: ${text}` }
        ],
        temperature: 0.2
      })
    });
  
    const result = await response.json();
    const corrected = result.choices[0].message.content.trim();
    alert("Corrected:\n\n" + corrected);
  }
  