
chrome.browserAction.onClicked.addListener(function(tab) {
  chrome.tabs.executeScript({
    file: 'extension.js'
  });
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    title: 'TA Select',
    contexts: ['all'],
    onclick(info, tab) {
      chrome.tabs.sendMessage(tab.id, {});
    }
  })
})
