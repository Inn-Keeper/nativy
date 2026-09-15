# Nativy

A focused pronunciation tool. Swedish first, more languages later.

The intended interaction is self-paced: speech matches fill blue as you speak;
pausing never advances the sentence. Deeper analysis follows completion. Reference
audio, pronunciation tips, tongue positioning, and contextual grammar support retrying.

## Scaffold status

- `frontend/`: centered React/TypeScript practice preview, built with Vite.
- `backend/`: FastAPI health endpoint and explicit CORS origins.
- `render.yaml`: backend deployment configuration.

Listen plays and pauses a locally generated Swedish reference for the displayed
sentence. Five synthetic samples are included; native-speaker review is pending.
Speak requests microphone access and records locally. Stop makes the attempt
available through Hear myself; Cancel discards the new attempt. Try again keeps
the previous recording until a new attempt is saved. Playback is exclusive, so
the reference and your recording do not overlap. Recordings disappear on reload;
no audio is uploaded. Live matching, final analysis, and teaching content are not
implemented yet. A healthy API does not imply that speech inference is ready.

Microphone access requires HTTPS or localhost and browser permission. Hardware
recording and audible replay still need verification on your browser/device.

Recording requests browser noise suppression (where supported), then applies an
80 Hz high-pass filter and gentle 1.5:1 compression using Web Audio. Automatic gain
control and echo cancellation are requested off because reference playback is
paused during recording. No extra library or server processing is involved.
Without Web Audio, recording uses the microphone stream directly. Actual noise
suppression depends on the browser and device; cleanup does not remove room echo
or guarantee a match to the reference sound. Settings are in
`frontend/src/audio/recordingAudio.ts`.

After Stop, playback loudness is approximately matched to the reference using
the energy of active audio frames. Quiet pauses are excluded; amplification is
capped at +6 dB and sample peaks retain about 1 dB of headroom. Very faint input
is not boosted. The result is a local PCM WAV. This is a simple RMS approximation,
not perceptual LUFS matching or echo removal. If decoding or reference loading
fails, the original recording remains playable. No audio leaves the browser.

See [local audio generation](tools/audio/README.md) for the free Piper workflow,
sample sources, and licensing notes. Reference playback does not require the backend.

The original `swedish-pronunciation-mvp-plan.md` remains a reference. Subsequent
decisions take precedence: this is a tool, not a course platform; live matching
is required; Swedish is the first language rather than a permanent restriction.
Recognition matches must not be presented as proof of individual sound accuracy.

## Run locally

### Frontend organization

```text
frontend/src/
  app/        App shell, global styles, journey tests
  practice/   Sentence content and practice screen components
  recording/  Microphone lifecycle and recording feedback controls
  audio/      Playback coordination, filtering, loudness matching
  test/       Shared test setup
  main.tsx    Browser entry point
```

Tests live beside the code they exercise. Keep new code in its owning scope;
extract components at clear responsibilities. Comments explain what a less
obvious step does and why it exists. Add shared infrastructure only when a real
second use needs it.

Use Node **24.15+ within Node 24**, or Node 26+, and Python **3.14**.
`frontend/.nvmrc` selects Node 24. Use pnpm **12.4.1**, pinned in
`frontend/package.json`. Verification used Node 24.21.0 and Python 3.14.3.

Backend, in one terminal:

```sh
cd backend
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements-dev.txt
.venv/bin/python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Frontend, in another terminal:

```sh
cd frontend
nvm use
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Open http://127.0.0.1:5173. API docs: http://127.0.0.1:8000/docs.
Local defaults work without environment files. To change the frontend API URL,
copy `frontend/.env.example` to `frontend/.env.local` and edit it. Backend settings
are read from process environment variables; `backend/.env.example` documents
them but is not loaded automatically.

## Verify

```sh
cd frontend
pnpm test
pnpm build
```

```sh
cd backend
.venv/bin/python -m pytest -q
```

Latest stable dependencies were resolved from npm/PyPI when scaffolded. Exact
frontend versions and transitive dependencies are locked in `pnpm-lock.yaml`.
Python runtime dependencies are pinned in `requirements.txt`; the complete test
environment is pinned in `requirements-dev.txt`. The `.in` files list direct
dependencies. Speech-engine packages will be selected and verified when that
feature is implemented.

## Render backend setup

Nothing on Render is needed for local development. To deploy:

1. Put this project in your GitHub/GitLab/Bitbucket repository and connect it to Render.
2. Create a **Web Service** with the settings below, or create a **Blueprint**
   from the included `render.yaml` and supply `ALLOWED_ORIGINS` when prompted.

| Setting | Value |
| --- | --- |
| Runtime | Python 3 |
| Root directory | `backend` |
| Build command | `pip install -r requirements.txt` |
| Start command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Health check | `/health` |
| Instance | Free for the scaffold/demo |
| `PYTHON_VERSION` | `3.14.3` |
| `ALLOWED_ORIGINS` | Your exact frontend origin, e.g. `https://nativy.onrender.com` |

Origins have no trailing slash or path. Separate multiple origins with commas.
To use the deployed API from local development, include
`http://localhost:5173,http://127.0.0.1:5173`.

3. Set frontend `VITE_API_BASE_URL` to the resulting backend HTTPS URL and
   restart the dev server or rebuild the deployed frontend.
4. Verify `https://<your-api>.onrender.com/health` returns `{"status":"ok"}`.

No database, disk, API key, or account system is needed for this scaffold.
If hosting the frontend on Render too, use a **Static Site**, root `frontend`,
build `corepack pnpm install --frozen-lockfile && corepack pnpm build`, publish directory `dist`, and Node 24.21.0
via `NODE_VERSION`.

Render Free web services sleep after 15 minutes without traffic and take about
a minute to wake. This is suitable for checking the scaffold; speech-model
memory, cold starts, and real-time latency still need measurement before choosing
the inference hosting plan. The preview currently times out after 15 seconds;
reload after a cold service has awakened.

Official setup: [FastAPI on Render](https://render.com/docs/deploy-fastapi),
[Python versions](https://render.com/docs/python-version),
[Free service limits](https://render.com/docs/free).
