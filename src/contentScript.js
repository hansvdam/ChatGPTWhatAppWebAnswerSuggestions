'use strict';

// Content script file will run in the context of web page.
// With content script you can manipulate the web pages using
// Document Object Model (DOM).
// You can also pass information to the parent extension.

// We execute this script by making an entry in manifest.json file
// under `content_scripts` property

// For more information on Content Scripts,
// See https://developer.chrome.com/extensions/content_scripts

// Log `title` of current active web page
const pageTitle = document.head.getElementsByTagName('title')[0].innerHTML;
console.log(
    `Page title is: '${pageTitle}' - evaluated by Chrome extension's 'contentScript.js' file`
);

// const link = document.createElement('link');
// link.rel = 'stylesheet';
// link.type = 'text/css';
// link.href = chrome.runtime.getURL('content.css');
// document.head.appendChild(link);

// let apiKey;
let sendHistory = false;
let apiKey = null;

function readData() {
    console.log('readData')
    try {
        chrome.storage.local.get({
            apiKey: '',
            sendHistory: 'manual',
        }, (result) => {
            console.log('Storage result:', result); // Debug log
            apiKey = result.apiKey;
            sendHistory = result.sendHistory;
            console.log('sendHistory set to:', sendHistory); // Debug log
        })
    } catch (e) {
        console.error('Error reading storage:', e); // Debug log
    }
}

readData();

async function copyToSendField(text) {
    try {
        const textareaEl = globalMainNode.querySelector('[contenteditable="true"]');
        textareaEl.focus();
        document.execCommand('insertText', false, text);
    } catch (e) {
    }
}

let delayTimer;

let parseHtmlFunction

function triggerEvent() {
    if (delayTimer) {
        clearTimeout(delayTimer);
    }
    delayTimer = setTimeout(parseHtmlFunction, 100); // Change 1000 to the delay time you want (in milliseconds)
}

let globalMainNode;
let newFooterParagraph;

async function createPrompt(lastIsMine, chatHistoryShort) {
    let promptCenter;
    let mePrefix = 'Me: ';
    let promptPrefix1 = "You are an excellent chat-turn completer for Whatsapp. Your own turns in the provided chat-history are prefixed by 'Me: ', the turns of others by '<integer>: '. In a one-on-one coversation the other's turn is prefixed by '1: '.";
    if (lastIsMine) {
        promptCenter = 'Complete the following chat by providing a second message for my double-texting sequence. Do not react but continue the thought, elaborate, or add a supplementary point, without repeating the last utterance.';
    } else {
        promptCenter = 'As "Me", give an utterance completing the following chat conversation flow.';
    }

    const result = await new Promise((resolve) => {
        chrome.storage.local.get({
            toneOfVoice: 'Use Emoji and my own writing style. Be concise.'
        }, resolve);
    });

    const tone_of_voice = result.toneOfVoice;
    let prompt = promptPrefix1 + ' ' + promptCenter + ' ' + tone_of_voice + '\n\n' + "chat history:\n" + chatHistoryShort + "\n\n" + mePrefix;
    console.log("prompt:", prompt)
    return prompt;
}

let globalGptButtonObject;

function gptButtonClicked() {
    chrome.storage.local.get({
        askedForPermission: false,
    }, (result) => {
        if (!result.askedForPermission) {
            let message = "<ul>" +
                "<li>The last 10 messages of your chat-conversation will be sent to openai, each time you press this button.</li>" +
                "<li>They are handled by openai according to their <a href='https://openai.com/policies/api-data-usage-policies' target='_blank'>api-documentation</a> and <a href='https://openai.com/policies/privacy-policy' target='_blank'>privacy policy</a>.</li>" +
                "<li>This is less secure than the end-to-end encryption that <a href='https://faq.whatsapp.com/820124435853543/?helpref=uf_share' target='_blank'>WhatsApp(tm) uses</a>.</li>" +
                "</ul><br><br>" +
                "<p style=\"display: inline-block; text-align: center; width: 100%;\">Are you ok with that?</p>"
            confirmDialog(message).then((result) => {
                if (result) {
                    chrome.storage.local.set({
                        askedForPermission: true,
                    }, () => {
                    })
                    triggerEvent()
                }
            })
        } else {
            triggerEvent()
        }
    })
}

function maybeShowOptionsHintInResponseField() {
    chrome.storage.local.get({
        optionsHintShown: 0,
    }, (result) => {
        if (result.optionsHintShown < 3) {
            const path = '<path d="m9.25 22-.4-3.2q-.325-.125-.612-.3-.288-.175-.563-.375L4.7 19.375l-2.75-4.75 2.575-1.95Q4.5 12.5 4.5 12.337v-.675q0-.162.025-.337L1.95 9.375l2.75-4.75 2.975 1.25q.275-.2.575-.375.3-.175.6-.3l.4-3.2h5.5l.4 3.2q.325.125.613.3.287.175.562.375l2.975-1.25 2.75 4.75-2.575 1.95q.025.175.025.337v.675q0 .163-.05.338l2.575 1.95-2.75 4.75-2.95-1.25q-.275.2-.575.375-.3.175-.6.3l-.4 3.2Zm2.8-6.5q1.45 0 2.475-1.025Q15.55 13.45 15.55 12q0-1.45-1.025-2.475Q13.5 8.5 12.05 8.5q-1.475 0-2.488 1.025Q8.55 10.55 8.55 12q0 1.45 1.012 2.475Q10.575 15.5 12.05 15.5Zm0-2q-.625 0-1.062-.438-.438-.437-.438-1.062t.438-1.062q.437-.438 1.062-.438t1.063.438q.437.437.437 1.062t-.437 1.062q-.438.438-1.063.438ZM12 12Zm-1 8h1.975l.35-2.65q.775-.2 1.438-.588.662-.387 1.212-.937l2.475 1.025.975-1.7-2.15-1.625q.125-.35.175-.738.05-.387.05-.787t-.05-.788q-.05-.387-.175-.737l2.15-1.625-.975-1.7-2.475 1.05q-.55-.575-1.212-.963-.663-.387-1.438-.587L13 4h-1.975l-.35 2.65q-.775.2-1.437.587-.663.388-1.213.938L5.55 7.15l-.975 1.7 2.15 1.6q-.125.375-.175.75-.05.375-.05.8 0 .4.05.775t.175.75l-2.15 1.625.975 1.7 2.475-1.05q.55.575 1.213.962.662.388 1.437.588Z\"/>'

            const optionsButton = "<svg style=\"display: inline; vertical-align: middle;\" viewBox=\"0 0 24 24\" height=\"24\" width=\"24\" preserveAspectRatio=\"xMidYMid meet\">" + path + " </svg>"
            newFooterParagraph.innerHTML = "<p>use the options button " + optionsButton + " to make GPT answers appear here automatically.</p>"
            chrome.storage.local.set({
                optionsHintShown: result + 1,
            }, () => {
            })
        }
    })
}

chrome.storage.local.onChanged.addListener((changes) => {
    if (changes.sendHistory || changes.apiKey || changes.apiChoice) {
        location.reload();
    }
});

function processMainNodeAdded(addedNode) {
    const mainNode = addedNode;
    globalMainNode = addedNode;
    readData();
    const footer = mainNode.getElementsByTagName('footer')[0];
    footer.querySelectorAll('.selectable-text.copyable-text')[0];
// Create a new footer element with the same HTML content as the original
    const {
        newFooter,
        gptButtonObject,
        copyButton
    } = createGptFooter(footer, addedNode);
    globalGptButtonObject = gptButtonObject;
    newFooterParagraph = newFooter.querySelectorAll('.selectable-text.copyable-text')[0];
    maybeShowOptionsHintInResponseField();
    copyButton.addEventListener('click', () => {
        copyToSendField(newFooterParagraph.textContent);
    });
    console.log("sendHistory:", sendHistory)
    parseHtmlFunction = async function () {
        const {chatHistoryShort, lastIsMine} = parseHtml(addedNode)
        // console.log("chatInput:", chatHistoryShort)
        let prompt = await createPrompt(lastIsMine, chatHistoryShort);
        gptButtonObject.setBusy(true)
        writeTextToSuggestionField('', true); // Show loading spinner
        await chrome.runtime.sendMessage({
            message: "sendChatToGpt",
            prompt: prompt,
        });
    };
    if (sendHistory === 'auto') {
        triggerEvent()
    }
    const gptButton = gptButtonObject.gptButton;
    console.log("gptButton:", gptButton)
    gptButton.addEventListener('click', () => {
        gptButtonClicked();

    });
}

const observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
        // Check if a node was added
        if (mutation.type === 'childList') {
            // Get the added node's ID
            mutation.addedNodes.forEach(function (addedNode) {
                const addedNodeId = addedNode.id
                if (addedNodeId === 'main') {
                    processMainNodeAdded(addedNode);
                } else if (addedNode.role === 'row') { // when chat messages come in (or are sent out by me)
                    // console.log("row added:", addedNode)
                    if (sendHistory === 'auto') {
                        console.log("uploadButton present")
                        triggerEvent()
                    }
                }
            })
        }
    })
});

let confirmVisible = false;

// Start observing the target node for configured mutations
observer.observe(document.body, {
    childList: true, // Watch for changes in the children of the node
    subtree: true // Watch for changes in the descendants of the node
});

async function writeTextToSuggestionField(response, isLoading = false) {
    try {
        if (isLoading) {
            newFooterParagraph.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <style>
                        .spinner {
                            transform-origin: center;
                            animation: spin 0.6s linear infinite;
                        }
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    </style>
                    <circle class="spinner" cx="12" cy="12" r="10" stroke="#54656F" stroke-width="3" fill="none" stroke-dasharray="15, 85" stroke-dashoffset="0"/>
                </svg>`;
        } else {
            newFooterParagraph.innerHTML = response;
        }
    } catch (e) {
        console.error(e);
    }
}

chrome.runtime.onMessage.addListener((request) => {
    if (request.message === "gptResponse") {
        const response = request.response;
        globalGptButtonObject.setBusy(false);
        if (response.error !== null && response.error !== undefined) {
            writeTextToSuggestionField(response.error.message);
            return;
        }
        writeTextToSuggestionField(response.text.replace(/^Me:\s*/, ''));
    }
})
