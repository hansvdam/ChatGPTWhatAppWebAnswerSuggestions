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
    console.log('Saving options with sendHistory:', sendHistory);

    chrome.storage.local.set({
        apiKey: apiKey,
        sendHistory: sendHistory,
        apiChoice: 'openai'
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
        apiChoice: 'openai'
    }, (items) => {
        document.getElementById('api-key').value = items.apiKey;

        const sendHistoryRadio = document.querySelector(`input[name="send-history"][value="${items.sendHistory}"]`);
        if (sendHistoryRadio) {
            sendHistoryRadio.checked = true;
        }
    });
}
