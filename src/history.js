import { loadVersions, saveVersions } from './storage.js';

const versionList = document.getElementById('versionList');
const viewerTitle = document.getElementById('viewerTitle');
const viewerMeta = document.getElementById('viewerMeta');
const viewerContent = document.getElementById('viewerContent');

const fileInput = document.getElementById('fileInput');
const messageInput = document.getElementById('messageInput');
const commitBtn = document.getElementById('commitBtn');

let versions = loadVersions();
let selectedFileContent = '';
let selectedFileName = '';

function renderList() {
  if (!versionList) return;
  versionList.innerHTML = '';
  versions.forEach(v => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.className = 'btn secondary';
    btn.textContent = v.message || v.id;
    btn.addEventListener('click', () => selectVersion(v));
    li.appendChild(btn);
    versionList.appendChild(li);
  });
}

function selectVersion(v) {
  if (viewerTitle) viewerTitle.textContent = v.message || v.id;
  if (viewerMeta) viewerMeta.textContent = `${v.createdAt || ''}${v.fileName ? ' • ' + v.fileName : ''}`;
  if (viewerContent) viewerContent.textContent = v.content || '';
}

function setCommitEnabled() {
  const hasFile = selectedFileContent.length > 0;
  const hasMsg = !!messageInput && messageInput.value.trim().length > 0;
  if (commitBtn) commitBtn.disabled = !(hasFile && hasMsg);
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

async function onFileChange(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) {
    selectedFileContent = '';
    selectedFileName = '';
    setCommitEnabled();
    return;
  }
  const text = await file.text();
  selectedFileContent = text;
  selectedFileName = file.name || '';
  setCommitEnabled();
}

function onMessageInput() {
  setCommitEnabled();
}

function onCommit() {
  if (!selectedFileContent || !messageInput) return;
  const msg = messageInput.value.trim();
  if (!msg) return;

  const last = versions[0];
  if (last && last.content === selectedFileContent) {
    alert('No changes since last version');
    return;
  }

  const now = new Date();
  const v = {
    id: makeId(now),
    message: msg,
    createdAt: now.toISOString(),
    fileName: selectedFileName,
    content: selectedFileContent
  };

  versions = [v, ...versions];
  saveVersions(versions);
  renderList();
  selectVersion(v);

  if (fileInput) fileInput.value = '';
  if (messageInput) messageInput.value = '';
  selectedFileContent = '';
  selectedFileName = '';
  setCommitEnabled();
}

renderList();
if (versions[0]) selectVersion(versions[0]);
if (fileInput) fileInput.addEventListener('change', onFileChange);
if (messageInput) messageInput.addEventListener('input', onMessageInput);
if (commitBtn) commitBtn.addEventListener('click', onCommit);
setCommitEnabled();
