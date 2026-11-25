'use client';
import { WandSparkles } from 'lucide-react';
import { useAccessLookup } from '@/app/features/staff/staffAccess';
import MediaProgress from '@/app/features/studio/MediaProgress';

/**
 * Bước 3 (tùy chọn) của truyện gia đình: nhờ AI vẽ tranh và tạo giọng đọc từ nội dung đã xác nhận
 * (`parent/stories/{id}/manual/media/generate`), rồi theo dõi và xác nhận gói như luồng Creator.
 */
export default function ParentManualMedia({ storyId, versionId, active, disabled, onGenerate, onChanged }: {
  storyId: number; versionId: number; active: boolean; disabled: boolean; onGenerate: () => void; onChanged: () => void;
}) {
  // API tiến độ và gói media cũng cần quyền này nên thiếu quyền thì không tải.
  const canMedia = useAccessLookup()('media.generate').state !== 'Hidden';
  if (!canMedia) return <p className="notice warn" role="status" data-inline-notice>Quản trị viên đã tắt quyền sinh tranh và âm thanh của bạn. Bé vẫn đọc được truyện bằng chữ.</p>;
  return <MediaProgress storyId={storyId} versionId={versionId} active={active} disabled={disabled} stepNo={3} onChanged={onChanged}
    idle={<div className="pa-step">
      <p className="sub">Bước này không bắt buộc. Bỏ qua thì bé đọc truyện bằng chữ.</p>
      <div className="pa-actions"><button className="btn btn-p" disabled={disabled} onClick={onGenerate}><WandSparkles className="ic" />Tạo tranh và giọng đọc</button></div>
    </div>} />;
}
