import { expect, test } from 'vitest';
import { matchingGain, encodeWav } from './matchLoudness';

function samples(amplitude: number, silence = 0): AudioBuffer {
  const data = new Float32Array(4800 + silence);
  for (let i = silence; i < data.length; i++) data[i] = i % 2 ? amplitude : -amplitude;
  return { sampleRate: 48000, length: data.length, numberOfChannels: 1, getChannelData: () => data } as unknown as AudioBuffer;
}

test('raises quiet speech towards the reference level', () => {
  expect(matchingGain(samples(0.1), samples(0.15))).toBeCloseTo(1.5);
});

test('pauses do not cause extra amplification', () => {
  expect(matchingGain(samples(0.1, 48000), samples(0.15))).toBeCloseTo(1.5);
});

test('reduces loud recordings and caps quiet-recording amplification', () => {
  expect(matchingGain(samples(0.4), samples(0.1))).toBeCloseTo(0.25);
  expect(matchingGain(samples(0.02), samples(0.4))).toBeLessThanOrEqual(2);
});

test('does not boost silence or very faint noise', () => {
  expect(matchingGain(samples(0), samples(0.2))).toBe(1);
  expect(matchingGain(samples(0.001), samples(0.2))).toBe(1);
});

test('a transient peak limits gain to retain headroom', () => {
  const clip = samples(0.1);
  clip.getChannelData(0)[100] = 0.8;
  expect(matchingGain(clip, samples(0.3))).toBeLessThanOrEqual(0.89 / 0.8);
});

test('encodes gain-adjusted PCM with the correct WAV duration and sample rate', () => {
  const wav = new DataView(encodeWav(samples(0.1), 1.5));
  expect(wav.getUint32(24, true)).toBe(48000);
  expect(wav.getUint32(40, true)).toBe(4800 * 2);
  expect(wav.getInt16(44, true)).toBeCloseTo(-0.15 * 32767, -1);
});
