chrome.webRequest.onHeadersReceived.addListener((details) => {
  for (let i = details.responseHeaders.length-1; i >=0 ; --i) {
    const header = details.responseHeaders[i].name.toLowerCase();
    if (header == 'x-frame-options' || header == 'frame-options' || header == 'content-security-policy') {
      details.responseHeaders.splice(i, 1); // Remove header
    }
  }
  return {
    responseHeaders: details.responseHeaders,
  };
}, {
  urls: ["<all_urls>"],
  types: ["sub_frame"],
},
["blocking", "responseHeaders"]);

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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.msg === "capture") {
    chrome.tabs.captureVisibleTab(
      (dataUrl) =>  {
        sendResponse({imgSrc: dataUrl});
      }); //remember that captureVisibleTab() is a statement
  }
  return true;
});
