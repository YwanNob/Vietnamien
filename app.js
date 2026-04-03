/* ═══════════════════════════════════════════
   js/app.js
   Entry point: username, nav, Firestore listeners
   ═══════════════════════════════════════════ */

import {
  db, collection, doc,
  onSnapshot, addDoc, setDoc, updateDoc,
  state, FIXED_CATS
} from './firebase.js';
import { loadScores }             from './scores.js';
import { setSyncStatus, showToast, renderAll } from './render.js';
import { renderStudyCatFilters, startSession } from './study.js';
import { renderWordList, updateWordCount, renderMainCatPicker, renderManageCatFilters } from './manage.js';
import { renderCatTree }          from './categories.js';

// ═══════════════════════════════════════════
// USERNAME
// ═══════════════════════════════════════════
function initUsername() {
  if (state.username) {
    document.getElementById('username-screen').classList.add('hidden');
    document.getElementById('user-display').textContent = state.username;
    loadScores();
  }
}

window.confirmUsername = () => {
  const val = document.getElementById('username-input').value.trim();
  if (!val) return;
  state.username = val;
  localStorage.setItem('viet_username', val);
  document.getElementById('username-screen').classList.add('hidden');
  document.getElementById('user-display').textContent = val;
  loadScores();
};

window.changeUser = () => {
  const n = prompt('Change username:', state.username);
  if (n && n.trim()) {
    state.username = n.trim();
    localStorage.setItem('viet_username', state.username);
    document.getElementById('user-display').textContent = state.username;
    loadScores();
    showToast('Username changed!');
  }
};

// ═══════════════════════════════════════════
// NAV
// ═══════════════════════════════════════════
window.switchView = (v, el) => {
  document.querySelectorAll('.view').forEach(x => x.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(x => x.classList.remove('active'));
  document.getElementById('view-' + v).classList.add('active');
  el.classList.add('active');

  if (v === 'study')      { renderStudyCatFilters(); startSession(); }
  if (v === 'manage')     { renderManageCatFilters(); renderWordList(); renderMainCatPicker(); }
  if (v === 'categories') { renderCatTree(); }
};

// ═══════════════════════════════════════════
// FIRESTORE LISTENERS
// ═══════════════════════════════════════════

// Words
onSnapshot(collection(db, 'words'), async snap => {
  if (snap.empty && !state.dbReady) {
    // Seed with default words on first use
    const defaults = [
      { viet: 'Xin chào', fr: 'Hello',    roman: 'sin tchào', main: 'expressions', sub: '', audioUrl: '', createdAt: Date.now() },
      { viet: 'Cảm ơn',   fr: 'Thank you', roman: 'gàm ơn',   main: 'expressions', sub: '', audioUrl: '', createdAt: Date.now() },
      { viet: 'Tạm biệt', fr: 'Goodbye',  roman: 'tàm biệt', main: 'expressions', sub: '', audioUrl: '', createdAt: Date.now() },
      { viet: 'Vâng',     fr: 'Yes',       roman: 'vâng',     main: 'expressions', sub: '', audioUrl: '', createdAt: Date.now() },
      { viet: 'Không',    fr: 'No',        roman: 'khong',    main: 'expressions', sub: '', audioUrl: '', createdAt: Date.now() },
      { viet: 'Gia đình', fr: 'Family',    roman: 'gia dinh', main: 'vocabulaire', sub: 'famille', audioUrl: '', createdAt: Date.now() },
      { viet: 'Mẹ',       fr: 'Mum',       roman: 'mè',       main: 'vocabulaire', sub: 'famille', audioUrl: '', createdAt: Date.now() },
      { viet: 'Bố',       fr: 'Dad',       roman: 'bố',       main: 'vocabulaire', sub: 'famille', audioUrl: '', createdAt: Date.now() },
      { viet: 'Ăn',       fr: 'To eat',    roman: 'ăn',       main: 'verbes',      sub: '', audioUrl: '', createdAt: Date.now() },
      { viet: 'Uống',     fr: 'To drink',  roman: 'uống',     main: 'verbes',      sub: '', audioUrl: '', createdAt: Date.now() },
    ];
    for (const w of defaults) await addDoc(collection(db, 'words'), w);
    return;
  }

  state.words   = snap.docs.map(d => ({ ...d.data(), _id: d.id }));
  state.dbReady = true;
  setSyncStatus('ok');
  renderAll();
}, () => setSyncStatus('error'));

// Categories
onSnapshot(collection(db, 'categories'), async snap => {
  if (snap.empty) {
    const defaults = [
      { main: 'verbes',      subs: [] },
      { main: 'expressions', subs: [] },
      { main: 'vocabulaire', subs: ['famille', 'nourriture', 'couleurs', 'chiffres'] }
    ];
    for (const c of defaults) await setDoc(doc(db, 'categories', c.main), c);
    return;
  }

  state.categories = snap.docs.map(d => d.data());
  state.categories.sort((a, b) =>
    FIXED_CATS.indexOf(a.main) - FIXED_CATS.indexOf(b.main)
  );
  renderAll();
});

// ── Boot ────────────────────────────────────
initUsername();
