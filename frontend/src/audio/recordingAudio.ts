export function createRecordingAudio(stream: MediaStream) {
  if (typeof AudioContext === 'undefined') {
    return { stream, ready: Promise.resolve(), close() {} };
  }

  const context = new AudioContext();
  let output: MediaStreamAudioDestinationNode | undefined;
  let closed = false;
  function close() {
    if (closed) return;
    closed = true;
    output?.stream.getTracks().forEach((track) => track.stop());
    void context.close().catch(() => {});
  }

  try {
    const source = context.createMediaStreamSource(stream);
    const filter = context.createBiquadFilter();
    // Remove rumble without narrowing the consonant frequencies used in practice.
    filter.type = 'highpass';
    filter.frequency.value = 80;
    filter.Q.value = 0.707;

    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.knee.value = 12;
    compressor.ratio.value = 1.5;
    compressor.attack.value = 0.015;
    compressor.release.value = 0.15;

    output = context.createMediaStreamDestination();
    source.connect(filter);
    filter.connect(compressor);
    compressor.connect(output);
    // Record the processed stream; never monitor the microphone through speakers.
    return { stream: output.stream, ready: context.resume(), close };
  } catch (error) {
    close();
    throw error;
  }
}
