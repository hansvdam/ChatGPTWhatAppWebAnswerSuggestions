importScripts('createGptUtterance.js');
'use strict';

// With background scripts you can communicate with popup
// and contentScript files.
// For more information on background script,
// See https://developer.chrome.com/extensions/background_pages

// Reload whatsapp tab when extension is installed/updated
chrome.runtime.onInstalled.addListener(async () => {
    chrome.tabs.query({}, function (tabs) {
        for (var i = 0; i < tabs.length; i++) {
            if ("https://web.whatsapp.com/" === tabs[i].url) {
                chrome.tabs.reload(tabs[i].id);
            }
        }
    });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'openOptionsPage') {
        chrome.runtime.openOptionsPage();
    }
});

