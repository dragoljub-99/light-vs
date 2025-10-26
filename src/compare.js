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

function splitLines(text) {
  return String(text || '').replace(/\r\n?/g, '\n').split('\n');
}

function normLine(s) {
  return String(s || '').replace(/\s+$/g, '');
}

function renderLeft(lines) {
  if (!leftContent) return;
  leftContent.innerHTML = '';
  lines.forEach(line => {
    const div = document.createElement('div');
    div.className = 'line';
    div.textContent = line;
    leftContent.appendChild(div);
  });
}

function renderRight(items) {
  if (!rightContent) return;
  rightContent.innerHTML = '';
  items.forEach(it => {
    const div = document.createElement('div');
    div.className = 'line';
    if (it.kind) div.classList.add(it.kind);
    div.textContent = it.text;
    rightContent.appendChild(div);
  });
}

function rightAnchoredDiff(L, R) {
  const K = 40;
  const out = [];
  let i = 0;
  let j = 0;

  while (i < L.length && j < R.length) {
    if (normLine(L[i]) === normLine(R[j])) {
      out.push({ kind: 'same', text: R[j] });
      i += 1;
      j += 1;
      continue;
    }

    let jb = -1;
    {
      const target = normLine(L[i]);
      const maxJ = Math.min(R.length, j + K);
      for (let b = j; b < maxJ; b++) {
        if (normLine(R[b]) === target) { jb = b; break; }
      }
    }

    let ia = -1;
    {
      const target = normLine(R[j]);
      const maxI = Math.min(L.length, i + K);
      for (let a = i; a < maxI; a++) {
        if (normLine(L[a]) === target) { ia = a; break; }
      }
    }

    if (jb !== -1 && (ia === -1 || (jb - j) <= (ia - i))) {
      for (let t = j; t < jb; t++) out.push({ kind: 'inserted', text: R[t] });
      j = jb;
      continue;
    }

    if (ia !== -1) {
      for (let t = i; t < ia; t++) out.push({ kind: 'deleted', text: L[t] });
      i = ia;
      continue;
    }

    out.push({ kind: 'deleted', text: L[i] });
    out.push({ kind: 'inserted', text: R[j] });
    i += 1;
    j += 1;
  }

  while (j < R.length) {
    out.push({ kind: 'inserted', text: R[j] });
    j += 1;
  }

  while (i < L.length) {
    out.push({ kind: 'deleted', text: L[i] });
    i += 1;
  }

  return out;
}

function recomputeAndRender() {
  const items = rightAnchoredDiff(leftRaw, rightRaw);
  renderLeft(leftRaw);
  renderRight(items);
  if (resetBtn) resetBtn.disabled = true;
  if (acceptMergeBtn) acceptMergeBtn.disabled = true;
}

async function onRightUpload(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) {
    rightRaw = [];
    recomputeAndRender();
    return;
  }
  const text = await file.text();
  rightRaw = splitLines(text);
  recomputeAndRender();
}

leftRaw = splitLines(last ? last.content : '');
rightRaw = [];
recomputeAndRender();

if (rightUpload) rightUpload.addEventListener('change', onRightUpload);
