# Relationshapes · App

A privacy-friendly app implementation of the [Relationshape](https://github.com/Relationshape/Relationshape-Pre-release-1) questionnaire — a communication tool from the world of relationship anarchy that helps you map and discuss the shape of your relationships across many dimensions (emotional intimacy, physical intimacy, romance, partnership, financial, domestic, …).

The app was built around four core ideas:

1. **It belongs to you.** All data lives in your browser's local storage. No backend, no analytics, no accounts.
2. **End-to-end encrypted sharing.** When you want to compare results with someone, the app produces an AES-GCM encrypted bundle (key derived from your passphrase via PBKDF2). The bundle is just text or a small file — share it via any channel; the passphrase travels separately.
3. **Multiple profiles in one app instance.** One device can host the maps of several people (e.g. partners using the same shared tablet, or one person reflecting from multiple personas).
4. **Beautiful comparisons.** Spider chart, alignment overview (top matches & biggest gaps), and per-category bar diff.

## Stack

Plain HTML / CSS / ES modules — **no build step**. Works as a Progressive Web App, installable on iOS, Android and as a desktop app from the browser. Runs offline once visited.

```
.
├── index.html
├── manifest.json          ← PWA metadata
├── sw.js                  ← service worker (offline cache)
├── css/style.css
├── icons/
└── js/
    ├── app.js             ← router & view rendering
    ├── data.js            ← questionnaire categories / scale
    ├── storage.js         ← localStorage wrapper
    ├── crypto.js          ← WebCrypto encrypt/decrypt
    └── charts.js          ← SVG spider, bars, alignment
```

## Run locally

Any static-file server works. For example:

```bash
python3 -m http.server 8080
# then open http://localhost:8080/
```

## Features

- 🌷 **Profiles** with custom emoji + accent colour. Multiple profiles per device.
- 📝 **Questionnaire flow** — 30 categories from the Relationshapes pre-release, walked through one at a time with a 7-step scale (Need / Hell yes / Want / Open / Maybe / Not really / No), Giving/Receiving/Both notation where applicable, optional notes, custom items.
- 💾 **Local persistence** — answers are autosaved to `localStorage` after every click.
- 📤 **Encrypted sharing** — passphrase-protected bundles (AES-GCM 256, PBKDF2 SHA-256, 250 000 iterations). Copy as text or download as `.rshape.txt`.
- 📥 **Import** decrypted bundles into a separate "imports" pool.
- 📊 **Visualisations**
  - **Spider chart** with up to 4 datasets overlaid on the major Relationshapes axes.
  - **Alignment overview** — strongest matches and biggest gaps for two profiles.
  - **Per-category bar comparison** with item-level marks.
- 📱 **PWA** — install on iOS & Android home screen, works offline.

## Data shape

```js
result = {
  id, profileId,
  subject: "the relationship label",
  subjectEmoji, subjectColor,
  answers: {
    [categoryId]: {
      [itemName]: { scale: "want", gr: "G"|"R"|"×"|null, note: "" },
      __custom: { [name]: { ... } },
    },
  },
  progress: { catIndex },
  createdAt, updatedAt,
}
```

## Privacy notes

- The app never makes a network request after the first load.
- Sharing produces a JSON envelope of the form
  `{ magic, v, kdf:{ name, hash, iters, salt }, cipher:{ name, iv }, data }`.
- The passphrase is the only thing that can decrypt the data; choose a strong one and exchange it out of band (e.g. a secure messenger, in person, or a memorised shared phrase).

## Credits

The Relationshapes questionnaire and concept are by **Anne Lüscher** (she/they) and **Benjamin Frey** (him/his), released under CC BY-NC 4.0. The app implementation in this repository is unofficial.

## License

App code: MIT. Questionnaire content: CC BY-NC 4.0 (per the original).
