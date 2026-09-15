function measure(buffer: AudioBuffer) {
  const channels = Array.from({ length: buffer.numberOfChannels }, (_, i) => buffer.getChannelData(i));
  const frameSize = Math.max(1, Math.round(buffer.sampleRate * 0.02));
  const frames: { power: number; count: number }[] = [];
  let peak = 0;
  let loudest = 0;

  for (let start = 0; start < buffer.length; start += frameSize) {
    const end = Math.min(start + frameSize, buffer.length);
    let sum = 0;
    for (const channel of channels) {
      for (let i = start; i < end; i++) {
        sum += channel[i] ** 2;
        peak = Math.max(peak, Math.abs(channel[i]));
      }
    }
    const count = (end - start) * channels.length;
    const power = sum / count;
    loudest = Math.max(loudest, power);
    frames.push({ power, count });
  }

  // ponytail: energy gating approximates active speech, not perceptual LUFS or voice detection.
  const gate = Math.max(0.0001, loudest * 0.01);
  let energy = 0;
  let count = 0;
  for (const frame of frames) {
    if (frame.power < gate) continue;
    energy += frame.power * frame.count;
    count += frame.count;
  }
  return { rms: count ? Math.sqrt(energy / count) : 0, peak };
}

export function matchingGain(clip: AudioBuffer, reference: AudioBuffer) {
  const input = measure(clip);
  const target = measure(reference);
  if (!input.rms || !target.rms) return 1;
  // At most +6 dB; leave approximately 1 dB of sample-peak headroom.
  return Math.min(target.rms / input.rms, 2, 0.89 / input.peak);
}

export function encodeWav(clip: AudioBuffer, gain: number): ArrayBuffer {
  // PCM WAV makes the adjusted samples playable without another encoder dependency.
  const channels = Array.from({ length: clip.numberOfChannels }, (_, i) => clip.getChannelData(i));
  const bytesPerFrame = channels.length * 2;
  const dataSize = clip.length * bytesPerFrame;
  const bytes = new ArrayBuffer(44 + dataSize);
  const view = new DataView(bytes);
  const text = new TextEncoder();
  new Uint8Array(bytes, 0, 4).set(text.encode('RIFF'));
  view.setUint32(4, 36 + dataSize, true);
  new Uint8Array(bytes, 8, 8).set(text.encode('WAVEfmt '));
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels.length, true);
  view.setUint32(24, clip.sampleRate, true);
  view.setUint32(28, clip.sampleRate * bytesPerFrame, true);
  view.setUint16(32, bytesPerFrame, true);
  view.setUint16(34, 16, true);
  new Uint8Array(bytes, 36, 4).set(text.encode('data'));
  view.setUint32(40, dataSize, true);
  let offset = 44;
  for (let i = 0; i < clip.length; i++) {
    for (const channel of channels) {
      view.setInt16(offset, Math.round(Math.max(-1, Math.min(1, channel[i] * gain)) * 32767), true);
      offset += 2;
    }
  }
  return bytes;
}

export async function matchLoudness(clip: Blob, referenceUrl: string, signal: AbortSignal): Promise<Blob> {
  const decoder = new OfflineAudioContext(1, 1, 48000);
  const response = await fetch(referenceUrl, { signal });
  if (!response.ok) throw new Error('Reference audio unavailable');
  const [input, reference] = await Promise.all([
    clip.arrayBuffer().then((data) => decoder.decodeAudioData(data)),
    response.arrayBuffer().then((data) => decoder.decodeAudioData(data)),
  ]);
  signal.throwIfAborted();
  return new Blob([encodeWav(input, matchingGain(input, reference))], { type: 'audio/wav' });
}
