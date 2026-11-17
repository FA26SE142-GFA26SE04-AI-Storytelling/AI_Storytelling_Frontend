/** Cành lá trang trí góc khối "Hôm nay em đọc": thân cong, 4 lá có gân, đung đưa quanh gốc (CSS). */
const LEAVES = [
  // [cx, cy, góc xoay, màu]
  [30, 58, -35, "var(--primary)"],
  [50, 40, 30, "color-mix(in srgb, var(--primary) 60%, var(--gold))"],
  [62, 26, -50, "color-mix(in srgb, var(--mint) 70%, var(--primary))"],
  [84, 12, 15, "var(--primary)"],
] as const;

/** mirror: "x" soi gương ngang (cành mọc từ góc dưới phải), "y" lật dọc (cành rủ từ góc trên trái). */
export default function KidLeafSprig({ mirror, className }: { mirror?: "x" | "y"; className?: string }) {
  const flipT = mirror === "x" ? "translate(100 0) scale(-1 1)" : mirror === "y" ? "translate(0 100) scale(1 -1)" : undefined;
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 100"
      className={"kid-leaf-sprig " + (className ?? "")}
    >
      <g transform={flipT}>
      <path
        d="M 6 94 C 22 74 44 52 88 10"
        fill="none"
        stroke="color-mix(in srgb, var(--primary-strong) 65%, var(--gold-deep))"
        strokeWidth={5}
        strokeLinecap="round"
      />
      {LEAVES.map(([cx, cy, rot, fill], i) => (
        <g key={i} transform={`translate(${cx} ${cy}) rotate(${rot})`}>
          <path
            d="M 0 0 C 6 -10 18 -12 26 -2 C 18 8 6 8 0 0 Z"
            fill={fill}
            stroke="color-mix(in srgb, var(--text) 25%, transparent)"
            strokeWidth={1.2}
          />
          <path d="M 1 0 L 22 -2" stroke="color-mix(in srgb, var(--bg) 70%, transparent)" strokeWidth={1.4} strokeLinecap="round" />
        </g>
      ))}
      </g>
    </svg>
  );
}
