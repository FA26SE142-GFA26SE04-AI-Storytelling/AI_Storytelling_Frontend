"use client";

import "./kid.css";
import "./kidapp.css";
import { useCallback, useEffect, useState } from "react";
import { Flame, LogOut, Star } from "lucide-react";
import { readingService } from "@/app/services/readingService";
import type { CompleteResult, KidHome as Home, LibraryStory, OpenedFrom, ReadingPackage } from "@/app/types/reading";
import PondBackdrop from "@/app/components/brand/PondBackdrop";
import Frog from "@/app/components/brand/Frog";
import KidHome from "./KidHome";
import KidReader from "./KidReader";
import KidAfter from "./KidAfter";
import KidWish from "./KidWish";
import KidNotebook from "./KidNotebook";
import { useKidSession } from "./useKidSession";

type Screen =
  | { kind: "home" }
  | { kind: "notebook" }
  | { kind: "wish" }
  | { kind: "read"; story: LibraryStory; from: OpenedFrom; retake: boolean }
  | { kind: "after"; sessionId: number; pack: ReadingPackage; retake: boolean; completed: CompleteResult | null }
  | { kind: "stopped" };

/**
 * Luồng 3 — toàn bộ trải nghiệm của bé trong một Child Session.
 * `onExit`: nút Thoát (không cần cổng người lớn với phiên QR; phiên ProfileSwitcher thì nơi gọi tự hỏi cổng).
 */
export default function KidApp({ childId, onExit }: { childId: number; onExit: () => void }) {
  const [home, setHome] = useState<Home | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>({ kind: "home" });
  // Luồng 1 Bước 1.10 — phiên tự hết hạn sau 20 phút không hoạt động hoặc khi bố mẹ thu hồi quyền vào.
  const sessionEnd = useKidSession();

  const load = useCallback(async () => {
    const r = await readingService.getHome(childId);
    if (r.success && r.data) { setHome(r.data); setErr(null); } else setErr(r.message || "Chưa mở được thư viện của em.");
  }, [childId]);
  useEffect(() => { void load(); }, [load]);

  const toHome = () => { setScreen({ kind: "home" }); void load(); };
  const open = (story: LibraryStory, from: OpenedFrom, retake = false) => setScreen({ kind: "read", story, from, retake });

  const finished = async (sessionId: number, pack: ReadingPackage, retake: boolean) => {
    const r = await readingService.complete(childId, sessionId);
    readingService.log(sessionId, "session_completed");
    for (const b of r.data?.newBadges ?? []) readingService.log(sessionId, "badge_unlocked", { badgeCode: b });
    setScreen({ kind: "after", sessionId, pack, retake, completed: r.data });
  };

  const reading = screen.kind === "read";

  if (sessionEnd) {
    return (
      <div className="kid" role="dialog" aria-label="Chế độ của bé">
        <PondBackdrop />
        <div className="kpane"><div className="kcard" style={{ alignItems: "center", textAlign: "center" }}>
          <Frog size={120} mood="idle" />
          <h2 className="display">{sessionEnd === "idle" ? "Em nghỉ lâu quá rồi!" : "Hết giờ đọc rồi!"}</h2>
          <p className="sub" style={{ fontSize: 15 }}>
            {sessionEnd === "idle" ? "Ếch con đã cất sách giúp em. " : ""}Em nhờ bố mẹ mở lại để đọc tiếp nhé. Trang em đang đọc dở đã được lưu.
          </p>
          <button className="btn btn-p" onClick={onExit}>Về với bố mẹ</button>
        </div></div>
      </div>
    );
  }

  return (
    <div className="kid" role="dialog" aria-label="Chế độ của bé">
      <PondBackdrop />
      {!reading && (
        <div className="ktop">
          <button className="btn btn-s" onClick={onExit}><LogOut className="ic" />Thoát</button>
          <div className="ktabs" role="tablist">
            <button role="tab" aria-selected={screen.kind !== "notebook"} className={screen.kind !== "notebook" ? "on" : ""} onClick={toHome}>Truyện</button>
            <button role="tab" aria-selected={screen.kind === "notebook"} className={screen.kind === "notebook" ? "on" : ""} onClick={() => setScreen({ kind: "notebook" })}>Sổ tay & Cây</button>
          </div>
          {home && <>
            <span className="kstat">{home.nickname}</span>
            <span className="kstat" title="Sao tích luỹ"><Star className="ic" style={{ color: "var(--warn-ink)", fill: "var(--gold)" }} />{home.achievements.expTotal}</span>
            <span className="kstat" title="Chuỗi ngày đọc"><Flame className="ic" style={{ color: "var(--gold-deep)" }} />{home.achievements.streakDays}</span>
          </>}
        </div>
      )}

      {err && (
        <div className="kpane"><div className="kcard" style={{ alignItems: "center", textAlign: "center" }}>
          <Frog size={110} mood="think" /><h2 className="display">Ôi, chưa mở được thư viện</h2><p className="sub" style={{ fontSize: 15 }}>{err}</p>
          <button className="btn btn-p" onClick={() => void load()}>Thử lại</button>
        </div></div>
      )}

      {home && !err && (
        <>
          {screen.kind === "home" && <div className="kscroll"><KidHome home={home} onOpen={open} onWish={() => setScreen({ kind: "wish" })} /></div>}
          {screen.kind === "notebook" && <div className="kscroll"><KidNotebook childId={childId} achievements={home.achievements} /></div>}
          {screen.kind === "wish" && <KidWish childId={childId} library={home.library} onBack={toHome} onOpen={(s) => open(s, "wish_suggestion")} />}
          {screen.kind === "read" && (
            <KidReader key={`${screen.story.storyId}-${screen.retake}`} childId={childId} story={screen.story} openedFrom={screen.from} isRetake={screen.retake}
              readingMode={home.readingMode} onLeave={toHome} onForceExit={() => setScreen({ kind: "stopped" })}
              onFinished={(sid, pack) => void finished(sid, pack, screen.retake)} />
          )}
          {screen.kind === "after" && (
            <KidAfter childId={childId} sessionId={screen.sessionId} pack={screen.pack} ageBand={home.ageBand} readingMode={home.readingMode}
              isRetake={screen.retake} completed={screen.completed} onDone={toHome} />
          )}
          {screen.kind === "stopped" && (
            <div className="kpane"><div className="kcard" style={{ alignItems: "center", textAlign: "center" }}>
              <Frog size={120} mood="idle" /><h2 className="display">Mình đọc truyện khác nhé!</h2>
              <p className="sub" style={{ fontSize: 15 }}>Truyện này tạm nghỉ rồi. Em chọn một truyện khác trong thư viện nha.</p>
              <button className="btn btn-p" onClick={toHome}>Về thư viện</button>
            </div></div>
          )}
        </>
      )}
    </div>
  );
}
