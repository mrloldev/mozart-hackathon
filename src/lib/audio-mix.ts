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

const TRACK_WEIGHTS = [0.7, 0.7, 1.2] as const;
const MIX_MAX_DURATION_SEC = 30;

export async function mixBeatAndMelodyBlob(beatUrl: string, melodyBlob: Blob): Promise<Blob> {
  const ctx = new AudioContext();
  const sampleRate = ctx.sampleRate;
  const maxSamples = Math.floor(MIX_MAX_DURATION_SEC * sampleRate);

  const [beatRes, melodyArr] = await Promise.all([
    fetch(beatUrl, { mode: "cors", credentials: "omit" }),
    melodyBlob.arrayBuffer(),
  ]);
  const beatBuf = await ctx.decodeAudioData(await beatRes.arrayBuffer());
  const melodyBuf = await ctx.decodeAudioData(melodyArr);

  const trim = (buf: AudioBuffer) => {
    const trimTo = Math.min(buf.length, maxSamples);
    if (trimTo < buf.length) {
      const t = ctx.createBuffer(buf.numberOfChannels, trimTo, sampleRate);
      for (let ch = 0; ch < buf.numberOfChannels; ch++) {
        t.copyFromChannel(buf.getChannelData(ch), ch, 0, 0, trimTo);
      }
      return t;
    }
    return buf;
  };
  const b1 = trim(beatBuf);
  const b2 = trim(melodyBuf);
  const maxLength = Math.min(maxSamples, Math.max(b1.length, b2.length));
  const numChannels = Math.max(2, b1.numberOfChannels, b2.numberOfChannels);
  const mixed = ctx.createBuffer(numChannels, maxLength, sampleRate);

  const inL1 = b1.getChannelData(0);
  const inR1 = b1.numberOfChannels > 1 ? b1.getChannelData(1) : inL1;
  const inL2 = b2.getChannelData(0);
  const inR2 = b2.numberOfChannels > 1 ? b2.getChannelData(1) : inL2;

  for (let ch = 0; ch < numChannels; ch++) {
    const out = mixed.getChannelData(ch);
    const in1 = ch === 0 ? inL1 : inR1;
    const in2 = ch === 0 ? inL2 : inR2;
    for (let i = 0; i < maxLength; i++) {
      const s1 = i < in1.length ? in1[i] : 0;
      const s2 = i < in2.length ? in2[i] : 0;
      out[i] = (s1 + s2) * 0.5;
    }
  }
  return audioBufferToWav(mixed);
}

export async function mixTrackUrls(urls: (string | null | undefined)[]): Promise<Blob> {
  const buffer = await mixAudioUrls(urls);
  return audioBufferToWav(buffer);
}

export async function mixAudioUrls(urls: (string | null | undefined)[]): Promise<AudioBuffer> {
  const deduped = [...urls];
  if (deduped[0] && deduped[1] && deduped[0] === deduped[1]) {
    deduped[1] = null;
  }
  const withIndex = deduped
    .map((url, i) => ({ url, weight: TRACK_WEIGHTS[Math.min(i, TRACK_WEIGHTS.length - 1)] }))
    .filter((t): t is { url: string; weight: number } => !!t.url?.length);
  if (withIndex.length === 0) throw new Error("No valid audio URLs");

  const ctx = new AudioContext();
  const sampleRate = ctx.sampleRate;
  const maxSamples = Math.floor(MIX_MAX_DURATION_SEC * sampleRate);
  const buffers: AudioBuffer[] = [];
  const weights: number[] = [];

  for (const { url, weight } of withIndex) {
    const res = await fetch(url, { mode: "cors", credentials: "omit" });
    const arr = await res.arrayBuffer();
    const buf = await ctx.decodeAudioData(arr);
    const trimTo = Math.min(buf.length, maxSamples);
    if (trimTo < buf.length) {
      const trimmed = ctx.createBuffer(buf.numberOfChannels, trimTo, sampleRate);
      for (let ch = 0; ch < buf.numberOfChannels; ch++) {
        trimmed.copyFromChannel(buf.getChannelData(ch), ch, 0, 0, trimTo);
      }
      buffers.push(trimmed);
    } else {
      buffers.push(buf);
    }
    weights.push(weight);
  }

  const weightSum = weights.reduce((a, b) => a + b, 0);
  const maxLength = Math.min(maxSamples, Math.max(...buffers.map((b) => b.length)));
  const numChannels = Math.max(2, ...buffers.map((b) => b.numberOfChannels));
  const mixed = ctx.createBuffer(numChannels, maxLength, sampleRate);

  for (let b = 0; b < buffers.length; b++) {
    const buf = buffers[b];
    const gain = weights[b] / weightSum;
    const inL = buf.getChannelData(0);
    const inR = buf.numberOfChannels > 1 ? buf.getChannelData(1) : inL;
    for (let ch = 0; ch < numChannels; ch++) {
      const out = mixed.getChannelData(ch);
      const inCh = ch === 0 ? inL : inR;
      for (let i = 0; i < inCh.length; i++) {
        out[i] = (out[i] ?? 0) + inCh[i] * gain;
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
