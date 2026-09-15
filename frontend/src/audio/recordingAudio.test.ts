import { afterEach, expect, test, vi } from 'vitest';
import { createRecordingAudio } from './recordingAudio';

afterEach(() => vi.unstubAllGlobals());

test('routes the microphone through the filter and compressor to the recorded stream, and releases it', async () => {
  const connections: unknown[][] = [];
  const node = () => ({ connect(target: unknown) { connections.push([this, target]); } });
  const source = node();
  const filter = { ...node(), frequency: { value: 0 }, Q: { value: 0 }, type: '' };
  const compressor = { ...node(), threshold: { value: 0 }, knee: { value: 0 }, ratio: { value: 0 }, attack: { value: 0 }, release: { value: 0 } };
  const stop = vi.fn();
  const output = { stream: { getTracks: () => [{ stop }] } };
  const close = vi.fn().mockResolvedValue(undefined);
  const input = {} as MediaStream;
  const createSource = vi.fn(() => source);
  vi.stubGlobal('AudioContext', class {
    createMediaStreamSource = createSource;
    createBiquadFilter = () => filter;
    createDynamicsCompressor = () => compressor;
    createMediaStreamDestination = () => output;
    resume = () => Promise.resolve();
    close = close;
  });

  const audio = createRecordingAudio(input);
  await audio.ready;
  expect(createSource).toHaveBeenCalledWith(input);
  expect(connections).toEqual([[source, filter], [filter, compressor], [compressor, output]]);
  expect(audio.stream).toBe(output.stream);
  audio.close();
  audio.close();
  expect(stop).toHaveBeenCalledTimes(1);
  expect(close).toHaveBeenCalledTimes(1);
});

test('falls back to microphone input when Web Audio is unavailable', async () => {
  vi.stubGlobal('AudioContext', undefined);
  const input = {} as MediaStream;
  const audio = createRecordingAudio(input);
  await audio.ready;
  expect(audio.stream).toBe(input);
  expect(() => audio.close()).not.toThrow();
});
