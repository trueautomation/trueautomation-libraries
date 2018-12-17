let clickedElement;
let currentDocument;

document.addEventListener("mousedown", (event) => {
  clickedElement = event.target;
  currentDocument = document;
}, true);

const iframes = [...document.getElementsByTagName('iframe')];
if (iframes.length > 0) {
  iframes.forEach((iframe) => {
    const doc = iframe.contentDocument;
    if (doc) {
      doc.addEventListener('mousedown', (event) => {
        clickedElement = event.target;
        currentDocument = doc;
      });
    }
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const trueautomationLocalIdeServerUrl = 'http://localhost:9898';

  fetch(`${trueautomationLocalIdeServerUrl}/browser/currentElement`).then(response => response.json()).then((json) => {
    const elementName = json.name;
    const projectName = json.projectName;

    if (!elementName) {
      alert('There is no TA locator to select. Use your IDE to select TA locator');
      return;
    }
    selectElementHandler(currentDocument, clickedElement, projectName);
  });
});

const selectElementHandler = (currentDocument, currentElement, projectName) => {
  const style = currentElement.style;
  getCanvas(currentDocument, currentElement).then((canvas) => {
    currentElement.style = style;
    sendElement(currentDocument, currentElement, projectName, canvas.toDataURL());
  });
};

const getElementAttributes = (el) => {
  let xPos = 0;
  let yPos = 0;
  const currentElement = el;

  while (el) {
    if (el.tagName == 'BODY') {
      // deal with browser quirks with body/window/document and page scroll
      const xScroll = el.scrollLeft || document.documentElement.scrollLeft;
      const yScroll = el.scrollTop || document.documentElement.scrollTop;

      xPos += (el.offsetLeft - xScroll + el.clientLeft);
      yPos += (el.offsetTop - yScroll + el.clientTop);
    } else {
      // for all other non-BODY elements
      xPos += (el.offsetLeft - el.scrollLeft + el.clientLeft);
      yPos += (el.offsetTop - el.scrollTop + el.clientTop);
    }

    el = el.offsetParent;
  }
  let width = currentElement.offsetWidth + 100;
  let height = currentElement.offsetHeight + 100;
  let x = xPos + window.pageXOffset - 50;
  let y = yPos + window.pageYOffset - 50;
  const ASPECT_RATIO = 1.6;

  if (width / height > ASPECT_RATIO) {
    const newHeight = width / ASPECT_RATIO;
    y -= (newHeight - height) / 2;
    height = newHeight;
  } else if (width / height < ASPECT_RATIO) {
    const newWidth = height * ASPECT_RATIO;
    x -= (newWidth - width) / 2;
    width = newWidth;
  }

  return {
    x,
    y,
    width,
    height,
  };
};

const getCanvas = (doc, currentElement) => {
  const attrs = getElementAttributes(currentElement);
  currentElement.style.borderWidth = "2px";
  currentElement.style.borderColor = "#ee6c4d";
  currentElement.style.borderStyle = "solid";
  return html2canvas(doc.body, {
    x: attrs.x,
    y: attrs.y,
    width: attrs.width,
    height: attrs.height,
    scale: 1,
    useCORS: true,
    logging: true,
    foreignObjectRendering: true,
    async: false,
    allowTaint: true,
  });
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
