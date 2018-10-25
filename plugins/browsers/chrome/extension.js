function executeExtension() {
  const trueautomationLocalIdeServerUrl = 'http://localhost:3000';
  const trueautomationDevIdeServerUrl = 'http://app-dev.trueautomation.io';
  const trueautomationProdIdeServerUrl = 'https://trueautomation.io/';

  const taScript = document.createElement("script");
  taScript.src = `${trueautomationLocalIdeServerUrl}/ide/index.js`;

  const taLayovers = document.getElementsByClassName('ta-layover');

  if (taLayovers.length > 0 ) {
    taScript.remove();
    taLayovers[0].parentElement.removeChild(taLayovers[0]);
    window.location.reload(true);
  } else {
    document.head.appendChild(taScript);
  }
}

executeExtension();
