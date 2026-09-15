import os

from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app.domain.models import PronunciationResult

app = FastAPI(title='Nativy API')

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in os.getenv(
            'ALLOWED_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173'
        ).split(',')
        if origin.strip()
    ],
    allow_methods=['GET', 'POST'],
)


@app.get('/health')
def health() -> dict[str, str]:
    return {'status': 'ok'}


@app.post('/api/v1/pronunciation/analyse')
async def analyse_pronunciation(
    audio: UploadFile = File(...),
    exercise_id: str = Form(...),
) -> PronunciationResult:
    # TODO: Implement pronunciation analysis
    # 1. Validate audio content type and size
    # 2. Write temporary file
    # 3. Transcribe using faster-whisper
    # 4. Extract transcript + timestamps
    # 5. Normalize Swedish words
    # 6. Lookup expected exercise
    # 7. Levenshtein alignment
    # 8. Calculate lexical/timing scores
    # 9. Delete temporary file
    # 10. Return PronunciationResult
    return PronunciationResult(
        transcript='',
        words=[],
        durationMs=0,
    )
