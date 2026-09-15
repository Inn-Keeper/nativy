# Local reference audio

Piper 1.8.0 generates five Swedish preview clips from
`frontend/src/practice/exercises.json`. Generation is local; playback serves the WAV
files from `frontend/public/audio/sv-SE/piper-v1/`. No API key, paid service, or
Piper installation on Render is needed. These synthetic previews have not been
reviewed by a native Swedish speaker.

From the project root (Python 3.13 was used for this separate tooling environment):

```sh
python3.13 -m venv tools/audio/.venv
tools/audio/.venv/bin/python -m pip install -r tools/audio/requirements.txt
tools/audio/.venv/bin/python -m piper.download_voices sv_SE-nst-medium --data-dir tools/audio/models
tools/audio/.venv/bin/python tools/audio/generate.py
```

The first two downloads need internet access. Synthesis runs offline afterwards.
The generator preserves existing recordings and validates their WAV format,
duration, and nonempty signal. Use a new versioned audio path for new takes.
This validation does not assess Swedish pronunciation quality.

## Source and licensing

- Engine: [OHF Piper](https://github.com/OHF-Voice/piper1-gpl), GPL-3.0.
  It is a local authoring tool, not bundled with the frontend or backend.
- Voice: [sv_SE-nst-medium](https://huggingface.co/rhasspy/piper-voices/tree/main/sv/sv_SE/nst/medium),
  one speaker, 22,050 Hz; trained by KBLab at the National Library of Sweden.
- The [model card](https://huggingface.co/rhasspy/piper-voices/raw/main/sv/sv_SE/nst/medium/MODEL_CARD)
  labels its **dataset** CC0. The [dataset publisher](https://www.nb.no/sprakbanken/en/resource-catalogue/oai-nb-no-sbr-17/)
  independently lists CC0. This is the published dataset designation, not a
  separate license statement for model weights or a claim of human recording.
- Samples were generated from the five project sentences, with default synthesis
  settings, on 2026-09-15. No voice cloning or user audio was used.

Downloaded model SHA-256:

```text
df011f56825a59dd1efc080c38a65a1ef70407e60f63050e9246f43a3d7e471e  sv_SE-nst-medium.onnx
d45dd74cbb4eca58694bf04a97e243044092476f28a55ae26424f0653086980a  sv_SE-nst-medium.onnx.json
```

The model and virtual environment are ignored by Git. Dependency versions are
pinned in `requirements.txt`. Existing audio files are the reference artifacts;
new synthesis is not guaranteed to produce identical bytes.
