'use client';
import { useEffect, useState } from 'react';
import { Award, Check, Droplets, Flame, Sprout } from 'lucide-react';
import { childRewardsService } from '@/app/services/childReadingService';
import type { ChildRewards } from '@/app/types/childReading';
import KnowledgeTreeArt, { TREE_STAGE_CODES, treeStageIndex } from '@/app/components/brand/KnowledgeTreeArt';
import { usePop } from '@/app/lib/motion';

/** Tổng EXP, chuỗi ngày đọc và huy hiệu của bé. */
export default function KidRewards({ token }: { token: string }) {
  const [data, setData] = useState<ChildRewards | null>(null);
  const [note, setNote] = useState('');
  const [watering, setWatering] = useState(false);
  const [treeNote, setTreeNote] = useState('');
  /** EXP vừa tưới: hiện "+N EXP" bay lên rồi mất, thanh EXP của cây chạy dài ra. */
  const [gain, setGain] = useState<{ amount: number; key: number } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    void childRewardsService.get(token, controller.signal).then(r => {
      if (controller.signal.aborted) return;
      if (r.success && r.data) setData(r.data); else setNote(r.message);
    });
    return () => controller.abort();
  }, [token]);

  const water = async () => {
    if (watering) return;
    setWatering(true); setTreeNote('');
    const r = await childRewardsService.water(token);
    setWatering(false);
    if (!r.success || !r.data) { setTreeNote(r.message); return; }
    const result = r.data;
    setData(d => d ? { ...d, knowledgeTree: result.tree } : d);
    setGain(g => ({ amount: result.expPoured, key: (g?.key ?? 0) + 1 }));
    window.setTimeout(() => setGain(null), 1600);
    if (result.newTreePlanted) setTreeNote('Cây đã ra hoa! Em vừa trồng một hạt giống mới.');
  };

  const stageIdx = data ? treeStageIndex(data.knowledgeTree.stage) : 0;
  const artRef = usePop<HTMLDivElement>(stageIdx, 0.8);

  if (!data) return note ? <p className="notice" role="status">{note}</p> : <p role="status">Đang tải phần thưởng…</p>;
  const tree = data.knowledgeTree;
  const earned = data.badges.filter(b => b.earned);
  return <section className="kid-rewards kid-rewards-split">
    <div className="kid-reward-stats kid-reward-left">
      <section className="kcard kid-tree" aria-label="Cây tri thức"><div ref={artRef} className="kid-tree-art"><KnowledgeTreeArt stage={tree.stage} size={420} /></div></section>
    </div>
    <div className="kid-rewards-right">
      <div className="kid-reward-stats">
        <section className="kcard kid-exp kid-info-card" aria-label="Kinh nghiệm">
          <div className="kid-streak" role="img" title="Ngày đọc liên tiếp" aria-label={`${data.streakDays} ngày đọc liên tiếp`}><Flame aria-hidden="true" /><b>{data.streakDays}</b></div>
          <div className="kid-tree-info">
            <div className="kid-exp-line"><b>{data.expTotal}</b><span>EXP</span><em>{tree.stageName}</em>{gain && <i key={gain.key} className="kid-tree-gain" aria-live="polite">+{gain.amount} EXP</i>}</div>
            {tree.nextStageAt != null && <div className={`kid-exp-bar${gain ? ' filling' : ''}`} role="progressbar" aria-valuemin={0} aria-valuemax={tree.nextStageAt} aria-valuenow={tree.currentTreeExp} aria-label={`Cây ${tree.currentTreeExp}/${tree.nextStageAt} EXP để lớn lên`}><span style={{ width: `${Math.max(4, Math.min(100, (tree.currentTreeExp / tree.nextStageAt) * 100))}%` }} /></div>}
            <ol className="kid-tree-steps" aria-label="Các giai đoạn của cây">{TREE_STAGE_CODES.map((c, n) => <li key={c} className={n < stageIdx ? 'done' : n === stageIdx ? 'now' : ''}>{n < stageIdx ? <Check aria-hidden="true" /> : <Sprout aria-hidden="true" />}</li>)}</ol>
          </div>
          <button type="button" className="kid-listen-primary" disabled={watering || tree.expToWater <= 0} onClick={() => void water()}>
            <Droplets aria-hidden="true" />Tưới cây{tree.expToWater > 0 && ` (+${tree.expToWater})`}
          </button>
          {treeNote && <p className="notice" role="status">{treeNote}</p>}
        </section>
      </div>
    <h3 className="display">Huy hiệu của em <span className="kid-badge-count">{earned.length}/{data.badges.length}</span></h3>
    <div className="kid-badges">{data.badges.map(b => <article key={b.code} className={`kid-badge${b.earned ? ' on' : ''}`} title={b.earned && b.earnedAt ? `Đã nhận ngày ${new Date(b.earnedAt).toLocaleDateString('vi-VN')}` : 'Chưa nhận'}>
      {b.earned ? <Check aria-hidden="true" /> : <Award aria-hidden="true" />}
      <div><b>{b.name}</b><p>{b.description}</p></div>
    </article>)}</div>
    </div>
  </section>;
}
