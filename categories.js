/* ═══════════════════════════════════════════
   js/categories.js
   "Categories" view: add/delete subcategories
   ═══════════════════════════════════════════ */

import { db, doc, updateDoc, state } from './firebase.js';
import { showToast, setSyncStatus }  from './render.js';

// ── Render the whole category tree ───────────
export function renderCatTree() {
  const tree = document.getElementById('cat-tree');
  if (!tree) return;

  tree.innerHTML = state.categories.map(c => `
    <div class="cat-main-row">
      <div class="cat-main-label">${c.main}</div>
      <div class="cat-subs">
        ${c.subs.map(s =>
          `<div class="sub-tag">${s}
            <button onclick="deleteSub('${c.main}','${s}')">×</button>
          </div>`
        ).join('')}
        ${c.main === 'vocabulaire'
          ? `<div class="add-sub-inline">
               <input type="text" id="new-sub-${c.main}"
                 placeholder="new subcategory…"
                 onkeydown="if(event.key==='Enter')addSub('${c.main}')" />
               <button onclick="addSub('${c.main}')">+ Add</button>
             </div>`
          : `<span style="font-size:12px;color:var(--text-muted);font-style:italic">
               No subcategories
             </span>`}
      </div>
    </div>
    <div style="height:1px;background:var(--border);margin:4px 0"></div>
  `).join('');
}

// ── Add a subcategory ──────────────────────
window.addSub = async main => {
  const input = document.getElementById(`new-sub-${main}`);
  const val   = input.value.trim().toLowerCase();
  if (!val) return;

  const cat = state.categories.find(c => c.main === main);
  if (!cat || cat.subs.includes(val)) { showToast('Already exists'); return; }

  setSyncStatus('syncing');
  await updateDoc(doc(db, 'categories', main), { subs: [...cat.subs, val] });
  input.value = '';
  showToast(`"${val}" added`);
};

// ── Delete a subcategory (and clear it on affected words) ──
window.deleteSub = async (main, sub) => {
  const cat = state.categories.find(c => c.main === main);
  if (!cat) return;

  setSyncStatus('syncing');
  await updateDoc(doc(db, 'categories', main), {
    subs: cat.subs.filter(s => s !== sub)
  });

  // Detach the sub from any word that used it
  for (const w of state.words.filter(w => w.main === main && w.sub === sub)) {
    await updateDoc(doc(db, 'words', w._id), { sub: '' });
  }

  showToast(`"${sub}" deleted`);
};
