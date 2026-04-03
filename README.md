# Tiếng Việt Flashcards

Vietnamese flashcard app with spaced repetition, audio support, and Firebase sync.

---

## Project structure

```
viet-flashcards/
├── index.html          ← HTML only — no inline JS or CSS
├── style.css           ← All styles, including mobile responsive rules
└── js/
    ├── app.js          ← Entry point: username, nav, Firestore listeners
    ├── firebase.js     ← Firebase init, Cloudinary config, shared state
    ├── audio.js        ← Cloudinary upload + Web Speech playback
    ├── scores.js       ← Per-user score read/write (Firestore)
    ├── render.js       ← Sync status, toast, renderAll() orchestrator
    ├── study.js        ← Study view: filters, session logic, card render
    ├── manage.js       ← "My words" view: add / edit / delete / CSV import
    └── categories.js   ← Categories view: add / remove subcategories
```

---

## How to use

Open `index.html` directly in a browser (no build step needed).  
All modules are loaded as native ES modules (`type="module"`).

> ⚠️ Because of ES module CORS restrictions, you need to serve the files
> through a local HTTP server rather than opening the file directly.
>
> Quick option: `npx serve .`  or  `python3 -m http.server`

---

## Features

| Feature | Details |
|---|---|
| **Spaced repetition** | Cards with low scores appear first |
| **Score tracking** | Per-user, synced to Firestore |
| **Audio** | Native recordings via Cloudinary, fallback to Web Speech vi-VN |
| **CSV import** | Drop a `.csv` to bulk-import words |
| **Multi-user** | Each username gets its own score sub-collection |
| **Responsive** | Full mobile support with horizontal-scroll filters |

---

## Responsive design

- Filters scroll horizontally on mobile (no wrapping mess)
- Nav tabs fill the full width and resize labels
- Answer buttons stack/wrap gracefully
- Form grid collapses to 1 column below 600 px
- Modal is scrollable with `max-height: 90vh`
- Toast stays within viewport on all screen sizes
- iOS safe-area & theme-color meta tags included
