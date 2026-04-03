/* ═══════════════════════════════════════════
   js/manage.js
   "My words" view: add, edit, delete, CSV import
   ═══════════════════════════════════════════ */

import { db, collection, doc, addDoc, updateDoc, deleteDoc, state } from './firebase.js';
import { uploadToCloudinary }  from './audio.js';
import { showToast, setSyncStatus } from './render.js';
import { getScore }            from './scores.js';
import { playWordAudio }       from './audio.js';

// ── Local UI state ───────────────────────────
let selectedMainCat  = '';
let selectedSubCat   = '';
let manageCatMain    = 'tout';
let manageCatSub     = '';
let editingId        = null;
let editSelectedMain = '';
let editSelectedSub  = '';
let pendingAudioFile     = null;
let editPendingAudioFile = null;
let csvParsed        = [];

// ═══════════════════════════════════════════
// MANAGE FILTERS
// ═══════════════════════════════════════════
export function renderManageCatFilters() {
  const mainEl = document.getElementById('manage-main-filters');
  if (!mainEl) return;

  mainEl.innerHTML = ['tout', ...state.categories.map(c => c.main)].map(m =>
    `<button class="toggle-btn ${manageCatMain === m ? 'active' : ''}"
      onclick="setManageMain('${m}')">${m === 'tout' ? 'All' : m}</button>`
  ).join('');

  const subEl  = document.getElementById('manage-sub-filters');
  const catObj = state.categories.find(c => c.main === manageCatMain);

  subEl.innerHTML = catObj && catObj.subs.length > 0
    ? ['tout', ...catObj.subs].map(s =>
        `<button class="toggle-btn sub ${(s === 'tout' && !manageCatSub) || manageCatSub === s ? 'active' : ''}"
          onclick="setManageSub('${s}')">${s === 'tout' ? 'All' : s}</button>`
      ).join('')
    : '';
}

window.setManageMain = m => { manageCatMain = m; manageCatSub = ''; renderManageCatFilters(); renderWordList(); };
window.setManageSub  = s => { manageCatSub = s === 'tout' ? '' : s; renderManageCatFilters(); renderWordList(); };

// ═══════════════════════════════════════════
// MAIN CATEGORY PICKER (add form)
// ═══════════════════════════════════════════
export function renderMainCatPicker(sel) {
  sel = sel !== undefined ? sel : selectedMainCat;
  const el = document.getElementById('main-cat-picker');
  if (!el) return;

  el.innerHTML = state.categories.map(c =>
    `<button class="cat-pill ${sel === c.main ? 'selected' : ''}"
      onclick="pickMainCat('${c.main}')">${c.main}</button>`
  ).join('');
}

window.pickMainCat = m => {
  selectedMainCat = m;
  selectedSubCat  = '';
  renderMainCatPicker(m);

  const catObj = state.categories.find(c => c.main === m);
  const grp    = document.getElementById('sub-cat-group');
  const sp     = document.getElementById('sub-cat-picker');

  if (catObj && catObj.subs.length > 0) {
    grp.style.display = '';
    sp.innerHTML      = catObj.subs.map(s =>
      `<button class="cat-pill" onclick="pickSubCat('${s}')">${s}</button>`
    ).join('');
  } else {
    grp.style.display = 'none';
    sp.innerHTML      = '';
  }
};

window.pickSubCat = s => {
  selectedSubCat = s;
  document.getElementById('sub-cat-picker')
    .querySelectorAll('.cat-pill')
    .forEach(p => p.classList.toggle('selected', p.textContent.trim() === s));
};

// ═══════════════════════════════════════════
// ADD WORD
// ═══════════════════════════════════════════
window.addWord = async () => {
  const viet  = document.getElementById('inp-viet').value.trim();
  const fr    = document.getElementById('inp-fr').value.trim();
  const roman = document.getElementById('inp-roman').value.trim();

  if (!viet || !fr)       { showToast('Fill in at least Vietnamese and English'); return; }
  if (!selectedMainCat)   { showToast('Choose a category');                       return; }

  const btn    = document.getElementById('btn-add-word');
  btn.disabled = true;
  btn.textContent = 'Adding...';
  setSyncStatus('syncing');

  let audioUrl = '';
  if (pendingAudioFile) {
    try {
      showToast('Uploading audio...');
      audioUrl = await uploadToCloudinary(pendingAudioFile);
    } catch (e) { showToast('Audio upload error'); }
    pendingAudioFile = null;
  }

  await addDoc(collection(db, 'words'), {
    viet, fr, roman,
    main: selectedMainCat,
    sub:  selectedSubCat,
    audioUrl,
    createdAt: Date.now()
  });

  ['inp-viet', 'inp-fr', 'inp-roman'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('audio-filename').textContent = 'No file — stored on Cloudinary';
  document.getElementById('audioFileInput').value       = '';
  selectedMainCat = '';
  selectedSubCat  = '';
  renderMainCatPicker('');
  document.getElementById('sub-cat-group').style.display = 'none';
  btn.disabled    = false;
  btn.textContent = 'Add card';
  showToast('Card added!');
};

window.handleAudioFile = input => {
  const f = input.files[0]; if (!f) return;
  pendingAudioFile = f;
  document.getElementById('audio-filename').textContent =
    `${f.name} → will be uploaded to Cloudinary`;
};

// ═══════════════════════════════════════════
// WORD LIST
// ═══════════════════════════════════════════
export function renderWordList() {
  const filtered = state.words.filter(w => {
    if (manageCatMain === 'tout') return true;
    if (w.main !== manageCatMain) return false;
    if (manageCatSub && w.sub !== manageCatSub) return false;
    return true;
  });

  const list = document.getElementById('word-list');
  if (!list) return;

  if (!filtered.length) {
    list.innerHTML = '<div class="empty-card"><p>No cards here.</p></div>';
    updateWordCount();
    return;
  }

  list.innerHTML = filtered.map(w => {
    const cat     = w.sub ? `${w.main} › ${w.sub}` : w.main;
    const safe    = (w.viet     || '').replace(/'/g, "\\'");
    const safeUrl = (w.audioUrl || '').replace(/'/g, "\\'");
    const s       = getScore(w._id);
    const sc      = s > 0 ? '#7ae8a0' : s < 0 ? '#e87a7a' : 'var(--text-muted)';

    return `<div class="word-item">
      <div style="font-size:11px;color:${sc};min-width:24px;text-align:center;font-weight:600">
        ${s > 0 ? '+' : ''}${s}
      </div>
      <div class="word-viet">${w.viet}</div>
      <div class="word-fr">${w.fr}</div>
      <div class="word-cat">${cat}${w.audioUrl ? ' 🎵' : ''}</div>
      <div class="word-actions">
        <button class="word-btn" onclick="wordPlayAudio('${safeUrl}','${safe}')">
          <svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
        </button>
        <button class="word-btn" onclick="openEditModal('${w._id}')">
          <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
        </button>
        <button class="word-btn delete" onclick="deleteWord('${w._id}')">
          <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
        </button>
      </div>
    </div>`;
  }).join('');

  updateWordCount();
}

export function updateWordCount() {
  const el = document.getElementById('word-count');
  if (el) el.textContent = state.words.length;
}

window.wordPlayAudio = (url, viet) => playWordAudio(url, viet);
window.deleteWord    = async id => {
  setSyncStatus('syncing');
  await deleteDoc(doc(db, 'words', id));
  showToast('Card deleted');
};

// ═══════════════════════════════════════════
// EDIT MODAL
// ═══════════════════════════════════════════
window.openEditModal = id => {
  const w = state.words.find(x => x._id === id);
  if (!w) return;

  editingId        = id;
  editSelectedMain = w.main;
  editSelectedSub  = w.sub || '';
  editPendingAudioFile = null;

  document.getElementById('edit-viet').value  = w.viet;
  document.getElementById('edit-fr').value    = w.fr;
  document.getElementById('edit-roman').value = w.roman || '';
  document.getElementById('edit-audio-filename').textContent =
    w.audioUrl ? '🎵 existing audio' : 'no audio';
  document.getElementById('editAudioFileInput').value = '';

  renderEditPicker(editSelectedMain);
  document.getElementById('edit-modal').classList.add('open');
};

function renderEditPicker(sel) {
  document.getElementById('edit-main-cat-picker').innerHTML =
    state.categories.map(c =>
      `<button class="cat-pill ${sel === c.main ? 'selected' : ''}"
        onclick="editPickMain('${c.main}')">${c.main}</button>`
    ).join('');
  renderEditSubs(sel);
}

function renderEditSubs(main) {
  const catObj = state.categories.find(c => c.main === main);
  const grp    = document.getElementById('edit-sub-cat-group');
  const el     = document.getElementById('edit-sub-cat-picker');

  if (catObj && catObj.subs.length > 0) {
    grp.style.display = '';
    el.innerHTML      = catObj.subs.map(s =>
      `<button class="cat-pill ${editSelectedSub === s ? 'selected' : ''}"
        onclick="editPickSub('${s}')">${s}</button>`
    ).join('');
  } else {
    grp.style.display = 'none';
    el.innerHTML      = '';
  }
}

window.editPickMain  = m => { editSelectedMain = m; editSelectedSub = ''; renderEditPicker(m); };
window.editPickSub   = s => {
  editSelectedSub = s;
  document.getElementById('edit-sub-cat-picker')
    .querySelectorAll('.cat-pill')
    .forEach(p => p.classList.toggle('selected', p.textContent.trim() === s));
};
window.closeEditModal = () => {
  document.getElementById('edit-modal').classList.remove('open');
  editingId        = null;
  editPendingAudioFile = null;
};
window.saveEdit = async () => {
  if (!editingId) return;
  setSyncStatus('syncing');

  const w = state.words.find(x => x._id === editingId);
  let audioUrl = w?.audioUrl || '';

  if (editPendingAudioFile) {
    try {
      showToast('Uploading audio...');
      audioUrl = await uploadToCloudinary(editPendingAudioFile);
    } catch (e) { showToast('Audio upload error'); }
  }

  await updateDoc(doc(db, 'words', editingId), {
    viet:  document.getElementById('edit-viet').value.trim(),
    fr:    document.getElementById('edit-fr').value.trim(),
    roman: document.getElementById('edit-roman').value.trim(),
    main:  editSelectedMain,
    sub:   editSelectedSub,
    audioUrl
  });

  window.closeEditModal();
  showToast('Card updated!');
};

window.handleEditAudioFile = input => {
  const f = input.files[0]; if (!f) return;
  editPendingAudioFile = f;
  document.getElementById('edit-audio-filename').textContent = f.name;
};

// ═══════════════════════════════════════════
// CSV IMPORT
// ═══════════════════════════════════════════
function parseCSV(text) {
  return text.trim().split('\n')
    .filter(l => l.trim())
    .map(line => {
      const p = line.split(',').map(x => x.trim());
      return {
        viet:  p[0] || '',
        fr:    p[1] || '',
        roman: p[2] || '',
        main: (p[3] || 'expressions').toLowerCase(),
        sub:  (p[4] || '').toLowerCase()
      };
    })
    .filter(r => r.viet && r.fr);
}

function previewCsv(text) {
  csvParsed = parseCSV(text);
  if (!csvParsed.length) { showToast('Empty or badly formatted file'); return; }

  const preview = document.getElementById('csv-preview');
  const btn     = document.getElementById('btn-import');
  preview.style.display = '';
  btn.style.display     = '';
  btn.textContent       = `Import ${csvParsed.length} word${csvParsed.length > 1 ? 's' : ''}`;

  preview.innerHTML = csvParsed.slice(0, 8).map(r =>
    `<div class="csv-row">
      <div class="cv">${r.viet}</div>
      <div class="cf">${r.fr}</div>
      <div class="cc">${r.main}${r.sub ? ' › ' + r.sub : ''}</div>
    </div>`
  ).join('') + (csvParsed.length > 8
    ? `<div class="csv-row" style="color:var(--text-muted);font-size:12px">... and ${csvParsed.length - 8} more</div>`
    : '');
}

window.handleCsvFile = input => {
  const f = input.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = e => previewCsv(e.target.result);
  r.readAsText(f);
};

window.handleCsvDrop = e => {
  e.preventDefault();
  document.getElementById('csv-drop').classList.remove('drag');
  const f = e.dataTransfer.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = ev => previewCsv(ev.target.result);
  r.readAsText(f);
};

window.importCsv = async () => {
  if (!csvParsed.length) return;
  setSyncStatus('syncing');

  for (const w of csvParsed) {
    await addDoc(collection(db, 'words'), { ...w, audioUrl: '', createdAt: Date.now() });
  }

  csvParsed = [];
  document.getElementById('csv-preview').style.display = 'none';
  document.getElementById('btn-import').style.display  = 'none';
  document.getElementById('csvFileInput').value        = '';
  showToast('Words imported!');
};
