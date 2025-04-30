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

function saveOptions(e) {
    e.preventDefault();
    const apiKey = document.getElementById('api-key').value;
    const sendHistory = document.querySelector('input[name="send-history"]:checked').value;
    const toneOfVoice = document.getElementById('tone-of-voice').value;
    console.log('Saving options with sendHistory:', sendHistory);

    chrome.storage.local.set({
        apiKey: apiKey,
        sendHistory: sendHistory,
        apiChoice: 'openai',
        toneOfVoice: toneOfVoice
    }, () => {
        console.log('Options saved successfully');
        const alertBox = document.querySelector('.toast');
        alertBox.style.display = 'block';
        setTimeout(function () {
            alertBox.style.display = 'none';
            window.close()
        }, 2000);
    });
}

function restoreOptions() {
    chrome.storage.local.get({
        apiKey: '',
        sendHistory: 'manual',
        apiChoice: 'openai',
        toneOfVoice: 'Use Emoji and my own writing style. Be concise.'
    }, (items) => {
        document.getElementById('api-key').value = items.apiKey;
        document.getElementById('tone-of-voice').value = items.toneOfVoice;

        const sendHistoryRadio = document.querySelector(`input[name="send-history"][value="${items.sendHistory}"]`);
        if (sendHistoryRadio) {
            sendHistoryRadio.checked = true;
        }
    });
}
