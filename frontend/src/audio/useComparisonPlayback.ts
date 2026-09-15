import { useRef, useState } from 'react';

// Own both players together to prevent reference bleed into playback or capture.
export function useComparisonPlayback() {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const attemptAudio = useRef<HTMLAudioElement>(null);
  const [attemptPlaying, setAttemptPlaying] = useState(false);
  const [attemptError, setAttemptError] = useState(false);

  function pauseForRecording() {
    audio.current?.pause();
    attemptAudio.current?.pause();
    setAttemptError(false);
  }

  async function toggleAttempt() {
    const player = attemptAudio.current;
    if (!player) return;
    setAttemptError(false);
    if (attemptPlaying) { player.pause(); return; }
    audio.current?.pause();
    try {
      await player.play();
    } catch {
      setAttemptPlaying(false);
      setAttemptError(true);
    }
  }

  async function togglePlayback() {
    const player = audio.current;
    if (!player) return;
    setAudioError(false);

    if (playing) {
      player.pause();
      return;
    }

    try {
      attemptAudio.current?.pause();
      if (player.error) player.load();
      await player.play();
    } catch {
      setPlaying(false);
      setAudioError(true);
    }
  }

  return {
    audio, playing, audioError, setPlaying, setAudioError,
    attemptAudio, attemptPlaying, attemptError, setAttemptPlaying, setAttemptError,
    togglePlayback, toggleAttempt, pauseForRecording,
  };
}
