'use client';

import type { CSSProperties } from 'react';
import type { MonthPeriod } from '@/app/lib/monthPeriods';
import { useGrowBars } from '@/app/lib/motion';
import { niceScale } from './statFormat';
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
  const { top, ticks } = niceScale(Math.max(0, ...numbers));

  const barsRef = useGrowBars<HTMLDivElement>('.ce-bar-fill', [
    values.join('|'),
    months.map((m) => m.key).join(','),
  ]);

  const gridStyle = { '--n': ticks.length - 1, '--cols': months.length } as CSSProperties;

  return (
    <section className="mb-chart">
      <h3 className="sec-h">{title}</h3>
      {/* Lưới 3 hàng (số / cột / tháng); cột đầu là trục các mức, đường kẻ ngang vẽ trong vùng cột. */}
      <div ref={barsRef} className="ce-bars" role="img" aria-label={title} style={gridStyle}>
        <div />
        <div className="ce-axis" aria-hidden="true">
          {ticks.map((t) => (
            <span key={t} style={{ bottom: `${(t / top) * 100}%` }}>
              {format(t)}
            </span>
          ))}
        </div>
        <div />
        {months.map((m, i) => {
          const v = values[i];
          const isNum = typeof v === 'number';
          const text = isNum ? format(v) : v === null ? '—' : '…';
          const dataH = isNum
            ? v > 0
              ? `${Math.max(4, Math.round((v / top) * 100))}%`
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
