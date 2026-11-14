"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { confirmDialog } from "@/app/lib/confirm";
import { childProfileService } from "@/app/services/childProfileService";
import type { ReadingSlotsDto } from "@/app/types/backendContracts";

function initialIds(d: ReadingSlotsDto): number[] {
  const anySelected = d.profiles.some((p) => p.isSelected);
  return d.profiles.filter((p) => (anySelected ? p.isSelected : p.canRead)).map((p) => p.childProfileId);
}

/** Thẻ chọn hồ sơ được đọc khi số hồ sơ vượt mức của gói. Tự tải dữ liệu; không hiện khi chưa vượt giới hạn. */
export default function ReadingSlotsCard({ onChanged, onLoaded }: { onChanged?: () => void; onLoaded?: (data: ReadingSlotsDto) => void }) {
  const [data, setData] = useState<ReadingSlotsDto | null>(null);
  const [picked, setPicked] = useState<number[]>([]);
  const [base, setBase] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const loadedRef = useRef(onLoaded);
  useEffect(() => { loadedRef.current = onLoaded; });

  const apply = (d: ReadingSlotsDto) => {
    const ids = initialIds(d);
    setData(d); setPicked(ids); setBase(ids);
    loadedRef.current?.(d);
  };

  useEffect(() => {
    const c = new AbortController();
    let alive = true;
    void childProfileService.getReadingSlots(c.signal).then((r) => {
      if (!alive) return;
      if (r.success && r.data) apply(r.data);
      else if (r.message) setNote(r.message);
    });
    return () => { alive = false; c.abort(); };
  }, []);

  const changed = useMemo(() => picked.length !== base.length || picked.some((id) => !base.includes(id)), [picked, base]);

  if (!data || !data.isOverLimit) return null;
  const locked = data.nextChangeAllowedAt !== null && new Date(data.nextChangeAllowedAt).getTime() > Date.now();
  const full = picked.length >= data.slots;

  const toggle = (id: number) => {
    setPicked((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : cur.length >= data.slots ? cur : [...cur, id]));
  };

  const save = async () => {
    if (busy || !changed || locked || picked.length < 1) return;
    if (!await confirmDialog("Mỗi tuần chỉ đổi được một lần. Bé ở hồ sơ chuyển sang chỉ xem sẽ bị đăng xuất. Lưu lựa chọn này?")) return;
    setBusy(true); setNote("");
    const r = await childProfileService.selectReadingSlots(picked);
    setBusy(false);
    if (r.success && r.data) { apply(r.data); onChanged?.(); return; }
    setNote(r.message);
  };

  return (
    <section className="sec reading-slots" style={{ gap: 8 }}>
      <h4 className="display" style={{ margin: 0 }}>Hồ sơ được đọc</h4>
      <p className="sub" style={{ margin: 0 }}>Gói hiện tại cho {data.slots} hồ sơ vào đọc. Các hồ sơ khác chỉ xem được, không bị xoá.</p>
      <div className="reading-slots-list">
        {data.profiles.map((p) => {
          const on = picked.includes(p.childProfileId);
          return (
            <label key={p.childProfileId} className="reading-slots-item">
              <input type="checkbox" checked={on} disabled={locked || busy || (!on && full)} onChange={() => toggle(p.childProfileId)} />
              <span>{p.nickname}</span>
            </label>
          );
        })}
      </div>
      {locked && <p className="sub" style={{ margin: 0 }}>Bạn đổi lại được từ {new Date(data.nextChangeAllowedAt as string).toLocaleString("vi-VN")}.</p>}
      {note && <p className="notice warn" role="status">{note}</p>}
      {changed && !locked && picked.length >= 1 && (
        <div className="row"><button className="btn btn-p" disabled={busy} onClick={() => void save()}>Lưu lựa chọn</button></div>
      )}
    </section>
  );
}
