'use client';

import type { CSSProperties } from 'react';
import type { MonthPeriod } from '@/app/lib/monthPeriods';
import { useGrowBars } from '@/app/lib/motion';
import { niceScale } from './statFormat';
import '@/app/styles/components/stats/MonthBars.css';

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
              ? `${Math.max(6, Math.round((v / top) * 100))}%`
              : '0%'
            : undefined;

          return (
            <div className="ce-bar" key={m.key}>
              <span className={`ce-bar-val${m.key === selectedKey ? ' on' : ''}${isNum && v > 0 ? ' has-val' : ''}`}>
                <span className="ce-bar-val-pill">{text}</span>
              </span>
              <div className={`ce-bar-track${m.key === selectedKey ? ' on' : ''}`}>
                {/* Rãnh cột nền mờ sang trọng định hình chiều cao tối đa */}
                <div className="ce-bar-slot" aria-hidden="true" />
                {isNum && (
                  <i
                    className={`ce-bar-fill${m.key === selectedKey ? ' on' : ''}${v === 0 ? ' is-zero' : ''}`}
                    data-h={dataH}
                    style={{ height: dataH }}
                  >
                    <span className="ce-bar-glow" aria-hidden="true" />
                  </i>
                )}
                {isNum && v === 0 && (
                  <span className="ce-bar-zero-dot" aria-hidden="true" />
                )}
              </div>
              {/* Nhãn "T9/2026" tách hai dòng (tháng / năm) để không dính nhau ở màn hẹp. */}
              <span className={`ce-bar-month${m.key === selectedKey ? ' on' : ''}`} title={m.label}>
                <span className="ce-bar-month-m">{m.label.split('/')[0]}</span>
                {m.label.includes('/') && <small className="ce-bar-month-y">{m.label.split('/')[1]}</small>}
                {m.key === selectedKey && <span className="ce-bar-month-cur" aria-hidden="true" />}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
