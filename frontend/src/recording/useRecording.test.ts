import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { useRecording } from './useRecording';
import { matchLoudness } from '../audio/matchLoudness';

vi.mock('../audio/matchLoudness', () => ({ matchLoudness: vi.fn() }));

class Recorder extends EventTarget {
  static latest: Recorder;
  state = 'inactive';
  mimeType = 'audio/webm';
  constructor() { super(); Recorder.latest = this; }
  start() { this.state = 'recording'; }
  stop() {
    this.state = 'inactive';
    queueMicrotask(() => {
      this.dispatchEvent(Object.assign(new Event('dataavailable'), { data: new Blob(['voice'], { type: this.mimeType }) }));
      this.dispatchEvent(new Event('stop'));
    });
  }
}

const stopTrack = vi.fn();
const stream = { getTracks: () => [{ stop: stopTrack }] } as unknown as MediaStream;
const getUserMedia = vi.fn();

beforeEach(() => {
  vi.mocked(matchLoudness).mockReset();
  stopTrack.mockClear();
  getUserMedia.mockReset().mockResolvedValue(stream);
  vi.stubGlobal('MediaRecorder', Recorder);
  vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } });
  vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:attempt'), revokeObjectURL: vi.fn() });
});

afterEach(() => vi.unstubAllGlobals());

test('requests audio only on start, saves on stop, and releases the microphone', async () => {
  const { result, unmount } = renderHook(useRecording);
  expect(getUserMedia).not.toHaveBeenCalled();
  await act(() => result.current.start());
  expect(getUserMedia).toHaveBeenCalledWith({ audio: {
    channelCount: { ideal: 1 }, noiseSuppression: true, echoCancellation: false, autoGainControl: false,
  } });
  expect(result.current.status).toBe('recording');
  act(() => result.current.stop());
  await waitFor(() => expect(result.current.url).toBe('blob:attempt'));
  expect(stopTrack).toHaveBeenCalled();
  const revoke = URL.revokeObjectURL;
  unmount();
  expect(revoke).toHaveBeenCalledWith('blob:attempt');
});

test('cancel discards the new attempt and releases the microphone', async () => {
  const { result } = renderHook(useRecording);
  await act(() => result.current.start());
  await act(() => result.current.cancel());
  expect(result.current.status).toBe('idle');
  expect(result.current.url).toBeNull();
  expect(stopTrack).toHaveBeenCalled();
});

test('a cancelled permission request cannot start recording when it later resolves', async () => {
  let resolve!: (value: MediaStream) => void;
  getUserMedia.mockReturnValue(new Promise<MediaStream>((done) => { resolve = done; }));
  const { result } = renderHook(useRecording);
  let pending!: Promise<void>;
  act(() => { pending = result.current.start(); });
  act(() => result.current.cancel());
  await act(async () => { resolve(stream); await pending; });
  expect(result.current.status).toBe('idle');
  expect(stopTrack).toHaveBeenCalled();
});

test('permission denial offers guidance and leaves recording retryable', async () => {
  getUserMedia.mockRejectedValue(new DOMException('Denied', 'NotAllowedError'));
  const { result } = renderHook(useRecording);
  await act(() => result.current.start());
  expect(result.current.status).toBe('idle');
  expect(result.current.error).toMatch(/allow microphone access/i);
});

test('unmount stops an active microphone', async () => {
  const { result, unmount } = renderHook(useRecording);
  await act(() => result.current.start());
  unmount();
  expect(stopTrack).toHaveBeenCalled();
  expect(Recorder.latest.state).toBe('inactive');
});

test('recorder failure discards partial audio and releases the microphone', async () => {
  const { result } = renderHook(useRecording);
  await act(() => result.current.start());
  await act(() => Recorder.latest.dispatchEvent(new Event('error')));
  expect(result.current.status).toBe('idle');
  expect(result.current.error).toMatch(/recording failed/i);
  expect(result.current.url).toBeNull();
  expect(stopTrack).toHaveBeenCalled();
});

test('cancelling a retry preserves the previous playable attempt', async () => {
  const { result } = renderHook(useRecording);
  await act(() => result.current.start());
  await act(() => result.current.stop());
  await waitFor(() => expect(result.current.url).toBe('blob:attempt'));
  await act(() => result.current.start());
  await act(() => result.current.cancel());
  expect(result.current.url).toBe('blob:attempt');
  expect(URL.revokeObjectURL).not.toHaveBeenCalled();
});

test('keeps the original recording when loudness processing fails', async () => {
  vi.mocked(matchLoudness).mockRejectedValue(new Error('Decode failed'));
  const { result } = renderHook(() => useRecording('/reference.wav'));
  await act(() => result.current.start());
  await act(() => result.current.stop());
  await waitFor(() => expect(result.current.url).toBe('blob:attempt'));
  expect(result.current.error).toMatch(/original recording is ready/i);
  expect(result.current.status).toBe('idle');
});

test('cancel during loudness processing discards its eventual result', async () => {
  let resolve!: (clip: Blob) => void;
  vi.mocked(matchLoudness).mockImplementation(() => new Promise((done) => { resolve = done; }));
  const { result } = renderHook(() => useRecording('/reference.wav'));
  await act(() => result.current.start());
  await act(() => result.current.stop());
  expect(result.current.status).toBe('saving');
  act(() => result.current.cancel());
  await act(async () => resolve(new Blob(['processed'])));
  expect(result.current.url).toBeNull();
  expect(result.current.status).toBe('idle');
});
