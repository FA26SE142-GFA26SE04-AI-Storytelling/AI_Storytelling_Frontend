/** Hoa sen: năm cánh hồng quanh nhụy vàng. Chỉ để trang trí. */
export default function Lotus({ size = 56, className }: { size?: number; className?: string }) {
  const petal = (rot: number, scale = 1, fill = "var(--lotus)") => (
    <path key={`${rot}-${scale}`} d="M50 56 C34 44 34 22 50 8 C66 22 66 44 50 56Z" fill={fill} transform={`rotate(${rot} 50 56) scale(${scale})`} style={{ transformOrigin: "50px 56px" }} />
  );
  return (
    <svg className={className} width={size} height={size * 0.78} viewBox="0 0 100 78" aria-hidden>
      <g opacity=".95">
        {petal(-62, 0.88, "var(--lotus-deep)")}
        {petal(62, 0.88, "var(--lotus-deep)")}
        {petal(-32, 0.96)}
        {petal(32, 0.96)}
        {petal(0, 1, "var(--lotus-light)")}
      </g>
      <ellipse cx="50" cy="58" rx="9" ry="4" fill="var(--gold)" />
      <path d="M12 62 Q50 74 88 62" fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" opacity=".5" />
    </svg>
  );
}
