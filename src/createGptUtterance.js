chrome.runtime.onMessage.addListener(
    function (request, sender) {
      if (request.message === "sendChatToGpt") {
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
    }
);

let chatResponseBodyReader = null;

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
          message: 'No API key found. Please enter your OpenAI API key in the extension options.'
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

async function postConversationReal(apiKey, prompt, handleResponseOrError) {
  const requestPayload = {
    model: "gpt-4.1",
    messages: [{role: "user", content: prompt}],
    temperature: 0.5,
  };

  const chatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestPayload),
  });

  if (!chatResponse.ok) {
    switch (chatResponse.status) {
      case 429:
        handleResponseOrError({
          error: {
            type: "processingError",
            message: "You have been rate-limited by OpenAI. Please try again."
          }
        });
        break;
      case 401:
        handleResponseOrError({
          error: {
            type: "processingError",
            message: "Invalid API key. Please check your API key in the extension options."
          }
        });
        break;
      default:
        handleResponseOrError({
          error: {
            type: "processingError",
            message: "Something went wrong fetching the answer from GPT; Status code: " + chatResponse.status + ", " + chatResponse.statusText
          }
        });
    }
    return;
  }

  try {
    const response = await chatResponse.json();
    if (response.choices && response.choices[0] && response.choices[0].message) {
      handleResponseOrError({text: response.choices[0].message.content.trim()});
    } else {
      handleResponseOrError({
        error: {
          type: "unknown",
          message: "Unexpected response format from OpenAI API"
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
