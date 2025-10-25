import { loadVersions } from './storage.js';

const versionList = document.getElementById('versionList');
const viewerTitle = document.getElementById('viewerTitle');
const viewerMeta = document.getElementById('viewerMeta');
const viewerContent = document.getElementById('viewerContent');
const versions = loadVersions();

function renderList() {
  if (!versionList) return;
  versionList.innerHTML = '';
  versions.forEach(v => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.className = 'btn secondary';
    btn.textContent = v.message || v.id;
    btn.addEventListener('click', () => {
      if (viewerTitle) viewerTitle.textContent = v.message || v.id;
      if (viewerMeta) viewerMeta.textContent = v.createdAt || '';
      if (viewerContent) viewerContent.textContent = v.content || '';
    });
    li.appendChild(btn);
    versionList.appendChild(li);
  });
}

renderList();
