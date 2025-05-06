'use strict';

// With background scripts you can communicate with popup
// and contentScript files.
// For more information on background script,
// See https://developer.chrome.com/extensions/background_pages

// GPT functionality
async function createGptUtterance(prompt) {
    try {
        const result = await chrome.storage.local.get({
            apiKey: '',
        });
        const apiKey = result.apiKey;
        if (!apiKey) {
            return {error: {message: 'Please set your OpenAI API key in the extension options.'}};
        }

        const chatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [{role: "user", content: prompt}],
                temperature: 0.7,
                max_tokens: 150
            })
        });

        if (!chatResponse.ok) {
            return {
                error: {
                    message: "Something went wrong fetching the answer from GPT; Status code: " + chatResponse.status + ", " + chatResponse.statusText
                }
            };
        }

        const data = await chatResponse.json();
        return {text: data.choices[0].message.content};
    } catch (error) {
        return {error: {message: error.message}};
    }
}

// Message handling
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'openOptionsPage') {
        chrome.runtime.openOptionsPage();
    } else if (request.message === "sendChatToGpt") {
        createGptUtterance(request.prompt)
            .then(response => {
                chrome.tabs.sendMessage(sender.tab.id, {
                    message: "gptResponse",
                    response: response
                });
            });
        return true; // Keep the message channel open for async response
    }
});

