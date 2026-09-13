# Integration notes

## 1. Install the new dependency
```
pnpm add tesseract.js
```
(already added to the `package.json` in this bundle — merge it into yours, or just run the command above)

## 2. Copy files into your repo (matching paths)
```
src/lib/medicine-data.ts     (new)
src/lib/speech.ts            (new)
src/lib/ocr.ts               (new)
src/routes/medicine.tsx      (new — new page at /medicine)
src/routes/doctor.tsx        (new — new page at /doctor)
src/routes/__root.tsx        (replace — adds top nav bar)
src/routes/index.tsx         (replace — adds language toggle + voice playback)
```
Since routes are file-based (TanStack Router), adding `medicine.tsx` and
`doctor.tsx` under `src/routes/` should auto-register `/medicine` and
`/doctor` the next time the route tree is generated (`routeTree.gen.ts`
regenerates automatically in dev, or run your router codegen step in CI).

## 3. What's real vs. placeholder

| Feature | Status |
|---|---|
| Medicine search by name/symptom | Real — matches against the bundled reference dataset (`medicine-data.ts`) |
| Photo/prescription scan (OCR) | Real — runs `tesseract.js` fully client-side, no API key needed. Reads English + Bengali text. |
| Bilingual descriptions (EN/BN) | Real — every medicine entry has both languages |
| Voice readout (EN/BN) | Real — uses the browser's built-in Web Speech API (`speechSynthesis`). Bengali voice **quality/availability depends on the user's device/OS** — not all phones ship a Bengali TTS voice. |
| Symptom → medicine mapping | Real — reference list only (general "commonly used for" info), not dosing instructions |
| Live real doctor (chat/voice/video) | **Placeholder** — `/doctor` only collects a request right now. Connecting an actual doctor requires a real telehealth backend (staffed queue + a video/voice provider like Twilio, Vonage, Daily, etc.) plus real medical staff, which no code alone can create. The submit handler has a `TODO(integration)` marking where to wire a real API. |

## 4. Expanding the medicine dataset
Add more entries to the `MEDICINES` array in `src/lib/medicine-data.ts`
following the existing shape. Keep descriptions at the "what it's
generally used for" level — avoid embedding specific doses, since this
app is a reference tool, not a prescribing tool.

## 5. Known limitations
- OCR accuracy on handwritten prescriptions will be inconsistent — it's
  tuned for printed text (medicine box/strip labels) more than doctor
  handwriting.
- The Bengali voice depends entirely on what's installed on the user's
  device; on some browsers/OSes there is no Bengali voice at all, in
  which case `useSpeech().supported` will be true but no audio will
  play in `bn`. Consider surfacing a fallback message if you want to
  handle that case explicitly.
