'use client';
import { useEffect, useState } from 'react';
import { Award, Flame, Star } from 'lucide-react';
import { childRewardsService } from '@/app/services/childReadingService';
import type { ChildRewards } from '@/app/types/childReading';

/** Tổng EXP, chuỗi ngày đọc và huy hiệu của bé. */
export default function KidRewards({ token }: { token: string }) {
  const [data, setData] = useState<ChildRewards | null>(null);
  const [note, setNote] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    void childRewardsService.get(token, controller.signal).then(r => {
      if (controller.signal.aborted) return;
      if (r.success && r.data) setData(r.data); else setNote(r.message);
    });
    return () => controller.abort();
  }, [token]);

  if (!data) return note ? <p className="notice" role="status">{note}</p> : <p role="status">Đang tải phần thưởng…</p>;
  const earned = data.badges.filter(b => b.earned);
  return <section className="kid-rewards">
    <div className="kid-reward-stats">
      <div className="kcard"><Star aria-hidden="true" /><b>{data.expTotal}</b><span>EXP</span></div>
      <div className="kcard"><Flame aria-hidden="true" /><b>{data.streakDays}</b><span>ngày đọc liên tiếp</span></div>
      <div className="kcard"><Award aria-hidden="true" /><b>{earned.length}/{data.badges.length}</b><span>huy hiệu</span></div>
    </div>
    <h3 className="display">Huy hiệu của em</h3>
    <div className="kid-badges">{data.badges.map(b => <article key={b.code} className={`kid-badge${b.earned ? ' on' : ''}`}>
      <Award aria-hidden="true" />
      <div><b>{b.name}</b><p>{b.description}</p><small>{b.earned ? `Đã nhận${b.earnedAt ? ` ngày ${new Date(b.earnedAt).toLocaleDateString('vi-VN')}` : ''}` : 'Chưa nhận'}</small></div>
    </article>)}</div>
  </section>;
}
