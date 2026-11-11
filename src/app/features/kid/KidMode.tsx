"use client";

import "./kid.css";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { childAccessService } from "@/app/services/childAccessService";
import { childProfileService } from "@/app/services/childProfileService";
import type { ChildProfile } from "@/app/types/childProfile";
import PondBackdrop from "@/app/components/brand/PondBackdrop";
import Frog from "@/app/components/brand/Frog";
import ParentalGate from "./ParentalGate";
import KidApp from "./KidApp";

/** Xin phiên của bé (giao máy / giám sát / dùng lại phiên đã lưu) và cài đặt an toàn cùng lúc. */
function enterKid(child: ChildProfile, storyId: number | null | undefined, resume: boolean) {
  const stored = childAccessService.readSession();
  const reuse = resume && !storyId && stored?.childProfileId === child.id;
  const session = reuse ? Promise.resolve(null)
    : storyId ? childAccessService.startStoryHandover(child.id, storyId) : childAccessService.startSupervisedSession(child.id);
  return Promise.all([session, childProfileService.getSafetyPolicy(child.id)]);
}

/**
 * "Cho bé đọc" (Luồng 1 Bước 1.10, Luồng 3 Bước 3.0): mở phiên riêng của bé bằng mã giao máy (handover).
 * Rời chế độ của bé phải qua cổng xác nhận người lớn nếu cài đặt an toàn bật.
 */
export default function KidMode({ child, storyId, resume = false, onExit }: { child: ChildProfile; /** Có thì mở thẳng truyện này (Luồng 1c). */ storyId?: number | null;
  /** Vào lại sau khi tải trang: dùng tiếp phiên của bé đã lưu thay vì xin phiên mới. */ resume?: boolean; onExit: () => void }) {
  const { user } = useAuth();
  const [entry, setEntry] = useState<{ ok: boolean; message?: string } | null>(null);
  const [gateOn, setGateOn] = useState(true);
  const [gateOpen, setGateOpen] = useState(false);

  // Giữ yêu cầu đang chạy theo (bé, truyện): React (dev) chạy effect hai lần lúc mở, không giữ thì gửi giao máy hai lần, tạo hai phiên.
  const request = useRef<{ key: string; result: ReturnType<typeof enterKid> } | null>(null);

  useEffect(() => {
    if (!child) return;
    let alive = true;
    const key = `${child.id}:${storyId ?? ""}:${resume}`;
    if (request.current?.key !== key) request.current = { key, result: enterKid(child, storyId, resume) };
    void request.current.result.then(([s, p]) => {
      if (!alive) return;
      if (s?.success && s.data) childAccessService.saveSession(s.data, "profile_switcher");
      setEntry(s ? { ok: s.success, message: s.message } : { ok: true });
      setGateOn(p.data?.parentalGateEnabled ?? true);
    });
    return () => { alive = false; };
  }, [child, storyId, resume]);

  const leave = () => { childAccessService.clearSession(); onExit(); };
  const requestExit = () => (gateOn ? setGateOpen(true) : leave());

  if (!child || !entry) {
    return <div className="kid" role="dialog" aria-modal="true" aria-label="Chế độ của bé"><PondBackdrop /><div className="kpane"><div className="kcard"><h2 className="display">Đang mở…</h2></div></div></div>;
  }

  if (!entry.ok) {
    return (
      <div className="kid" role="dialog" aria-modal="true" aria-label="Chế độ của bé">
        <PondBackdrop />
        <div className="kpane">
          <div className="kcard" style={{ alignItems: "center", textAlign: "center" }}>
            <Frog size={120} mood="think" />
            <h2 className="display">{child.nickname} chưa vào đọc được lúc này</h2>
            <p className="sub" style={{ fontSize: "var(--fs-md)" }}>{child.status === "Active" ? entry.message : "Hồ sơ của bé chưa được kích hoạt. Hãy hoàn tất hồ sơ ở mục Hồ sơ bé."}</p>
            <button className="btn btn-p" onClick={leave}><ArrowLeft className="ic" />Về khu người lớn</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <KidApp childId={child.id} onExit={requestExit} openStoryId={storyId} />
      {gateOpen && <ParentalGate email={user?.email ?? ""} onPass={leave} onCancel={() => setGateOpen(false)} />}
    </>
  );
}
