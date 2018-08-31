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

  scanForTa(editor) {
    const markers = this.markers;

    editor.scan(/ta\s*\(\s*[\'\"]((\w|:)+)[\'\"]\s*\)/g, {}, async (result) => {
      const taName = result.match[1];

      console.log(result.match);

      const nameIndex = result.match[0].indexOf(taName);
      const { start, end } = result.range;

      const rangeToMarkName = new Range(
        new Point(start.row, start.column + nameIndex),
        new Point(start.row, start.column + nameIndex + taName.length),
      );

      const rangeToMarkTA = new Range(
        new Point(start.row, start.column + 2),
        new Point(start.row, start.column + 3),
      );

      const elementsJson = await fetch('http://localhost:9898/ide/findElementsByNames', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ names: [taName] }),
      });

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

      const elements = await elementsJson.json();
      const foundClass = elements.elements.length > 0 ? 'ta-found' : 'ta-not-found';
      let nameMarker = [...markers].find((markerElement) => {
        return markerElement.oldTailScreenPosition.row === rangeToMarkName.start.row &&
               markerElement.oldTailScreenPosition.column === rangeToMarkName.start.column
      })

      let taMarker = [...markers].find((markerElement) => {
        return markerElement.oldTailScreenPosition.row === rangeToMarkTA.start.row &&
               markerElement.oldTailScreenPosition.column === rangeToMarkTA.start.column &&
               markerElement.oldHeadScreenPosition.row === rangeToMarkTA.end.row &&
               markerElement.oldHeadScreenPosition.column === rangeToMarkTA.end.column
      })

      if (nameMarker) {
        nameMarker.destroy();
        markers.splice(markers.indexOf(nameMarker), 1)
      }
      if (taMarker) {
        taMarker.destroy();
        markers.splice(markers.indexOf(taMarker), 1)
      }

      nameMarker = editor.markBufferRange(rangeToMarkName, { invalidate: 'touch' });
      taMarker = editor.markBufferRange(rangeToMarkTA, { invalidate: 'touch' });

      editor.decorateMarker(nameMarker, { type: 'text', class: `ta-element-name ${foundClass}` });
      editor.decorateMarker(taMarker, { type: 'overlay', item: taButtonElement });
      editor.decorateMarker(taMarker, { type: 'text', class: `ta-element` });

      nameMarker.onDidChange((event) => {
        if (event.wasValid && !event.isValid
          && taButtonElement && taButtonElement.parentElement) {
          taButtonElement.parentElement.removeChild(taButtonElement);
        }
      });

      taMarker.onDidChange((event) => {
        if (event.wasValid && !event.isValid
          && taButtonElement && taButtonElement.parentElement) {
          taButtonElement.parentElement.removeChild(taButtonElement);
        }
      });

      markers.push(taMarker);
      markers.push(nameMarker);
    });
  }
};
