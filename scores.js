/* ═══════════════════════════════════════════
   js/scores.js
   Per-user score management (Firestore)
   ═══════════════════════════════════════════ */

import { db, collection, doc, onSnapshot, setDoc, state } from './firebase.js';
import { renderAll } from './render.js';

// ── Subscribe to the current user's score sub-collection ──
export function loadScores() {
  if (!state.username) return;

  onSnapshot(collection(db, 'scores', state.username, 'words'), snap => {
    state.scores = {};
    snap.docs.forEach(d => { state.scores[d.id] = d.data().score || 0; });
    renderAll();
  });
}

// ── Write a score delta (+1 / -1) ──
export async function updateScore(wordId, delta) {
  if (!state.username) return;
  const next          = Math.max(-5, Math.min(10, (state.scores[wordId] || 0) + delta));
  state.scores[wordId] = next;
  await setDoc(doc(db, 'scores', state.username, 'words', wordId), { score: next });
}

// ── Read a score (default 0) ──
export function getScore(id) {
  return state.scores[id] || 0;
}

// ── Render the 5 coloured pip dots ──
export function scorePips(id) {
  const s    = getScore(id);
  let html   = '';
  for (let i = 0; i < 5; i++) {
    if (s >= 0) html += `<div class="pip ${i < s  ? 'green' : ''}"></div>`;
    else        html += `<div class="pip ${i < -s ? 'red'   : ''}"></div>`;
  }
  return `<div class="score-pips">${html}</div>`;
}
