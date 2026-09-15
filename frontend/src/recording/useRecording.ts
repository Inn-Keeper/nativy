import { useEffect, useRef, useState } from 'react';
import { createRecordingAudio } from '../audio/recordingAudio';
import { matchLoudness } from '../audio/matchLoudness';

export function useRecording(referenceUrl?: string) {
  const [status, setStatus] = useState<'idle' | 'requesting' | 'recording' | 'saving'>('idle');
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [seconds, setSeconds] = useState(0);
  // Invalidate late permission/processing results when an attempt is cancelled.
  const request = useRef(0);
  const recorder = useRef<MediaRecorder | null>(null);
  const release = useRef(() => {});
  const busy = useRef(false);
  const startedAt = useRef(0);

  useEffect(() => () => {
    request.current += 1;
    release.current();
    busy.current = false;
  }, []);

  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);

  useEffect(() => {
    if (status !== 'recording') return;
    const timer = window.setInterval(() => setSeconds(Math.floor((Date.now() - startedAt.current) / 1000)), 250);
    return () => window.clearInterval(timer);
  }, [status]);

  function cancel() {
    request.current += 1;
    release.current();
    busy.current = false;
    setStatus('idle');
  }

  async function start() {
    if (busy.current) return;
    setError('');
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('Recording is unavailable in this browser. Try a current browser on HTTPS or localhost.');
      return;
    }

    busy.current = true;
    const id = ++request.current;
    setStatus('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: {
        channelCount: { ideal: 1 },
        noiseSuppression: true,
        // Playback is paused while recording; avoid extra voice processing.
        echoCancellation: false,
        autoGainControl: false,
      } });
      const stopTracks = () => stream.getTracks().forEach((track) => track.stop());
      if (id !== request.current) { stopTracks(); return; }
      release.current = stopTracks;
      const processed = createRecordingAudio(stream);
      // The microphone and processing graph share one cleanup path for every exit.
      const releaseInput = () => { stopTracks(); processed.close(); };
      release.current = releaseInput;
      await processed.ready;
      if (id !== request.current) { releaseInput(); return; }
      const recording = new MediaRecorder(processed.stream);
      recorder.current = recording;
      release.current = () => {
        if (recording.state !== 'inactive') recording.stop();
        releaseInput();
      };
      const chunks: Blob[] = [];
      recording.addEventListener('dataavailable', (event) => {
        if (event.data.size) chunks.push(event.data);
      });
      recording.addEventListener('stop', async () => {
        releaseInput();
        if (id !== request.current) return;
        setStatus('saving');
        let clip = new Blob(chunks, { type: recording.mimeType || chunks[0]?.type });
        if (clip.size && referenceUrl) {
          // Keep the previous attempt playable until the replacement is ready.
          const controller = new AbortController();
          release.current = () => controller.abort();
          const timeout = window.setTimeout(() => controller.abort(), 10_000);
          try {
            clip = await matchLoudness(clip, referenceUrl, controller.signal);
          } catch {
            // Audio cleanup is optional; never lose a usable take because it failed.
            if (id === request.current) setError('Loudness matching was unavailable. Your original recording is ready to play.');
          } finally {
            window.clearTimeout(timeout);
          }
        }
        if (id !== request.current) return;
        if (clip.size) setUrl(URL.createObjectURL(clip));
        else setError('No audio was recorded. Please try again.');
        busy.current = false;
        setStatus('idle');
      });
      recording.addEventListener('error', () => {
        if (id !== request.current) return;
        cancel();
        setError('Recording failed. Please try again.');
      });
      recording.start();
      startedAt.current = Date.now();
      setSeconds(0);
      setStatus('recording');
    } catch (cause) {
      if (id !== request.current) return;
      cancel();
      setError(cause instanceof DOMException && cause.name === 'NotAllowedError'
        ? 'Please allow microphone access in your browser, then try again.'
        : 'Could not access your microphone. Check that it is connected and available.');
    }
  }

  function stop() {
    if (recorder.current?.state !== 'recording') return;
    setStatus('saving');
    release.current();
  }

  return { status, url, error, seconds, start, stop, cancel };
}
