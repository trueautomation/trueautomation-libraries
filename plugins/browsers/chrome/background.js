chrome.webRequest.onHeadersReceived.addListener(
  function (details) {
    for (let i = 0; i < details.responseHeaders.length; ++i) {
      if (['content-security-policy', 'x-frame-options'].includes(details.responseHeaders[i].name.toLowerCase())) {
        details.responseHeaders.splice(i, 1);
      }
    }
    return {
      responseHeaders: details.responseHeaders
    };
  }, {
    urls: ["<all_urls>"]
  }, ["blocking", "responseHeaders"]);

chrome.browserAction.onClicked.addListener(function(tab) {
  chrome.tabs.executeScript({
    file: 'extension.js'
  });
});

chrome.contextMenus.create({
  title: 'TA Select',
  contexts: ['all'],
  onclick(info, tab) {
    chrome.tabs.sendMessage(tab.id, {});
  }
})

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.messageType == "taSelect") {
      const notidicationOptions = {
        type: "basic",
        title: 'TA select',
        message: 'Element locator has been successfully saved.',
        iconUrl: 'http://app-dev.trueautomation.io/favicon.png'
      }
      chrome.notifications.create(notidicationOptions);
    }
});
