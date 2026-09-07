// Preferences stay on this device and never enter analytics payloads.
(() => {
  const readingSize = document.getElementById('reading-size');
  const guidedMode = document.getElementById('guided-mode');
  function save(key, value) { try { localStorage.setItem(key, value); } catch (_) {} }
  function applySize(value) {
    const size = ['standard', 'large', 'extra'].includes(value) ? value : 'standard';
    document.body.dataset.readingSize = size;
    readingSize.value = size;
  }
  function applyGuided(value) {
    document.body.dataset.guided = String(value);
    guidedMode.checked = value;
  }
  applySize(safeGet('rosary-reading-size', 'standard'));
  applyGuided(safeGet('rosary-guided', 'false') === 'true');
  readingSize.addEventListener('change', () => { applySize(readingSize.value); save('rosary-reading-size', readingSize.value); });
  guidedMode.addEventListener('change', () => { applyGuided(guidedMode.checked); save('rosary-guided', String(guidedMode.checked)); });
  document.getElementById('intention-input').addEventListener('input', event => {
    if (!state.showingIntention) return;
    state.intention = event.target.value.slice(0, 1000);
    persistSession();
  });
  // A scroll or drag is reading, never a page turn, even if the finger returns.
  document.addEventListener('scroll', () => { state.tapStart = null; }, {passive:true,capture:true});
  document.addEventListener('pointermove', event => {
    const start = state.tapStart;
    if (start && (Math.abs(event.clientX-start.x)>12 || Math.abs(event.clientY-start.y)>12)) state.tapStart = null;
  }, {passive:true});
  // Leave vertical arrows for reading and avoid skipping prayers on key repeat.
  document.addEventListener('keydown', event => {
    if (!screenIs('prayer') || isMobileMenuOpen()) return;
    if (event.repeat || ['ArrowUp','ArrowDown'].includes(event.key)) event.stopImmediatePropagation();
  }, true);
  document.getElementById('mystery-image').addEventListener('error', event => { event.target.hidden = true; });
  new MutationObserver(() => { document.getElementById('mystery-image').hidden = false; })
    .observe(document.getElementById('mystery-image'), { attributes:true, attributeFilter:['src'] });
  const sheet = document.getElementById('mobile-menu-sheet');
  new MutationObserver(() => { document.body.classList.toggle('menu-open', !sheet.hidden); })
    .observe(sheet, {attributes:true, attributeFilter:['hidden']});
})();
