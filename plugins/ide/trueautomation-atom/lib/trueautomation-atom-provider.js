'use babel';

import fetch from 'isomorphic-fetch';
import { exec } from 'child_process';

const TA_REGEX = /ta\s{0,}\(\s{0,}[\'\"]/;

class TrueautomationAtomProvider {
  constructor() {
    this.selector = '.source .string';
    this.inclusionPriority = 4;
    this.suggestionPriority = 5;
    this.filterSuggestions = true;
  }

  isRunning(processName) {
    return new Promise((resolve, reject) => {
      let platform = process.platform;
      let cmd = '';
      switch (platform) {
          case 'win32' : cmd = `tasklist`; break;
          case 'darwin' : cmd = `ps -ax | grep "${processName}"`; break;
          case 'linux' : cmd = `ps -A`; break;
          default: break;
      }

      exec(cmd, (err, stdout, stderr) => {
        const processList = stdout.toLowerCase().
                            replace(/grep "trueautomation ide"/, '').
                            replace(/grep trueautomation ide/, '');

        resolve(processList.indexOf(processName.toLowerCase()) > -1)
      })
    })
  }

  async getSuggestions(params) {
    const {
      editor,
      bufferPosition,
      scopeDescriptor,
      prefix,
      activatedManually,
    } = params;

    const isIdeRun = await this.isRunning('trueautomation ide');
    const line = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition]);

    if (isIdeRun && line.match(TA_REGEX)) {
      const elementJson = await fetch(`http://localhost:9898/ide/searchElements?query=${prefix}`, {
        method: 'GET',
      });
      const elements = await elementJson.json();
      return elements.elementNames.map(element => ({ text: element.name, iconHTML: 'TA' }));
    }
  }
}

export default new TrueautomationAtomProvider();
