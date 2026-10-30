"use client";

import { useEffect, useRef, useState } from "react";
import { CircleAlert, CircleCheck, Info, X } from "lucide-react";

type Tone = "ok" | "err" | "warn" | "info";
type Toast = { id: number; text: string; tone: Tone };

/** Thông báo nằm trong các vùng này vẫn hiện tại chỗ: hộp thoại, màn đăng nhập, chế độ của bé. */
const INLINE_ZONES = ".dlg, .login, .kid, .parental-gate-backdrop, [data-inline-notice]";
const NOTICE = '.notice[role="status"]';
const MAX_VISIBLE = 3;

const toneOf = (el: Element): Tone => (el.classList.contains("err") ? "err" : el.classList.contains("ok") ? "ok" : el.classList.contains("warn") ? "warn" : "info");

/**
 * Chuyển mọi thông báo kết quả (“Đã lưu…”, “Đã xoá…”, “Đã gửi…”) từ khung nằm trong trang
 * thành thông báo trượt xuống từ phía trên. Các nơi cũ vẫn render `.notice[role="status"]`;
 * component này ẩn khung đó và hiện cùng nội dung dưới dạng toast.
 */
export default function ToastHost() {
  const [items, setItems] = useState<Toast[]>([]);
  const seq = useRef(0);
  const lastText = useRef(new WeakMap<Element, string>());
  const timers = useRef(new Map<number, number>());

  const dismiss = (id: number) => {
    window.clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setItems((cur) => cur.filter((t) => t.id !== id));
  };
  const arm = (id: number, ms: number) => {
    window.clearTimeout(timers.current.get(id));
    timers.current.set(id, window.setTimeout(() => dismiss(id), ms));
  };

  useEffect(() => {
    const push = (el: Element) => {
      if (el.closest(INLINE_ZONES) || el.querySelector("button, a")) return;
      const text = (el.textContent ?? "").trim();
      if (!text) return;
      el.setAttribute("data-toasted", "");
      if (lastText.current.get(el) === text) return;
      lastText.current.set(el, text);
      const tone = toneOf(el);
      const id = ++seq.current;
      setItems((cur) => [...cur.filter((t) => t.text !== text), { id, text, tone }].slice(-MAX_VISIBLE));
      arm(id, tone === "err" || tone === "warn" ? 7000 : 4000);
    };
    const visit = (n: Node) => {
      if (!(n instanceof Element)) return;
      if (n.matches(NOTICE)) push(n);
      n.querySelectorAll(NOTICE).forEach(push);
    };
    const observer = new MutationObserver((records) => {
      for (const r of records) {
        if (r.type === "childList") r.addedNodes.forEach(visit);
        const host = (r.target instanceof Element ? r.target : r.target.parentElement)?.closest(NOTICE);
        if (host) push(host);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    document.querySelectorAll(NOTICE).forEach(push);
    const pending = timers.current;
    return () => { observer.disconnect(); pending.forEach((t) => window.clearTimeout(t)); pending.clear(); };
  }, []);

  if (items.length === 0) return null;
  return (
    <div className="toast-host" role="region" aria-label="Thông báo" aria-live="polite">
      {items.map((t) => {
        const Icon = t.tone === "ok" ? CircleCheck : t.tone === "info" ? Info : CircleAlert;
        return (
          <div key={t.id} className={`app-toast ${t.tone}`} role={t.tone === "err" ? "alert" : "status"}
            onMouseEnter={() => window.clearTimeout(timers.current.get(t.id))}
            onMouseLeave={() => arm(t.id, 2500)}>
            <Icon className="ic" aria-hidden="true" />
            <span className="grow">{t.text}</span>
            <button type="button" aria-label="Đóng thông báo" onClick={() => dismiss(t.id)}><X size={14} /></button>
          </div>
        );
      })}
    </div>
  );
}
