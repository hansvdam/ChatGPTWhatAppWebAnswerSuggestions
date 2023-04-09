chrome.runtime.onMessage.addListener(
    function (request, sender) {
      if (request.message === "sendChatToGpt") {
        chrome.storage.local.get({
          apiChoice: 'webapp'
          // copyChatSuggestion: 'auto',
        }, (items) => {
          if (items.apiChoice === 'webapp') {
            createGPTUtteranceWebApi(request.prompt, async function (gptResponse) {
              //send async gptResponse to content script
              try {
                await chrome.tabs.sendMessage(sender.tab.id, {
                  message: "gptResponse",
                  response: gptResponse
                });
              } catch (e) {
                console.error("error sending message back to whatsapp");
              }
            });
          } else {
            createGPTUtteranceRealApi(request.prompt, async function (gptResponse) {
              //send async gptResponse to content script
              try {
                await chrome.tabs.sendMessage(sender.tab.id, {
                  message: "gptResponse",
                  response: gptResponse
                });
              } catch (e) {
                console.error("error sending message back to whatsapp");
              }
            });
          }
        });
      }
    }
);

let chatResponseBodyReader = null;


async function createGPTUtteranceWebApi(prompt, handleResponseOrError) {
  try {
    await chatResponseBodyReader?.cancel();
    chatResponseBodyReader?.releaseLock();
    chatResponseBodyReader = null;

    const sessionToken = await getSessionToken();
    if (sessionToken) {
      await postConversation(sessionToken, prompt, handleResponseOrError);
    } else {
      handleResponseOrError({
        error: {
          type: "noSessionToken",
          message: '<a href="https://chat.openai.com/" target="_blank">Click here to log in to ChatGPT</a>!'
        }
      });
    }
  } catch (e) {
    console.error(e);
    handleResponseOrError({
      error: {
        type: "unknown",
        message: e.message
      }
    });
  }
}

async function getValues(keys) {
  const result = await new Promise((resolve) => {
    chrome.storage.local.get(keys, (values) => {
      resolve(values);
    });
  });

  const values = {};
  keys.forEach((key) => {
    values[key] = result[key];
  });

  return values;
}

async function createGPTUtteranceRealApi(prompt, handleResponseOrError) {
  try {
    await chatResponseBodyReader?.cancel();
    chatResponseBodyReader?.releaseLock();
    chatResponseBodyReader = null;
    const {apiKey} = await getValues(['apiKey']);
    if (apiKey && apiKey.length > 0) {
      await postConversationReal(apiKey, prompt, handleResponseOrError);
    } else {
      handleResponseOrError({
        error: {
          type: "noApiKey",
          message: 'No api key found'
        }
      });
    }

  } catch (e) {
    console.error(e);
    handleResponseOrError({
      error: {
        type: "unknown",
        message: e.message
      }
    });
  }
}

async function getSessionToken() {
  const sessionResponse = await fetch('https://chat.openai.com/api/auth/session');
  if (sessionResponse.status === 200) {
    const {accessToken} = await sessionResponse.json();
    return accessToken;
  } else {
    return null;
  }
}

function generateUUIDv4() {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

function createHeaders(sessionToken) {
  return new Headers({
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + sessionToken,
  });
}

async function postConversation(sessionToken, prompt, handleResponseOrError) {
  const requestPayload = {
    action: 'next',
    messages: [
      {
        id: generateUUIDv4(),
        role: 'user',
        content: {
          content_type: 'text',
          parts: [prompt],
        },
      },
    ],
    model: 'text-davinci-002-render-sha',
    parent_message_id: generateUUIDv4(),
  }

  const chatResponse = await fetch('https://chat.openai.com/backend-api/conversation', {
    method: 'POST',
    headers: createHeaders(sessionToken),
    body: JSON.stringify(requestPayload),
  });
  if (!chatResponse.ok) {
    switch (chatResponse.status) {
      case 429:
        handleResponseOrError({
          error: {
            type: "processingError",
            message: "You have been rate-limited by ChatGPT. Please try again."
          }
        });
        break;
      default :
        handleResponseOrError({
          error: {
            type: "processingError",
            message: "Something went wrong fetching the answer from GPT; Statuscode: " + chatResponse.status + "," + chatResponse.statusText
          }
        });
    }
    return;
  }

  try {
    chatResponseBodyReader = chatResponse.body.getReader();
    while (true) {
      const {done, value} = await chatResponseBodyReader.read();
      if (done) {
        break;
      }
      const streamOutput = new TextDecoder().decode(value);
      const lastAssistantContent = getLastAssistantContentMessage(streamOutput)
      if (lastAssistantContent) {
        handleResponseOrError({text: lastAssistantContent})
      }
    }
  } catch (e) {
    console.error(e);
    handleResponseOrError({
      error:
          {
            type: "unknown",
            message: e.message
          }
    });
  } finally {
  }
}

async function postConversationReal(apiKey, prompt, handleResponseOrError) {
  const requestPayload = {
    model: "gpt-3.5-turbo",
    messages: [{role: "user", content: prompt}],
    // max_tokens: 4096,
    temperature: 0.5,
    // frequency_penalty: 1.0,
    // stream: true,
  };

  const chatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: createHeaders(apiKey),
    body: JSON.stringify(requestPayload),
  });
  if (!chatResponse.ok) {
    switch (chatResponse.status) {
      case 429:
        handleResponseOrError({
          error: {
            type: "processingError",
            message: "You have been rate-limited by ChatGPT. Please try again."
          }
        });
        break;
      default :
        handleResponseOrError({
          error: {
            type: "processingError",
            message: "Something went wrong fetching the answer from GPT; Statuscode: " + chatResponse.status + "," + chatResponse.statusText
          }
        });
    }
    return;
  }

  try {
    chatResponseBodyReader = chatResponse.body.getReader();
    while (true) {
      const {done, value} = await chatResponseBodyReader.read();
      if (done) {
        break;
      }
      const streamOutput = new TextDecoder().decode(value);
      const chatGetAnswer = JSON.parse(streamOutput);
      let content = null;
      if (undefined !== chatGetAnswer.error) {
        let message = chatGetAnswer.error.message;
        console.log("chatGetAnswerError:", message)
        content = message;
      } else {
        try {
          content = chatGetAnswer.choices[0].message.content.trim();
        } catch (e) {
          content = chatGetAnswer;
        }
      }

      if (content) {
        handleResponseOrError({text: content})
      }
    }
  } catch (e) {
    console.error(e);
    handleResponseOrError({
      error:
          {
            type: "unknown",
            message: e.message
          }
    });
  } finally {
  }
}

function getLastAssistantContentMessage(input) {
  const regex = /"role":\s*"assistant".+?"parts":\s*\[(.*?)\]/g;
  let match;
  let lastAssistantContent = '';

  match = regex.exec(input)
  if (!match) {
    return null;
  }
  while (match !== null) {
    lastAssistantContent = match[1];
    match = regex.exec(input)
  }
  return JSON.parse(lastAssistantContent);
}
