import type { ReadingScene } from "@/app/types/childReading";

/** Một tranh của cảnh và đoạn chữ [start, end) nó minh hoạ. */
export type ScenePicture = { url: string | null; start: number; end: number };

/** Tranh của cảnh theo thứ tự; Backend cũ chỉ có illustrationUrl thì là một tranh phủ cả cảnh. */
export function scenePictures(scene: ReadingScene): ScenePicture[] {
  const list = (scene.illustrations ?? []).filter((p) => p.url).slice().sort((a, b) => a.beatOrder - b.beatOrder)
    .map((p) => ({ url: p.url, start: p.startOffset, end: p.endOffset }));
  return list.length ? list : [{ url: scene.illustrationUrl, start: 0, end: scene.text.length }];
}

/**
 * Đoạn chữ hiện cùng từng tranh: tranh bắt đầu ở câu nó minh hoạ (beat.startOffset) và kéo tới ngay trước câu của tranh
 * sau; tranh đầu tính từ đầu cảnh, tranh cuối tới hết cảnh, nên ghép lại đủ cả cảnh. Bỏ khoảng trắng ở hai đầu.
 */
export function pictureParts(pictures: ScenePicture[], text: string): { start: number; end: number }[] {
  return pictures.map((p, i) => {
    let start = i === 0 ? 0 : Math.min(Math.max(0, p.start), text.length);
    let end = i === pictures.length - 1 ? text.length : Math.min(Math.max(start, pictures[i + 1].start), text.length);
    while (start < end && /\s/.test(text[start])) start++;
    while (end > start && /\s/.test(text[end - 1])) end--;
    return { start, end };
  });
}

/** Tranh ứng với vị trí chữ đang đọc: tranh có đoạn chứa vị trí đó, không có thì tranh gần nhất phía trước. */
export function pictureAt(pictures: ScenePicture[], offset: number): number {
  const inside = pictures.findIndex((p) => offset >= p.start && offset < p.end);
  if (inside >= 0) return inside;
  let last = 0;
  pictures.forEach((p, i) => { if (p.start <= offset) last = i; });
  return last;
}

/** Vị trí bắt đầu của từng đoạn âm thanh trong chữ của cảnh (Backend cũ không trả thì tự tìm theo thứ tự). */
export function segmentStarts(scene: ReadingScene): number[] {
  let cursor = 0;
  return scene.segments.slice().sort((a, b) => a.segmentOrder - b.segmentOrder).map((s) => {
    if (typeof s.startOffset === "number") { cursor = s.startOffset + s.text.length; return s.startOffset; }
    const at = scene.text.indexOf(s.text, cursor);
    const start = at >= 0 ? at : cursor;
    cursor = start + s.text.length;
    return start;
  });
}

type Timing = { word: string; start: number; end: number | null };

/** Mốc thời gian từng chữ do Backend lưu: [{ word, start, end }] tính bằng giây. Sai định dạng thì bỏ qua. */
export function parseWordTimings(json: string | null): Timing[] {
  if (!json) return [];
  try {
    const raw = JSON.parse(json);
    if (!Array.isArray(raw)) return [];
    return raw.filter((t) => t && typeof t.word === "string" && typeof t.start === "number")
      .map((t) => ({ word: t.word, start: t.start, end: typeof t.end === "number" ? t.end : null }));
  } catch { return []; }
}

/**
 * Vị trí ký tự đang được đọc trong một đoạn: theo mốc thời gian từng chữ nếu có,
 * không có thì ước theo tỉ lệ thời gian đã phát trên độ dài đoạn.
 */
export function charInSegment(text: string, timings: Timing[], seconds: number, duration: number): number {
  if (timings.length) {
    let cursor = 0, hit = 0;
    for (const t of timings) {
      const at = text.indexOf(t.word, cursor);
      if (at < 0) continue;
      if (t.start <= seconds) hit = at;
      cursor = at + t.word.length;
    }
    return hit;
  }
  if (!duration || !Number.isFinite(duration)) return 0;
  return Math.min(text.length - 1, Math.floor((seconds / duration) * text.length));
}

/**
 * Số giây tương ứng vị trí ký tự charOffset trong text.
 * Có timings: mốc start của từ chứa charOffset hoặc từ đầu tiên có vị trí >= charOffset.
 * Không có timings: tỉ lệ theo ký tự trong [0, duration].
 */
export function secondsAtChar(text: string, timings: Timing[] | null | undefined, charOffset: number, duration: number): number {
  if (!duration || !Number.isFinite(duration) || duration <= 0) return 0;
  if (!text || charOffset <= 0) return 0;
  if (charOffset >= text.length) return duration;

  if (timings && timings.length) {
    let cursor = 0;
    for (const t of timings) {
      const at = text.indexOf(t.word, cursor);
      if (at < 0) continue;
      const endAt = at + t.word.length;
      if (charOffset < endAt || at >= charOffset) {
        return Math.min(Math.max(0, t.start), duration);
      }
      cursor = endAt;
    }
    return duration;
  }

  const ratio = (duration * charOffset) / text.length;
  return Math.min(Math.max(0, ratio), duration);
}
