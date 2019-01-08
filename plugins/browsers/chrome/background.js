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

chrome.webRequest.onCompleted.addListener((details) => {
  chrome.tabs.executeScript({
    file: 'notification.js'
  });
}, {
  urls: ["http://localhost:9898/browser/selectElement"]
});

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
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.msg === "capture") {
    chrome.tabs.captureVisibleTab(
      (dataUrl) =>  {
        sendResponse({imgSrc: dataUrl});
      }); //remember that captureVisibleTab() is a statement
  }
  return true;
});
