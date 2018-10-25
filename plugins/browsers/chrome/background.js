chrome.webRequest.onHeadersReceived.addListener(
  function (details) {
    for (let i = 0; i < details.responseHeaders.length; ++i) {
      if (['content-security-policy', 'x-frame-options'].includes(details.responseHeaders[i].name.toLowerCase())) {
        details.responseHeaders.splice(i, 1);
      }
    }

    const acao = details.responseHeaders.findIndex((element, index, array) => {
      return element.name.toLowerCase() === 'access-control-allow-origin'
    });

    const acah = details.responseHeaders.findIndex((element, index, array) => {
      return element.name.toLowerCase() === 'access-control-allow-headers'
    });

    if ( acao === -1) {
      details.responseHeaders.push({ name: 'access-control-allow-origin', value: '*'});
    }

    if (acah === -1) {
      details.responseHeaders.push({ name: 'access-control-allow-headers', value: 'Content-Type, Accept, X-Requested-With, remember-me'});
    } else {
      details.responseHeaders[acao].value = 'Content-Type, Accept, X-Requested-With, remember-me'
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
