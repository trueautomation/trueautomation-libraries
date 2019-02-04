if (window.location.hash === '#ta-iphonex') {
  const userAgentScript = document.createElement('script');
  userAgentScript.type = 'text/javascript';
  userAgentScript.id = 'ta-script-user-agent';

  userAgentScript.text = `
navigator.__defineGetter__("userAgent", function() {
  return "Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1";
});
navigator.__defineGetter__("appVersion", function() {
  return "5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1";
});
screen.__defineGetter__("availWidth", function() {
  return 375;
});
screen.__defineGetter__("width", function() {
  return 375;
});
screen.__defineGetter__("height", function() {
  return 812;
});
screen.__defineGetter__("availHeight", function() {
  return 812;
});`;
  const elementForScript = (document.head || document.documentElement);
  elementForScript.appendChild(userAgentScript);
}
