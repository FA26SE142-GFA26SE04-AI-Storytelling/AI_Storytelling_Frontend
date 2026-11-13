"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Lock } from "lucide-react";
import Dialog from "@/app/components/Dialog";
import { confirmDialog } from "@/app/lib/confirm";
import { showToast } from "@/app/lib/toast";
import { childProfileService } from "@/app/services/childProfileService";
import type { ReadingSlotsDto } from "@/app/types/readingSlots";

export type ReadingSlotsDialogProps = {
  slots: ReadingSlotsDto;
  onClose: () => void;
  onSaved: () => void;
};

/** Định dạng thời gian theo múi giờ Việt Nam. */
function formatVietnamTime(iso: string): string {
  return new Date(iso).toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Popup chọn bé được đọc truyện khi gói giới hạn N bé (F-03). */
export default function ReadingSlotsDialog({ slots, onClose, onSaved }: ReadingSlotsDialogProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>(() =>
    slots.profiles.filter((p) => p.isSelected).map((p) => p.childProfileId)
  );
  const [saving, setSaving] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const isLocked = Boolean(
    slots.nextChangeAllowedAt && new Date(slots.nextChangeAllowedAt).getTime() > Date.now()
  );

  const initialIds = useMemo(
    () => new Set(slots.profiles.filter((p) => p.isSelected).map((p) => p.childProfileId)),
    [slots.profiles]
  );

  const isDirty = useMemo(() => {
    if (selectedIds.length !== initialIds.size) return true;
    return selectedIds.some((id) => !initialIds.has(id));
  }, [selectedIds, initialIds]);

  const toggleProfile = (id: number) => {
    if (isLocked || saving) return;
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= slots.slots) {
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleSave = async () => {
    const ok = await confirmDialog(
      "Đổi bé được đọc? Bé không được chọn sẽ chỉ xem và bị đăng xuất. Mỗi tuần chỉ đổi được 1 lần."
    );
    if (!ok) return;

    setSaving(true);
    try {
      const r = await childProfileService.selectReadingSlots(selectedIds);
      if (!isMountedRef.current) return;

      if (r.success) {
        showToast("Đã lưu danh sách bé được đọc.", "ok");
        onSaved();
      } else {
        showToast(r.message || "Không lưu được danh sách bé được đọc.", "err");
        setSaving(false);
      }
    } catch {
      if (isMountedRef.current) {
        showToast("Không lưu được danh sách bé được đọc.", "err");
        setSaving(false);
      }
    }
  };

  const title = `Chọn bé được đọc (đã chọn ${selectedIds.length}/${slots.slots})`;

  return (
    <Dialog title={title} onClose={onClose}>
      <div className="sec" style={{ gap: 16 }}>
        {isLocked && slots.nextChangeAllowedAt && (
          <div className="notice warn" role="status" data-inline-notice>
            <Lock className="ic" /> Có thể đổi lại từ {formatVietnamTime(slots.nextChangeAllowedAt)}
          </div>
        )}

        <div className="reading-slot-list sec" style={{ gap: 8 }}>
          {slots.profiles.map((p) => {
            const checked = selectedIds.includes(p.childProfileId);
            const disabled = isLocked || (!checked && selectedIds.length >= slots.slots) || saving;

            return (
              <label
                key={p.childProfileId}
                className="reading-slot-item row"
                style={{
                  gap: 10,
                  cursor: disabled ? "not-allowed" : "pointer",
                  alignItems: "center",
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => toggleProfile(p.childProfileId)}
                />
                <span>{p.nickname}</span>
              </label>
            );
          })}
        </div>

        <div className="row" style={{ justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
          <button type="button" className="btn btn-g" disabled={saving} onClick={onClose}>
            Đóng
          </button>
          {isDirty && (
            <button
              type="button"
              className="btn btn-p"
              disabled={saving || selectedIds.length === 0}
              onClick={() => void handleSave()}
            >
              {saving ? "Đang lưu..." : "Lưu"}
            </button>
          )}
        </div>
      </div>
    </Dialog>
  );
}
