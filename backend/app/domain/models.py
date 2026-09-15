from pydantic import BaseModel


class WordResult(BaseModel):
    expected: str
    recognised: str | None
    startMs: int | None
    endMs: int | None
    lexicalMatch: float
    timingRatio: float | None
    status: str


class PronunciationResult(BaseModel):
    transcript: str
    words: list[WordResult]
    durationMs: int
    engine: str = 'faster-whisper-api'
