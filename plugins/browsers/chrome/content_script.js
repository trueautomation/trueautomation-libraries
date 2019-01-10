let clickedElement;
let currentDocument;

document.addEventListener("mousedown", (event) => {
  clickedElement = event.target;
  currentDocument = document;
}, true);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const trueautomationLocalIdeServerUrl = 'http://localhost:9898';

  fetch(`${trueautomationLocalIdeServerUrl}/browser/currentElement`).then(response => response.json()).then((json) => {
    const elementName = json.name;
    const projectName = json.projectName;

    if (!elementName) {
      alert('There is no TA locator to select. Use your IDE to select TA locator');
      return;
    }

    // Add border style for clickedElement
    const tagName = clickedElement.tagName;
    clickedElement.classList.add("taClicked");

    const css = `${tagName}.taClicked { border: 2px solid #ee6c4d !important; }`;
    const style = currentDocument.createElement('style');
    style.appendChild(currentDocument.createTextNode(css));
    currentDocument.head.appendChild(style);

    //Screenshot page and selectElementHandler
    setTimeout(() => {
      chrome.runtime.sendMessage({msg: "capture"}, (response) => {
        selectElementHandler(response.imgSrc, currentDocument, clickedElement, style, projectName);
      });
    }, 100);
  });
});

const selectElementHandler = (dataUrl, currentDocument, currentElement, style, projectName, callback) => {
  const topWindow = currentDocument.defaultView.top;
  const width = topWindow.innerWidth;
  const height = topWindow.innerHeight;
  const devicePixelRatio = topWindow.devicePixelRatio * 1.0;

  const img = new Image();
  img.style.width = `${width}px`;
  img.style.height = `${height}px`;

  const canvas = currentDocument.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const attrs = currentElement.getBoundingClientRect();
  console.log(attrs);
  let offsetLeft = 0;
  let offsetTop = 0;

  if (topWindow !== currentDocument.defaultView) {
    const iframes = [...topWindow.document.getElementsByTagName('iframe')];
    const iframe = iframes.find((elem) => elem.contentDocument === currentDocument);
    const iframeAttrs = iframe.getBoundingClientRect();
    offsetLeft = iframeAttrs.x;
    offsetTop = iframeAttrs.y;
  }
  const ASPECT_RATIO = 1.6;

  let x = (attrs.x + offsetLeft - 50) * devicePixelRatio;
  let y = (attrs.y + offsetTop - 50) * devicePixelRatio;
  let elWidth = (attrs.width + 100) * devicePixelRatio;
  let elHeight = (attrs.height + 100) * devicePixelRatio;

  if (elWidth / elHeight > ASPECT_RATIO) {
    const newHeight = elWidth / ASPECT_RATIO;
    y -= (newHeight - elHeight) / 2;
    elHeight = newHeight;
  } else if (elWidth / elHeight < ASPECT_RATIO) {
    const newWidth = elHeight * ASPECT_RATIO;
    x -= (newWidth - elWidth) / 2;
    elWidth = newWidth;
  }

  canvas.width = elWidth/devicePixelRatio;
  canvas.height = elHeight/devicePixelRatio;

  img.onload = () => {
    ctx.drawImage(img, x, y, elWidth, elHeight, 0, 0, elWidth/devicePixelRatio, elHeight/devicePixelRatio);
    const base64 = canvas.toDataURL();
    console.log(base64);
    style.remove();
    currentElement.classList.remove("taClicked");
    if (callback) callback();
    sendElement(currentDocument, currentElement, projectName, base64);
  };

  img.src = dataUrl;
};

const sendElement = (currentDocument, currentElement, projectName, screenURL) => {
  const trueautomationLocalIdeServerUrl = 'http://localhost:9898';
  const screenshot = screenURL;
  const address = findElementAddress(currentElement);
  const htmlJson = JSON.stringify(findNodeCss(currentDocument.documentElement));

  fetch(`${trueautomationLocalIdeServerUrl}/browser/selectElement`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      projectName,
      screenshot,
      address,
      html: htmlJson,
    }),
  }).then((response) => {
    console.log(response);
  }).catch((err) => {
    console.log('Error occurred', err);
  });
};

const findNodeCss = (node) => {
  const css = sliceByKeys(window.getComputedStyle(node), styles);
  const tag = node.tagName;
  const attributes = [].slice.call(node.attributes).reduce((result, attribute) => ({ ...result, [attribute.name]: attribute.value }), {});

  const children = [].slice.call(node.childNodes).reduce((result, child) => {
    switch (child.nodeType) {
      case 1:
        if (child.classList.contains('ta-layover')) {
          return result;
        }

        const childElement = findNodeCss(child);
        result.push(childElement);
        break;
      case 3:
        const text = child.data.trim();
        if (text) {
          result.push({ node_type: 'Text', value: text });
        }
        break;
      default:
    }

    return result;
  }, []);

  return {
    node_type: 'Element',
    children,
    css,
    tag,
    attributes,
  };
};

const findElementAddress = (el) => {
  const stack = [];
  while (el !== null) {
    stack.unshift(getElementIndex(el));

    el = el.parentElement;
  }

  return stack.join('.');
};

const getElementIndex = (el) => {
  if (el.parentElement === null) return 0;

  const childrenArray = [].slice.call(el.parentElement.children);
  return childrenArray.indexOf(el);
};

const sliceByKeys = (object, keys) => {
  const result = {};

  for (const key of keys) {
    const val = object[key];
    if (val && val.length > 0) {
      result[key] = val;
    }
  }

  return result;
};

const styles = [
  'background',
  'backgroundColor',
  'backgroundImage',
  'border',
  'borderBottom',
  'borderTop',
  'borderLeft',
  'borderRight',
  'borderColor',
  'borderRadius',
  'borderWidth',
  'color',
  'content',
  'display',
  'font',
  'fontDisplay',
  'fontFamily',
  'fontWeight',
  'height',
  'justifyContent',
  'lineHeight',
  'maxHeight',
  'maxWidth',
  'opacity',
  'outline',
  'overflow',
  'padding',
  'paddingTop',
  'paddingBottom',
  'paddingLeft',
  'paddingRight',
  'position',
  'size',
  'textAlign',
  'textShadow',
  'textTransform',
  'visibility',
  'width',
  'zIndex',
];
