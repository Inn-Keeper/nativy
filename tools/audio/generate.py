"""Generate missing Swedish preview recordings locally; preserve existing audio."""

import json
from pathlib import Path
import wave

from piper import PiperVoice

ROOT = Path(__file__).resolve().parents[2]
MODEL = Path(__file__).parent / 'models' / 'sv_SE-nst-medium.onnx'


def main():
    exercises = json.loads((ROOT / 'frontend/src/practice/exercises.json').read_text())
    voice = PiperVoice.load(str(MODEL))

    for exercise in exercises:
        if exercise['language'] != 'sv-SE':
            continue
        output = ROOT / 'frontend/public' / exercise['audio'].lstrip('/')
        output.parent.mkdir(parents=True, exist_ok=True)
        if not output.exists():
            temporary = output.with_suffix('.tmp.wav')
            try:
                with wave.open(str(temporary), 'wb') as recording:
                    voice.synthesize_wav(exercise['sv'], recording)
                temporary.replace(output)
            finally:
                temporary.unlink(missing_ok=True)

        with wave.open(str(output), 'rb') as recording:
            duration = recording.getnframes() / recording.getframerate()
            assert recording.getnchannels() == 1, output
            assert recording.getsampwidth() == 2, output
            assert 0.25 < duration < 20, (output, duration)
            assert any(recording.readframes(recording.getnframes())), output
        print(f'{output.name}: {duration:.2f}s — {exercise["sv"]}')


if __name__ == '__main__':
    main()
