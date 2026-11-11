import type * as B from '@/app/types/backendContracts';

export const LISTENING_TYPE_LABELS: Record<string, string> = {
  Checkpoint: 'Câu hỏi giữa truyện',
  RolePlay: 'Nhập vai',
  FillBlank: 'Điền từ',
  EventOrdering: 'Sắp xếp sự kiện',
  PicturePrediction: 'Đoán tranh',
};

export type ChangeReviewItem =
  | { kind: 'PublicStoryReview'; data: B.PublicReviewPackageDto }
  | { kind: 'RoadmapTemplateReview'; data: B.RoadmapReviewPackageDto };

export type ChangePartConfig = {
  value: string;
  label: string;
  requiresTarget: boolean;
  emptyMessage?: string;
};

export type ChangeTargetOption = {
  value: string;
  id: number;
  label: string;
  previewTitle: string;
  previewBody: string;
  previewMeta?: string;
};

export type ValidChangeRequestPayload =
  | { ok: true; kind: 'PublicStoryReview'; body: B.RequestChangesDto }
  | { ok: true; kind: 'RoadmapTemplateReview'; body: B.RequestRoadmapChangesDto };

export type ChangeRequestBuildResult =
  | ValidChangeRequestPayload
  | { ok: false; error: string };

export interface ChangeDialogState {
  partType: string;
  targetId: string;
  note: string;
  localError: string;
}

export type ChangeDialogAction =
  | { type: 'setPartType'; partType: string }
  | { type: 'setTargetId'; targetId: string }
  | { type: 'setNote'; note: string }
  | { type: 'setError'; error: string }
  | { type: 'reset'; item: ChangeReviewItem; initialNote?: string; initialPartType?: string; initialTargetId?: string };

const PUBLIC_PARTS: ChangePartConfig[] = [
  { value: 'metadata', label: 'Thông tin chung (tiêu đề, mô tả, nhãn)', requiresTarget: false },
  { value: 'scene_text', label: 'Chữ của cảnh', requiresTarget: true, emptyMessage: 'Truyện này chưa có cảnh nào để yêu cầu sửa chữ.' },
  { value: 'scene_image', label: 'Tranh của cảnh', requiresTarget: true, emptyMessage: 'Truyện này chưa có cảnh nào để yêu cầu sửa tranh.' },
  { value: 'scene_audio', label: 'Âm thanh của cảnh', requiresTarget: true, emptyMessage: 'Truyện này chưa có cảnh nào để yêu cầu sửa âm thanh.' },
  { value: 'quiz', label: 'Câu đố', requiresTarget: true, emptyMessage: 'Truyện này chưa có câu đố nào để yêu cầu sửa.' },
  { value: 'vocabulary', label: 'Từ vựng', requiresTarget: true, emptyMessage: 'Truyện này chưa có từ vựng nào để yêu cầu sửa.' },
  { value: 'listening', label: 'Câu hỏi tương tác khi nghe', requiresTarget: true, emptyMessage: 'Truyện này chưa có tương tác khi nghe nào để yêu cầu sửa.' },
];

const ROADMAP_PARTS: ChangePartConfig[] = [
  { value: 'name_description', label: 'Tên và mô tả lộ trình', requiresTarget: false },
  { value: 'order', label: 'Thứ tự các truyện', requiresTarget: false },
  { value: 'age_level', label: 'Độ tuổi và mức đọc', requiresTarget: false },
  { value: 'story', label: 'Một truyện trong lộ trình', requiresTarget: true, emptyMessage: 'Lộ trình này chưa có truyện nào để yêu cầu sửa.' },
];

const clean = (raw: string | null | undefined): string => (raw ?? '').replace(/\s+/g, ' ').trim();

function snippet(raw: string | null | undefined, max = 64): string {
  const text = clean(raw);
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

function parseChoices(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
  } catch { /* giữ fallback chuỗi ngăn cách | */ }
  return raw.split('|').map(x => x.trim()).filter(Boolean);
}

/** Chỉ gắn hậu tố thứ tự khi hai mục khác ID có cùng nhãn hiển thị để dễ phân biệt trong danh sách. */
function disambiguateLabels(items: ChangeTargetOption[]): ChangeTargetOption[] {
  const counts = new Map<string, number>();
  for (const it of items) counts.set(it.label, (counts.get(it.label) ?? 0) + 1);
  const seen = new Map<string, number>();
  return items.map(it => {
    if ((counts.get(it.label) ?? 0) <= 1) return it;
    const ord = (seen.get(it.label) ?? 0) + 1;
    seen.set(it.label, ord);
    return { ...it, label: `${it.label} (mục ${ord})` };
  });
}

export function changePartConfigs(kind: ChangeReviewItem['kind']): ChangePartConfig[] {
  return kind === 'PublicStoryReview' ? PUBLIC_PARTS : ROADMAP_PARTS;
}

export function defaultPartTypeFor(kind: ChangeReviewItem['kind']): string {
  return changePartConfigs(kind)[0].value;
}

export function changeTargetOptions(item: ChangeReviewItem, partType: string): ChangeTargetOption[] {
  if (item.kind === 'RoadmapTemplateReview') {
    if (partType !== 'story') return [];
    const stories = [...item.data.stories].sort((a, b) => a.position - b.position);
    return disambiguateLabels(stories.map(s => {
      const title = clean(s.title) || 'Truyện chưa có tên';
      const meta = [
        s.ageBand ? `Độ tuổi ${s.ageBand}` : null,
        s.readingLevel != null ? `Mức đọc ${s.readingLevel}` : null,
        s.days != null ? `${s.days} ngày` : null,
        s.isEligible ? 'Đủ điều kiện' : 'Không còn đủ điều kiện',
      ].filter(Boolean).join(' · ');
      return {
        value: String(s.storyId),
        id: s.storyId,
        label: `Vị trí ${s.position} — ${snippet(title, 64)}`,
        previewTitle: `Vị trí ${s.position}: ${title}`,
        previewBody: title,
        previewMeta: meta,
      };
    }));
  }

  const d = item.data;
  if (partType === 'scene_text' || partType === 'scene_image' || partType === 'scene_audio') {
    const scenes = [...d.scenes].sort((a, b) => a.sceneIndex - b.sceneIndex);
    return disambiguateLabels(scenes.map((scene, idx) => {
      const body = clean(scene.sceneText) || 'Cảnh này chưa có nội dung chữ.';
      const head = snippet(scene.sceneText, 64) || 'Chưa có nội dung chữ';
      const meta = partType === 'scene_image'
        ? [`Vị trí ${idx + 1}/${scenes.length}`, `${scene.illustrations.length} tranh minh hoạ`, clean(scene.visualDescription) ? `Mô tả tranh: ${clean(scene.visualDescription)}` : null].filter(Boolean).join(' · ')
        : partType === 'scene_audio'
          ? `Vị trí ${idx + 1}/${scenes.length} · ${scene.segments.length} đoạn âm thanh`
          : `Vị trí ${idx + 1}/${scenes.length} · ${scene.sceneText.trim().length} ký tự`;
      return {
        value: String(scene.sceneId),
        id: scene.sceneId,
        label: `Cảnh ${scene.sceneIndex + 1} — ${head}`,
        previewTitle: `Cảnh ${scene.sceneIndex + 1}`,
        previewBody: body,
        previewMeta: meta,
      };
    }));
  }

  if (partType === 'quiz') {
    return disambiguateLabels(d.quizzes.map((q, idx) => {
      const question = clean(q.question);
      const choices = parseChoices(q.choices);
      const meta = [
        `Câu đố ${idx + 1}/${d.quizzes.length}`,
        q.correctAnswer ? `Đáp án: ${clean(q.correctAnswer)}` : null,
        choices.length > 0 ? `Lựa chọn: ${choices.join(' / ')}` : null,
      ].filter(Boolean).join(' · ');
      return {
        value: String(q.id),
        id: q.id,
        label: snippet(question, 76) || `Câu đố thứ ${idx + 1}`,
        previewTitle: `Câu đố ${idx + 1}/${d.quizzes.length}`,
        previewBody: question || 'Chưa có nội dung câu hỏi.',
        previewMeta: meta,
      };
    }));
  }

  if (partType === 'vocabulary') {
    return disambiguateLabels(d.vocabulary.map((v, idx) => {
      const term = clean(v.term) || `Từ vựng thứ ${idx + 1}`;
      const def = clean(v.definition);
      return {
        value: String(v.id),
        id: v.id,
        label: `${term} — ${snippet(def, 60) || 'Chưa có định nghĩa'}`,
        previewTitle: term,
        previewBody: def || 'Chưa có định nghĩa.',
        previewMeta: `Mục ${idx + 1}/${d.vocabulary.length}`,
      };
    }));
  }

  if (partType === 'listening') {
    const list = d.listeningInteractions ?? [];
    return disambiguateLabels(list.map((it, idx) => {
      const kindLabel = LISTENING_TYPE_LABELS[it.type] ?? (clean(it.type) || 'Tương tác');
      const prompt = clean(it.prompt);
      const quote = clean(it.sourceQuote);
      const label = prompt
        ? `${kindLabel} — ${snippet(prompt, 64)}`
        : quote
          ? `${kindLabel} — “${snippet(quote, 56)}”`
          : `${kindLabel} #${idx + 1}`;
      const bodyParts = [
        prompt ? `Câu hỏi: ${prompt}` : null,
        quote ? `Đoạn trích: “${quote}”` : null,
        clean(it.hiddenWord) ? `Từ cần điền: ${clean(it.hiddenWord)}` : null,
      ].filter(Boolean);
      const meta = [
        it.characterName ? `Nhân vật: ${clean(it.characterName)}` : null,
        it.options.length > 0 ? `${it.options.length} lựa chọn: ${it.options.map(o => clean(o.text)).filter(Boolean).join(' / ')}` : null,
      ].filter(Boolean).join(' · ');
      return {
        value: String(it.id),
        id: it.id,
        label,
        previewTitle: `${kindLabel} (${idx + 1}/${list.length})`,
        previewBody: bodyParts.join('\n') || 'Tương tác chưa có câu hỏi hoặc đoạn trích.',
        previewMeta: meta || undefined,
      };
    }));
  }

  return [];
}

export function buildChangeRequestPayload(
  item: ChangeReviewItem,
  partType: string,
  targetId: string,
  rawNote: string,
): ChangeRequestBuildResult {
  const note = rawNote.trim();
  if (!note) return { ok: false, error: 'Vui lòng nhập nội dung cần sửa.' };
  if (note.length > 1000) return { ok: false, error: 'Nội dung cần sửa tối đa 1.000 ký tự.' };

  const cfg = changePartConfigs(item.kind).find(c => c.value === partType);
  if (!cfg) return { ok: false, error: 'Loại phần cần sửa không hợp lệ.' };

  if (!cfg.requiresTarget) {
    return item.kind === 'PublicStoryReview'
      ? { ok: true, kind: 'PublicStoryReview', body: { generalNote: note, parts: [{ partType, partId: null, note }] } }
      : { ok: true, kind: 'RoadmapTemplateReview', body: { generalNote: note, parts: [{ partType, storyId: null, action: null, note }] } };
  }

  const options = changeTargetOptions(item, partType);
  if (options.length === 0) {
    return { ok: false, error: cfg.emptyMessage ?? 'Không có nội dung phù hợp trong gói duyệt.' };
  }
  const chosen = options.find(o => o.value === targetId);
  if (!chosen) {
    return { ok: false, error: 'Vui lòng chọn nội dung cần sửa thuộc gói duyệt hiện tại.' };
  }

  return item.kind === 'PublicStoryReview'
    ? { ok: true, kind: 'PublicStoryReview', body: { generalNote: note, parts: [{ partType, partId: chosen.id, note }] } }
    : { ok: true, kind: 'RoadmapTemplateReview', body: { generalNote: note, parts: [{ partType, storyId: chosen.id, action: 'replace', note }] } };
}

export function createChangeDialogState(
  item: ChangeReviewItem,
  initialNote = '',
  initialPartType?: string,
  initialTargetId = '',
): ChangeDialogState {
  const configs = changePartConfigs(item.kind);
  const validPart = configs.some(c => c.value === initialPartType) ? initialPartType! : configs[0].value;
  return {
    partType: validPart,
    targetId: initialTargetId,
    note: initialNote,
    localError: '',
  };
}

export function changeDialogReducer(state: ChangeDialogState, action: ChangeDialogAction): ChangeDialogState {
  switch (action.type) {
    case 'setPartType':
      return { ...state, partType: action.partType, targetId: '', localError: '' };
    case 'setTargetId':
      return { ...state, targetId: action.targetId, localError: '' };
    case 'setNote':
      return { ...state, note: action.note, localError: '' };
    case 'setError':
      return { ...state, localError: action.error };
    case 'reset':
      return createChangeDialogState(action.item, action.initialNote ?? '', action.initialPartType, action.initialTargetId ?? '');
  }
}

export async function submitChangeRequest(
  send: () => Promise<boolean>,
  isInFlight: () => boolean,
  setInFlight: (busy: boolean) => void,
  onSuccessClose: () => void,
): Promise<boolean> {
  if (isInFlight()) return false;
  setInFlight(true);
  try {
    const ok = await send();
    if (ok) onSuccessClose();
    return ok;
  } finally {
    setInFlight(false);
  }
}
