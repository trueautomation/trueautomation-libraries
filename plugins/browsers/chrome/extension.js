function executeExtension() {
  let taScript;
  const trueautomationLocalIdeServerUrl = 'http://localhost:3000';
  const trueautomationDevIdeServerUrl = 'http://app-dev.trueautomation.io';
  const trueautomationProdIdeServerUrl = 'https://trueautomation.io/';

  chrome.storage.local.get('taScript', function(result) {
    taScript = result['taScript'];

    if (!taScript) {
      fetch(`${trueautomationLocalIdeServerUrl}/client/ide/getPlugin`).then(function (response) {
        return response.text();
      }).then(function(respBody) {
        taScript = respBody;
        chrome.storage.local.set({ 'taScript': taScript })
        eval(taScript);

      }).catch(function (err) {
        console.log('Error occurred:', err);
      });
    } else {
      eval(taScript);
    }
  });
}

executeExtension();
