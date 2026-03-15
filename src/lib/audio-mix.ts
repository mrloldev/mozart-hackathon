function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1;
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = buffer.length * blockAlign;
  const bufferSize = 44 + dataSize;

  const arrayBuffer = new ArrayBuffer(bufferSize);
  const view = new DataView(arrayBuffer);
  let offset = 0;

  function writeString(str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset++, str.charCodeAt(i));
    }
  }

  writeString("RIFF");
  view.setUint32(offset, bufferSize - 8, true);
  offset += 4;
  writeString("WAVE");
  writeString("fmt ");
  view.setUint32(offset, 16, true);
  offset += 4;
  view.setUint16(offset, format, true);
  offset += 2;
  view.setUint16(offset, numChannels, true);
  offset += 2;
  view.setUint32(offset, sampleRate, true);
  offset += 4;
  view.setUint32(offset, sampleRate * blockAlign, true);
  offset += 4;
  view.setUint16(offset, blockAlign, true);
  offset += 2;
  view.setUint16(offset, bitDepth, true);
  offset += 2;
  writeString("data");
  view.setUint32(offset, dataSize, true);
  offset += 4;

  const channels = Array.from({ length: numChannels }, (_, ch) => buffer.getChannelData(ch));
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channels[ch][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}

export async function mixTrackUrls(urls: string[]): Promise<Blob> {
  const buffer = await mixAudioUrls(urls);
  return audioBufferToWav(buffer);
}

export async function mixAudioUrls(urls: (string | null | undefined)[]): Promise<AudioBuffer> {
  const validUrls = urls.filter((u): u is string => !!u);
  if (validUrls.length === 0) throw new Error("No valid audio URLs");

  const ctx = new AudioContext();
  const buffers: AudioBuffer[] = [];

  for (const url of validUrls) {
    const res = await fetch(url);
    const arr = await res.arrayBuffer();
    const buf = await ctx.decodeAudioData(arr);
    buffers.push(buf);
  }

  const maxLength = Math.max(...buffers.map((b) => b.length));
  const sampleRate = ctx.sampleRate;
  const mixed = ctx.createBuffer(
    Math.max(...buffers.map((b) => b.numberOfChannels)),
    maxLength,
    sampleRate
  );

  for (const buf of buffers) {
    for (let ch = 0; ch < buf.numberOfChannels; ch++) {
      const out = mixed.getChannelData(ch);
      const inCh = buf.getChannelData(ch);
      for (let i = 0; i < inCh.length; i++) {
        out[i] = (out[i] ?? 0) + inCh[i] / validUrls.length;
      }
    }
  }

  return mixed;
}

export function playMixedBuffer(buffer: AudioBuffer): { stop: () => void } {
  const ctx = new AudioContext();
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.connect(ctx.destination);
  src.start();

  return {
    stop: () => {
      try {
        src.stop();
      } catch {
        // Already stopped
      }
    },
  };
}
