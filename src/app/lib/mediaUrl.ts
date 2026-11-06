import type { ListeningAttemptResult, ReadingContent } from "@/app/types/childReading";

/**
 * Địa chỉ gốc của kho media công khai, ví dụ `https://<project>.supabase.co/storage/v1/object/public/<bucket>`.
 * Backend đang lưu và trả đường dẫn tương đối trong kho (`908/versions/911/v1/….png`); trình duyệt không mở được
 * đường dẫn này nên cần ghép với địa chỉ gốc. Đường dẫn đã đầy đủ (http, https, blob, data, bắt đầu bằng "/") giữ nguyên,
 * nên khi Backend trả link đầy đủ thì không cần đặt biến này.
 */
const BASE = (process.env.NEXT_PUBLIC_MEDIA_BASE_URL ?? "").replace(/\/+$/, "");

export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (!BASE || /^(https?:|blob:|data:|\/)/i.test(url)) return url;
  return `${BASE}/${url.replace(/^\/+/, "")}`;
}

/** Đổi mọi đường dẫn media trong nội dung đọc của bé (tranh, giọng đọc, tương tác) thành link mở được. */
export function resolveContentMedia(content: ReadingContent): ReadingContent {
  return {
    ...content,
    scenes: content.scenes.map((scene) => ({
      ...scene,
      illustrationUrl: resolveMediaUrl(scene.illustrationUrl),
      segments: scene.segments.map((s) => ({ ...s, audioUrl: resolveMediaUrl(s.audioUrl) })),
      interaction: scene.interaction && {
        ...scene.interaction,
        modelAudioUrl: resolveMediaUrl(scene.interaction.modelAudioUrl),
        audioUrls: Object.fromEntries(Object.entries(scene.interaction.audioUrls ?? {}).map(([k, v]) => [k, resolveMediaUrl(v) ?? v])),
        options: scene.interaction.options.map((o) => ({
          ...o,
          imageUrl: resolveMediaUrl(o.imageUrl),
          audioUrl: resolveMediaUrl(o.audioUrl),
          feedbackAudioUrl: resolveMediaUrl(o.feedbackAudioUrl),
        })),
      },
    })),
  };
}

export function resolveAttemptMedia(result: ListeningAttemptResult): ListeningAttemptResult {
  return { ...result, feedbackAudioUrl: resolveMediaUrl(result.feedbackAudioUrl) };
}
