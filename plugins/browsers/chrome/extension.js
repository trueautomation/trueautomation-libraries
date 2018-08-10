function executeExtension() {
  let taScript;

  chrome.storage.local.get('taScript', function(result) {
    taScript = result;
  });

  if (!taScript) {
    fetch('http://localhost:9898/browser/getPlugin').then(function (response) {
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
}

executeExtension();
