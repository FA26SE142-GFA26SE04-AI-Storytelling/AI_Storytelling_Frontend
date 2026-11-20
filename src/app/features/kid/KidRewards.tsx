'use client';
import { useEffect, useState } from 'react';
import { Award, Check, Droplets, Flame, Lock, Sprout } from 'lucide-react';
import { childRewardsService } from '@/app/services/childReadingService';
import type { ChildRewards } from '@/app/types/childReading';
import KnowledgeTreeArt, { TREE_STAGE_CODES, treeStageIndex } from '@/app/components/brand/KnowledgeTreeArt';
import Frog from '@/app/components/brand/Frog';
import { usePop, useRiseIn } from '@/app/lib/motion';
import { showToast } from '@/app/lib/toast';
import '@/app/styles/features/kid/kid-lobby.css';
import '@/app/styles/features/kid/kid-panes.css';

/** Tổng EXP, chuỗi ngày đọc và huy hiệu của bé. */
export default function KidRewards({ token }: { token: string }) {
  const [data, setData] = useState<ChildRewards | null>(null);
  const [failed, setFailed] = useState(false);
  const [watering, setWatering] = useState(false);
  /** EXP vừa tưới: hiện "+N EXP" bay lên rồi mất, thanh EXP của cây chạy dài ra. */
  const [gain, setGain] = useState<{ amount: number; key: number } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    void childRewardsService.get(token, controller.signal).then(r => {
      if (controller.signal.aborted) return;
      if (r.success && r.data) setData(r.data);
      else { setFailed(true); showToast(r.message, 'err'); }
    });
    return () => controller.abort();
  }, [token]);

  const water = async () => {
    if (watering) return;
    setWatering(true);
    const r = await childRewardsService.water(token);
    setWatering(false);
    if (!r.success || !r.data) { showToast(r.message, 'err'); return; }
    const result = r.data;
    setData(d => d ? { ...d, knowledgeTree: result.tree } : d);
    setGain(g => ({ amount: result.expPoured, key: (g?.key ?? 0) + 1 }));
    window.setTimeout(() => setGain(null), 1600);
    if (result.newTreePlanted) showToast('Cây đã ra hoa! Em vừa trồng một hạt giống mới.', 'ok');
  };

  const stageIdx = data ? treeStageIndex(data.knowledgeTree.stage) : 0;
  const artRef = usePop<HTMLDivElement>(stageIdx, 0.8);
  const rootRef = useRiseIn<HTMLElement>('.kl-panel', [!!data], { delay: 70 });

  if (!data) return failed ? null : <div className="kid-pane-loading" role="status"><Frog mood="think" size={96} /><span className="sr-only">Đang tải phần thưởng…</span></div>;
  const tree = data.knowledgeTree;
  const earned = data.badges.filter(b => b.earned);
  return <section ref={rootRef} className="kid-rewards kid-rewards-split kid-rewards-panes">
    <div className="kid-reward-left">
      <section className="kl-panel kid-tree" aria-label="Cây tri thức"><div ref={artRef} className="kid-tree-art"><KnowledgeTreeArt stage={tree.stage} size={420} /></div></section>
    </div>
    <div className="kid-rewards-right">
      <section className="kl-panel kid-exp-panel" aria-labelledby="kid-exp-h">
        <h2 id="kid-exp-h" className="kl-head display"><Sprout aria-hidden="true" />{tree.stageName}</h2>
        <div className="kid-streak" role="img" title="Ngày đọc liên tiếp" aria-label={`${data.streakDays} ngày đọc liên tiếp`}><Flame aria-hidden="true" /><b>{data.streakDays}</b></div>
        <div className="kid-tree-info">
          <div className="kid-exp-line"><b className="display">{data.expTotal}</b><span>EXP</span>{gain && <i key={gain.key} className="kid-tree-gain" aria-live="polite">+{gain.amount} EXP</i>}</div>
          {tree.nextStageAt != null && <div className={`kid-exp-bar${gain ? ' filling' : ''}`} role="progressbar" aria-valuemin={0} aria-valuemax={tree.nextStageAt} aria-valuenow={tree.currentTreeExp} aria-label={`Cây ${tree.currentTreeExp}/${tree.nextStageAt} EXP để lớn lên`}><span style={{ width: `${Math.max(4, Math.min(100, (tree.currentTreeExp / tree.nextStageAt) * 100))}%` }} /></div>}
          <ol className="kid-tree-steps" aria-label="Các giai đoạn của cây">{TREE_STAGE_CODES.map((c, n) => <li key={c} className={n < stageIdx ? 'done' : n === stageIdx ? 'now' : ''}>{n < stageIdx ? <Check aria-hidden="true" /> : <Sprout aria-hidden="true" />}</li>)}</ol>
        </div>
        <button type="button" className="kid-btn3d is-sky is-wide" disabled={watering || tree.expToWater <= 0} onClick={() => void water()}>
          <Droplets aria-hidden="true" />Tưới cây{tree.expToWater > 0 && ` (+${tree.expToWater})`}
        </button>
      </section>
      <section className="kl-panel kid-badge-panel" aria-labelledby="kid-badge-h">
        <h2 id="kid-badge-h" className="kl-head display"><Award aria-hidden="true" />Huy hiệu của em<span className="kid-badge-count">{earned.length}/{data.badges.length}</span></h2>
        <div className="kid-badge-grid">{data.badges.map((b, i) => <article key={b.code} className={`kid-badge-card ${b.earned ? 'is-earned' : 'is-locked'}`} style={b.earned ? { animationDelay: `${Math.min(i, 12) * 0.06}s` } : undefined} title={b.earned && b.earnedAt ? `Đã nhận ngày ${new Date(b.earnedAt).toLocaleDateString('vi-VN')}` : 'Chưa nhận'}>
          <span className="kid-badge-icon">{b.earned ? <Award aria-hidden="true" /> : <Lock aria-hidden="true" />}</span>
          <b className="display">{b.name}</b>
          <p>{b.description}</p>
        </article>)}</div>
      </section>
    </div>
  </section>;
}
