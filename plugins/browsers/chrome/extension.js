function executeExtension() {
  let taScript;
  const trueautomationLocalIdeServerUrl = 'http://localhost:3000';
  const trueautomationDevIdeServerUrl = 'http://app-dev.trueautomation.io';
  const trueautomationProdIdeServerUrl = 'https://app.trueautomation.io';

  chrome.storage.local.get('taScript', function(result) {
    taScript = result['taScript'];

    if (!taScript) {
      fetch(`${trueautomationDevIdeServerUrl}/ide/index.js`).then(function (response) {
        return response.text();
      }).then(function(respBody) {
        taScript = respBody;
        chrome.storage.local.set({ 'taScript': taScript });
        const taServerNotStartedEvent = new Event('TAServerNotStarted');
        document.addEventListener('TAServerNotStarted', function (e) {
          chrome.storage.local.get('showNotification', function(result) {
            eval(result['showNotification']);
            const notificationText = 'TrueAutomation.IO IDE has not been started. You can start it by running `trueautomation ide` in the console of your operating system.';
            showNotification(notificationText)
          })
        }, false);
        eval(taScript);
      }).catch(function (err) {
        console.log('Error occurred:', err);
      });
    } else {
      const taLayovers = document.getElementsByClassName('ta-main');
      if (taLayovers.length === 0) {
        eval(taScript);
      } else {
        window.enableAllUserEvents();
        window.removeTALayover();
        chrome.storage.local.remove('taScript');
      }
    }
  });
}

executeExtension();
