let userAgent = {
  default: null,
  iphonex: "Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1"
};

const delay = (millis) => {
  const date = new Date();
  let curDate = null;
  do { curDate = new Date(); }
  while(curDate-date < millis);
}

let taIdeStarted = false;
let retries = 20;
const connectIde = () => {
  fetch(`http://localhost:9898/browser/projectsList`).then((resp)=>{
    chrome.tabs.executeScript({ file: 'extension.js' });
  }).catch((err)=>{
    if (!taIdeStarted) {
      const port = chrome.runtime.connectNative('io.trueautomation.ide');
      taIdeStarted = true;
      port.onMessage.addListener(function(msg) {
        console.log("Received" + msg);
      });
      port.onDisconnect.addListener(function() {
        console.log("Disconnected");
        taIdeStarted = false;
      });
    };

    if (--retries <= 0) {
      console.log('No more retries - start script anyway.');
      chrome.tabs.executeScript({ file: 'extension.js' });
    } else {
      delay(300);
      connectIde();
    }
  });
};

chrome.webRequest.onBeforeSendHeaders.addListener((details) => {
  let currentUserAgent = userAgent.default;
  if (details.url.includes('#ta-iphonex'))
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
      details.responseHeaders.splice(i,1);
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
  retries = 20;
  connectIde();
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
