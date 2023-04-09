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

var link = document.createElement('link');
link.rel = 'stylesheet';
link.type = 'text/css';
link.href = chrome.runtime.getURL('content.css');
document.head.appendChild(link);

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
      apiKey = result.apiKey;
      sendHistory = result.sendHistory;
    })
  } catch (e) {
    // sometimes this happens when resetting the extension, its just annoying to see this error in the console, so we catch it
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

function createPrompt(lastIsMine, chatHistoryShort) {
  let promptPrefix;
  let promptInstructions = 'Me: ';
  if (lastIsMine) {
    promptPrefix = 'As me, give a double texting utterance completing the following chat conversation flow. Use Emoij and the style of Me and do not repeat the contents of the last utterance:\n\n';
  } else {
    promptPrefix = 'As me, give an utterance completing the following chat conversation flow. Use Emoij and the style of Me:\n\n';
  }
  let prompt = promptPrefix + chatHistoryShort + "\n\n" + promptInstructions;
  console.log("prompt:", prompt)
  return prompt;
}

let globalGptButtonObject;

function gptButtonClicked(gptButton) {
  // console.log("gptButton clicked:", gptButton)
  chrome.storage.local.get({
    askedForPermission: false,
  }, (result) => {
    if (!result.askedForPermission) {
      let message = "<ul>" +
          "<li>The last 8 messages of your chat-conversation will be sent to openai, each time you press this button.</li>" +
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
    let prompt = createPrompt(lastIsMine, chatHistoryShort);
    gptButtonObject.setBusy(true)
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
    gptButtonClicked(gptButton);

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

async function writeTextToSuggestionField(response) {
  try {
    newFooterParagraph.innerHTML = response
  } catch (e) {
    console.error(e);
  }
}

chrome.runtime.onMessage.addListener((request, sender) => {
  if (request.message === "gptResponse") {
    var response = request.response;
    globalGptButtonObject.setBusy(false);
    if (response.error !== null && response.error !== undefined) {
      writeTextToSuggestionField(response.error.message);
      return;
    }
    writeTextToSuggestionField(response.text);
  }
})
