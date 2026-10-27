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
        <ChildReadingLibrary key={childId} childId={childId} community={selected} onReadingChange={setReading}/>
        {!reading&&<>
        {errors.map((e,i) => <p className="notice err" role="alert" key={i}>{e}</p>)}
        {pack ? <article className="ksection"><button className="btn btn-s" onClick={() => setPack(null)}>Về thư viện</button><h2 className="display">{pack.title}</h2>{pack.segments.slice().sort((a,b) => a.order - b.order).map((s,i) => <p key={i} style={{ whiteSpace: 'pre-wrap', fontSize: 20, lineHeight: 1.8 }}>{s.text}</p>)}<FamilyMediaPreview preparation={pack}/><p className="sub">Để lưu vị trí và hoàn thành đọc, em mở truyện trong mục Đọc và nghe truyện.</p></article> : <>
          <details className="kid-library-more"><summary>Thư viện và hành trình</summary>
          <section className="ksection"><h2 className="display">Hành trình của em</h2>{roadmap?.open && <div className="kcard"><b>{roadmap.open.title}</b>{roadmap.open.note && <p>{roadmap.open.note}</p>}<p>{roadmap.open.isLocked ? 'Truyện đang khóa' : 'Bố mẹ đã chọn cho em'}</p></div>}<ol>{roadmap?.upcoming.map(s => <li key={`${s.order}:${s.storyId}`}>{s.title} · {s.isLocked ? 'Chưa mở' : 'Đã mở'}</li>)}</ol>{roadmap && <p>Đã đọc {roadmap.completedCount}/{roadmap.totalCount}{roadmap.isFinished ? ' · Em đã hoàn thành hành trình!' : ''}</p>}</section>
          <section className="ksection"><h2 className="display">Truyện gia đình dành cho em</h2>{library.map(c => <button className="btn btn-s" key={c.confirmationId} disabled={busy} onClick={() => void openManual(c)}>Mở truyện gia đình #{c.storyId}</button>)}{!library.length && <p>Bố mẹ chưa giao truyện gia đình cho em.</p>}</section>
          <section className="ksection"><h2 className="display">Khám phá truyện cộng đồng</h2>{community?.items.map(s => <button className="btn btn-s" key={s.submissionId} disabled={busy} onClick={() => void openCommunity(s.submissionId)}>{s.title} · {s.author}</button>)}<div className="row"><button className="btn btn-s" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Trước</button><button className="btn btn-s" disabled={!community?.hasNextPage} onClick={() => setPage(p => p + 1)}>Tiếp</button></div>{selected && <div className="kcard"><h3>{selected.title}</h3><p>{selected.description}</p><p>{selected.author}</p><p className="sub">Em chọn nút Đọc truyện cộng đồng trong mục Đọc và nghe truyện để mở nội dung được cấp quyền.</p></div>}</section>
          </details>
        </>}
        </>}
      </>}
    </div></div>
  </div>;
}
