//content script
var clickedElement;

document.addEventListener("mousedown", (event) => {
  clickedElement = event.target;
}, true);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    selectElementHandler(clickedElement);
  }
);

const selectElementHandler = (currentElement) => {
  const trueautomationLocalIdeServerUrl = 'http://localhost:9898';
  const address = findElementAddress(currentElement);
  const htmlJson = JSON.stringify(findNodeCss(document.documentElement));

  fetch(`${trueautomationLocalIdeServerUrl}/browser/selectElement`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      address,
      html: htmlJson,
    }),
  }).then((response) => {
    alert('Element locator has been successfully saved.');
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
