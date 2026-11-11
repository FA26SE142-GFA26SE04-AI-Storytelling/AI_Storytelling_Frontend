'use client';
import type * as B from '@/app/types/backendContracts';
import SafeImage from '@/app/components/SafeImage';
import { Check, ShieldCheck } from 'lucide-react';
import { coverFor } from '@/app/lib/storyView';
import ModerationEvidence from './ModerationEvidence';
import { LISTENING_TYPE_LABELS } from './changeRequestOptions';

/** Dấu ! báo mục còn thiếu; rê chuột để xem lý do. */
export const Warn = ({ why }: { why: string }) => <span className="st-warn" role="img" aria-label={why} title={why}>!</span>;

const AGE: Record<string, string> = { '6-8': '6–8 tuổi', '9-10': '9–10 tuổi' };

export type CheckKey = 'safety' | 'ageFit' | 'education' | 'language' | 'copyright' | 'image' | 'audio' | 'interaction';

const isAi = (source?: string | null) => !source || source === 'AiGenerated';

/** Căn cứ ngắn cho từng tiêu chí, lấy từ gói duyệt, để Moderator biết cần xem gì trước khi chấm. */
export function criterionEvidence(d: B.PublicReviewPackageDto, key: CheckKey): string {
  const pics = d.scenes.flatMap((s) => s.illustrations);
  const segs = d.scenes.flatMap((s) => s.segments);
  const interactions = d.listeningInteractions ?? [];
  const openFlags = d.flags.filter((f) => !f.resolved).length;
  switch (key) {
    case 'safety': {
      if (d.flags.length) return `${d.flags.length} cờ AI, còn ${openFlags} chưa xử lý`;
      const scan = d.safetyScan;
      if (scan?.status === 'Safe') {
        const score = scan.riskScore != null ? ` · điểm rủi ro ${scan.riskScore}` : '';
        const adv = scan.advisoryFindings?.length ? ` · ${scan.advisoryFindings.length} lưu ý nhẹ` : ' · 0 cờ';
        return `Đã quét AI: An toàn (Safe)${score}${adv}`;
      }
      if (scan?.status === 'HardBlock') return 'AI đánh dấu chặn (HardBlock)';
      return 'Chưa có kết quả quét AI trên phiên bản này';
    }
    case 'ageFit': return [AGE[d.story.ageBand] ?? d.story.ageBand, d.story.readingLevel ? `mức đọc ${d.story.readingLevel}` : null, d.story.vocabularyLevel ? `từ vựng ${d.story.vocabularyLevel}` : null].filter(Boolean).join(' · ');
    case 'education': return `${d.vocabulary.length} từ vựng · ${d.quizzes.length} câu đố${d.story.moralLesson || d.version.lesson ? ' · có bài học' : ' · chưa có bài học'}`;
    case 'language': { const warn = segs.filter((s) => s.hasPronunciationWarning).length; return `${d.story.language === 'vi' ? 'Tiếng Việt' : d.story.language}${warn ? ` · ${warn} đoạn cảnh báo phát âm` : ''}`; }
    case 'copyright': { const up = pics.filter((p) => !isAi(p.source)).length + segs.filter((s) => !isAi(s.audioSource)).length; return up ? `${up} tệp do Creator tải lên, xem cam kết ở từng cảnh` : 'Tranh và âm thanh đều do AI của nền tảng tạo'; }
    case 'image': return `${pics.filter((p) => p.url).length}/${pics.length} tranh · đã xem ${d.scenes.filter((s) => s.viewed).length}/${d.scenes.length} cảnh`;
    case 'audio': return `${segs.filter((s) => s.audioUrl).length}/${segs.length} đoạn có âm thanh · đã nghe ${segs.filter((s) => s.heard).length}`;
    case 'interaction': return interactions.length ? `${interactions.length} tương tác khi nghe, xem mục bên dưới` : 'Truyện không có tương tác khi nghe';
  }
}

/**
 * Ảnh bìa trong gói duyệt có thể là tham chiếu nội bộ `scene:{mã ảnh}#crop=…` (backend chưa đổi sang link).
 * Bìa luôn là một tranh trong truyện, nên lấy link của tranh có cùng mã ảnh trong gói và giữ nguyên vùng cắt.
 */
function resolveCover(d: B.PublicReviewPackageDto): string | null {
  const raw = d.story.coverImageUrl;
  const m = raw?.match(/^scene:(\d+)(#crop=.*)?$/);
  if (!m) return raw;
  const pic = d.scenes.flatMap((s) => s.illustrations).find((i) => i.assetId === Number(m[1]) && i.url);
  return pic ? `${pic.url}${m[2] ?? ''}` : null;
}

/** Thông tin chung của truyện: ảnh bìa, độ tuổi, mức đọc, thể loại, mô tả, bài học. */
export function StoryFacts({ d }: { d: B.PublicReviewPackageDto }) {
  const lesson = d.story.moralLesson || d.version.lesson;
  return <div className="st-group"><b className="st-group-title">Thông tin truyện</b>
    <div className="pr-facts">
      <div className="pr-cover" role="img" aria-label="Ảnh bìa" style={{ background: coverFor(resolveCover(d)) }} />
      <div className="st-facts">
        <div><small>Độ tuổi</small><b>{AGE[d.story.ageBand] ?? d.story.ageBand}</b></div>
        <div><small>Mức đọc</small><b>{d.story.readingLevel ?? '—'}</b></div>
        <div><small>Mức từ vựng</small><b>{d.story.vocabularyLevel ?? '—'}</b></div>
        <div><small>Thể loại</small><b>{d.story.genre ?? '—'}</b></div>
        <div><small>Phiên bản</small><b>V{d.versionNo}{d.isResubmission ? ' · gửi lại' : ''}</b></div>
      </div>
    </div>
    {d.story.description && <div className="st-quote"><small>Mô tả</small><p>{d.story.description}</p></div>}
    <div className="st-quote"><small>Bài học</small><p>{lesson || 'Creator chưa ghi bài học.'}</p></div>
  </div>;
}

/** Khối kiểm tra an toàn AI & cờ cần xử lý: luôn hiện trạng thái quét AI kể cả khi Safe (0 cờ) hoặc chưa quét. */
export function SafetyScanSection({
  packageData,
  content,
  busy,
  onResolveFlag,
}: {
  packageData: B.PublicReviewPackageDto;
  content: string | null | undefined;
  busy: boolean;
  onResolveFlag: (flagId: string, name: string) => void;
}) {
  const { flags, safetyScan } = packageData;
  const unresolved = flags.some((f) => !f.resolved);
  const status = flags.length > 0 ? 'GrayZone' : (safetyScan?.status ?? 'NotChecked');
  const pill = status === 'Safe'
    ? { cls: 'ok', label: 'Đã quét AI: An toàn (Safe)' }
    : status === 'GrayZone'
      ? { cls: 'wait', label: 'Đã quét AI: Vùng xám (GrayZone)' }
      : status === 'HardBlock'
        ? { cls: 'flag', label: 'AI đánh dấu chặn (HardBlock)' }
        : { cls: 'wait', label: 'Chưa có kết quả quét AI' };
  const metaParts = [
    safetyScan?.riskScore != null ? `Điểm rủi ro: ${safetyScan.riskScore}/100` : null,
    safetyScan?.provider && safetyScan?.model ? `${safetyScan.provider} · ${safetyScan.model}` : safetyScan?.model ?? null,
    safetyScan?.phase ? `Giai đoạn: ${safetyScan.phase}` : null,
  ].filter(Boolean);
  const advisory = flags.length === 0 ? (safetyScan?.advisoryFindings ?? []) : [];

  return <div className="st-group">
    <b className="st-group-title">Cờ cần xử lý{unresolved && <Warn why="Còn cờ chưa xử lý" />}</b>
    <div className="row st-wrap">
      <span className={`pill ${pill.cls}`}>{pill.label}</span>
      {metaParts.length > 0 && <span className="st-review-meta">{metaParts.join(' · ')}</span>}
    </div>
    {flags.length > 0
      ? flags.map((f) => <div className="st-scene" key={f.flagId}>
          <b>{f.name}{!f.resolved && <Warn why="Cờ chưa xử lý" />}</b>
          <ModerationEvidence flag={f} content={content} />
          <button className="btn btn-s" disabled={busy || f.resolved} onClick={() => onResolveFlag(f.flagId, f.name)}>
            <ShieldCheck className="ic" />{f.resolved ? 'Đã xử lý' : 'An toàn'}
          </button>
        </div>)
      : <>
          <p className="sub">
            {status === 'Safe'
              ? 'AI không gắn cờ vùng xám nào trên phiên bản này.'
              : status === 'HardBlock'
                ? 'AI đánh dấu mức chặn; Moderator không nên duyệt công khai khi chưa xử lý vấn đề an toàn.'
                : 'Phiên bản này chưa có kết quả quét an toàn bằng AI. Hãy rà soát kỹ toàn bộ nội dung trước khi quyết định.'}
          </p>
          {advisory.length > 0 && <>
            <b className="st-scene-label">Lưu ý mức nhẹ do AI ghi nhận (tham khảo, không chặn duyệt)</b>
            {advisory.map((f) => <div className="st-scene" key={f.flagId}>
              <b>{f.name}{f.criterionCode ? ` (${f.criterionCode})` : ''}</b>
              <ModerationEvidence flag={f} content={content} />
            </div>)}
          </>}
        </>}
  </div>;
}

/** Nguồn của một tranh / đoạn âm thanh: AI tạo hay Creator tải lên (kèm cam kết). */
export function SourceNote({ source, sourceDeclaration, rightsDeclaration }: { source?: string | null; sourceDeclaration?: string | null; rightsDeclaration?: string | null }) {
  if (isAi(source)) return <span className="pill draft">AI tạo</span>;
  return <span className="pill wait" title={[sourceDeclaration && `Nguồn: ${sourceDeclaration}`, rightsDeclaration && `Cam kết: ${rightsDeclaration}`].filter(Boolean).join('\n') || 'Creator chưa ghi nguồn'}>Creator tải lên</span>;
}

/** Danh sách tương tác khi nghe để chấm tiêu chí "Tương tác". */
export function ListeningList({ items }: { items: B.PublicReviewListeningDto[] }) {
  return <div className="st-group"><b className="st-group-title">Tương tác khi nghe ({items.length})</b>
    {items.length === 0 ? <p className="sub">Truyện không có tương tác khi nghe.</p>
      : <div className="pr-list">{items.map((it, i) => <article className="pr-item" key={it.id}>
        <div className="row"><b>{i + 1}. {LISTENING_TYPE_LABELS[it.type] ?? it.type}</b>{it.characterName && <span className="pill draft">{it.characterName}</span>}</div>
        {it.sourceQuote && <blockquote className="pr-quote">{it.sourceQuote}</blockquote>}
        {it.prompt && <p><b>Câu hỏi:</b> {it.prompt}</p>}
        {it.hiddenWord && <p><b>Từ cần điền:</b> {it.hiddenWord}{it.hint ? ` (gợi ý: ${it.hint})` : ''}</p>}
        {it.options.length > 0 && <ul className="pr-options">{[...it.options].sort((a, b) => a.sortOrder - b.sortOrder).map((o) => <li key={o.id} className={o.isMatch ? 'ok' : ''}>
          {o.isMatch && <Check className="ic" aria-hidden />}{o.correctOrder != null && <b>{o.correctOrder}. </b>}{o.text}
          {o.imageUrl && <SafeImage className="pr-thumb" src={o.imageUrl} alt={o.imageDescription ?? o.text} />}
        </li>)}</ul>}
        {it.explanation && <p className="sub">Giải thích: {it.explanation}</p>}
      </article>)}</div>}
  </div>;
}
