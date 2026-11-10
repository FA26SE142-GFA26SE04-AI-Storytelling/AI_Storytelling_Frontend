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
import PaneSwap from './PaneSwap';
import KidToday from './KidToday';
import { Shelf, ShelfRow } from '@/app/features/library/LibraryWorkspace';
import { coverFor } from '@/app/lib/storyView';
import { BookOpen, Home, Lock, LogOut, Moon, RefreshCw, Sun } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';
import { circleReveal, usePop } from '@/app/lib/motion';

/** Bìa sách trên kệ của bé: tên truyện in trên bìa. */
function Cover({ coverUrl, title, meta, disabled, onOpen, label }: { id: number; coverUrl?: string | null; title: string; meta?: string; disabled?: boolean; onOpen?: () => void; label?: string }) {
  const canRead = !!onOpen;
  return <button className={`bk${canRead ? ' can-read' : ' cannot-read'}`} disabled={disabled || !canRead} aria-label={canRead ? `Đọc truyện ${title}` : `${title}: ${label ?? 'chưa mở'}`} onClick={onOpen}><span className="bk-cover" style={{ background: coverFor(coverUrl) }}>{canRead ? <span className="pill ok bk-badge"><BookOpen className="ic" aria-hidden />Đọc được</span> : <span className="pill draft bk-badge"><Lock className="ic" aria-hidden />{label ?? 'Chưa mở'}</span>}<span className="bk-name display">{title}</span></span>{meta && <span className="bk-meta">{meta}</span>}</button>;
}
export default function ConnectedKidHome({ childId, onExit, openStoryId }: { childId: number; onExit: () => void; openStoryId?: number | null }) {
  const ended = useKidSession();
  const { theme, toggleTheme } = useTheme();
  const endedRef = usePop<HTMLElement>(ended, 0.9);
  const [roadmap, setRoadmap] = useState<B.MyRoadmapDto | null>(null);
  const [library, setLibrary] = useState<B.ParentFamilyConfirmationDto[]>([]);
  const [community, setCommunity] = useState<B.PagedResult<B.CommunityStoryDto> | null>(null);
  const [page, setPage] = useState(1);
  const [pack, setPack] = useState<B.ParentPreparationDto | null>(null);
  const [selected, setSelected] = useState<B.CommunityStoryDto | null>(null);
  /** Truyện bé vừa bấm trong "Hành trình của em"; ChildReadingLibrary mở đọc rồi xoá giá trị này. */
  const [startStory, setStartStory] = useState<{ storyId: number } | null>(() => (openStoryId ? { storyId: openStoryId } : null));
  const [errors, setErrors] = useState<string[]>([]);
  const [nickname, setNickname] = useState('');
  const [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState(false);
  const [reading,setReading]=useState(false);
  const [pane, setPane] = useState('stories');
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
  return <div className={`kid${reading?' kid-focus':''}`} role="dialog" aria-label="Chế độ của bé">{!reading&&<PondBackdrop />}{!reading&&<div className="ktop"><button className="btn btn-s" onClick={onExit}><LogOut className="ic" aria-hidden />Thoát</button><b>{nickname || 'Thư viện của em'}</b><button className="btn btn-s icon-only" onClick={() => setRevision(v => v + 1)} aria-label="Tải lại" title="Tải lại"><RefreshCw className="ic" aria-hidden /></button><button className="btn btn-s kid-theme-btn" onClick={e => { const r = e.currentTarget.getBoundingClientRect(); circleReveal(r.left + r.width / 2, r.top + r.height / 2, toggleTheme); }} aria-label={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'} title={theme === 'dark' ? 'Giao diện sáng' : 'Giao diện tối'}>{theme === 'dark' ? <Sun className="ic" aria-hidden /> : <Moon className="ic" aria-hidden />}</button></div>}
    <div className="kscroll"><div className="khome">
      {ended ? <section ref={endedRef} className="ksection kid-ended" role="status"><Frog mood="idle" size={150} /><h2 className="display">Phiên đọc đã kết thúc</h2><p>Em nhờ bố mẹ mở lại nhé.</p><button className="btn btn-p" onClick={onExit}><Home className="ic" aria-hidden />Về với bố mẹ</button></section> : <>
        <ChildReadingLibrary key={childId} childId={childId} community={selected} story={startStory} onStoryOpened={() => setStartStory(null)} unlockTitle={titleOf(lock.unlockStoryId)} onLockChange={setLock} onPaneChange={setPane} onCommunityOpened={() => setSelected(null)} onReadingChange={setReading} hero={<KidToday roadmap={roadmap} nickname={nickname} busy={busy} onRead={(storyId) => setStartStory({ storyId })} />}/>
        {!reading&&<>
        {errors.map((e,i) => <p className="notice err" role="alert" key={i}>{e}</p>)}
        {pack ? <article className="ksection"><button className="btn btn-s" onClick={() => setPack(null)}>Về thư viện</button><h2 className="display">{pack.title}</h2>{pack.segments.slice().sort((a,b) => a.order - b.order).map((s,i) => <p key={i} style={{ whiteSpace: 'pre-wrap', fontSize: "var(--fs-xl)", lineHeight: 1.8 }}>{s.text}</p>)}<FamilyMediaPreview preparation={pack}/><p className="sub">Để lưu vị trí và hoàn thành đọc, em mở truyện trong mục Đọc và nghe truyện.</p></article> : pane === 'stories' ? <PaneSwap gap={18} dir={-1}>
          <Shelf title="Truyện gia đình dành cho em" items={library.map(c => ({ id: c.storyId }))}>
            {library.length ? <ShelfRow>{library.map(c => <Cover key={c.confirmationId} id={c.storyId} title={`Truyện gia đình #${c.storyId}`} meta="Bố mẹ giao cho em" disabled={busy} onOpen={() => void openManual(c)} />)}</ShelfRow> : <p>Bố mẹ chưa giao truyện gia đình cho em.</p>}
          </Shelf>
          <Shelf title="Khám phá truyện cộng đồng" items={(community?.items ?? []).map(s => ({ id: s.submissionId }))}>
            {community?.items.length ? <ShelfRow>{community.items.map(s => <Cover key={s.submissionId} id={s.submissionId} title={s.title} meta={lock.locked ? 'Em đọc lại truyện đang mở trước nhé' : s.author} label="Đang khóa" disabled={busy} onOpen={lock.locked ? undefined : () => void openCommunity(s.submissionId)} />)}</ShelfRow> : <p>Chưa có truyện cộng đồng.</p>}
            {(page > 1 || community?.hasNextPage) && <div className="row"><button className="btn btn-s" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Trước</button><button className="btn btn-s" disabled={!community?.hasNextPage} onClick={() => setPage(p => p + 1)}>Tiếp</button></div>}
          </Shelf>

        </PaneSwap> : null}
        </>}
      </>}
    </div></div>
  </div>;
}
