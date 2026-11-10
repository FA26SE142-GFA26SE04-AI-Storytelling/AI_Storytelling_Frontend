"use client";

import "./kid.css";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { childAccessService } from "@/app/services/childAccessService";
import { childProfileService } from "@/app/services/childProfileService";
import type { ChildProfile } from "@/app/types/childProfile";
import PondBackdrop from "@/app/components/brand/PondBackdrop";
import Frog from "@/app/components/brand/Frog";
import ParentalGate from "./ParentalGate";
import KidApp from "./KidApp";

/**
 * "Cho bé đọc" (Luồng 1 Bước 1.10, Luồng 3 Bước 3.0): mở phiên riêng của bé bằng mã giao máy (handover).
 * Rời chế độ của bé phải qua cổng xác nhận người lớn nếu cài đặt an toàn bật.
 */
export default function KidMode({ child, storyId, onExit }: { child: ChildProfile; /** Có thì mở thẳng truyện này (Luồng 1c). */ storyId?: number | null; onExit: () => void }) {
  const { user } = useAuth();
  const [entry, setEntry] = useState<{ ok: boolean; message?: string } | null>(null);
  const [gateOn, setGateOn] = useState(true);
  const [gateOpen, setGateOpen] = useState(false);

  useEffect(() => {
    if (!child) return;
    let alive = true;
    const session = storyId ? childAccessService.startStoryHandover(child.id, storyId) : childAccessService.startSupervisedSession(child.id);
    void Promise.all([session, childProfileService.getSafetyPolicy(child.id)]).then(([s, p]) => {
      if (!alive) return;
      if (s.success && s.data) childAccessService.saveSession(s.data, "profile_switcher");
      setEntry({ ok: s.success, message: s.message });
      setGateOn(p.data?.parentalGateEnabled ?? true);
    });
    return () => { alive = false; };
  }, [child, storyId]);

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
