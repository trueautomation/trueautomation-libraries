fetch('http://localhost:9898/browser/currentElement').then(function (response) {
  return response.json();
}).then(function(json) {
  elementName = json.name;

  if (!elementName) {
    alert('There is no TA locator to select. Use your IDE to select TA locator');
    return;
  }

  const labelHeight = 25;

  let currentElement = null;
  let filter = null;

  const layover = document.createElement('div');
  layover.className = 'ta-layover';
  layover.style.border = '#ee6c4d 2px solid';
  layover.style.position = 'fixed';
  layover.style.pointerEvents = 'none';
  layover.style.zIndex = '2000';

  const label = document.createElement('div');
  label.className = 'ta-layover-label';
  label.style.backgroundColor = '#ee6c4d';
  label.style.padding = '3px';
  label.style.color = '#ffffff';

  const selectButton = document.createElement('a');
  selectButton.className = 'ta-layover-button';
  selectButton.style.display = 'block';
  selectButton.style.backgroundColor = '#ee6c4d';
  selectButton.style.padding = '3px';
  selectButton.style.color = '#ffffff';
  selectButton.style.position = 'absolute';
  selectButton.style.bottom = '0px';
  selectButton.style.left = '0px';
  selectButton.style.pointerEvents = 'auto';
  selectButton.style.cursor = 'pointer';
  selectButton.innerHTML = 'SELECT';

  const filterModal = document.createElement('div');
  filterModal.className = 'ta-filter-modal';
  filterModal.innerHTML = `
    <div id='ta-description'>Select corresponding element for '${elementName}'</div>
    <div>
      <label for='ta-filter-tag'>Filter elements by tag name:</label>
      <input type='text' name='ta-filter-tag' id='ta-filter-tag'/> 
    </div>
  `;
  filterModal.style.backgroundColor = '#ffffff';
  filterModal.style.padding = '5px';
  filterModal.style.position = 'fixed';
  filterModal.style.bottom = '0px';
  filterModal.style.right = '0px';
  filterModal.style.pointerEvents = 'auto';

  let socket
  fetch('https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.1.1/socket.io.js').then((response) => {
    response.text().then((socketBody) => {
      eval(socketBody);
      socket = io.connect('http://localhost:9898/browser/connect');

      // TODO: Subscribe on events
      // socket.on('some event', function() {
      //   some action
      // });
    })
  });

  layover.appendChild(label);
  layover.appendChild(selectButton);
  layover.appendChild(filterModal);

  document.body.appendChild(layover);

  const filterInput = document.getElementById('ta-filter-tag');
  filterInput.addEventListener('keyup', function (event) {
    if (filterInput.value) {
      filter = filterInput.value;
    } else {
      filter = null;
    }
  });


  document.addEventListener('mouseover', function (event) {
    if (event.target.className === 'ta-layover-button') {
      return;
    }

    if (filter && !event.target.tagName.toLowerCase().startsWith(filter.toLowerCase())) {
      return;
    }

    currentElement = event.target;

    const boundingRect = event.target.getBoundingClientRect();
    const topPx = boundingRect.top - labelHeight;
    const leftPx = boundingRect.left;

    label.innerHTML = event.target.tagName;

    layover.style.display = 'block';
    layover.style.left = leftPx + 'px';
    layover.style.top = topPx + 'px';
    layover.style.width = boundingRect.width + 'px';
    layover.style.height = (boundingRect.height + labelHeight) + 'px';
  });

  const findElementAddress = function (el) {
    const stack = [];
    while (el.parentElement !== null) {
      let elIndex = 0;
      let sib = el.parentElement.children[elIndex];
      while (el !== sib && elIndex < el.parentElement.children.length) {
        sib = el.parentElement.children[++elIndex];
      }
      stack.unshift(elIndex);
      el = el.parentElement;
    }

    stack.unshift(0);

    return stack.join('.');
  };

  selectButton.addEventListener('click', function (event) {
    event.stopPropagation();

    const address = findElementAddress(currentElement);
    const htmlJson = JSON.stringify(findNodeCss(document.documentElement));

    fetch('http://localhost:9898/browser/selectElement', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        address: address,
        html: htmlJson,
      }),
    }).then(function (response) {
      // TODO: Put io request here to switch focus
      layover.parentElement.removeChild(layover);
      alert('Element locator has been successfully saved.');
    }).catch(function (err) {
      console.log('Error occurred', err);
    });
  });


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

  function sliceByKeys(object, keys) {
    const result = {};

    for (let key of keys) {
      const val = object[key];
      if (val && val.length > 0) {
        result[key] = val;
      }
    }

    return result;
  }

  function findNodeCss(node) {
    const css = sliceByKeys(window.getComputedStyle(node), styles);
    const tag = node.tagName;
    const children = [];
    const attributes = {};

    for (let i = 0; i < node.attributes.length; i++) {
      const attribute = node.attributes[i];
      attributes[attribute.name] = attribute.value;
    }

    for (let i = 0; i < node.childNodes.length; i++) {
      const child = node.childNodes[i];

      switch (child.nodeType) {
        case 1:
          if (child.classList.contains('ta-layover')) {
            continue;
          }

          const childElement = findNodeCss(child);
          children.push(childElement);
          break;
        case 3:
          const text = child.data.trim();
          if (text) {
            children.push({ node_type: 'Text', value: text });
          }
          break;
        default:
      }
    }

    return {
      node_type: 'Element',
      children,
      css,
      tag,
      attributes,
    }
  }
}).catch(function (err) {
  console.log('Error occurred:', err);
});
