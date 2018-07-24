'use babel';

export default class TrueautomationAtomView {

  constructor(serializedState) {
    // Create root element
    this.element = document.createElement('div');
    this.element.classList.add('ta-modal');

    // Create message element
    this.message = document.createElement('div');
    this.message.textContent = 'NO TEXT';
    this.message.classList.add('ta-modal-message');
    this.element.appendChild(this.message);

    this.doneButton = document.createElement('a');
    this.doneButton.textContent = 'Done';
    this.doneButton.classList.add('ta-primary-btn');
    this.element.appendChild(this.doneButton);
    this.doneButton.addEventListener('click', (event) => {
      this.doneCallback();
    });
  }

  setDoneCallback(callback) {
    this.doneCallback = callback;
  }

  setText(text) {
    this.message.textContent = text;
  }

  // Returns an object that can be retrieved when package is activated
  serialize() {}

  // Tear down any state and detach
  destroy() {
    this.element.remove();
  }

  getElement() {
    return this.element;
  }

}
