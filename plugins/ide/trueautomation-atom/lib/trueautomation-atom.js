'use babel';

import { TextEditor, CompositeDisposable, Range, Point, File, BufferedProcess } from 'atom';
import { exec } from 'child_process';
import find from 'find-process';
import fs from 'fs';
import io from 'socket.io-client';

import fetch from 'isomorphic-fetch';

const TAExampleURL = 'https://app.trueautomation.io/howtouse/';

let chromeWindowId;
const macChromeCmd = (windowId) => {
  const macChromeCmdString = `
tell application "Google Chrome"
  activate
  set searchString to "${TAExampleURL}"
  set tab_MatchList to {}
  set win to front window
  set tab_list to every tab of win
  set window_list to every window
  set atomWindow to "unknown"
  set idPrecisionPow to 10 ^ 2
  repeat with w in window_list
    set roudedId to round of (id of w / idPrecisionPow) rounding down
    if (roudedId as integer) is equal to ("${windowId || 0}" as integer) then
      set atomWindow to w
      exit repeat
    end if
  end repeat
  if atomWindow is equal to "unknown" then
    make new window
    set roudedId to round of (id of front window / idPrecisionPow) rounding down
    set winId to roudedId as integer
    set URL of active tab of front window to searchString
  else
    set winId to "${windowId}"
    tell atomWindow to activate
  end if
  return winId
end tell
`;
  return macChromeCmdString;
};

export default {
  subscriptions: null,
  markers: [],
  ide: null,
  idePort: 9898,
  initialized: null,
  starting: null,
  projectNotFound: false,
  attempts: 5,

  findOrStartIDE(cb) {
    find('port', 9898).then((list) => {
      if (!list.length) return this.runClientIde(cb);
      const trueautomationProcess = list.find((proc) => proc.name === 'trueautomation' || proc.cmd.includes('trueautomation'));
      if (!trueautomationProcess) return this.runClientIde(cb);
      return cb();
    });
  },

  runIdeCmd(ideCommand, projectPath, callback, allowNotifications = true) {
    console.log("Staring ide process...");
    let notification = null;
    if (allowNotifications)
      notification = atom.notifications.addInfo("Starting TrueAutomation Element picker ...", { dismissable: true });
    const ideProcess = exec(ideCommand, { cwd: projectPath, maxBuffer: Infinity }, (error, stdout, stderr) => {
      if (error) {
        if (notification) notification.dismiss();
        if (this.attempts > 0) {
          setTimeout(() => {
            this.attempts -= 1;
            this.findOrStartIDE(callback);
          }, 1000);
        } else {
          let err = stderr.match(/^.*error.*$/m);
          err = err ? err[0].replace(/^.*?]\s*/,'') : error.message;
          if (error.signal !== 'SIGKILL')
            atom.notifications.addError(err, { dismissable: true });
          return;
        }
      }
    });
    setTimeout(() => {
      if (!ideProcess.exitCode) {
        this.ide = ideProcess;
        this.starting = false;
        this.attempts = 0;
        console.log("IDE process started");
        if (notification) notification.dismiss();
        if (allowNotifications) atom.notifications.addSuccess("TrueAutomation Element picker is started successfully!");
        callback();
      }
    }, 10000)
  },

  runMacCmd() {
    let processOutput;
    new BufferedProcess({
      command: 'osascript',
      args: ['-e', macChromeCmd(chromeWindowId)],
      stderr: (data) => {
        console.log('Error: ' + data.toString())
      },
      stdout: (out) => {
        processOutput = out
      },
      exit: (code) => {
        chromeWindowId = processOutput;
      }
    })
  },

  runClientIde(callback) {
    const projectPath = atom.project.rootDirectories[0] && atom.project.rootDirectories[0].path;
    const isWin = process.platform === "win32";
    if (!isWin) {
      this.runIdeCmd('~/.trueautomation/bin/trueautomation ide --logs', projectPath, callback)
    } else {
      this.runIdeCmd('trueautomation ide --logs', projectPath, callback)
    }
  },

  cleanTaSpaces(editor) {
    editor.scan(/[\s|\(|\=](ta|byTa|@FindByTA)\s*\((\s+|\s*taName\s*\=\s+)[\'\"]((\w|:)+)[\'\"]\s*\)/g, {}, async (result) => {
      const text = result.match[0].replace(/(\(|\(\s*taName\s*\=)\s+/, '$1');
      editor.setTextInBufferRange(result.range, text);
      const buffer = editor.getBuffer();
      buffer.groupLastChanges();
    });
    editor.save();
  },

  activate(state) {
    const paths = atom.project.rootDirectories.map(dir => dir.path);

    const isTaInitialized = paths.find(path => fs.existsSync(`${path}/trueautomation.json`));

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'trueautomation-atom:toggle': () => this.toggle()
    }));

    atom.project.onDidChangePaths((path) => {
      if (fs.existsSync(`${path}/trueautomation.json`)) {
        this.initialized = true;
        this.toggle();
      }
    });

    atom.project.getPaths().forEach((path) => {
      if (fs.existsSync(`${path}/trueautomation.json`)) {
        this.initialized = true;
        this.toggle();
      }
    });
    if (isTaInitialized) this.toggle();
  },

  deactivate() {
    this.markers = [];
    this.ide = null;
    this.starting = null;
    this.initialized = null;
    const editors = atom.workspace.getTextEditors();
    editors.forEach(editor => this.cleanTaSpaces(editor));
    console.log('TrueAutomation IDE stoped')
  },

  serialize() {
  },

  toggle() {
    if (!this.starting && this.ide) {
      this.deactivate();
    } else if (!this.starting && this.initialized) {
      this.starting = true;
      const run = () => {
        this.markers = [];

        atom.workspace.onDidDestroyPaneItem((event) => {
          if (event.item instanceof TextEditor && fs.existsSync(event.item.getPath())) this.cleanTaSpaces(event.item);
        });

        atom.workspace.onDidChangeActiveTextEditor(editor => {
          if (!editor || !(editor instanceof TextEditor)) return;
          this.cleanUpLine(editor);
          this.scanForTa(editor);
        });

        atom.workspace.observeTextEditors(editor => {
          editor.onDidStopChanging(({changes}) => {
            const lastEditedPoint = editor.getCursorBufferPosition();
            this.cleanUpLine(editor, changes.newRange);
            this.cleanUpMarkersForRow(lastEditedPoint.row, editor);
            this.scanForTa(editor, changes.newRange);
          });

          editor.element.onDidChangeScrollLeft(() => {
            const visibleColumn = editor.getFirstVisibleScreenColumn();
            editor.getOverlayDecorations().forEach(overlay => {
              const properties = overlay.getProperties();
              if (overlay.marker.hasChangeObservers) {
                if (overlay.marker.oldHeadScreenPosition.column < visibleColumn) {
                  overlay.setProperties({...properties, class: 'ta-element-hidden'});
                } else {
                  overlay.setProperties({...properties, class: 'ta-element'});
                }
              }
            });
          });

          this.scanForTa(editor);
        });

        const editors = atom.workspace.getTextEditors();
        editors.forEach(editor => this.scanForTa(editor));
      };

      this.findOrStartIDE(run);
    }
  },

  getProjectName(editor) {
    const projectPath = atom.project.getPaths().find(path => editor.getDirectoryPath() && editor.getDirectoryPath().includes(path));
    if (!projectPath) return null;
    const taConfigPath = `${projectPath}/trueautomation.json`;
    if (!fs.existsSync(taConfigPath)) return null;
    const taConfigRead = fs.readFileSync(taConfigPath).toString();
    return JSON.parse(taConfigRead).projectName;
  },

  taButton(taName, editor) {
    const projectName = this.getProjectName(editor);
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

      if (!projectName) return atom.notifications.addError("Project name is not set. Run `trueautomation init` to set the project name.", { dismissable: true });
      if (this.projectNotFound) return atom.notifications.addError("Project name was not found. Please run `trueautomation init` to create a new project or use the existing one.", { dismissable: true });

      try {
        const response = await fetch('http://localhost:9898/ide/selectElement', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ name: taName, projectName }),
        });

        if (response.status === 200) {
          const ideServerUrl = 'http://localhost:9898';
          const socket = io(ideServerUrl);
          socket.on('taElementSelected', () => {
            this.scanForTaElement(editor, taName);
          });
          this.runMacCmd();
        }
      } catch (e) {
        console.log(e);
        const result =  await find('port', 9898);
        if (result.length === 0)
          atom.notifications.addError("ERROR: TrueAutomation IDE process is not running! Please, reopen your project or start the process manually.", { dismissable: true });
      }
    });

    return taButtonElement;
  },

  cleanUpLine(editor, range=null) {
    const clean = (result) => {
      const text = result.match[0].replace(/\s+(\'|\")/, '$1');
      editor.setTextInBufferRange(result.range, text, { undo: 'skip' });
      const cursorPosition = editor.getCursorBufferPosition();
      const overlayLength = 2;
      const newCursosrPosition = new Point(cursorPosition.row, cursorPosition.column - overlayLength);
      editor.setCursorBufferPosition(newCursosrPosition);
    };

    if (!range) {
      editor.scan(/[\s|\(|\=](ta|byTa|@FindByTA)\s*\((\s+|\s*taName\s*\=\s+)[\'\"][\'\"]\s*\)/g, {}, result => clean(result));
    } else {
      editor.scanInBufferRange(/[\s|\(|\=](ta|byTa|@FindByTA)\s*\((\s+|\s*taName\s*\=\s+)[\'\"][\'\"]\s*\)/g, range, result => clean(result));
    }
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
    editor.setTextInBufferRange(textRange, text + overlaySpaces);
    const buffer = editor.getBuffer();
    buffer.groupLastChanges();
    editor.save();
    return true;
  },

  createTaMarker({ taName, start, taButtonElement, editor, foundClass, nameIndex }) {
    const markers = this.markers;

    const row = start.row;
    const startColumn = start.column + nameIndex - 5; //Overlay spaces = 3, quotes = 1
    const endColumn = startColumn + 1;
    const markerClass = 'ta-element';

    const textRange = new Range(
      new Point(row, startColumn + 1),
      new Point(row, endColumn + 3),
    );
    if (editor.getTextInBufferRange(textRange) !== '   ') return;

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

  scanForTa(editor, range=null) {
    const projectName = this.getProjectName(editor);
    const callback = async (result) => {
      try {
        if (this.updateEditorText({ result, editor })) return null;

        let foundClass;
        if (projectName) {
          const taName = result.match[3];
          const elementsJson = await fetch('http://localhost:9898/ide/findElementsByNames', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({ names: [taName], projectName }),
          });

          if (elementsJson.status !== 200 ) {
            console.log(await elementsJson.text());
            this.projectNotFound = true;
            foundClass = 'ta-not-found';
          } else {
            this.projectNotFound = false;
            const elements = await elementsJson.json();
            foundClass = elements.hasOwnProperty('elements') && elements.elements.length > 0 ? 'ta-found' : 'ta-not-found';
          }
        } else {
          foundClass = 'ta-not-found';
        }

        this.createTaMarkers(result, foundClass, editor);
      } catch (e) {
        console.log(e);
      }
    };

    if (!range) {
      editor.scan(/[\s|\(|\=](ta|byTa|@FindByTA)\s*\((\s*|\s*taName\s*\=\s*)[\'\"]((\w|:)+)[\'\"]\s*\)/g, {}, result => callback(result));
    } else {
      editor.scanInBufferRange(/[\s|\(|\=](ta|byTa|@FindByTA)\s*\((\s*|\s*taName\s*\=\s*)[\'\"]((\w|:)+)[\'\"]\s*\)/g, range, result => callback(result));
    }
  },
  scanForTaElement(editor, selector) {
    const projectName = this.getProjectName(editor);
    const callback = async (result) => {
      try{
        if (this.updateEditorText({ result, editor })) return null;

        let foundClass;
        if (projectName) {
          const taName = result.match[3];
          const elementsJson = await fetch('http://localhost:9898/ide/findElementsByNames', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({ names: [taName], projectName }),
          });

          if (elementsJson.status !== 200 ) {
            console.log(await elementsJson.text());
            this.projectNotFound = true;
            foundClass = 'ta-not-found';
          } else {
            this.projectNotFound = false;
            const elements = await elementsJson.json();
            foundClass = elements.hasOwnProperty('elements') && elements.elements.length > 0 ? 'ta-found' : 'ta-not-found';
          }
        } else {
          foundClass = 'ta-not-found';
        }

        this.createTaMarkers(result, foundClass, editor);
      } catch (e) {
        console.log(e);
      }
    };

    const regex = new RegExp("[\\s|\\(|\\=](ta|byTa|@FindByTA)\\s*\\((\\s*|\\s*taName\\s*\\=\\s*)[\\'\\\"](" + selector + ")[\\'\\\"]\\s*\\)", "g");
    editor.scan(regex, {}, result => callback(result));
  }
};
