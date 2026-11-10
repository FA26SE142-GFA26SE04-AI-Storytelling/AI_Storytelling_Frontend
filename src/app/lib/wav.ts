/**
 * Đổi bản ghi âm của trình duyệt (webm/ogg/mp4) sang WAV 16-bit một kênh.
 * Kho media của Backend chỉ nhận WAV hoặc MP3 (kiểm tra theo byte đầu file), còn MediaRecorder trên Chrome/Edge chỉ ghi được webm.
 */
export const WAV_SAMPLE_RATE = 12_000;
/** Số byte cho một giây WAV ở cấu hình trên (12 kHz × 2 byte). */
export const WAV_BYTES_PER_SECOND = WAV_SAMPLE_RATE * 2;
const HEADER_BYTES = 44;

/** Thời lượng tối đa (giây) để file WAV không vượt `maxBytes`, chừa 5% dự phòng. */
export const wavMaxSeconds = (maxBytes: number) => Math.floor(((maxBytes - HEADER_BYTES) / WAV_BYTES_PER_SECOND) * 0.95);

export async function toWav(blob: Blob): Promise<Blob> {
  const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx || typeof OfflineAudioContext === 'undefined') throw new Error('WAV_UNSUPPORTED');
  const ctx = new AudioCtx();
  let decoded: AudioBuffer;
  try { decoded = await ctx.decodeAudioData(await blob.arrayBuffer()); }
  finally { void ctx.close(); }

  // Trộn về một kênh và hạ tần số lấy mẫu cho nhẹ file; giọng nói vẫn rõ.
  const length = Math.max(1, Math.ceil(decoded.duration * WAV_SAMPLE_RATE));
  const offline = new OfflineAudioContext(1, length, WAV_SAMPLE_RATE);
  const source = offline.createBufferSource();
  source.buffer = decoded;
  source.connect(offline.destination);
  source.start();
  const samples = (await offline.startRendering()).getChannelData(0);

  const view = new DataView(new ArrayBuffer(HEADER_BYTES + samples.length * 2));
  const text = (at: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(at + i, s.charCodeAt(i)); };
  text(0, 'RIFF'); view.setUint32(4, 36 + samples.length * 2, true); text(8, 'WAVE');
  text(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, WAV_SAMPLE_RATE, true); view.setUint32(28, WAV_BYTES_PER_SECOND, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  text(36, 'data'); view.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(HEADER_BYTES + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([view], { type: 'audio/wav' });
}
