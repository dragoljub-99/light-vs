# LightVS — Light Versioning System
GitHub-inspired light versioning application developed in plain JavaScript, HTML, and CSS. It uses LocalStorage for storing and tracking changes. 

## How to run

Opening `index.html` by double-click may work, but for the most reliable way (especially because of LocalStorage usage), use a small local server.

**VS Code (Live Server Extension)**  
Requires extension: **Live Server** — Ritwick Dey (`ritwickdey.LiveServer`).

1. Open the project folder in VS Code
2. Right click `index.html` → **Open with Live Server**

## How to use it

**Home (index.html)**
- Two cards: History and Compare
- About button open a modal with contact links and short project description

**History**
1. Click Choose file and select a text file (.txt, .md, .json, .css, .js, etc.).
2. Enter a Commit message.
3. Click Commit -> a new version is saved to LocalStorage.
4. The left panel lists versions; click one to view its content and metadata on the right.

**Compare**
1. Left panel auto-loads the latest committed version (if any).
2. Upload a file on the right panel to compare against the left.
3. The right panel colors lines as same / inserted / deleted.
4. Click Accept merge to generate a Merge preview (final merged content).
5. Enter a message and Commit to save the merge result as a new version.

## Algorithm
Greedy bi-directional pointer with a limited window ahead, ignoring trailing whitespaces. K is number of lines in window, set in code, rather then in config file or UI, for now.

## Project structure

LightVS/
├─src/
├─ index.html      # Home: title, cards (History/Compare), About modal
├─ history.html    # Version list (left), selected version viewer (right), uploader & commit
├─ compare.html    # Left latest version (as-is), right upload + diff + merge preview &commit
├─ style.css       # Light theme, cards, soft shadows, animations, responsive layout
├─ main.js         # About modal show/hide and global UI events
├─ history.js      # Version load/save, uploader, list rendering, viewer rendering
├─ compare.js      # Line splitting, diff algorithm, right pane states, merge preview &commit
└─ storage.js      # LocalStorage abstraction (key, load/save helpers)
