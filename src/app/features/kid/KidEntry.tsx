"use client";

import "./kid.css";
import { useEffect, useRef, useState } from "react";
import { childAccessService } from "@/app/services/childAccessService";
import PondBackdrop from "@/app/components/brand/PondBackdrop";
import Frog from "@/app/components/brand/Frog";
import KidApp from "./KidApp";

type State =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; childId: number };

/** Luồng 1 Bước 1.10 / Luồng 3 Bước 3.0 — bé vào bằng mã QR, mở phiên riêng của bé. */
export default function KidEntry({ code, onDone }: { code: string; onDone: () => void }) {
  const [state, setState] = useState<State>({ kind: "loading" });
  const started = useRef(false);

  useEffect(() => {
    // Mã chỉ dùng được một lần: không gọi lại khi React chạy effect hai lần ở chế độ dev.
    if (started.current) return;
    started.current = true;
    void (async () => {
      const login = await childAccessService.loginWithEasyLogin(code);
      if (!login.success || !login.data) { setState({ kind: "error", message: login.message }); return; }
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
              <h2 className="display">Ôi, chưa vào được rồi!</h2>
              <p className="sub" style={{ fontSize: 15 }}>{state.message}</p>
              <button className="btn btn-p" onClick={exit}>Về trang đầu</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
