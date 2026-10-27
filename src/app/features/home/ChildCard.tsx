"use client";

import { useEffect, useState, type ReactNode } from "react";
import { BookOpen, Headphones, Heart, Lock, LockOpen, Route, ShieldCheck, Users } from "lucide-react";
import type { ChildProfile, LearningProfile, SafetyPolicy } from "@/app/types/childProfile";
import { childProfileService } from "@/app/services/childProfileService";
import { supervisionService } from "@/app/services/supervisionService";
import { guardianService } from "@/app/services/guardianService";
import { ageLabel } from "@/app/lib/storyView";
import { avatarOf, childStatus } from "@/app/lib/guardian";

type Detail = {
  learning: LearningProfile | null;
  safety: SafetyPolicy | null;
  supervisors: number | null;
  roadmap: { completed: number; total: number } | null;
};

/** Một ô thông tin: icon + giá trị ngắn; ý nghĩa đầy đủ nằm ở tooltip và chữ ẩn cho trình đọc màn hình. */
function Stat({ icon, value, label, tone }: { icon: ReactNode; value: ReactNode; label: string; tone?: "ok" | "warn" }) {
  return (
    <li className={`kc-stat${tone ? ` ${tone}` : ""}`} title={label}>
      {icon}<span aria-hidden>{value}</span><span className="sr-only">{label}</span>
    </li>
  );
}

/** Thẻ gọn của một bé trên trang Tổng quan: ảnh đại diện, tên, tuổi và một hàng icon. Bấm thẻ để mở hồ sơ của bé. */
export default function ChildCard({ child, onOpenProfile }: { child: ChildProfile; onOpenProfile: () => void }) {
  const [d, setD] = useState<Detail | null>(null);

  useEffect(() => {
    let alive = true;
    void Promise.all([
      childProfileService.getLearningProfile(child.id),
      childProfileService.getSafetyPolicy(child.id),
      supervisionService.listSupervisors(child.id),
      guardianService.roadmap(child.id),
    ]).then(([lp, sp, sv, rm]) => {
      if (!alive) return;
      setD({
        learning: lp.success ? lp.data : null,
        safety: sp.success ? sp.data : null,
        supervisors: sv.success && sv.data ? sv.data.length : null,
        roadmap: rm.success && rm.data ? { completed: rm.counts?.completed ?? 0, total: rm.counts?.total ?? rm.data.length } : null,
      });
    });
    return () => { alive = false; };
  }, [child.id]);

  const av = avatarOf(child.avatarId);
  const st = childStatus(child.status);
  const lp = d?.learning;
  const sp = d?.safety;
  const listen = lp?.readingMode === "ListenFirst";
  const favorites = lp?.topics.filter((t) => t.relation === "FavoriteTopic").map((t) => t.topic) ?? [];
  const blocked = sp?.categories.filter((c) => c.rule !== "Allowed").length ?? 0;

  return (
    <div className="kc">
      <button className="kc-main" onClick={onOpenProfile} title={`Mở hồ sơ của ${child.nickname}`}>
        <span className="kc-head">
          <span className="kc-av" aria-hidden>{av.emoji}</span>
          <span className="kc-name">
            <b className="display">{child.nickname}</b>
            <small>{ageLabel(child.ageBand)}{child.status !== "Active" && <> · <span className={`kc-status ${st.tone}`}>{st.label}</span></>}</small>
          </span>
        </span>

        {d === null ? <span className="kc-loading">Đang tải…</span> : (
          <ul className="kc-stats">
            {lp && <Stat icon={listen ? <Headphones aria-hidden /> : <BookOpen aria-hidden />} value={`Mức ${lp.readingLevel}`}
              label={`Mức đọc ${lp.readingLevel}, ${listen ? "nghe là chính" : "tự đọc"}`} />}
            {d.roadmap && <Stat icon={<Route aria-hidden />} value={`${d.roadmap.completed}/${d.roadmap.total}`}
              label={d.roadmap.total ? `Lộ trình: đã đọc ${d.roadmap.completed} trên ${d.roadmap.total} truyện` : "Chưa có truyện trong lộ trình"} />}
            {favorites.length > 0 && <Stat icon={<Heart aria-hidden />} value={favorites.length}
              label={`Chủ đề yêu thích: ${favorites.join(", ")}`} />}
            {sp && <Stat icon={<ShieldCheck aria-hidden />} value={blocked} label={`${blocked} chủ đề bị chặn, tối đa ${sp.maxStoryLength} tiếng mỗi truyện`} />}
            {sp && <Stat icon={sp.parentalGateEnabled ? <Lock aria-hidden /> : <LockOpen aria-hidden />} value={sp.parentalGateEnabled ? "Bật" : "Tắt"}
              label={`Cổng phụ huynh ${sp.parentalGateEnabled ? "đang bật" : "đang tắt"}`} tone={sp.parentalGateEnabled ? "ok" : "warn"} />}
            {d.supervisors !== null && <Stat icon={<Users aria-hidden />} value={d.supervisors} label={`${d.supervisors} người giám sát`} />}
          </ul>
        )}
      </button>
    </div>
  );
}
