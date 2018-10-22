function executeExtension() {
  const maxZIndex = Array.from(document.querySelectorAll('body *'))
    .map(a => parseFloat(window.getComputedStyle(a).zIndex))
    .filter(a => !isNaN(a))
    .sort()
    .pop();

  let link = document.createElement("link");
  document.head.appendChild(link);
  link.href = "https://fonts.googleapis.com/css?family=Montserrat:600";
  link.rel = "stylesheet";

  let div = document.createElement("div");
  document.body.appendChild(div);
  div.innerHTML = `Element locator has been <span style="color:#ee6c4d;">successfully</span> saved.`;
  div.style.position = "absolute";
  div.style.top = "10px";
  div.style.right = "10px";
  div.style.padding = "24px 36px";
  div.style.borderRadius = "10px";
  div.style.border = "1px solid #ee6c4d";
  div.style.backgroundColor = "#fff";
  div.style.zIndex = maxZIndex + 101;
  div.style.fontSize = "16px";
  div.style.letterSpacing = "0.3px";
  div.style.fontFamily = "Montserrat-SemiBold, sans-serif";

  setTimeout(() => { div.remove(); link.remove(); }, 3000);
}

executeExtension();
