// Hiệu ứng cánh hoa sen bung toả dùng chung cho không gian của bé
import { prefersReducedMotion } from "@/app/lib/motion";

export function petalBurst(x: number, y: number, count = 14): void {
  if (typeof window === "undefined" || prefersReducedMotion()) {
    return;
  }

  for (let i = 0; i < count; i++) {
    const span = document.createElement("span");
    const size = Math.floor(Math.random() * 7) + 8; // 8–14px
    const bg = i % 2 === 0 ? "var(--lotus)" : "var(--gold)";

    span.style.position = "fixed";
    span.style.left = `${x}px`;
    span.style.top = `${y}px`;
    span.style.width = `${size}px`;
    span.style.height = `${size}px`;
    span.style.pointerEvents = "none";
    span.style.zIndex = "9999";
    span.style.borderRadius = "50% 0 50% 50%";
    span.style.background = bg;

    document.body.appendChild(span);

    const dx = (Math.random() - 0.5) * 180; // -90..90
    const dyPeak = -(Math.random() * 90 + 30); // -120..-30
    const dyFall = Math.random() * 80 + 120; // +120..+200
    const rotPeak = (Math.random() - 0.5) * 360;
    const rotEnd = rotPeak + (Math.random() - 0.5) * 360;

    const anim = span.animate(
      [
        {
          transform: "translate(-50%, -50%) translate(0px, 0px) rotate(0deg)",
          opacity: 1,
          offset: 0,
        },
        {
          transform: `translate(-50%, -50%) translate(${dx * 0.6}px, ${dyPeak}px) rotate(${rotPeak}deg)`,
          opacity: 0.9,
          offset: 0.35,
          easing: "ease-out",
        },
        {
          transform: `translate(-50%, -50%) translate(${dx}px, ${dyFall}px) rotate(${rotEnd}deg)`,
          opacity: 0,
          offset: 1,
          easing: "ease-in",
        },
      ],
      {
        duration: 1400,
        fill: "forwards",
      }
    );

    const cleanup = () => {
      span.remove();
    };

    anim.onfinish = cleanup;
    anim.oncancel = cleanup;
  }
}
