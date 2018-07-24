'use babel';

import fetch from 'isomorphic-fetch';

const TA_REGEX = /ta\s{0,}\(\s{0,}[\'\"]/;

class TrueautomationAtomProvider {
  constructor() {
    this.selector = '.source .string';
    this.inclusionPriority = 4;
    this.suggestionPriority = 5;
    this.filterSuggestions = true;
  }

  async getSuggestions(params) {
    const {
      editor,
      bufferPosition,
      scopeDescriptor,
      prefix,
      activatedManually,
    } = params;

    const line = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition]);

    if (line.match(TA_REGEX)) {
      const elementJson = await fetch(`http://localhost:9898/ide/searchElements?query=${prefix}`, {
        method: 'GET',
      });
      const elements = await elementJson.json();
      return elements.elementNames.map(element => ({ text: element.name, iconHTML: 'TA' }));
    }
  }
}

export default new TrueautomationAtomProvider();
