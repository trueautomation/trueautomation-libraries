chrome.webRequest.onHeadersReceived.addListener(
  function (details) {
    for (let i = 0; i < details.responseHeaders.length; ++i) {
      if ('x-frame-options' === details.responseHeaders[i].name.toLowerCase()) {
        details.responseHeaders.splice(i, 1);
      }
      if ('content-security-policy' === details.responseHeaders[i].name.toLowerCase()) {
        details.responseHeaders[i].value = '';
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
