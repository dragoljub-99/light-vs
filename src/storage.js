export const STORAGE_KEY = 'lvs_versions';

export function loadVersions() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}

export function saveVersions(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list || []));
}
