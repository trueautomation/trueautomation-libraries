'use babel';

import trueautomationAtomProvider from './trueautomation-atom-provider';
import TrueautomationAtomView from './trueautomation-atom-view';
import { CompositeDisposable, Range, Point, File } from 'atom';
import { exec } from 'child_process';

import fetch from 'isomorphic-fetch';

export default {
  trueautomationAtomView: null,
  modalPanel: null,
  subscriptions: null,
  markers: [],

  getProvider() {
    console.log('Get provider');
    if (!this.p) {
      this.p = trueautomationAtomProvider;
    }

    return this.p;
  },

  runClientIde() {
    projectPath = atom.project.rootDirectories[0] && atom.project.rootDirectories[0].path;

    const isWin = process.platform === "win32";
    this.isRunning('trueautomation ide').then((isProcessRunning) => {
      if (!isWin && !isProcessRunning && projectPath) {
        exec(`~/.trueautomation/bin/trueautomation ide`, { cwd: projectPath }, (error) => {
          if (error) {
            this.trueautomationAtomView.setText('Trueatomation is not installed. Please install to use TA plugin');
            this.trueautomationAtomView.setDoneCallback(() => {
              this.modalPanel.hide();
            });
            this.modalPanel.show();
          }
        });
      }
    })
  },

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
      });
    })
  },

  activate(state) {
    this.trueautomationAtomView = new TrueautomationAtomView(state.trueautomationAtomViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.trueautomationAtomView.getElement(),
      visible: false
    });

    this.runClientIde();

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'trueautomation-atom:toggle': () => this.toggle()
    }));

    atom.project.getPaths().forEach((path) => {
      const taConfig = new File(`${path}/trueautomation.json`);

      if (taConfig.existsSync()) {
        this.toggle();
      }
    });
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.trueautomationAtomView.destroy();
  },

  serialize() {
    return {
      trueautomationAtomViewState: this.trueautomationAtomView.serialize()
    };
  },

  toggle() {
    this.markers = [];

    atom.workspace.observeTextEditors(editor => {
      const editorElement = atom.views.getView(editor);

      editor.onDidStopChanging(() => {
        this.scanForTa(editor);
      });

      this.scanForTa(editor);
    })
  },

  taButton(taName, editor) {
    const markers = this.markers;
    const taButtonElement = document.createElement('div');
    taButtonElement.className = 'ta-element-button';
    taButtonElement.innerHTML = 'TA';
    taButtonElement.addEventListener('mouseover', (event) => {
      taButtonElement.classList.add('ta-hover');
    });

    taButtonElement.addEventListener('mouseout', (event) => {
      taButtonElement.classList.remove('ta-hover');
    });

    taButtonElement.addEventListener('click', async (event) => {
      console.log('Element clicked:', taName);

      await fetch('http://localhost:9898/ide/selectElement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ name: taName }),
      });

      this.trueautomationAtomView.setText(`Choose element for '${taName}' locator in your Chrome browser`);
      this.trueautomationAtomView.setDoneCallback(() => {
        this.modalPanel.hide();
        if (markers && markers.length > 0) {
          for (let i = 0; i < markers.length; i++) {
            markers[i].destroy();
          }
        }
        this.scanForTa(editor);
      });
      this.modalPanel.show();
    });

    return taButtonElement;
  },

  cleanUpMarker(markerRange) {
    const markers = this.markers;
    const markerElement = [...markers].find((markerElement) => {
      return markerElement.oldTailScreenPosition.isEqual(markerRange.start);
    });

    if (markerElement) {
      markerElement.destroy();
      markers.splice(markers.indexOf(markerElement), 1);
    }
  },

  createMarker({ row, startColumn, endColumn, taButtonElement, editor, markerClass }) {
    const markRange = new Range(
      new Point(row, startColumn),
      new Point(row, endColumn),
    );

    this.cleanUpMarker(markRange);
    const markerElement = editor.markBufferRange(markRange, { invalidate: 'touch' });

    editor.decorateMarker(markerElement, { type: 'text', class: markerClass });

    markerElement.onDidChange((event) => {
      if (event.wasValid && !event.isValid
        && taButtonElement && taButtonElement.parentElement) {
        taButtonElement.parentElement.removeChild(taButtonElement);
      }
    });

    return markerElement;
  },

  createTaMarker({ taName, start, taButtonElement, editor }) {
    const markers = this.markers;

    const row = start.row;
    const startColumn = start.column + 2;
    const endColumn = start.column + 3;
    const markerClass = 'ta-element';

    const taMarker = this.createMarker({ row, startColumn, endColumn, taButtonElement, editor, markerClass });
    editor.decorateMarker(taMarker, { type: 'overlay', item: taButtonElement });

    markers.push(taMarker);
  },

  createNameMarker({ taName, start, taButtonElement, editor, foundClass, nameIndex }) {
    const markers = this.markers;

    const row = start.row;
    const startColumn = start.column + nameIndex;
    const endColumn = start.column + nameIndex + taName.length;
    const markerClass = `ta-element-name ${foundClass}`;

    const nameMarker = this.createMarker({ row, startColumn, endColumn, taButtonElement, editor, markerClass });

    markers.push(nameMarker);
  },

  createTaMarkers(result, foundClass, editor) {
    const taName = result.match[1];

    const nameIndex = result.match[0].indexOf(taName);
    const { start, end } = result.range;
    const taButtonElement = this.taButton(taName, editor);

    const taOptions = {
      taName,
      start,
      taButtonElement,
      editor,
      foundClass,
      nameIndex,
    };

    this.createTaMarker(taOptions);
    this.createNameMarker(taOptions);
  },

  scanForTa(editor) {
    editor.scan(/([^a-zA-Z|^_|^-]|^)ta\s*\(\s*[\'\"]((\w|:)+)[\'\"]\s*\)/g, {}, async (result) => {
      const taName = result.match[1];
      const elementsJson = await fetch('http://localhost:9898/ide/findElementsByNames', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ names: [taName] }),
      });

      const elements = await elementsJson.json();
      const foundClass = elements.elements.length > 0 ? 'ta-found' : 'ta-not-found';

      this.createTaMarkers(result, foundClass, editor);
    });
  }
};
