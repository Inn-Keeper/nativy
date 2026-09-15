# Recording Module

Handles microphone recording and audio capture.

## Components

- **RecordingControls.tsx** — UI controls for recording (start, stop, cancel)

## Hooks

- **useRecording.ts** — Custom hook managing `MediaRecorder` state and audio Blob storage

## Purpose

Provides recording functionality via Web Audio API's `MediaRecorder`. Captures user speech into a Blob, stores locally in memory, and makes it available for playback or upload. No persistence to database.
