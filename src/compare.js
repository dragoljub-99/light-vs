import { loadVersions } from './storage.js';

const leftContent = document.getElementById('leftContent');
const rightContent = document.getElementById('rightContent');
const rightUpload = document.getElementById('rightUpload');
const versions = loadVersions();
const last = versions[0];

if (leftContent) leftContent.textContent = last ? last.content || '' : '';
if (rightUpload) {
  rightUpload.addEventListener('change', async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    if (rightContent) rightContent.textContent = text;
  });
}
