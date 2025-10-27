import { loadVersions, saveVersions } from './storage.js';

const leftContent = document.getElementById('leftContent');
const rightContent = document.getElementById('rightContent');
const rightUpload = document.getElementById('rightUpload');
const resetBtn = document.getElementById('resetBtn');
const acceptMergeBtn = document.getElementById('acceptMergeBtn');
const mergePreview = document.getElementById('mergePreview');
const mergeMessage = document.getElementById('mergeMessage');
const commitMergeBtn = document.getElementById('commitMergeBtn');

let versions = loadVersions();
let leftRaw = [];
let rightRaw = [];
let rightFileName = '';
let blocks = [];
let decisions = {};

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

function rightAnchoredDiff(L, R) {
  const K = 40;
  const items = [];
  let i = 0;
  let j = 0;

  while (i < L.length && j < R.length) {
    if (normLine(L[i]) === normLine(R[j])) {
      items.push({ kind: 'same', text: R[j] });
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
      for (let t = j; t < jb; t++) items.push({ kind: 'inserted', text: R[t] });
      j = jb;
      continue;
    }

    if (ia !== -1) {
      for (let t = i; t < ia; t++) items.push({ kind: 'deleted', text: L[t] });
      i = ia;
      continue;
    }

    items.push({ kind: 'deleted', text: L[i] });
    items.push({ kind: 'inserted', text: R[j] });
    i += 1;
    j += 1;
  }

  while (j < R.length) {
    items.push({ kind: 'inserted', text: R[j] });
    j += 1;
  }

  while (i < L.length) {
    items.push({ kind: 'deleted', text: L[i] });
    i += 1;
  }

  return items;
}

function buildBlocks(items) {
  const out = [];
  let cur = null;
  let idx = 0;
  for (const it of items) {
    if (it.kind === 'same') {
      if (cur) { out.push(cur); cur = null; }
      out.push({ id: null, kind: 'same', lines: [it.text] });
      continue;
    }
    if (!cur || cur.kind !== it.kind) {
      if (cur) out.push(cur);
      cur = { id: String(idx++), kind: it.kind, lines: [it.text] };
      continue;
    }
    cur.lines.push(it.text);
  }
  if (cur) out.push(cur);
  return out;
}

function defaultDecisions(blks) {
  const map = {};
  blks.forEach(b => {
    if (!b.id) return;
    if (b.kind === 'inserted') map[b.id] = true;
    if (b.kind === 'deleted') map[b.id] = false;
  });
  return map;
}

function renderRight(blks) {
  if (!rightContent) return;
  rightContent.innerHTML = '';
  blks.forEach(b => {
    if (b.kind === 'same') {
      b.lines.forEach(line => {
        const div = document.createElement('div');
        div.className = 'line same';
        div.textContent = line;
        rightContent.appendChild(div);
      });
      return;
    }
    const block = document.createElement('div');
    block.className = 'block';
    block.dataset.id = b.id;
    const toolbar = document.createElement('div');
    toolbar.className = 'block-toolbar';
    const btn = document.createElement('button');
    btn.className = 'btn ghost';
    btn.textContent = b.kind === 'inserted' ? '−' : '+';
    btn.addEventListener('click', () => toggleBlock(b.id, b.kind, block));
    toolbar.appendChild(btn);
    block.appendChild(toolbar);
    b.lines.forEach(line => {
      const div = document.createElement('div');
      div.className = 'line ' + (b.kind === 'inserted' ? 'inserted' : 'deleted');
      div.textContent = line;
      block.appendChild(div);
    });
    rightContent.appendChild(block);
    syncBlockStateClass(block, b.kind);
  });
}

function syncBlockStateClass(blockEl, kind) {
  const id = blockEl.dataset.id;
  const val = decisions[id];
  blockEl.classList.toggle('excluded', kind === 'inserted' && val === false);
  blockEl.classList.toggle('restored', kind === 'deleted' && val === true);
}

function toggleBlock(id, kind, blockEl) {
  const cur = decisions[id];
  decisions[id] = !cur;
  syncBlockStateClass(blockEl, kind);
  updateActionsState();
  updateCommitState();
}

function buildMergedResult(blks) {
  const lines = [];
  blks.forEach(b => {
    if (b.kind === 'same') {
      b.lines.forEach(l => lines.push(l));
      return;
    }
    if (b.kind === 'inserted') {
      const keep = decisions[b.id] === true;
      if (keep) b.lines.forEach(l => lines.push(l));
      return;
    }
    if (b.kind === 'deleted') {
      const restore = decisions[b.id] === true;
      if (restore) b.lines.forEach(l => lines.push(l));
      return;
    }
  });
  return lines.join('\n');
}

function recomputeAndRender() {
  const items = rightAnchoredDiff(leftRaw, rightRaw);
  blocks = buildBlocks(items);
  decisions = defaultDecisions(blocks);
  renderLeft(leftRaw);
  renderRight(blocks);
  updateActionsState();
  if (mergePreview) mergePreview.textContent = '';
  updateCommitState();
}

function updateActionsState() {
  const hasRight = rightRaw.length > 0;
  if (resetBtn) resetBtn.disabled = !hasRight;
  if (acceptMergeBtn) acceptMergeBtn.disabled = !hasRight;
}

function updateCommitState() {
  const hasPreview = !!mergePreview && mergePreview.textContent.length > 0;
  const hasMsg = !!mergeMessage && mergeMessage.value.trim().length > 0;
  const canCommit = hasPreview && hasMsg;
  if (commitMergeBtn) commitMergeBtn.disabled = !canCommit;
}

async function onRightUpload(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) {
    rightRaw = [];
    rightFileName = '';
    recomputeAndRender();
    return;
  }
  const text = await file.text();
  rightRaw = splitLines(text);
  rightFileName = file.name || '';
  recomputeAndRender();
}

function onAcceptMerge() {
  const result = buildMergedResult(blocks);
  if (mergePreview) mergePreview.textContent = result;
  updateCommitState();
}

function makeId(d) {
  const y = String(d.getFullYear());
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  const salt = Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0');
  return `lvs-${y}${m}${day}-${hh}${mm}${ss}-${salt}`;
}

function onCommitMerge() {
  if (!mergePreview || !mergeMessage) return;
  const content = mergePreview.textContent;
  const msg = mergeMessage.value.trim();
  if (!content || !msg) return;

  versions = loadVersions();
  const last = versions[0];
  if (last && last.content === content) {
    alert('No changes since last version');
    return;
  }

  const now = new Date();
  const v = {
    id: makeId(now),
    message: msg,
    createdAt: now.toISOString(),
    fileName: rightFileName || 'merged.txt',
    content
  };

  versions = [v, ...versions];
  saveVersions(versions);

  leftRaw = splitLines(v.content);
  rightRaw = [];
  rightFileName = '';
  if (rightUpload) rightUpload.value = '';
  if (mergePreview) mergePreview.textContent = '';
  if (mergeMessage) mergeMessage.value = '';
  recomputeAndRender();
}

function refreshLeftFromHistory() {
  versions = loadVersions();
  const last = versions[0];
  leftRaw = splitLines(last ? last.content : '');
}

refreshLeftFromHistory();
rightRaw = [];
recomputeAndRender();

if (rightUpload) rightUpload.addEventListener('change', onRightUpload);
if (acceptMergeBtn) acceptMergeBtn.addEventListener('click', onAcceptMerge);
if (commitMergeBtn) commitMergeBtn.addEventListener('click', onCommitMerge);
if (mergeMessage) mergeMessage.addEventListener('input', updateCommitState);
