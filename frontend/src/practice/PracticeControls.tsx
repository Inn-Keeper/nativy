import { useComparisonPlayback } from '../audio/useComparisonPlayback';
import { useRecording } from '../recording/useRecording';
import { RecordingControls } from '../recording/RecordingControls';
import { PracticeNote } from './PracticeNote';

export function PracticeControls({ referenceUrl }: { referenceUrl: string }) {
  const recording = useRecording(referenceUrl);
  const recordingBusy = recording.status !== 'idle';
  const {
    audio, playing, audioError, setPlaying, setAudioError,
    attemptAudio, attemptPlaying, attemptError, setAttemptPlaying, setAttemptError,
    togglePlayback, toggleAttempt, pauseForRecording,
  } = useComparisonPlayback();

  function startRecording() {
    pauseForRecording();
    void recording.start();
  }

  // The displayed action follows the recorder state; the hook owns its lifecycle.
  const speakLabel = recording.status === 'recording' ? 'Stop'
    : recording.status === 'requesting' ? 'Allow mic…'
    : recording.status === 'saving' ? 'Saving…'
    : recording.url ? 'Try again' : 'Speak';

  return (
    <>
        <div className="controls" aria-describedby="preview-note">
          <button className="listen" disabled={recordingBusy} onClick={() => void togglePlayback()}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d={playing ? 'M8 5v14M16 5v14' : 'm9 5 11 7-11 7V5Z'} />
            </svg>
            {playing ? 'Pause' : 'Listen'}
          </button>
          <button className="speak" disabled={recording.status === 'requesting' || recording.status === 'saving'} onClick={recording.status === 'recording' ? recording.stop : startRecording}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="12" rx="3" /><path d="M5 11v1a7 7 0 0 0 14 0v-1M12 19v3M9 22h6" /></svg>
            {speakLabel}
          </button>
        </div>

      <RecordingControls
        recording={recording}
        attemptPlaying={attemptPlaying}
        attemptError={attemptError}
        onToggleAttempt={toggleAttempt}
      />

        {recording.url && <audio
          key={recording.url}
          ref={attemptAudio}
          src={recording.url}
          aria-label="Your recording"
          onPlay={() => setAttemptPlaying(true)}
          onPause={() => setAttemptPlaying(false)}
          onEnded={() => setAttemptPlaying(false)}
          onError={() => { setAttemptPlaying(false); setAttemptError(true); }}
        />}

        <audio
          ref={audio}
          src={referenceUrl}
          preload="none"
          aria-label="Reference audio"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onError={() => { setPlaying(false); setAudioError(true); }}
        />
      <PracticeNote audioError={audioError} />
    </>
  );
}
