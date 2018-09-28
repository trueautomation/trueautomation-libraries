'use babel';

import trueautomationAtomProvider from './trueautomation-atom-provider';
import TrueautomationAtomView from './trueautomation-atom-view';
import { TextEditor, CompositeDisposable, Range, Point, File } from 'atom';
import { exec } from 'child_process';
import killPort from 'kill-port'
import fs from 'fs'

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

    console.log("Project path: " + projectPath);
    const isWin = process.platform === "win32";
    const isTaInitialized = fs.existsSync(`${projectPath}/trueautomation.json`);
    const idePort = 9898;
    if (!isWin && projectPath && isTaInitialized) {
      console.log("Kill ide process if exist");
      killPort(idePort).then(() => {
        console.log("Staring ide process...");
        atom.notifications.addInfo("Starting TrueAutomation IDE ...");
        const ideProcess = exec(`~/.trueautomation/bin/trueautomation ide`, { cwd: projectPath }, (error, stdout, stderr) => {
          if (error) {
            atom.notifications.addError(stdout + "\n" + stderr, { dismissable: true });
            return;
          }
        });
        setTimeout(() => {
          if (!ideProcess.exitCode) {
            console.log("IDE process started");
            atom.notifications.addSuccess("TrueAutomation IDE is started successfully!");
            this.toggle();
          }
        }, 10000)
      }).catch((err) => {
        console.log("ERROR: " + err);
        atom.notifications.addError("ERROR: " + err);
        return;
      });
    }
  },

  cleanTaSpaces(editor) {
    editor.scan(/[\s|\(|\=](ta|byTa|@FindByTA)\s*\((\s+|\s*taName\s*\=\s+)[\'\"]((\w|:)+)[\'\"]\s*\)/g, {}, async (result) => {
      const text = result.match[0].replace(/(\()\s+/, '$1');
      editor.setTextInBufferRange(result.range, text, { undo: 'skip' });
    });
    editor.save();
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

    atom.project.onDidChangePaths(() => {
      this.runClientIde();
    });

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
    const editors = atom.workspace.getTextEditors();
    editors.forEach(editor => this.cleanTaSpaces(editor));
  },

  serialize() {
    return {
      trueautomationAtomViewState: this.trueautomationAtomView.serialize()
    };
  },

  toggle() {
    this.markers = [];

    atom.workspace.onDidDestroyPaneItem((event) => {
      if (event.item instanceof TextEditor) this.cleanTaSpaces(event.item);
    });

    atom.workspace.observeTextEditors(editor => {
      editor.onDidStopChanging(() => {
        const lastEditedPoint = editor.getCursorBufferPosition();
        this.cleanUpLine(editor);
        this.cleanUpMarkersForRow(lastEditedPoint.row, editor);
        this.scanForTa(editor);
      });

      editor.element.onDidChangeScrollLeft(() => {
        const visibleColumn = editor.getFirstVisibleScreenColumn();
        editor.getOverlayDecorations().forEach(overlay => {
          const properties = overlay.getProperties();
          if (overlay.marker.oldHeadScreenPosition.column < visibleColumn) {
            overlay.setProperties({ ...properties, class: 'ta-element-hidden'});
          } else {
            overlay.setProperties({ ...properties, class: 'ta-element'});
          }
        });
      });

      this.scanForTa(editor);
    });
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

  cleanUpLine(editor) {
    editor.scan(/[\s|\(|\=](ta|byTa|@FindByTA)\s*\((\s+|\s*taName\s*\=\s+)[\'\"][\'\"]\s*\)/g, {}, async (result) => {
      const text = result.match[0].replace(/\s+(\'|\")/, '$1');
      editor.setTextInBufferRange(result.range, text, { undo: 'skip' });
      const cursorPosition = editor.getCursorBufferPosition();
      const overlayLength = 2;
      const newCursosrPosition = new Point(cursorPosition.row, cursorPosition.column - overlayLength);
      editor.setCursorBufferPosition(newCursosrPosition);
    });
  },

  cleanUpMarkersForRow(editedRow, editor) {
    const markers = this.markers;
    const markerElements = [...markers].filter((markerElement) => {
      return markerElement.oldTailScreenPosition.row === editedRow &&
        (editor.getMarkers().indexOf(markerElement) !== -1);
    });

    markerElements.forEach((markerElement) => {
      markerElement.destroy();
      markers.splice(markers.indexOf(markerElement), 1);
    })
  },

  cleanUpMarker(markerRange, editor) {
    const markers = this.markers;
    const markerElement = [...markers].find((markerElement) => {
      return markerElement.oldTailScreenPosition.isEqual(markerRange.start) &&
        (editor.getMarkers().indexOf(markerElement) !== -1);
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

    this.cleanUpMarker(markRange, editor);
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

  updateEditorText({ result, editor }) {
    const nameIndex = result.match[0].search(/\"|\'/);
    const { start, end } = result.range;
    const row = start.row;
    const taButtonLength = 3;

    const taNameEq = result.match[2].search("=");
    const presentSpaces = result.match[2].length - taNameEq - 1;
    const startColumn = start.column + nameIndex - presentSpaces - 1;
    const endColumn = startColumn + 1;

    const textRange = new Range(
      new Point(row, startColumn),
      new Point(row, endColumn),
    );

    const text = editor.getTextInBufferRange(textRange);

    if (presentSpaces >= taButtonLength) return null;
    const overlaySpaces = ' '.repeat(taButtonLength - presentSpaces);
    editor.setTextInBufferRange(textRange, text + overlaySpaces, { undo: 'skip' });
    editor.save();
    return true;
  },

  createTaMarker({ taName, start, taButtonElement, editor, foundClass, nameIndex }) {
    const markers = this.markers;

    const row = start.row;
    const startColumn = start.column + nameIndex - 5; //Overlay spaces = 3, quotes = 1
    const endColumn = startColumn + 1;
    const markerClass = 'ta-element';

    const taMarker = this.createMarker({ row, startColumn, endColumn, taButtonElement, editor, markerClass });
    editor.decorateMarker(taMarker, { type: 'overlay', item: taButtonElement, class: 'ta-element', avoidOverflow: false });
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
    if (!result.match) return null;
    const taName = result.match[3];

    const nameIndex = result.match[0].search(/\"|\'/) + 1;
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
    editor.scan(/[\s|\(|\=](ta|byTa|@FindByTA)\s*\((\s*|\s*taName\s*\=\s*)[\'\"]((\w|:)+)[\'\"]\s*\)/g, {}, async (result) => {
      if (this.updateEditorText({ result, editor })) return null;

      const taName = result.match[3];
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
