'use client';

import { useId, useState } from 'react';
import type { MonthPeriod } from '@/app/lib/monthPeriods';
import { niceScale } from './statFormat';
import '@/app/styles/components/stats/MonthAreaChart.css';

/** Tạo đường cong mượt tự nhiên (Catmull-Rom Spline) nối các điểm dữ liệu */
function buildSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    // Giữ hệ số căng vừa phải để đường cong mềm mại mà không bị võng quá mức
    const tension = 0.22;
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

export default function MonthAreaChart({
  title,
  months,
  values,
  format,
  selectedKey,
  onSelectKey,
}: {
  title?: string;
  months: MonthPeriod[];
  values: (number | null | undefined)[];
  format: (n: number) => string;
  selectedKey?: string;
  onSelectKey?: (key: string) => void;
}) {
  const gradientId = useId();
  const filterId = useId();

  const numbers = values.filter((v): v is number => typeof v === 'number');
  const maxVal = Math.max(0, ...numbers);
  const { top, ticks } = niceScale(maxVal);

  // Mặc định chọn tháng có giá trị cao nhất hoặc tháng được truyền vào
  const defaultIdx = (() => {
    if (selectedKey) {
      const idx = months.findIndex((m) => m.key === selectedKey);
      if (idx >= 0) return idx;
    }
    let bestIdx = months.length - 1;
    let bestVal = -1;
    for (let i = 0; i < values.length; i++) {
      const v = values[i];
      if (typeof v === 'number' && v > bestVal) {
        bestVal = v;
        bestIdx = i;
      }
    }
    return Math.max(0, bestIdx);
  })();

  const [activeIdx, setActiveIdx] = useState<number>(defaultIdx);

  // Khung vẽ SVG
  const width = 640;
  const height = 270;
  const padLeft = 56;
  const padRight = 24;
  const padTop = 38;
  const padBottom = 210;

  const chartW = width - padLeft - padRight;
  const chartH = padBottom - padTop;

  // Tính tọa độ điểm dữ liệu
  const n = months.length;
  const points = months.map((_, i) => {
    const x = n > 1 ? padLeft + i * (chartW / (n - 1)) : padLeft + chartW / 2;
    const v = values[i];
    const isNum = typeof v === 'number';
    const y = isNum && top > 0
      ? padBottom - Math.min(chartH, Math.max(0, (v / top) * chartH))
      : padBottom;
    return { x, y, isNum, val: v };
  });

  const linePath = buildSmoothPath(points);
  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${padBottom} L ${points[0].x} ${padBottom} Z`
    : '';

  const activePoint = points[activeIdx] ?? points[0];
  const activeMonth = months[activeIdx];
  const activeValText = activePoint && typeof activePoint.val === 'number'
    ? format(activePoint.val)
    : activePoint?.val === null ? '—' : '…';

  // Kích thước tooltip
  const tipWidth = Math.max(88, activeValText.length * 9.5 + 24);
  const tipHeight = 28;
  const tipX = Math.max(padLeft, Math.min(width - padRight - tipWidth, (activePoint?.x ?? 0) - tipWidth / 2));
  const tipY = Math.max(8, (activePoint?.y ?? 0) - tipHeight - 12);
  const arrowX = activePoint?.x ?? 0;

  return (
    <div className="mac-wrapper">
      {title && (
        <div className="mac-header">
          <h3 className="mac-title display">{title}</h3>
          <span className="mac-badge">{months[0]?.label.split('/')[0]} – {months[months.length - 1]?.label}</span>
        </div>
      )}

      <div className="mac-chart-box">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="mac-svg"
          preserveAspectRatio="none"
          role="img"
          aria-label={title ?? "Biểu đồ đường theo tháng"}
        >
          <defs>
            {/* Gradient màu phủ vùng diện tích theo theme đầm sen */}
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.32" />
              <stop offset="65%" stopColor="var(--mint)" stopOpacity="0.12" />
              <stop offset="100%" stopColor="var(--mint)" stopOpacity="0.0" />
            </linearGradient>

            {/* Bóng phát sáng cho điểm active */}
            <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="var(--primary)" floodOpacity="0.45" />
            </filter>
          </defs>

          {/* Đường lưới ngang và giá trị trục Y */}
          {ticks.map((t) => {
            const y = padBottom - (t / (top || 1)) * chartH;
            return (
              <g key={t} className="mac-grid-row">
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  className="mac-grid-line"
                />
                <text
                  x={padLeft - 10}
                  y={y + 4}
                  className="mac-axis-txt"
                  textAnchor="end"
                >
                  {format(t)}
                </text>
              </g>
            );
          })}

          {/* Đường đáy trục X */}
          <line
            x1={padLeft}
            y1={padBottom}
            x2={width - padRight}
            y2={padBottom}
            className="mac-axis-base"
          />

          {/* Vùng diện tích phủ gradient */}
          {areaPath && (
            <path
              d={areaPath}
              fill={`url(#${gradientId})`}
              className="mac-area"
            />
          )}

          {/* Đường đồ thị chính */}
          {linePath && (
            <path
              d={linePath}
              className="mac-line"
            />
          )}

          {/* Cột dọc mờ chỉ thị khi hover / active */}
          {activePoint && (
            <line
              x1={activePoint.x}
              y1={padTop}
              x2={activePoint.x}
              y2={padBottom}
              className="mac-cursor-line"
            />
          )}

          {/* Các điểm dữ liệu mốc tròn trên đường */}
          {points.map((p, i) => {
            const isCur = i === activeIdx;
            return (
              <g
                key={months[i].key}
                className={`mac-point-group${isCur ? ' is-active' : ''}`}
                onMouseEnter={() => {
                  setActiveIdx(i);
                  onSelectKey?.(months[i].key);
                }}
                onClick={() => {
                  setActiveIdx(i);
                  onSelectKey?.(months[i].key);
                }}
                tabIndex={0}
                role="button"
                aria-label={`${months[i].label}: ${p.isNum ? format(p.val as number) : 'không có dữ liệu'}`}
              >
                {/* Vùng cảm ứng chuột rộng hơn */}
                <circle cx={p.x} cy={p.y} r={18} fill="transparent" className="mac-hit-area" />

                {/* Vòng hào quang phát sáng của điểm active */}
                {isCur && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={9}
                    className="mac-halo-dot"
                  />
                )}

                {/* Chấm tròn chính */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isCur ? 6 : 4.5}
                  className="mac-point-dot"
                />
              </g>
            );
          })}

          {/* Tooltip nổi bật ở điểm active (như mẫu DashStack) */}
          {activePoint && (
            <g className="mac-tooltip-group" pointerEvents="none">
              {/* Thân tooltip */}
              <rect
                x={tipX}
                y={tipY}
                width={tipWidth}
                height={tipHeight}
                rx="8"
                className="mac-tip-box"
              />
              {/* Mũi tên tam giác chỉ xuống điểm dữ liệu */}
              <polygon
                points={`${arrowX - 5},${tipY + tipHeight} ${arrowX + 5},${tipY + tipHeight} ${arrowX},${tipY + tipHeight + 5}`}
                className="mac-tip-arrow"
              />
              {/* Chữ giá trị trong tooltip */}
              <text
                x={tipX + tipWidth / 2}
                y={tipY + 18}
                textAnchor="middle"
                className="mac-tip-txt"
              >
                {activeValText}
              </text>
            </g>
          )}

          {/* Nhãn tháng ở trục X */}
          {months.map((m, i) => {
            const p = points[i];
            const isCur = i === activeIdx;
            return (
              <g
                key={m.key}
                className={`mac-x-label${isCur ? ' is-active' : ''}`}
                onClick={() => {
                  setActiveIdx(i);
                  onSelectKey?.(m.key);
                }}
              >
                <text
                  x={p.x}
                  y={235}
                  textAnchor="middle"
                  className="mac-month-m"
                >
                  {m.label.split('/')[0]}
                </text>
                {m.label.includes('/') && (
                  <text
                    x={p.x}
                    y={248}
                    textAnchor="middle"
                    className="mac-month-y"
                  >
                    {m.label.split('/')[1]}
                  </text>
                )}
                {isCur && (
                  <circle
                    cx={p.x}
                    cy={258}
                    r={2.5}
                    className="mac-active-pip"
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
