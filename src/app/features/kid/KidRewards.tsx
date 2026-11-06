'use client';
import { useEffect, useState } from 'react';
import { Award, Check, Droplets, Flame, Sprout, Star } from 'lucide-react';
import { childRewardsService } from '@/app/services/childReadingService';
import type { ChildRewards } from '@/app/types/childReading';

/** Tổng EXP, chuỗi ngày đọc và huy hiệu của bé. */
export default function KidRewards({ token }: { token: string }) {
  const [data, setData] = useState<ChildRewards | null>(null);
  const [note, setNote] = useState('');
  const [watering, setWatering] = useState(false);
  const [treeNote, setTreeNote] = useState('');
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
    setTreeNote(result.newTreePlanted ? 'Cây đã ra hoa! Em vừa trồng một hạt giống mới.' : `Em đã tưới cây ${result.expPoured} EXP.`);
  };

  if (!data) return note ? <p className="notice" role="status">{note}</p> : <p role="status">Đang tải phần thưởng…</p>;
  const earned = data.badges.filter(b => b.earned);
  // Backend chưa có cấp độ: thanh EXP chạy tới mốc tròn 100 kế tiếp (120 EXP -> 20/100 tới mốc 200).
  const STEP = 100;
  const into = data.expTotal % STEP;
  const nextGoal = data.expTotal - into + STEP;
  return <section className="kid-rewards">
    <div className="kid-reward-stats">
      <div className="kcard kid-exp">
        <Star aria-hidden="true" />
        <div className="kid-exp-line"><b>{data.expTotal}</b><span>EXP</span><em>mốc {nextGoal}</em></div>
        <div className="kid-exp-bar" role="progressbar" aria-valuemin={0} aria-valuemax={STEP} aria-valuenow={into} aria-label={`EXP: còn ${STEP - into} để tới ${nextGoal}`}><span style={{ width: `${Math.max(4, (into / STEP) * 100)}%` }} /></div>
      </div>
      <div className="kcard"><Flame aria-hidden="true" /><b>{data.streakDays}</b><span>ngày đọc liên tiếp</span></div>
    </div>
    <section className="kcard kid-tree" aria-label="Cây tri thức">
      <Sprout aria-hidden="true" />
      <div className="grow">
        <b>Cây tri thức: {data.knowledgeTree.stageName}</b>
        <p>{data.knowledgeTree.nextStageAt == null ? 'Cây đã ra hoa!' : `${data.knowledgeTree.currentTreeExp}/${data.knowledgeTree.nextStageAt} EXP để lớn lên`}{data.knowledgeTree.floweredTreeCount > 0 && ` · ${data.knowledgeTree.floweredTreeCount} cây đã ra hoa`}</p>
        {treeNote && <p role="status">{treeNote}</p>}
      </div>
      <button type="button" className="kid-listen-primary" disabled={watering || data.knowledgeTree.expToWater <= 0} onClick={() => void water()}>
        <Droplets aria-hidden="true" />Tưới cây{data.knowledgeTree.expToWater > 0 && ` (+${data.knowledgeTree.expToWater})`}
      </button>
    </section>
    <h3 className="display">Huy hiệu của em <span className="kid-badge-count">{earned.length}/{data.badges.length}</span></h3>
    <div className="kid-badges">{data.badges.map(b => <article key={b.code} className={`kid-badge${b.earned ? ' on' : ''}`} title={b.earned && b.earnedAt ? `Đã nhận ngày ${new Date(b.earnedAt).toLocaleDateString('vi-VN')}` : 'Chưa nhận'}>
      {b.earned ? <Check aria-hidden="true" /> : <Award aria-hidden="true" />}
      <div><b>{b.name}</b><p>{b.description}</p></div>
    </article>)}</div>
  </section>;
}
