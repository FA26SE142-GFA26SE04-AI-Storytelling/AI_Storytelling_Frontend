/** Năm giai đoạn của Cây tri thức, đúng thứ tự backend trả về trong `stage`. */
export const TREE_STAGE_CODES = ['SEED', 'SPROUT', 'SAPLING', 'GROWN', 'FLOWERING'] as const;

/** Vị trí giai đoạn (0–4); mã lạ thì về hạt giống. */
export const treeStageIndex = (stage: string) => Math.max(0, TREE_STAGE_CODES.indexOf(stage.toUpperCase() as (typeof TREE_STAGE_CODES)[number]));

const SOIL = 'color-mix(in srgb, var(--gold-deep) 55%, var(--text))';
const TRUNK = 'color-mix(in srgb, var(--gold-deep) 70%, var(--text))';
const LEAF = 'var(--primary)';
const LEAF_DEEP = 'var(--primary-strong)';

const Leaf = ({ x, y, rot, s = 1, fill = LEAF }: { x: number; y: number; rot: number; s?: number; fill?: string }) => (
  <path d="M0 0 C-12 -10 -12 -28 0 -38 C12 -28 12 -10 0 0Z" fill={fill} transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} />
);

const Blossom = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {[0, 72, 144, 216, 288].map(r => <ellipse key={r} cx="0" cy="-8" rx="5.5" ry="9" fill="var(--lotus)" transform={`rotate(${r})`} />)}
    <circle r="4.5" fill="var(--gold)" />
  </g>
);

/** Hình cây theo giai đoạn: hạt → mầm → cây con → cây lớn → cây ra hoa. Chỉ để trang trí. */
export default function KnowledgeTreeArt({ stage, size = 168, className }: { stage: string; size?: number; className?: string }) {
  const i = treeStageIndex(stage);
  return (
    <svg className={`tree-art${className ? ` ${className}` : ''}`} width={size} height={size} viewBox="0 0 160 160" aria-hidden data-stage={i}>
      <ellipse cx="80" cy="140" rx="58" ry="12" fill={SOIL} opacity=".35" />
      <path d="M32 140 Q36 122 80 122 Q124 122 128 140 Z" fill={SOIL} />
      <g className="tree-sway" style={{ transformOrigin: '80px 124px' }}>
        {i === 0 && <>
          <ellipse cx="80" cy="119" rx="11" ry="8" fill="var(--gold-deep)" />
          <path d="M76 116 Q80 112 84 116" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" />
        </>}
        {i === 1 && <>
          <path d="M80 124 Q80 108 80 96" stroke={LEAF_DEEP} strokeWidth="4" strokeLinecap="round" fill="none" />
          <Leaf x={80} y={98} rot={-52} s={0.62} />
          <Leaf x={80} y={98} rot={52} s={0.62} fill={LEAF_DEEP} />
        </>}
        {i === 2 && <>
          <path d="M80 124 Q78 100 80 72" stroke={TRUNK} strokeWidth="6" strokeLinecap="round" fill="none" />
          <Leaf x={79} y={104} rot={-62} s={0.7} />
          <Leaf x={80} y={92} rot={64} s={0.7} fill={LEAF_DEEP} />
          <Leaf x={80} y={80} rot={-40} s={0.78} />
          <Leaf x={80} y={74} rot={34} s={0.82} fill={LEAF_DEEP} />
          <Leaf x={80} y={72} rot={0} s={0.7} />
        </>}
        {(i === 3 || i === 4) && <>
          <path d="M72 124 Q76 104 78 86 L82 86 Q84 104 88 124 Z" fill={TRUNK} />
          <path d="M80 100 Q66 92 58 80 M80 94 Q94 86 102 74" stroke={TRUNK} strokeWidth="4" strokeLinecap="round" fill="none" />
          <circle cx="80" cy="56" r="32" fill={LEAF} />
          <circle cx="54" cy="72" r="22" fill={LEAF_DEEP} />
          <circle cx="106" cy="72" r="22" fill={LEAF_DEEP} />
          <circle cx="80" cy="50" r="20" fill={LEAF} opacity=".85" />
        </>}
        {i === 3 && <>
          <circle cx="66" cy="62" r="4.5" fill="var(--gold)" />
          <circle cx="96" cy="58" r="4.5" fill="var(--gold)" />
          <circle cx="82" cy="78" r="4.5" fill="var(--gold)" />
        </>}
        {i === 4 && <>
          <Blossom x={62} y={52} s={1.1} />
          <Blossom x={96} y={50} s={1.2} />
          <Blossom x={80} y={74} s={1} />
          <Blossom x={52} y={78} s={0.8} />
          <Blossom x={108} y={76} s={0.85} />
          <Blossom x={80} y={34} s={0.85} />
        </>}
      </g>
    </svg>
  );
}
