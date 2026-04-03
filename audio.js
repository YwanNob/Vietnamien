/* ═══════════════════════════════════════════
   js/audio.js
   Audio playback (Cloudinary URL + Web Speech)
   ═══════════════════════════════════════════ */

import { CLOUDINARY_CLOUD, CLOUDINARY_PRESET, CLOUDINARY_URL } from './firebase.js';

let currentAudio = null;

// ── Upload a file to Cloudinary, return secure URL ──
export async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append('file',           file);
  formData.append('upload_preset',  CLOUDINARY_PRESET);
  formData.append('folder',         'viet-flashcards');

  const res = await fetch(CLOUDINARY_URL, { method: 'POST', body: formData });
  if (!res.ok) throw new Error('Cloudinary upload failed');
  const data = await res.json();
  return data.secure_url;
}

// ── Play a Cloudinary URL, fallback to Web Speech ──
export function playAudio(e, audioUrl, vietText) {
  if (e) e.stopPropagation();

  const btn = document.getElementById('play-btn');

  if (currentAudio) { currentAudio.pause(); currentAudio = null; }

  if (audioUrl) {
    currentAudio = new Audio(audioUrl);
    if (btn) btn.classList.add('playing');
    currentAudio.play().catch(() => speakVietnamese(vietText, btn));
    currentAudio.onended = () => { if (btn) btn.classList.remove('playing'); };
  } else {
    speakVietnamese(vietText, btn);
  }
}

// ── Play audio from the word list (no play-btn element) ──
export function playWordAudio(audioUrl, vietText) {
  if (currentAudio) currentAudio.pause();
  if (audioUrl) {
    currentAudio = new Audio(audioUrl);
    currentAudio.play();
  } else {
    speakVietnamese(vietText, null);
  }
}

// ── Web Speech API — Vietnamese TTS ──
export function speakVietnamese(text, btn) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();

  const utter    = new SpeechSynthesisUtterance(text);
  utter.lang     = 'vi-VN';
  utter.rate     = 0.85;

  const voices   = speechSynthesis.getVoices();
  const viVoice  = voices.find(v => v.lang.startsWith('vi'));
  if (viVoice) utter.voice = viVoice;

  if (btn) btn.classList.add('playing');
  utter.onend = () => { if (btn) btn.classList.remove('playing'); };
  speechSynthesis.speak(utter);
}
