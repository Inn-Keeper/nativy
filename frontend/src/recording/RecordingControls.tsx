import type { useRecording } from './useRecording';

type Props = {
  recording: ReturnType<typeof useRecording>;
  attemptPlaying: boolean;
  attemptError: boolean;
  onToggleAttempt: () => Promise<void>;
};

export function RecordingControls({ recording, attemptPlaying, attemptError, onToggleAttempt }: Props) {
  const recordingBusy = recording.status !== 'idle';

  return (
        <div className="recording-controls">
          <p role="status" className="recording-status">
            {recording.status === 'recording' && <>Recording · <span aria-hidden="true">{Math.floor(recording.seconds / 60)}:{String(recording.seconds % 60).padStart(2, '0')}</span></>}
            {recording.status === 'requesting' && 'Allow microphone access to begin.'}
            {recording.status === 'saving' && 'Preparing your recording…'}
            {recording.status === 'idle' && (recording.url ? 'Listen to both recordings, then try again.' : 'Your recording stays in this browser. Nothing is uploaded.')}
          </p>
          {recordingBusy && <button className="text-button" onClick={recording.cancel}>Cancel</button>}
          {recording.url && !recordingBusy && <button className="text-button" onClick={() => void onToggleAttempt()}>{attemptPlaying ? 'Pause my recording' : 'Hear myself'}</button>}
          {recording.error && <p role="alert">{recording.error}</p>}
          {attemptError && <p role="alert">Could not play your recording. Please try again.</p>}
        </div>
  );
}
