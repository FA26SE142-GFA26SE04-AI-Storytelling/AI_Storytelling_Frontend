"use client";

import { useState } from "react";
import { showToast } from "@/app/lib/toast";
import { eventService } from "@/app/services/eventService";
import { storyService } from "@/app/services/storyService";

export default function EventCuratedStoryPicker({ eventId, onAdded }: { eventId: number; onAdded: () => void }) {
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<{ id: number; title: string }[] | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [busy, setBusy] = useState(false);

  const findStories = async () => {
    setBusy(true);
    try {
      const result = await storyService.getCommunityStories({ searchTerm: search.trim(), pageIndex: 1, pageSize: 20 });
      setSelectedId("");
      setItems(result.data?.items ?? null);
      if (!result.success) showToast(result.message || "Không tải được truyện đã xuất bản.", "err");
    } finally {
      setBusy(false);
    }
  };

  const addStory = async () => {
    if (!selectedId) return;
    setBusy(true);
    try {
      const result = await eventService.seedStories(eventId, [Number(selectedId)]);
      if (!result.success) {
        showToast(result.message || "Không bổ sung được truyện.", "err");
        return;
      }
      showToast(result.data ? "Đã bổ sung truyện vào sự kiện." : "Không có truyện mới được thêm.", "ok");
      setSelectedId("");
      onAdded();
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="ev-card sec">
      <h3 className="display">Bổ sung truyện cho nhiệm vụ đọc</h3>
      <form className="row" onSubmit={(e) => { e.preventDefault(); void findStories(); }}>
        <input className="inp grow" aria-label="Tìm truyện đã xuất bản" placeholder="Nhập tên truyện" value={search}
          disabled={busy} onChange={(e) => setSearch(e.target.value)} />
        <button className="btn btn-s" disabled={busy}>Tìm truyện</button>
      </form>
      {items?.length === 0 && <p className="sub">Không tìm thấy truyện phù hợp.</p>}
      {!!items?.length && (
        <div className="row">
          <select className="inp grow" aria-label="Chọn truyện bổ sung" disabled={busy} value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}>
            <option value="">Chọn truyện</option>
            {items.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
          </select>
          <button type="button" className="btn btn-p" disabled={busy || !selectedId} onClick={() => void addStory()}>
            Thêm truyện
          </button>
        </div>
      )}
    </section>
  );
}
