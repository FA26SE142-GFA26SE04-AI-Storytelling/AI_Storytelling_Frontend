'use client';

import type { MonthPeriod } from '@/app/lib/monthPeriods';
import { useGrowBars } from '@/app/lib/motion';
import './MonthBars.css';

export default function MonthBars({
  title,
  months,
  values,
  format,
  selectedKey,
}: {
  title: string;
  months: MonthPeriod[];
  values: (number | null | undefined)[];
  format: (n: number) => string;
  selectedKey?: string;
}) {
  const numbers = values.filter((v): v is number => typeof v === 'number');
  const max = Math.max(1, ...numbers);

  const barsRef = useGrowBars<HTMLDivElement>('.ce-bar-fill', [
    values.join('|'),
    months.map((m) => m.key).join(','),
  ]);

  return (
    <section className="mb-chart">
      <h3 className="sec-h">{title}</h3>
      <div ref={barsRef} className="ce-bars" role="img" aria-label={title}>
        {months.map((m, i) => {
          const v = values[i];
          const isNum = typeof v === 'number';
          const text = isNum ? format(v) : v === null ? '—' : '…';
          const dataH = isNum
            ? v > 0
              ? `${Math.max(4, Math.round((v / max) * 100))}%`
              : '0%'
            : undefined;

          return (
            <div className="ce-bar" key={m.key}>
              <span className="ce-bar-val">{text}</span>
              <div className="ce-bar-track">
                {isNum && (
                  <i
                    className={`ce-bar-fill${m.key === selectedKey ? ' on' : ''}`}
                    data-h={dataH}
                    style={{ height: dataH }}
                  />
                )}
              </div>
              {/* Nhãn "T9/2026" tách hai dòng (tháng / năm) để không dính nhau ở màn hẹp. */}
              <span className="ce-bar-month" title={m.label}>
                {m.label.split('/')[0]}
                {m.label.includes('/') && <small>{m.label.split('/')[1]}</small>}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
