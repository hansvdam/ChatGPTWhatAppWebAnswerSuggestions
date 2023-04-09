document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('options-form').addEventListener('submit', saveOptions);

const chatHistoryWarningAlert = document.getElementById('chatHistoryWarningAlert');

const closeAlertButton = document.querySelector('#hideHistoryWarningAlert');

function showCustomAlert() {
    chatHistoryWarningAlert.style.visibility = 'visible';
}

function hideCustomAlert() {
    chatHistoryWarningAlert.style.visibility = 'hidden';
}

closeAlertButton.addEventListener('click', function () {
    hideCustomAlert();
});

document.getElementById('send-history-auto').addEventListener('click', function () {
    showCustomAlert();
});

document.getElementsByName("api-choice").forEach(function (radio) {
    radio.addEventListener("change", function () {
        if (this.value === "openai") {
            document.getElementById("api-key-container").style.display = "block";
            document.getElementById("api-key").required = true;
        } else {
            document.getElementById("api-key-container").style.display = "none";
            document.getElementById("api-key").required = false;
        }
    });
});

function saveOptions(e) {
    e.preventDefault();
    const apiKey = document.getElementById('api-key').value;
    const sendHistory = document.querySelector('input[name="send-history"]:checked').value;
    const apiChoice = document.querySelector('input[name="api-choice"]:checked').value;
    // const copyChatSuggestion = document.querySelector('input[name="copy-chat-suggestion"]:checked').value;

    chrome.storage.local.set({
        apiKey: apiKey,
        sendHistory: sendHistory,
        apiChoice: apiChoice,
        // copyChatSuggestion: copyChatSuggestion,
    }, () => {
        const alertBox = document.querySelector('.toast');
        alertBox.style.display = 'block';
        setTimeout(function () {
            // hide the alert after 5 seconds
            alertBox.style.display = 'none';
            window.close()
        }, 2000);

    });
}

function restoreOptions() {
    chrome.storage.local.get({
        apiKey: '',
        sendHistory: 'manual',
        apiChoice: 'webapp'
        // copyChatSuggestion: 'auto',
    }, (items) => {
        document.getElementById('api-key').value = items.apiKey;

        const sendHistoryRadio = document.querySelector(`input[name="send-history"][value="${items.sendHistory}"]`);
        if (sendHistoryRadio) {
            sendHistoryRadio.checked = true;
        }

        const apiChoiceRadio = document.querySelector(`input[name="api-choice"][value="${items.apiChoice}"]`);
        if (apiChoiceRadio) {
            apiChoiceRadio.checked = true;
        }
        if (items.apiChoice === 'openai') {
            document.getElementById("api-key-container").style.display = "block";
            document.getElementById("api-key").required = true;
        }
    });
}
