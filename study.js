/* ═══════════════════════════════════════════
   js/study.js
   Study view: filters, session, card render
   ═══════════════════════════════════════════ */

import { state }                          from './firebase.js';
import { getScore, scorePips, updateScore } from './scores.js';
import { playAudio }                      from './audio.js';

// ── Filter state ─────────────────────────────
let activeCatMain = 'tout';
let activeCatSub  = '';

// ── Session state ────────────────────────────
let deck         = [];
let currentIndex = 0;
let correct      = 0;
let wrong        = 0;
let mode         = 'viet-eng';

// ═══════════════════════════════════════════
// MODE
// ═══════════════════════════════════════════
export function setMode(m) {
  mode = m;
  document.querySelectorAll('#mode-controls .toggle-btn')
    .forEach(b => b.classList.remove('active'));
  document.getElementById('btn-' + m).classList.add('active');
  startSession();
}
window.setMode = setMode;

// ═══════════════════════════════════════════
// CATEGORY FILTERS
// ═══════════════════════════════════════════
export function renderStudyCatFilters() {
  const mainEl = document.getElementById('main-cat-filters');
  if (!mainEl) return;

  mainEl.innerHTML = ['tout', ...state.categories.map(c => c.main)].map(m =>
    `<button class="toggle-btn ${activeCatMain === m ? 'active' : ''}"
      onclick="setStudyMain('${m}')">${m === 'tout' ? 'All' : m}</button>`
  ).join('');

  const subEl  = document.getElementById('sub-cat-filters');
  const catObj = state.categories.find(c => c.main === activeCatMain);

  subEl.innerHTML = catObj && catObj.subs.length > 0
    ? ['tout', ...catObj.subs].map(s =>
        `<button class="toggle-btn sub ${(s === 'tout' && !activeCatSub) || activeCatSub === s ? 'active' : ''}"
          onclick="setStudySub('${s}')">${s === 'tout' ? 'All' : s}</button>`
      ).join('')
    : '';

  const bc = document.getElementById('cat-breadcrumb');
  bc.innerHTML = activeCatMain === 'tout' ? '' :
    `<span>${activeCatMain}</span>` +
    (activeCatSub ? `<span style="opacity:.4">›</span><span>${activeCatSub}</span>` : '');
}

window.setStudyMain = m => { activeCatMain = m; activeCatSub = ''; renderStudyCatFilters(); startSession(); };
window.setStudySub  = s => { activeCatSub = s === 'tout' ? '' : s; renderStudyCatFilters(); startSession(); };

// ═══════════════════════════════════════════
// SESSION
// ═══════════════════════════════════════════
function getFiltered() {
  return state.words.filter(w => {
    if (activeCatMain === 'tout') return true;
    if (w.main !== activeCatMain) return false;
    if (activeCatSub && w.sub !== activeCatSub) return false;
    return true;
  });
}

export function startSession() {
  const filtered = getFiltered();
  filtered.sort((a, b) => {
    const sa = getScore(a._id), sb = getScore(b._id);
    if (sa !== sb) return sa - sb;
    return Math.random() - 0.5;
  });
  deck         = filtered;
  currentIndex = 0;
  correct      = 0;
  wrong        = 0;
  updateStats();
  renderCard();
}
window.startSession = startSession;

// ═══════════════════════════════════════════
// STATS BAR
// ═══════════════════════════════════════════
function updateStats() {
  document.getElementById('stat-correct').textContent   = correct;
  document.getElementById('stat-wrong').textContent     = wrong;
  document.getElementById('stat-remaining').textContent = Math.max(0, deck.length - currentIndex);

  const pct = deck.length ? Math.round((currentIndex / deck.length) * 100) : 0;
  document.getElementById('progress-fill').style.width   = pct + '%';
  document.getElementById('progress-text').textContent   = currentIndex + ' / ' + deck.length;
}

// ═══════════════════════════════════════════
// CARD RENDER
// ═══════════════════════════════════════════
function renderCard() {
  const area = document.getElementById('study-area');
  if (!area) return;

  if (!state.dbReady) {
    area.innerHTML = `<div class="loading-screen"><div class="spinner"></div><p>Loading...</p></div>`;
    return;
  }
  if (!deck.length) {
    area.innerHTML = `<div class="empty-card"><p>No cards here.<br>Add words in <strong>My words</strong>.</p></div>`;
    return;
  }
  if (currentIndex >= deck.length) {
    area.innerHTML = `
      <div class="completed">
        <h2>Done!</h2>
        <p>${correct} known · ${wrong} to review</p>
        <p class="score-recap">Hard words will come first next time.</p>
        <button class="btn-restart" onclick="startSession()">Restart</button>
      </div>`;
    return;
  }

  const w   = deck[currentIndex];
  const em  = mode === 'random'
    ? (Math.random() > 0.5 ? 'viet-eng' : 'eng-viet')
    : mode;
  const sv  = em === 'viet-eng';
  const cat = w.sub ? `${w.main} › ${w.sub}` : w.main;

  // Escape single quotes for inline onclick attrs
  const safe    = (w.viet    || '').replace(/'/g, "\\'");
  const safeUrl = (w.audioUrl || '').replace(/'/g, "\\'");

  area.innerHTML = `
    <div class="card-area">
      <div class="card" id="flashcard" onclick="flipCard()">
        <div class="card-face card-front">
          <div class="card-lang-badge ${sv ? 'badge-viet' : 'badge-fr'}">${sv ? 'Vietnamese' : 'English'}</div>
          ${scorePips(w._id)}
          <div class="card-word">${sv ? w.viet : w.fr}</div>
          ${sv && w.roman ? `<div class="card-romanization">${w.roman}</div>` : ''}
          <div class="card-category">${cat}</div>
          <button class="audio-btn" id="play-btn"
            onclick="handlePlayAudio(event,'${safeUrl}','${safe}')">
            <svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
            ${w.audioUrl ? 'Listen (native)' : 'Listen (synth)'}
          </button>
          <div class="card-hint">Tap to flip</div>
        </div>
        <div class="card-face card-back">
          <div class="card-lang-badge ${sv ? 'badge-fr' : 'badge-viet'}">${sv ? 'English' : 'Vietnamese'}</div>
          <div class="card-word">${sv ? w.fr : w.viet}</div>
          ${!sv && w.roman ? `<div class="card-romanization">${w.roman}</div>` : ''}
          <div class="card-hint">How did you do?</div>
        </div>
      </div>
    </div>
    <div class="actions">
      <button class="btn btn-wrong"   onclick="answer(false)">✗ To review</button>
      <button class="btn btn-skip"    onclick="answer(null)">→ Skip</button>
      <button class="btn btn-correct" onclick="answer(true)">✓ Known</button>
    </div>`;
}

// ── Expose to inline HTML handlers ──
window.handlePlayAudio = (e, url, viet) => playAudio(e, url, viet);
window.flipCard        = () => document.getElementById('flashcard').classList.toggle('flipped');
window.answer          = async result => {
  const w = deck[currentIndex];
  if (result === true)  { correct++; await updateScore(w._id, +1); }
  if (result === false) { wrong++;   await updateScore(w._id, -1); }
  currentIndex++;
  updateStats();
  renderCard();
};
