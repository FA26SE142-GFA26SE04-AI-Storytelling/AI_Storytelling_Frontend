'use client';
import { useEffect, useRef, useState } from 'react';
import type * as B from '@/app/types/backendContracts';
import { roadmapService } from '@/app/services/roadmapService';
import { communityService } from '@/app/services/communityService';
import { childManualService } from '@/app/services/childManualService';
import { childAccessService } from '@/app/services/childAccessService';
import { useKidSession } from './useKidSession';
import PondBackdrop from '@/app/components/brand/PondBackdrop';
import Frog from '@/app/components/brand/Frog';
import FamilyMediaPreview from '@/app/features/authoring/FamilyMediaPreview';
import ChildReadingLibrary from './ChildReadingLibrary';
import { Shelf, ShelfRow } from '@/app/features/library/LibraryWorkspace';
import { gradientFor } from '@/app/lib/storyView';
import { BookOpen, Lock } from 'lucide-react';

/** Bìa sách trên kệ của bé: tên truyện in trên bìa. */
function Cover({ id, title, meta, disabled, onOpen, label }: { id: number; title: string; meta?: string; disabled?: boolean; onOpen?: () => void; label?: string }) {
  const canRead = !!onOpen;
  return <button className={`bk${canRead ? ' can-read' : ' cannot-read'}`} disabled={disabled || !canRead} aria-label={canRead ? `Đọc truyện ${title}` : `${title}: ${label ?? 'chưa mở'}`} onClick={onOpen}><span className="bk-cover" style={{ background: gradientFor(id) }}>{canRead ? <span className="pill ok bk-badge"><BookOpen className="ic" aria-hidden />Đọc được</span> : <span className="pill draft bk-badge"><Lock className="ic" aria-hidden />{label ?? 'Chưa mở'}</span>}<span className="bk-name display">{title}</span></span><span className="bk-title">{title}</span>{meta && <span className="bk-meta">{meta}</span>}</button>;
}
export default function ConnectedKidHome({ childId, onExit }: { childId: number; onExit: () => void }) {
  const ended = useKidSession();
  const [roadmap, setRoadmap] = useState<B.MyRoadmapDto | null>(null);
  const [library, setLibrary] = useState<B.ParentFamilyConfirmationDto[]>([]);
  const [community, setCommunity] = useState<B.PagedResult<B.CommunityStoryDto> | null>(null);
  const [page, setPage] = useState(1);
  const [pack, setPack] = useState<B.ParentPreparationDto | null>(null);
  const [selected, setSelected] = useState<B.CommunityStoryDto | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [nickname, setNickname] = useState('');
  const [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState(false);
  const [reading,setReading]=useState(false);
  // Thư viện của bé đang tạm khóa: chỉ đọc được truyện đang mở (backend chặn mọi truyện khác bằng 403).
  const [lock, setLock] = useState<{ locked: boolean; unlockStoryId: number | null }>({ locked: false, unlockStoryId: null });
  const scope = useRef(Symbol());
  useEffect(() => {
    const controller = new AbortController(); const run = Symbol(); scope.current = run;
    setRoadmap(null); setLibrary([]); setCommunity(null); setPack(null); setSelected(null); setErrors([]); setBusy(false);
    const session = childAccessService.readSession();
    if (!session || session.childProfileId !== childId) { setErrors(['Phiên của bé không khớp hồ sơ. Hãy vào lại.']); return; }
    const token = session.accessToken;
    const fail = (message: string) => { if (scope.current === run) setErrors(v => [...v,message]); };
    void childAccessService.getSessionProfile(token).then(r => { if (scope.current === run) { if (r.success && r.data?.childProfileId === childId) setNickname(r.data.nickname); else fail(r.message || 'Phiên của bé đã thay đổi.'); } });
    void roadmapService.mine(token, controller.signal).then(r => { if (scope.current === run) { if (r.success) setRoadmap(r.data); else fail(r.message); } });
    void childManualService.library(token, controller.signal).then(r => { if (scope.current === run) { if (r.success) setLibrary(r.data ?? []); else fail(r.message); } });
    void communityService.library(token, page, 20, controller.signal).then(r => { if (scope.current === run) { if (r.success) setCommunity(r.data); else fail(r.message); } });
    return () => { scope.current = Symbol(); controller.abort(); };
  }, [childId, page, revision]);
  // Tên truyện theo mã: lấy trong hành trình của bé (đang mở, sắp tới, đã đọc) vì API khóa chỉ trả mã truyện.
  const titleOf = (id: number | null) => id == null ? undefined : [roadmap?.open, ...(roadmap?.upcoming ?? []), ...(roadmap?.done ?? [])].find(s => s?.storyId === id)?.title ?? undefined;
  const openManual = async (confirmation: B.ParentFamilyConfirmationDto) => {
    if (busy) return;
    setBusy(true); setPack(null); const run = scope.current;
    const token = childAccessService.readSession()?.accessToken ?? '';
    const r = await childManualService.package(token, confirmation.confirmationId);
    if (scope.current !== run) return;
    setBusy(false);
    if (r.success && r.data && r.data.isReady && r.data.childProfileId === childId && r.data.storyVersionId === confirmation.storyVersionId) setPack(r.data);
    else setErrors(v => [...v,r.message || 'Truyện chưa sẵn sàng hoặc quyền đọc đã thay đổi.']);
  };
  const openCommunity = async (submissionId: number) => {
    if (busy) return;
    setBusy(true); const run = scope.current;
    const r = await communityService.detail(childAccessService.readSession()?.accessToken ?? '', submissionId);
    if (scope.current !== run) return;
    setBusy(false); if (r.success) setSelected(r.data); else setErrors(v => [...v,r.message]);
  };
  return <div className={`kid${reading?' kid-focus':''}`} role="dialog" aria-label="Chế độ của bé">{!reading&&<PondBackdrop />}{!reading&&<div className="ktop"><button className="btn btn-s" onClick={onExit}>Thoát</button><b>{nickname || 'Thư viện của em'}</b><button className="btn btn-s" onClick={() => setRevision(v => v + 1)}>Tải lại</button></div>}
    <div className="kscroll"><div className="khome">
      {ended ? <section className="ksection"><Frog mood="idle" size={90} /><h2 className="display">Phiên đọc đã kết thúc</h2><p>Em nhờ bố mẹ mở lại nhé.</p><button className="btn btn-p" onClick={onExit}>Về với bố mẹ</button></section> : <>
        <ChildReadingLibrary key={childId} childId={childId} community={selected} unlockTitle={titleOf(lock.unlockStoryId)} onLockChange={setLock} onCommunityOpened={() => setSelected(null)} onReadingChange={setReading}/>
        {!reading&&<>
        {errors.map((e,i) => <p className="notice err" role="alert" key={i}>{e}</p>)}
        {pack ? <article className="ksection"><button className="btn btn-s" onClick={() => setPack(null)}>Về thư viện</button><h2 className="display">{pack.title}</h2>{pack.segments.slice().sort((a,b) => a.order - b.order).map((s,i) => <p key={i} style={{ whiteSpace: 'pre-wrap', fontSize: 20, lineHeight: 1.8 }}>{s.text}</p>)}<FamilyMediaPreview preparation={pack}/><p className="sub">Để lưu vị trí và hoàn thành đọc, em mở truyện trong mục Đọc và nghe truyện.</p></article> : <>
          <Shelf title="Hành trình của em" items={[...(roadmap?.open ? [{ id: roadmap.open.storyId }] : []), ...(roadmap?.upcoming ?? []).map(s => ({ id: s.storyId }))]}>
            {roadmap && (roadmap.open || roadmap.upcoming.length > 0) ? <ShelfRow>
              {roadmap.open && <Cover id={roadmap.open.storyId} title={roadmap.open.title ?? 'Truyện chưa đặt tên'} meta={roadmap.open.isLocked ? 'Chưa đọc được lúc này' : roadmap.open.note || 'Bố mẹ đã chọn cho em'} label={roadmap.open.isLocked ? 'Đang khóa' : 'Đang mở'} />}
              {roadmap.upcoming.map(s => <Cover key={`${s.order}:${s.storyId}`} id={s.storyId} title={s.title ?? 'Truyện chưa đặt tên'} meta={s.isLocked ? 'Em đọc xong truyện trước thì mới mở' : 'Sắp tới lượt em'} label={s.isLocked ? 'Chưa mở' : 'Sắp tới'} />)}
            </ShelfRow> : <p>Bố mẹ chưa chọn hành trình cho em.</p>}
            {roadmap && <p>Đã đọc {roadmap.completedCount}/{roadmap.totalCount}{roadmap.isFinished ? ' · Em đã hoàn thành hành trình!' : ''}</p>}
          </Shelf>
          <Shelf title="Truyện gia đình dành cho em" items={library.map(c => ({ id: c.storyId }))}>
            {library.length ? <ShelfRow>{library.map(c => <Cover key={c.confirmationId} id={c.storyId} title={`Truyện gia đình #${c.storyId}`} meta="Bố mẹ giao cho em" disabled={busy} onOpen={() => void openManual(c)} />)}</ShelfRow> : <p>Bố mẹ chưa giao truyện gia đình cho em.</p>}
          </Shelf>
          <Shelf title="Khám phá truyện cộng đồng" items={(community?.items ?? []).map(s => ({ id: s.submissionId }))}>
            {community?.items.length ? <ShelfRow>{community.items.map(s => <Cover key={s.submissionId} id={s.submissionId} title={s.title} meta={lock.locked ? 'Em đọc lại truyện đang mở trước nhé' : s.author} label="Đang khóa" disabled={busy} onOpen={lock.locked ? undefined : () => void openCommunity(s.submissionId)} />)}</ShelfRow> : <p>Chưa có truyện cộng đồng.</p>}
            <div className="row"><button className="btn btn-s" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Trước</button><button className="btn btn-s" disabled={!community?.hasNextPage} onClick={() => setPage(p => p + 1)}>Tiếp</button></div>
          </Shelf>

        </>}
        </>}
      </>}
    </div></div>
  </div>;
}
