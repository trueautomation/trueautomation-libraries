let userAgent = {
  default: null,
  iphonex: "Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1"
};

const port = chrome.runtime.connectNative('io.trueautomation.recorder');
port.onMessage.addListener(function(msg) {
  console.log("Received" + msg);
});
port.onDisconnect.addListener(function() {
  console.log("Disconnected");
});
port.postMessage({ text: "Hello, my_application" });

chrome.webRequest.onBeforeSendHeaders.addListener((details) => {
  let currentUserAgent = userAgent.default;
  if (details.type === 'sub_frame' && details.url.includes('#ta-iphonex'))
    currentUserAgent = userAgent.iphonex;

  if (currentUserAgent) {
    for (let i = 0; i < details.requestHeaders.length; i++)
      if (details.requestHeaders[i].name === "User-Agent") {
        userAgent.default = details.requestHeaders[i].value;
        details.requestHeaders[i].value = currentUserAgent;
        break;
      }
    return {
      requestHeaders: details.requestHeaders
    }
  }
}, {
  urls: ["<all_urls>"]
}, ["blocking", "requestHeaders"]);

chrome.webRequest.onHeadersReceived.addListener((details) => {
  for (let i = 0; i < details.responseHeaders.length; i++) {
    const header = details.responseHeaders[i].name.toLowerCase();
    if (['x-frame-options', 'frame-options','content-security-policy'].includes(header)) {
      details.responseHeaders[i].value = '';
    }
  }
  return {
    responseHeaders: details.responseHeaders,
  };
}, {
  urls: ["<all_urls>"],
  types: ["main_frame", "sub_frame"],
}, ["blocking", "responseHeaders"]);

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
  } else if (request.msg === "url") {
    fetch(request.url).then((resp) => {
      resp.json().then((respJSON) => {
        sendResponse(respJSON);
      });
    }).catch((err) => {
      sendResponse(err);
    });
  } else if (request.msg === 'postUrl') {
    fetch(request.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: request.body,
    }).then((resp) => {
      resp.json().then((respJSON) => {
        sendResponse(respJSON);
      });
    }).catch((err) => {
      sendResponse(err);
    });
  }
  return true;
});
