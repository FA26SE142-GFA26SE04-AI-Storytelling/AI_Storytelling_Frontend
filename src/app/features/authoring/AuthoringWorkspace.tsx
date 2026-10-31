"use client";

import { useEffect, useRef, useState } from "react";
import { useWorkspaceData } from "@/app/context/WorkspaceDataContext";
import type { WorkspaceProps } from "@/app/components/shell/nav";
import { parentAuthoringService } from "@/app/services/parentAuthoringService";
import { chooseChild } from "@/app/lib/chooseChild";
import Frog from "@/app/components/brand/Frog";
import ParentAuthoringWorkspace from "./ParentAuthoringWorkspace";

/**
 * Trang Thủ công: phụ huynh tự soạn truyện gia đình, tự kiểm tra và giao cho bé.
 * Bé được chọn riêng cho trang này. Có `resumeStoryId` thì lấy đúng bé của bản nháp đó rồi mở thẳng.
 */
export default function AuthoringWorkspace({ resumeStoryId }: Pick<WorkspaceProps, "resumeStoryId">) {
  const { children: kids } = useWorkspaceData();
  const [kidId, setKidId] = useState<number | null>(null);
  const [resolving, setResolving] = useState(resumeStoryId != null);
  const child = kids.find((k) => k.id === kidId) ?? (kids.length === 1 ? kids[0] : null);

  useEffect(() => {
    if (resumeStoryId == null) return;
    let alive = true;
    void parentAuthoringService.get(resumeStoryId).then((r) => {
      if (!alive) return;
      if (r.data) setKidId(r.data.childProfileId);
      setResolving(false);
    });
    return () => { alive = false; };
  }, [resumeStoryId]);

  const pickKid = async () => {
    const kid = await chooseChild({ title: "Soạn truyện cho bé nào?" });
    if (kid) setKidId(kid.id);
  };
  // Vào trang mà chưa biết soạn cho bé nào thì mở hộp chọn bé ngay, chỉ một lần.
  const asked = useRef(false);
  useEffect(() => {
    if (asked.current || resolving || child || kids.length < 2) return;
    asked.current = true;
    void pickKid();
  });

  if (resolving) {
    return <section className="ws dock" style={{ gridTemplateColumns: "1fr" }}><div className="pane"><div className="empty"><span>Đang mở bản nháp…</span></div></div></section>;
  }
  if (!child) {
    return (
      <section className="ws dock" style={{ gridTemplateColumns: "1fr" }}>
        <div className="pane"><div className="empty">
          {kids.length === 0 ? <>
            <b className="display">Chưa có hồ sơ bé</b><span>Cần có hồ sơ bé để soạn truyện.</span>
          </> : <>
            <Frog size={100} mood="think" />
            <b className="display">Soạn truyện cho bé nào?</b>
            <span>Truyện tự soạn được kiểm tra và giao riêng cho từng bé.</span>
            <button className="btn btn-p" style={{ marginTop: 6 }} onClick={() => void pickKid()}>Chọn bé</button>
          </>}
        </div></div>
      </section>
    );
  }
  return <ParentAuthoringWorkspace key={child.id} childId={child.id} initialStoryId={resumeStoryId ?? null} onChangeKid={kids.length > 1 ? () => void pickKid() : undefined} />;
}
