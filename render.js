/* ═══════════════════════════════════════════
   js/render.js
   Shared render orchestrator + UI helpers
   ═══════════════════════════════════════════ */

import { state } from './firebase.js';

// ── Sync status dot ──────────────────────────
export function setSyncStatus(s) {
  document.getElementById('sync-dot').className    = 'sync-dot ' + s;
  document.getElementById('sync-label').textContent =
    s === 'ok'      ? 'Synced'      :
    s === 'syncing' ? 'Syncing...'  : 'Offline';
}

// ── Toast notification ───────────────────────
export function showToast(msg) {
  const t       = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ── Master re-render (called after any data change) ──
export function renderAll() {
  if (!state.dbReady || !state.username) return;

  // Lazy-import to avoid circular deps at module-load time
  import('./study.js').then(m   => { m.renderStudyCatFilters(); m.startSession(); });
  import('./manage.js').then(m  => { m.renderWordList(); m.updateWordCount(); m.renderMainCatPicker(); m.renderManageCatFilters(); });

  const catView = document.getElementById('view-categories');
  if (catView && catView.classList.contains('active')) {
    import('./categories.js').then(m => m.renderCatTree());
  }
}
