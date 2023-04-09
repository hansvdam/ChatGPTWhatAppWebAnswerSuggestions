function parseHtml(main) {
    const main2 = main;
    const chatHistory = [];
    // console.log(main2)
    const msgContainers = main2.querySelectorAll("div[data-testid='msg-container']");
    msgContainers.forEach((el) => {
        let messageStringCollector = '';
        const elements = el.querySelectorAll('.copyable-text');
        elements.forEach((el) => {
            const messageLabel = el.getAttribute('data-pre-plain-text');
            if (messageLabel !== null) { // get the prefix (person)
                if (el.closest('.message-out') !== null) {
                    messageStringCollector += "Me: ";
                } else {
                    messageStringCollector += "Contact: ";
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
    const chatHistoryShort = chatHistory.slice(-8);
    // if last expression is mine
    const lastExpression = chatHistoryShort[chatHistoryShort.length - 1];
    let lastIsMine = false;
    if (lastExpression.includes("Me:")) {
        lastIsMine = true
    }
    const chatHistoryShortAsString = chatHistoryShort.join('\n\n')
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

