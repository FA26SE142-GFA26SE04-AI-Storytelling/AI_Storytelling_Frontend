'use client';
import { useEffect, useRef, useState } from 'react';
import { confirmDialog } from '@/app/lib/confirm';
import { authoringGuideManagementService as api } from '@/app/services/authoringGuideManagementService';
import { useGuideManagement } from '@/app/features/story-workflow/useGuideManagement';
import type { GuideDraftPreview, GuideVersionDetail, GuideVersionSummary } from '@/app/types/authoringGuideManagement';
import type { PagedResult } from '@/app/types/backendContracts';
import Dialog from '@/app/components/Dialog';
import Frog from '@/app/components/brand/Frog';
import { FilePlus2, RefreshCw } from 'lucide-react';
import GuideHistorySection from './GuideHistorySection';
import GuideItemEditor from './GuideItemEditor';
import GuidePreviewSection from './GuidePreviewSection';
import { Page } from './ui';

/** Tài liệu 10 — Trang Hướng dẫn sáng tác (catalog mẫu do Moderator quản lý; tách 4 khu vực, chặn mất form khi đang lưu / lỗi 409). */
export default function AuthoringGuideManagement() {
  const h = useGuideManagement();
  const model = h.overview;
  const { setNote } = h;
  const [history, setHistory] = useState<PagedResult<GuideVersionSummary> | null>(null);
  const [page, setPage] = useState(1);
  const [version, setVersion] = useState<GuideVersionDetail | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [preview, setPreview] = useState<GuideDraftPreview | null>(null);
  const [purpose, setPurpose] = useState('');
  const [group, setGroup] = useState('');
  const [previewPage, setPreviewPage] = useState(1);
  const [values, setValues] = useState<Record<string, string>>({});
  const [reading, setReading] = useState(false);
  const [editing, setEditing] = useState(false);
  const versionCtrl = useRef<AbortController | null>(null);
  const item = model?.draft?.items.find(g => g.id === selected);

  useEffect(() => {
    const controller = new AbortController();
    void api.versions(page, controller.signal).then(r => {
      if (!controller.signal.aborted) {
        setHistory(r.data);
        if (!r.success && r.message) setNote(r.message);
      }
    });
    return () => {
      controller.abort();
      versionCtrl.current?.abort();
    };
  }, [page, model?.revisionToken, setNote]);

  const discardEdits = async () => !dirty || await confirmDialog('Bỏ thay đổi hướng dẫn chưa lưu?');

  const load = async () => {
    if (h.busy || reading) return;
    if (!(await discardEdits())) return;
    const ok = await h.load();
    if (ok) {
      setDirty(false);
      setPreview(null);
      setEditing(false);
    }
  };

  const select = async (id: string | null) => {
    if (h.busy || !(await discardEdits())) return;
    setSelected(id);
    setDirty(false);
    setValues({});
    setPreview(null);
    setEditing(true);
  };

  const closeEditor = async () => {
    if (h.busy) return;
    if (await discardEdits()) {
      setDirty(false);
      setEditing(false);
    }
  };

  const openVersion = async (versionId: number) => {
    versionCtrl.current?.abort();
    const controller = new AbortController();
    versionCtrl.current = controller;
    setReading(true);
    const r = await api.version(versionId, controller.signal);
    if (controller.signal.aborted) return;
    setReading(false);
    if (r.success && r.data) setVersion(r.data);
    else if (!r.success) setNote(r.message || 'Không tải được chi tiết phiên bản hướng dẫn.');
  };

  const runPreview = async (render = false) => {
    if (!model || !model.draft || reading || h.busy || h.blocked || dirty) return;
    setReading(true);
    setPreview(null);
    const r = await api.preview({
      revisionToken: model.revisionToken,
      purpose: purpose || null,
      group: group || null,
      pageIndex: previewPage,
      pageSize: 10,
      guideId: render ? item?.id : null,
      values: render ? values : null,
    });
    setReading(false);
    if (r.success) setPreview(r.data);
    else setNote(r.message || 'Xem thử thất bại; các giá trị biến bạn vừa nhập vẫn được giữ.');
  };

  const write = async (call: Parameters<typeof h.write>[0]) => {
    setPreview(null);
    const ok = await h.write(call);
    if (ok) setDirty(false);
    return ok;
  };

  const disabled = h.busy || h.blocked || reading || !model;
  const previewValid = preview?.revisionToken === model?.revisionToken && !!preview && !dirty;

  return (
    <Page title="Hướng dẫn sáng tác cho phụ huynh">
      <p className="sub">
        Catalog hướng dẫn sáng tác mẫu do Moderator quản lý — độc lập với công cụ AI gợi ý theo ngữ cảnh từng bản nháp.
      </p>
      {h.note && (
        <p className={`notice ${h.errorKind ? 'err' : ''}`} role={h.errorKind ? 'alert' : 'status'} data-inline-notice>
          {h.errorKind === 'load' ? 'Lỗi tải dữ liệu: ' : h.errorKind === 'save' ? 'Lỗi lưu thay đổi: ' : ''}
          {h.note}
        </p>
      )}
      {h.blocked && model && (
        <p className="notice warn" role="status" data-inline-notice>
          Dữ liệu vừa thay đổi (409) hoặc chưa rõ kết quả lưu. Hãy bấm Đồng bộ trước khi sửa tiếp; nội dung hiện tại được giữ nguyên.
        </p>
      )}
      <div className="row">
        <button type="button" className="btn btn-s" disabled={h.busy || reading} onClick={() => void load()} title="Tải lại bộ hướng dẫn mới nhất">
          <RefreshCw className="ic" />Đồng bộ
        </button>
      </div>

      {!model && h.blocked && (
        <div className="st-card st-empty">
          <Frog size={110} mood="think" />
          <b className="display">Chưa tải được bộ hướng dẫn</b>
        </div>
      )}

      {model && (
        <>
          <section className="st-card" aria-label="Bản đang phát hành">
            <h3>Đang phát hành (chỉ đọc): {model.published?.version.catalogVersion ?? 'Chưa có'}</h3>
            <p className="sub">{model.locale} · {model.published?.items.length ?? 0} mục hướng dẫn</p>
            {model.published && model.published.items.length > 0 && (
              <div className="st-list">
                {model.published.items.map(g => (
                  <p key={g.id} style={{ margin: 0 }}>
                    <b>{g.title}</b> <span className="sub">· {g.instruction}</span>
                  </p>
                ))}
              </div>
            )}
            {!model.draft && (
              <div className="row">
                <button type="button" className="btn btn-p" disabled={disabled || !model.published} onClick={() => void write(() => api.createDraft(null))} title="Tạo bản nháp từ bản đang dùng">
                  <FilePlus2 className="ic" />Tạo bản nháp
                </button>
              </div>
            )}
          </section>

          {model.draft && (
            <>
              <section className="st-card" aria-label="Bản nháp hướng dẫn">
                <h3>Bản nháp: {model.draft.version.catalogVersion}</h3>
                <div className="row st-wrap">
                  <button type="button" className="btn btn-s" disabled={disabled} onClick={() => void select(null)}>
                    Thêm hướng dẫn
                  </button>
                  <button type="button" className="btn btn-no" disabled={disabled} onClick={async () => { if (await confirmDialog('Hủy toàn bộ bản nháp hướng dẫn?') && await discardEdits()) void write(() => api.discard(model.revisionToken)); }}>
                    Hủy bản nháp
                  </button>
                </div>
                <div className="st-list">
                  {model.draft.items.map(g => (
                    <div key={g.id} className="row">
                      <button type="button" className="btn btn-g grow" disabled={disabled} onClick={() => void select(g.id)}>
                        {g.title}
                      </button>
                      <button type="button" className="btn btn-g" disabled={disabled || dirty} onClick={async () => { if (await confirmDialog(`Xóa hướng dẫn “${g.title}” khỏi bản nháp?`)) void write(() => api.remove(g.id, model.revisionToken)); }}>
                        Xóa khỏi bản nháp
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              {editing && (
                <Dialog title={item ? 'Sửa hướng dẫn' : 'Thêm hướng dẫn'} onClose={() => void closeEditor()} wide>
                  <GuideItemEditor
                    key={`${model.revisionToken}:${selected ?? 'new'}`}
                    item={item}
                    disabled={disabled}
                    onDirty={() => { setDirty(true); setPreview(null); }}
                    onSave={(id, value) => void write(() => api.upsert(id, { ...value, revisionToken: model.revisionToken })).then(ok => { if (ok) setEditing(false); })}
                  />
                </Dialog>
              )}

              <GuidePreviewSection
                purpose={purpose}
                group={group}
                previewPage={previewPage}
                selectedGuide={item}
                values={values}
                preview={preview}
                previewValid={previewValid}
                dirty={dirty}
                disabled={disabled}
                onPurposeChange={v => { setPurpose(v); setPreview(null); setPreviewPage(1); }}
                onGroupChange={v => { setGroup(v); setPreview(null); setPreviewPage(1); }}
                onPreviewPageChange={p => { setPreviewPage(p); setPreview(null); }}
                onValueChange={(k, v) => { setValues(prev => ({ ...prev, [k]: v })); setPreview(null); }}
                onRunPreview={render => void runPreview(render)}
                onPublish={() => { void confirmDialog('Phát hành cả bộ hướng dẫn này cho phụ huynh?').then(ok => { if (ok) void write(() => api.publish(model.revisionToken)); }); }}
              />
            </>
          )}
        </>
      )}

      <GuideHistorySection
        history={history}
        page={page}
        version={version}
        hasDraft={!!model?.draft}
        disabled={disabled}
        onPageChange={setPage}
        onSelectVersion={versionId => void openVersion(versionId)}
        onCreateDraftFrom={versionId => void write(() => api.createDraft(versionId))}
      />
    </Page>
  );
}
