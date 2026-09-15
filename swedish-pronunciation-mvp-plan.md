# Swedish Pronunciation Trainer — MVP Product Specification & Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task-by-task.

**Goal:** Build a zero-mandatory-cost Swedish pronunciation-training demo that teaches 1,000+ core Swedish words through natural sentences and provides an accessible Listen → Speak → Analyse → Retry workflow.

**Architecture:** React/TypeScript frontend on a Render Static Site plus a Python/FastAPI backend on a Render Web Service. The browser records audio and sends only the current practice clip to the backend. `faster-whisper` performs Swedish transcription and word timestamp extraction. The backend aligns recognised words against the expected exercise, applies transparent timing/lexical scoring, and returns structured feedback. Swedish IPA, easy phonetics, and pronunciation rules remain curated product data rather than being generated blindly from spelling.

**Tech Stack:** React, TypeScript, Vite, Web Audio API, MediaRecorder, IndexedDB, Python 3.12, FastAPI, Uvicorn, `faster-whisper`, CTranslate2, Vitest, Testing Library, Pytest, Playwright, axe-core, Render Static Sites, Render Web Services.

**Mandatory paid API cost:** €0 for the MVP/demo.

---

# Part I — Product Specification

## 1. Product Vision

The application is a focused Swedish pronunciation trainer, not a broad language-learning platform.

Core loop:

**Listen → Read → Speak → Analyse → Correct → Retry**

Every exercise should help the learner understand:

1. What should this Swedish phrase sound like?
2. How is it represented phonetically?
3. Which word or sound differed in my attempt?
4. What should I change before I try again?

The product should behave like a **debugger for spoken Swedish**.

---

## 2. MVP Scope

### Included

- Swedish only (`sv-SE`)
- At least 1,000 useful Swedish lemmas
- Approximately 500–800 natural sentence exercises
- Swedish text + English meaning for the first demo
- Easy learner phonetics
- IPA
- Native/reference audio
- Playback speed control
- Word highlighting during playback
- Microphone recording
- FastAPI backend
- Backend Swedish speech recognition using `faster-whisper`
- Expected-vs-recognised word alignment
- Word-by-word feedback
- Word isolation and retry
- Swedish-specific pronunciation rules
- Long/short vowel instruction
- Long/short consonant instruction
- Local progress in IndexedDB
- WCAG 2.2 AA-oriented interaction design
- Render deployment
- No mandatory paid speech, AI, auth, or database API

### Explicitly excluded from V0.1

- User accounts
- Cloud sync
- Payments/subscriptions
- Social features
- Leaderboards
- AI conversation
- Multiple learning languages
- Production-grade phoneme scoring
- Custom-trained acoustic models
- Native mobile apps

---

## 3. Accuracy Boundary

The MVP must not present Whisper as a specialised pronunciation assessor.

`faster-whisper` is used for:

- Swedish transcription
- word timestamps
- lexical confidence signals
- approximate timing information

The product can reliably show:

- whether expected words were recognised
- omissions/substitutions
- approximate timing differences
- reference-vs-user audio comparison
- curated Swedish pronunciation guidance

The product must **not claim** exact:

- phoneme accuracy percentages
- vowel-quality scores
- consonant-articulation scores
- pitch-accent accuracy
- prosody accuracy

UI labels should use:

- Excellent
- Good
- Close
- Practice
- Missing

rather than false precision such as `87.43%`.

---

## 4. Corpus Strategy

### Full MVP target

- 1,000+ Swedish lemmas
- 500–800 sentences
- 6,000–10,000 total word occurrences
- high-frequency vocabulary repeated in multiple contexts

Inflected forms belong to lexical families rather than artificially inflating vocabulary count.

Example:

```text
gå
går
gick
gått
```

### Golden vertical slice

Before expanding the corpus, build 20–40 highly curated exercises that prove the complete product flow.

The golden set must include:

- long vowel + shorter following consonant
- short vowel + longer/doubled following consonant
- `sj`
- `tj`
- `sk` before front vowels
- `g` and `k` sound changes
- `y`
- `u`
- `å`
- `ä`
- `ö`
- unstressed words
- connected-speech examples

---

## 5. Core Exercise Experience

Exercise states:

```text
idle
→ listening
→ ready-to-record
→ recording
→ processing
→ result
→ retry-word OR continue
```

Each exercise displays:

1. lesson progress
2. Swedish sentence
3. English meaning
4. phonetic representation
5. audio controls
6. Speak button
7. result after recording
8. Continue button

The interface should feel calm and focused, not like a dense dashboard.

---

## 6. Phonetic Display

Each word may display:

### Swedish orthography

Example: `jag`

### Easy phonetics

A learner-friendly Latin-script cue.

### IPA

The authoritative phonetic notation for the corpus.

Modes:

- Easy
- IPA
- Both

Default: **Both**

Easy phonetics are stored in the corpus. They are not generated automatically from IPA at runtime in V0.1.

---

## 7. Swedish Vowel and Consonant Quantity

This is a first-class learning requirement.

Useful teaching pattern:

- stressed vowel before one following consonant is often long
- stressed vowel before a doubled consonant or relevant cluster is often short
- short stressed vowel commonly pairs with a longer following consonant
- long stressed vowel commonly pairs with a shorter following consonant

Example:

```text
tak  → long vowel + shorter consonant
tack → short vowel + longer consonant
```

These are learning tendencies, not universal spelling laws. The corpus stores validated IPA and pronunciation metadata so the app does not guess pronunciation solely from spelling.

---

## 8. Swedish Pronunciation Rules

The content model must support at least:

```text
vowel-long
vowel-short
consonant-long
double-consonant
sj-sound
tj-sound
sk-front-vowel
g-softening
k-softening
r-combination
retroflex-cluster
word-stress
compound-stress
pitch-accent-1
pitch-accent-2
unstressed-reduction
connected-speech
```

A word may reference several rules.

---

## 9. Playback

Initial speeds:

- 0.50×
- 0.65×
- 0.75×
- 0.85×
- 1.00×

Controls:

- Play/Pause
- Replay
- Loop sentence
- Play selected word
- Speed selector

Future audio variants supported by the data model:

- Clear
- Natural
- Native

---

## 10. Recording

Recording requirements:

- request microphone permission only after the learner presses Speak
- show textual recording state
- show elapsed time
- provide Stop and Cancel
- keep expected sentence visible
- allow replay before analysis
- upload only when the learner chooses Analyse

---

## 11. Result and Retry

Example:

```text
Jag       Excellent
skulle    Practice
vilja     Good
ha        Excellent
en        Excellent
kaffe     Close
```

Every word is keyboard-focusable.

Selecting a word opens a detail view with:

- Swedish spelling
- English gloss where useful
- Easy phonetics
- IPA
- native/reference word playback
- latest learner segment playback when available
- associated pronunciation rule
- coaching text
- Retry word

---

# Part II — Technical Architecture

## 12. High-Level Architecture

```text
React / TypeScript frontend
        ↓
MediaRecorder / Web Audio
        ↓
POST /api/v1/pronunciation/analyse
        ↓
FastAPI
        ↓
faster-whisper
        ↓
transcript + word timestamps
        ↓
normalisation + alignment
        ↓
transparent scoring
        ↓
JSON result
        ↓
React result UI
```

Frontend and backend remain loosely coupled through a stable API contract.

---

## 13. Pronunciation Engine Contract

Frontend interface:

```ts
export interface PronunciationEngine {
  analyse(input: PronunciationInput): Promise<PronunciationResult>;
}
```

```ts
export interface PronunciationInput {
  audio: Blob;
  exercise: Exercise;
}
```

```ts
export interface PronunciationResult {
  transcript: string;
  words: WordResult[];
  durationMs: number;
  engine: 'faster-whisper-api';
}
```

```ts
export interface WordResult {
  expected: string;
  recognised: string | null;
  startMs: number | null;
  endMs: number | null;
  lexicalMatch: number;
  timingRatio: number | null;
  status: 'excellent' | 'good' | 'close' | 'practice' | 'missing';
}
```

React components never import `faster-whisper` or backend-specific logic.

---

## 14. FastAPI API

Endpoints:

```text
GET  /health
POST /api/v1/pronunciation/analyse
```

Analysis request:

```text
multipart/form-data
- audio
- exercise_id
```

The backend resolves the expected exercise from validated corpus data instead of trusting arbitrary expected text from the browser.

---

## 15. faster-whisper Configuration

Initial configuration:

```text
model: tiny
device: cpu
compute_type: int8
language: sv
word_timestamps: true
vad_filter: true
```

Load the model once per backend process.

Start with `tiny` because the Render free/demo environment is constrained. Evaluate `base` only after measuring:

- startup time
- memory use
- transcription latency
- error rate

The demo should prefer a stable smaller model over an unstable larger one.

---

## 16. Backend Processing Flow

```text
Upload audio
   ↓
validate content type + size
   ↓
write temporary file
   ↓
transcribe using faster-whisper
   ↓
extract transcript + timestamps
   ↓
normalize Swedish words
   ↓
lookup expected exercise
   ↓
Levenshtein alignment
   ↓
calculate lexical/timing signals
   ↓
return PronunciationResult
   ↓
delete temporary file
```

Temporary files must be deleted in a `finally` block.

---

## 17. Privacy

For V0.1:

- recordings are uploaded only after Analyse is pressed
- recordings are used only for the active request
- recordings are not added to a training dataset
- recordings are not persisted in a database
- temporary files are deleted after inference
- logs must never contain raw audio payloads
- HTTPS is required
- the UI explicitly states that audio is sent to the demo server for analysis

---

## 18. Word Alignment

Normalize:

- lowercase
- Unicode normalization
- punctuation trimming
- whitespace normalization
- preserve `å`, `ä`, `ö`

Example:

```text
Expected:   jag skulle vilja ha kaffe
Recognised: jag skulle vilja kaffe
```

Alignment:

```text
jag       → jag
skulle    → skulle
vilja     → vilja
ha        → missing
kaffe     → kaffe
```

Dynamic-programming edit distance is sufficient for the first version.

---

## 19. Timing Comparison

Reference word timing:

```ts
export interface WordTiming {
  wordId: string;
  startMs: number;
  endMs: number;
}
```

Heuristic timing ratio:

```text
learner duration / reference duration
```

Initial guidance:

- `0.75–1.30` broadly similar
- `< 0.75` considerably shorter
- `> 1.30` considerably longer

Timing is only a coaching signal and must not be presented as phoneme correctness.

---

## 20. Data Model

```ts
export interface Exercise {
  id: string;
  lessonId: string;
  order: number;
  sv: string;
  en: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  audio: ExerciseAudio;
  words: ExerciseWord[];
  tags: string[];
}
```

```ts
export interface ExerciseAudio {
  referenceSrc: string;
  timings: WordTiming[];
  variants?: {
    clear?: string;
    natural?: string;
    native?: string;
  };
}
```

```ts
export interface ExerciseWord {
  id: string;
  text: string;
  lemma: string;
  gloss?: string;
  easyPhonetics: string;
  ipa: string;
  syllables: string[];
  stressSyllable: number | null;
  rules: SwedishRuleId[];
}
```

---

## 21. Local Progress

Use IndexedDB for:

- exercise attempts
- completed exercises
- difficult words
- latest practice date
- preferred phonetic mode
- preferred playback speed
- reduced-motion preference

No account is required.

---

## 22. Accessibility

Target WCAG 2.2 AA for the primary journey.

Requirements:

- complete keyboard navigation
- visible focus indicators
- semantic buttons
- minimum practical touch targets around 44×44 CSS px
- no colour-only statuses
- scalable text
- no flashing content
- reduced-motion support
- recording state announced through `aria-live`
- processing state announced through `aria-live`
- text transcript always available
- speed controls operable without drag gestures
- modal focus management
- Escape closes non-destructive dialogs
- no horizontal page scrolling at 320 CSS px

---

# Part III — Repository Structure

```text
/
├── frontend/
│   ├── public/
│   │   └── audio/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── data/
│   │   ├── domain/
│   │   ├── features/
│   │   │   ├── audio/
│   │   │   ├── exercise/
│   │   │   ├── recording/
│   │   │   ├── pronunciation/
│   │   │   ├── progress/
│   │   │   └── settings/
│   │   └── styles/
│   ├── tests/
│   ├── package.json
│   └── vite.config.ts
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── api/
│   │   │   └── pronunciation.py
│   │   ├── core/
│   │   │   └── config.py
│   │   ├── domain/
│   │   │   ├── models.py
│   │   │   └── scoring.py
│   │   └── services/
│   │       ├── whisper_service.py
│   │       ├── alignment.py
│   │       └── corpus_service.py
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
├── shared/
│   └── corpus/
│       ├── exercises.json
│       ├── lessons.json
│       └── swedish-rules.json
├── scripts/
│   ├── validate-corpus.ts
│   └── corpus-stats.ts
├── render.yaml
└── README.md
```

---

# Part IV — Implementation Plan

## Global Constraints

- Swedish only for V0.1.
- 1,000+ Swedish lemmas in the completed MVP corpus.
- No mandatory paid API.
- React frontend + FastAPI backend.
- No account system.
- No cloud database.
- Render Static Site + Render Web Service.
- Audio is uploaded only for active analysis and deleted after inference.
- Whisper output is never presented as exact phoneme scoring.
- IPA and Easy phonetics come from curated corpus data.
- Accessibility is part of every feature's definition of done.

---

## Task 1 — Bootstrap Frontend

**Files:**

- `frontend/package.json`
- `frontend/src/main.tsx`
- `frontend/src/app/App.tsx`
- `frontend/src/styles/tokens.css`
- `frontend/src/styles/globals.css`

Steps:

- [ ] Create Vite React/TypeScript app.
- [ ] Add `idb`, React Router, Vitest, Testing Library, Playwright, axe-core.
- [ ] Add first render test.
- [ ] Add accessible application shell.
- [ ] Add spacing/type/focus/touch-target tokens.
- [ ] Run unit tests and production build.
- [ ] Commit.

---

## Task 2 — Bootstrap FastAPI Backend

**Files:**

- `backend/app/main.py`
- `backend/app/core/config.py`
- `backend/requirements.txt`
- `backend/tests/test_health.py`

Dependencies:

```text
fastapi
uvicorn[standard]
python-multipart
faster-whisper
pydantic-settings
pytest
httpx
```

Steps:

- [ ] Create virtual environment.
- [ ] Add `/health` test first.
- [ ] Implement FastAPI app.
- [ ] Configure CORS for localhost frontend and deployed frontend only.
- [ ] Verify `pytest` passes.
- [ ] Commit.

---

## Task 3 — Define Corpus and Domain Models

**Files:**

- `shared/corpus/exercises.json`
- `shared/corpus/lessons.json`
- `shared/corpus/swedish-rules.json`
- `frontend/src/domain/exercise.ts`
- `backend/app/domain/models.py`
- `scripts/validate-corpus.ts`
- `scripts/corpus-stats.ts`

Validation must reject:

- duplicate exercise IDs
- duplicate word IDs
- missing IPA
- missing Easy phonetics
- missing lemma
- unknown rule IDs
- invalid audio paths
- invalid timings

Build the first 20–40 golden exercises here.

---

## Task 4 — Build Exercise UI

Implement:

- Swedish sentence
- English meaning
- Easy / IPA / Both modes
- lesson progress
- interactive word tokens
- responsive layout
- keyboard access

Test word selection with keyboard and screen-reader-friendly accessible names.

---

## Task 5 — Add Reference Audio

Implement:

- play/pause
- replay
- word highlighting from reference timings
- speeds 0.50×, 0.65×, 0.75×, 0.85×, 1.00×
- `aria-pressed` selected speed
- accessible control labels

---

## Task 6 — Add Recording

Implement:

- `MediaRecorder`
- explicit permission request
- Stop/Cancel
- elapsed time
- replay learner audio
- local Blob storage for current attempt
- no upload until Analyse is pressed

Tests must cover denied microphone permission and cancellation.

---

## Task 7 — Implement Whisper Service

**Files:**

- `backend/app/services/whisper_service.py`
- `backend/tests/test_whisper_service.py`

Interface:

```python
class WhisperService:
    def transcribe(self, audio_path: str) -> WhisperTranscript:
        ...
```

Initial configuration:

```python
WhisperModel(
    "tiny",
    device="cpu",
    compute_type="int8",
)
```

Transcribe with:

```python
language="sv"
word_timestamps=True
vad_filter=True
```

Load model once per process.

Use a fake service in unit/API tests; do not load the real model during ordinary unit tests.

---

## Task 8 — Implement Pronunciation API

**Files:**

- `backend/app/api/pronunciation.py`
- `backend/app/services/corpus_service.py`
- `backend/tests/test_pronunciation_api.py`

Request:

```text
POST /api/v1/pronunciation/analyse
multipart/form-data
- audio
- exercise_id
```

Validation:

- supported audio content type
- known exercise ID
- upload-size limit
- reasonable duration limit

Temporary files must be deleted after inference.

Tests:

- success
- unknown exercise
- unsupported file
- inference unavailable
- temporary file cleanup

---

## Task 9 — Implement Swedish Word Alignment

**Files:**

- `backend/app/services/alignment.py`
- `backend/tests/test_alignment.py`

Implement:

- Unicode normalization
- lowercasing
- punctuation stripping
- preservation of `å`, `ä`, `ö`
- Levenshtein alignment

Test:

- exact match
- missing word
- substitution
- insertion
- punctuation differences

---

## Task 10 — Implement Transparent Scoring

**Files:**

- `backend/app/domain/scoring.py`
- `backend/tests/test_scoring.py`

Initial rules:

```text
exact lexical match + comparable timing → excellent
exact lexical match without usable timing → good
minor lexical difference → close
substitution → practice
deletion → missing
```

The result payload must clearly identify this as recognition/timing feedback, not exact phoneme scoring.

---

## Task 11 — Connect Frontend API Engine

**Files:**

- `frontend/src/features/pronunciation/PronunciationEngine.ts`
- `frontend/src/features/pronunciation/ApiPronunciationEngine.ts`
- `frontend/src/features/pronunciation/ApiPronunciationEngine.test.ts`

Implement multipart upload of:

```text
audio
exercise_id
```

Handle:

- success
- timeout
- validation error
- backend cold start
- 503 inference unavailable
- network failure

Do not silently retry audio uploads.

---

## Task 12 — Build Result and Word Retry UI

Implement:

- word-by-word statuses
- textual status labels
- word detail dialog
- reference word audio
- latest learner audio segment where practical
- Easy phonetics
- IPA
- pronunciation rule
- Retry word

Focus must return to the originating word when the dialog closes.

---

## Task 13 — Add Swedish Rule Teaching

Create curated explanations for:

- long/short vowels
- long/short consonants
- `sj`
- `tj`
- soft `g`
- soft `k`
- `sk` patterns
- `r` combinations
- stress
- pitch accent
- reduction
- connected speech

Simplified spelling patterns must be labelled as tendencies, not exception-free rules.

---

## Task 14 — Add Local Progress and Preferences

IndexedDB stores:

- attempts
- best status
- completion
- difficult word IDs
- last practiced date
- phonetic mode
- playback speed
- reduced-motion preference

No login required.

---

## Task 15 — Routing and Primary Journey

Routes:

```text
/
/lessons
/lesson/:lessonId/exercise/:exerciseId
/progress
/settings
```

Primary journey:

```text
Home → Lesson → Listen → Speak → Analyse → Inspect → Retry → Continue
```

---

## Task 16 — Backend Resilience

Add:

- API timeout
- upload-size limit
- duration limit
- cold-start UI
- retry-connection action
- graceful analysis failure

If the backend is unavailable:

- reference audio still works
- recording/replay still works
- Analyse is disabled with explanation

---

## Task 17 — Accessibility Verification

Playwright + axe checks for:

- home
- lesson list
- exercise idle state
- recording state
- result state
- word detail
- settings
- progress

Manual/automated keyboard journey must verify:

- speed control
- Speak
- Analyse
- word selection
- dialog close
- focus restoration

Responsive checks:

```text
320×800
390×844
768×1024
1440×900
```

---

## Task 18 — Expand Corpus to 1,000+ Lemmas

Release thresholds:

```text
unique lemmas >= 1000
exercises >= 500
required pronunciation-rule coverage = 100%
```

Every released exercise requires:

- natural Swedish
- English meaning
- IPA
- Easy phonetics
- pronunciation rule metadata
- reference audio
- reference word timings

Commit lesson batches incrementally rather than waiting for the whole corpus.

---

## Task 19 — Deploy on Render

### Frontend

```text
Service: Static Site
Root: frontend
Build: corepack pnpm install --frozen-lockfile && corepack pnpm build
Publish: dist
```

### Backend

```text
Service: Web Service
Root: backend
Runtime: Docker or Python
Health check: /health
```

Environment:

```text
WHISPER_MODEL=tiny
WHISPER_COMPUTE_TYPE=int8
ALLOWED_ORIGINS=<frontend-url>
```

Frontend environment:

```text
VITE_API_BASE_URL=<backend-url>
```

Deploy backend first, verify `/health`, then deploy frontend.

Production smoke test:

- HTTPS on both services
- restricted CORS
- reference audio works
- microphone requested only after Speak
- recording uploads only after Analyse
- temporary audio is deleted
- Swedish transcription succeeds
- word timestamps return
- cold start has visible loading state
- no paid API requests occur

---

# Part V — Definition of Done

## Product

- [ ] Listen → Speak → Analyse → Retry works end-to-end.
- [ ] Easy phonetics and IPA are both available.
- [ ] Swedish vowel/consonant quantity is taught clearly.
- [ ] Word retry works independently of full-sentence retry.
- [ ] Feedback avoids fake phoneme precision.

## Content

- [ ] 1,000+ unique Swedish lemmas.
- [ ] 500+ exercises.
- [ ] All corpus validation passes.
- [ ] Reference audio exists for released exercises.
- [ ] IPA manually reviewed.
- [ ] Easy phonetics follow one documented convention.

## Technical

- [ ] Frontend tests pass.
- [ ] Backend tests pass.
- [ ] E2E tests pass.
- [ ] FastAPI backend deploys successfully.
- [ ] Render frontend deploys successfully.
- [ ] No mandatory paid API.
- [ ] No database required.
- [ ] Learner audio is transient and not persisted.
- [ ] Backend failures degrade gracefully.

## Accessibility

- [ ] Keyboard-operable primary flow.
- [ ] No serious/critical axe violations in tested states.
- [ ] Visible focus.
- [ ] Statuses contain text, not colour only.
- [ ] Recording/processing states are announced.
- [ ] 320px layout does not require horizontal page scrolling.
- [ ] Reduced-motion preference is honoured.

---

# Part VI — Growth Path

## V0.2 — Better Pronunciation Analysis

Keep the API contract and add stronger analysis behind FastAPI:

- forced phoneme alignment
- vowel-duration analysis
- consonant-duration analysis
- minimal-pair classification
- confidence calibration against native/non-native recordings

Precise pronunciation scores should only appear after validation against real Swedish speech samples.

## V0.3 — Personalised Weak-Sound Training

Aggregate recurring difficulties and recommend existing corpus exercises.

## V0.4 — Accounts and Cloud Progress

Add only if there is a concrete need for multi-device sync or teacher features.

## V0.5 — AI Tutor

AI consumes structured pronunciation results and Swedish rule metadata.

Possible responsibilities:

- explain mistakes
- adapt explanations to learner background
- choose follow-up exercises
- generate practice variations
- summarise recurring weaknesses

AI should not invent the raw pronunciation measurement.

## V1 — Conversation Mode

```text
Conversation
→ detect recurring difficulty
→ recommend targeted lesson
→ drill word/sound
→ return to conversation
```

---

# Part VII — Decisions Locked In

1. Swedish first.
2. 1,000+ core lemmas learned through natural sentences.
3. Easy phonetics + IPA in parallel.
4. Swedish vowel/consonant quantity is a first-class concept.
5. No paid API is mandatory for MVP.
6. React frontend + Python/FastAPI backend.
7. `faster-whisper` runs on the backend for consistent demo inference.
8. No account/database initially.
9. Render Static Site for frontend + Render Web Service for backend.
10. Recognition/scoring stay behind a stable `PronunciationEngine` contract.
11. No fake phoneme precision from Whisper.
12. Learner audio is transient and deleted after inference.
13. Accessibility is part of feature completion.
14. Prove the entire experience with a small golden corpus before producing hundreds of recordings.
15. Grow consistently instead of pre-building production infrastructure.

---

# Suggested Development Order

```text
1. Frontend foundation
2. FastAPI foundation
3. Corpus/domain model
4. Exercise UI
5. Reference audio
6. Recording
7. faster-whisper service
8. Pronunciation API
9. Word alignment
10. Transparent scoring
11. Frontend API integration
12. Result + retry
13. Swedish teaching rules
14. Progress/preferences
15. Routing/full journey
16. Backend resilience
17. Accessibility verification
18. Expand to 1,000+ lemmas
19. Render deployment
```

Critical milestone after Task 13:

> A learner can open one curated Swedish exercise, hear it, inspect Easy phonetics and IPA, record themselves, upload the attempt to FastAPI, receive a transparent word-by-word result from backend `faster-whisper`, inspect a Swedish pronunciation rule, and retry a difficult word without using any paid API.

---

# References

- Render Static Sites: https://render.com/docs/static-sites
- Render FastAPI deployment: https://render.com/docs/deploy-fastapi
- Render free services: https://render.com/docs/free
- FastAPI: https://fastapi.tiangolo.com/
- faster-whisper: https://github.com/SYSTRAN/faster-whisper
- CTranslate2: https://opennmt.net/CTranslate2/
