'use client';
import { confirmDialog } from "@/app/lib/confirm";
import { useEffect, useState } from 'react';
import { authoringGuideManagementService as api } from '@/app/services/authoringGuideManagementService';
import { useGuideManagement } from '@/app/features/story-workflow/useGuideManagement';
import type { GuideDraftPreview, GuideVersionDetail, GuideVersionSummary } from '@/app/types/authoringGuideManagement';
import type { PagedResult } from '@/app/types/backendContracts';
import GuideItemEditor, { GUIDE_GROUPS, GUIDE_PURPOSES } from './GuideItemEditor';
import { Page } from './ui';

export default function AuthoringGuideManagement() {
  const h = useGuideManagement(); const model = h.overview;
  const { setNote } = h;
  const [history, setHistory] = useState<PagedResult<GuideVersionSummary> | null>(null);
  const [page, setPage] = useState(1);
  const [version, setVersion] = useState<GuideVersionDetail | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [preview, setPreview] = useState<GuideDraftPreview | null>(null);
  const [purpose, setPurpose] = useState(''); const [group, setGroup] = useState('');
  const [previewPage, setPreviewPage] = useState(1);
  const [values, setValues] = useState<Record<string,string>>({});
  const [reading, setReading] = useState(false);
  const item = model?.draft?.items.find(g => g.id === selected);
  useEffect(() => {
    const controller = new AbortController();
    void api.versions(page, controller.signal).then(r => { if (!controller.signal.aborted) { setHistory(r.data); if (!r.success) setNote(r.message); } });
    return () => controller.abort();
  }, [page, model?.revisionToken, setNote]);
  const discardEdits = async () => !dirty || await confirmDialog('Bỏ thay đổi hướng dẫn chưa lưu?');
  const load = async () => { if (!(await discardEdits())) return; setDirty(false); setPreview(null); await h.load(); };
  const select = async (id:string | null) => { if (await discardEdits()) { setSelected(id); setDirty(false); setValues({}); setPreview(null); } };
  const runPreview = async (render = false) => {
    if (!model || !model.draft || reading || h.busy || h.blocked || dirty) return;
    setReading(true); setPreview(null);
    const r = await api.preview({revisionToken:model.revisionToken, purpose:purpose || null, group:group || null, pageIndex:previewPage, pageSize:10, guideId:render ? item?.id : null, values:render ? values : null});
    setReading(false); if (r.success) setPreview(r.data); else h.setNote(r.message);
  };
  const write = async (call:Parameters<typeof h.write>[0]) => { setPreview(null); if (await h.write(call)) setDirty(false); };
  const disabled = h.busy || h.blocked || reading || !model;
  const previewValid = preview?.revisionToken === model?.revisionToken && !!preview && !dirty;
  return <Page title="Hướng dẫn sáng tác cho phụ huynh">
    <p className="sub">Sửa bản nháp, xem trước như phụ huynh rồi phát hành cả bộ. Bản đang dùng chỉ đổi sau khi phát hành thành công.</p>
    {h.note && <p className="notice" role="status">{h.note}</p>}
    {h.blocked && <p className="notice warn">Dữ liệu đã đổi hoặc chưa rõ kết quả thao tác. Đồng bộ trước khi sửa tiếp; nội dung đang soạn vẫn được giữ.</p>}
    <button className="btn btn-s" disabled={h.busy || reading} onClick={() => void load()}>Đồng bộ bộ hướng dẫn</button>
    {model && <><div className="st-card"><h3>Bản đang phát hành: {model.published?.version.catalogVersion ?? 'Chưa có'}</h3><p>{model.locale} · {model.published?.items.length ?? 0} hướng dẫn</p>
      {!model.draft && <button className="btn btn-p" disabled={disabled || !model.published} onClick={() => void write(() => api.createDraft(null))}>Tạo bản nháp từ bản đang dùng</button>}
    </div>
    {model.draft && <><div className="st-card"><h3>Bản nháp: {model.draft.version.catalogVersion}</h3>
      <div className="row"><button className="btn btn-s" disabled={disabled} onClick={() => select(null)}>Thêm hướng dẫn</button>
        <button className="btn btn-no" disabled={disabled} onClick={async () => { if (await confirmDialog('Hủy toàn bộ bản nháp hướng dẫn?') && await discardEdits()) void write(() => api.discard(model.revisionToken)); }}>Hủy bản nháp</button></div>
      <div className="st-list">{model.draft.items.map(g => <div key={g.id} className="row"><button className="btn btn-g grow" disabled={disabled} onClick={() => select(g.id)}>{g.title}</button>
        <button className="btn btn-g" disabled={disabled || dirty} onClick={async () => { if (await confirmDialog(`Xóa hướng dẫn “${g.title}” khỏi bản nháp?`)) void write(() => api.remove(g.id,model.revisionToken)); }}>Xóa khỏi bản nháp</button></div>)}</div>
    </div>
      <GuideItemEditor key={`${model.revisionToken}:${selected ?? 'new'}`} item={item} disabled={disabled} onDirty={() => { setDirty(true); setPreview(null); }} onSave={(id,value) => void write(() => api.upsert(id,{...value,revisionToken:model.revisionToken}))}/>
      <section className="st-card"><h3>Xem trước bản nháp</h3><fieldset disabled={disabled || dirty} style={{border:0,padding:0}}><div className="row">
        <select className="inp" aria-label="Lọc mục đích" value={purpose} onChange={e => { setPurpose(e.target.value); setPreview(null); setPreviewPage(1); }}><option value="">Mọi mục đích</option>{Object.entries(GUIDE_PURPOSES).map(([id,label]) => <option key={id} value={id}>{label}</option>)}</select>
        <select className="inp" aria-label="Lọc nhóm" value={group} onChange={e => { setGroup(e.target.value); setPreview(null); setPreviewPage(1); }}><option value="">Mọi nhóm</option>{Object.entries(GUIDE_GROUPS).map(([id,label]) => <option key={id} value={id}>{label}</option>)}</select>
        <input className="inp" aria-label="Trang xem trước" type="number" min={1} value={previewPage} onChange={e => { setPreviewPage(Math.max(1,Number(e.target.value))); setPreview(null); }}/>
        <button className="btn btn-s" onClick={() => void runPreview()}>Xem trước danh sách</button></div>
        {item && <><h4>Điền thử: {item.title}</h4>{item.placeholderDefinitions.map(key => <label className="field" key={key}>{key}<input className="inp" value={values[key] ?? ''} onChange={e => { setValues(v => ({...v,[key]:e.target.value})); setPreview(null); }}/></label>)}<button className="btn btn-s" onClick={() => void runPreview(true)}>Xem trước hướng dẫn đã điền</button></>}
      </fieldset>
      {previewValid && <>{preview.page?.items.map(g => <article key={g.id}><h4>{g.title}</h4><p>{g.instruction}</p><p>{g.example}</p></article>)}{preview.render && <p style={{whiteSpace:'pre-wrap'}}>{preview.render.text}</p>}</>}
      <button className="btn btn-ok" disabled={disabled || !previewValid} onClick={async () => { if (await confirmDialog('Phát hành cả bộ hướng dẫn này cho phụ huynh?')) void write(() => api.publish(model.revisionToken)); }}>Phát hành bộ đã xem trước</button></section>
    </>}
    </>}
    <section className="st-card"><h3>Lịch sử bộ hướng dẫn</h3>{history?.items.map(v => <button className="btn btn-s" key={v.versionId} disabled={disabled} onClick={() => { setReading(true); void api.version(v.versionId).then(r => { setReading(false); if (r.success) setVersion(r.data); else h.setNote(r.message); }); }}>{v.catalogVersion} · {v.status}</button>)}
      <div className="row"><button className="btn btn-s" disabled={page === 1 || disabled} onClick={() => setPage(p => p - 1)}>Trước</button><button className="btn btn-s" disabled={!history?.hasNextPage || disabled} onClick={() => setPage(p => p + 1)}>Tiếp</button></div>
      {version && <article><h4>{version.version.catalogVersion}</h4>{version.items.map(g => <p key={g.id}><b>{g.title}</b> · {g.instruction}</p>)}{!model?.draft && version.version.status === 'Published' && <button className="btn btn-s" disabled={disabled} onClick={() => void write(() => api.createDraft(version.version.versionId))}>Tạo bản nháp từ phiên bản này</button>}</article>}
    </section>
  </Page>;
}
