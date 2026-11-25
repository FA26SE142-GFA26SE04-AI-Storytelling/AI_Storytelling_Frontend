"use client";

import "@/app/styles/features/kid/kid.css";
import { useEffect, useRef, useState } from "react";
import { childAccessService } from "@/app/services/childAccessService";
import PondBackdrop from "@/app/components/brand/PondBackdrop";
import Frog from "@/app/components/brand/Frog";
import KidApp from "./KidApp";
import { blockedStateOf } from "@/app/lib/readingTime";

type State =
  | { kind: "loading" }
  | { kind: "error"; message: string; timeBlocked?: boolean }
  | { kind: "ready"; childId: number };

/** Luồng 1 Bước 1.10 / Luồng 3 Bước 3.0 — bé vào bằng mã QR, mở phiên riêng của bé. */
export default function KidEntry({ code, onDone }: { code: string; onDone: () => void }) {
  const [state, setState] = useState<State>({ kind: "loading" });
  const started = useRef(false);

  useEffect(() => {
    // Không gọi lại khi React chạy effect hai lần ở chế độ dev (mỗi lần đăng nhập mở một phiên mới của bé).
    if (started.current) return;
    started.current = true;
    void (async () => {
      const login = await childAccessService.loginWithEasyLogin(code);
      // Bố mẹ đặt giờ đọc: ngoài khung, giờ ngủ, hết phút màn hình hay đang nghỉ mắt thì backend trả 403 kèm mã READING_TIME_*.
      if (!login.success || !login.data) { setState({ kind: "error", message: login.message, timeBlocked: blockedStateOf(login.errors) !== null }); return; }
      const session = childAccessService.saveSession(login.data, "easy_login");
      const me = await childAccessService.getSessionProfile(session.accessToken);
      setState(me.success && me.data
        ? { kind: "ready", childId: me.data.childProfileId }
        : { kind: "error", message: me.message });
    })();
  }, [code]);

  // Bé tự thoát không cần cổng người lớn (Luồng 3 Bước 3.0b).
  const exit = () => { childAccessService.clearSession(); onDone(); };

  if (state.kind === "ready") return <KidApp childId={state.childId} onExit={exit} />;

  return (
    <div className="kid" role="main" aria-label="Chế độ của bé">
      <PondBackdrop />
      <div className="kpane">
        <div className="kcard" style={{ alignItems: "center", textAlign: "center" }}>
          {state.kind === "loading" && <><Frog size={120} mood="think" /><h2 className="display">Đang mở cửa vào đầm sen…</h2></>}
          {state.kind === "error" && (
            <>
              <Frog size={120} mood="think" />
              <h2 className="display">{state.timeBlocked ? "Bây giờ chưa đọc được nhé" : "Ôi, chưa vào được rồi!"}</h2>
              <p className="sub" style={{ fontSize: "var(--fs-md)" }}>{state.message}</p>
              <button className="btn btn-p" onClick={exit}>Về trang đầu</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
