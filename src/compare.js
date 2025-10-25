import { loadVersions } from './storage.js';

const leftContent = document.getElementById('leftContent');
const rightContent = document.getElementById('rightContent');
const rightUpload = document.getElementById('rightUpload');
const resetBtn = document.getElementById('resetBtn');
const acceptMergeBtn = document.getElementById('acceptMergeBtn');

const versions = loadVersions();
const last = versions[0];

let leftRaw = [];
let rightRaw = [];
let rightSelected = new Set();

function splitLines(text) {
  return String(text || '').split('\n');
}

function renderColumn(container, lines, selectable) {
  if (!container) return;
  container.innerHTML = '';
  lines.forEach((line, idx) => {
    const div = document.createElement('div');
    div.className = 'line';
    div.textContent = line;
    if (selectable) {
      div.addEventListener('click', () => {
        const key = String(idx);
        if (rightSelected.has(key)) {
          rightSelected.delete(key);
          div.classList.remove('selected');
        } else {
          rightSelected.add(key);
          div.classList.add('selected');
        }
        updateActionsState();
      });
    }
    container.appendChild(div);
  });
}

function updateActionsState() {
  const hasSelection = rightSelected.size > 0;
  if (resetBtn) resetBtn.disabled = !hasSelection;
  if (acceptMergeBtn) acceptMergeBtn.disabled = true;
}

function resetSelections() {
  rightSelected.clear();
  if (rightContent) {
    Array.from(rightContent.children).forEach(ch => ch.classList.remove('selected'));
  }
  updateActionsState();
}

function loadLeftFromLast() {
  leftRaw = splitLines(last ? last.content : '');
  renderColumn(leftContent, leftRaw, false);
}

async function onRightUpload(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) {
    rightRaw = [];
    renderColumn(rightContent, rightRaw, true);
    resetSelections();
    return;
  }
  const text = await file.text();
  rightRaw = splitLines(text);
  renderColumn(rightContent, rightRaw, true);
  resetSelections();
}

loadLeftFromLast();
renderColumn(rightContent, rightRaw, true);
updateActionsState();

if (rightUpload) rightUpload.addEventListener('change', onRightUpload);
if (resetBtn) resetBtn.addEventListener('click', resetSelections);
