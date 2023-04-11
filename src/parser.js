const encoder = new TextEncoder();

class LinkedSet {
    constructor() {
        this.set = new Set();
        this.array = [];
    }

    add(value) {
        if (!this.set.has(value)) {
            this.set.add(value);
            this.array.push(value);
        }
    }

    getPosition(value) {
        return this.array.indexOf(value);
    }
}

function parseHtml(main) {
    const main2 = main;
    const chatHistory = [];
    // console.log(main2)
    let msgContainers = main2.querySelectorAll("div[data-testid='msg-container']");

    const linkedSet = new LinkedSet();
    msgContainers = Array.from(msgContainers).slice(-10);
    msgContainers.forEach((el) => {
        let messageStringCollector = '';
        const elements = el.querySelectorAll('.copyable-text');
        elements.forEach((el) => {
            const messageLabel = el.getAttribute('data-pre-plain-text');
            if (messageLabel !== null) { // get the prefix (person)
                if (el.closest('.message-out') !== null) {
                    messageStringCollector += "me: ";
                } else {
                    let contactName = messageLabel.replace(/\[.*?\]\s*/, "").slice(0, -2)
                    linkedSet.add(contactName)
                    const contactNumber = linkedSet.getPosition(contactName) + 1
                    messageStringCollector += contactNumber + ": ";
                }
            } else { // get the message itself
                const messageContent = getTextWithEmojis(el);
                if (typeof messageContent !== "undefined") {
                    messageStringCollector += messageContent;
                }
            }
        })
        if (messageStringCollector.length !== 0) {
            chatHistory.push(messageStringCollector);
        }
    });
    // console.log('count', chatHistory.length)
    // if last expression is mine
    const lastExpression = chatHistory[chatHistory.length - 1];
    let lastIsMine = false;
    if (lastExpression.includes("me:")) {
        lastIsMine = true
    }
    const chatHistoryShortAsString = chatHistory.join('\n\n')
    // console.log(chatHistoryShortAsString);
    return {chatHistoryShort: chatHistoryShortAsString, lastIsMine: lastIsMine}
}

function getTextWithEmojis(element) {
    let result = '';

    for (const childNode of element.childNodes) {
        if (childNode.nodeType === Node.TEXT_NODE) {
            result += childNode.textContent;
        } else if (childNode.nodeType === Node.ELEMENT_NODE) {
            if (childNode.tagName === 'IMG' && childNode.hasAttribute('data-plain-text')) {
                result += childNode.getAttribute('data-plain-text');
            } else {
                result += getTextWithEmojis(childNode);
            }
        }
    }

    return result;
}

