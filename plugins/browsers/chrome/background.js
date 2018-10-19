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
        iconUrl: 'https://img-16.ccm2.net/gwn7Esw6Lm613F3Uy0lz-BpcXIk=/3a3cd4ae4c29482fbf38b927cf4f715c/ccm-faq/42390-kC8fqNdU27Oj9yOx-s-.png'
      }
      chrome.notifications.create(notidicationOptions);
    }
});
