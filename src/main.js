const aboutBtn = document.getElementById('aboutBtn');
const aboutModal = document.getElementById('aboutModal');
const aboutClose = document.getElementById('aboutClose');

function showModal() {
  if (!aboutModal) return;
  aboutModal.classList.add('show');
  aboutModal.setAttribute('aria-hidden', 'false');
}

function hideModal() {
  if (!aboutModal) return;
  aboutModal.classList.remove('show');
  aboutModal.setAttribute('aria-hidden', 'true');
}

if (aboutBtn) aboutBtn.addEventListener('click', showModal);
if (aboutClose) aboutClose.addEventListener('click', hideModal);
if (aboutModal) aboutModal.addEventListener('click', e => { if (e.target === aboutModal) hideModal(); });
