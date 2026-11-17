'use client';

import { Fragment, useEffect, useRef } from 'react';
import { Check, Lock } from 'lucide-react';
import SafeImage from '@/app/components/SafeImage';
import Frog from '@/app/components/brand/Frog';
import Lotus from '@/app/components/brand/Lotus';
import { useRiseIn } from '@/app/lib/motion';

export type JourneyStop = {
  storyId: number;
  title: string | null;
  coverImageUrl: string | null;
  status: 'done' | 'open' | 'locked';
};

export default function KidJourneyPath({
  stops,
  selectedId,
  onSelect,
  finished,
}: {
  stops: JourneyStop[];
  selectedId: number | null;
  onSelect: (stop: JourneyStop) => void;
  finished: boolean;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRiseIn<HTMLOListElement>('.kj-stop', [stops.length]);
  // stops tạo mới mỗi lần render: chỉ cuộn khi chặng hôm nay đổi, không kéo về giữa mỗi lần bé chọn chặng khác.
  const openId = stops.find((s) => s.status === 'open')?.storyId;

  useEffect(() => {
    const wrap = wrapRef.current;
    const list = listRef.current;
    if (!wrap || !list) return;

    const el = list.querySelector<HTMLElement>('.kj-stop.is-open');
    if (!el) return;

    const wrapRect = wrap.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const elLeft = elRect.left - wrapRect.left + wrap.scrollLeft;
    wrap.scrollLeft = elLeft - wrap.clientWidth / 2 + el.offsetWidth / 2;
  }, [openId, listRef]);

  if (stops.length === 0) {
    return null;
  }

  const lastStop = stops[stops.length - 1];

  return (
    <div className="kj-path-wrap" ref={wrapRef}>
      <ol className="kj-path" ref={listRef}>
        {stops.map((stop, i) => {
          const selected = stop.storyId === selectedId;
          const title = stop.title ?? 'Truyện bố mẹ chọn';
          const label =
            stop.status === 'done'
              ? 'đã đọc'
              : stop.status === 'open'
                ? 'hôm nay'
                : 'chưa mở';

          return (
            <Fragment key={stop.storyId}>
              {i > 0 && (
                <li
                  className="kj-link"
                  aria-hidden="true"
                  data-walked={stops[i - 1].status === 'done' ? 'true' : 'false'}
                />
              )}
              <li>
                <button
                  type="button"
                  className={`kj-stop is-${stop.status}${selected ? ' is-selected' : ''}`}
                  aria-pressed={selected}
                  aria-label={`Chặng ${i + 1}: ${title}, ${label}`}
                  onClick={() => onSelect(stop)}
                >
                  <span className="kj-stop-no">{i + 1}</span>
                  <SafeImage src={stop.coverImageUrl} alt="" className="kj-stop-cover" />
                  {stop.status === 'done' && (
                    <span className="kj-stop-badge">
                      <Check aria-hidden="true" />
                    </span>
                  )}
                  {stop.status === 'locked' && (
                    <span className="kj-stop-lock">
                      <Lock aria-hidden="true" />
                    </span>
                  )}
                  {stop.status === 'open' && (
                    <Frog className="kj-frog" mood="happy" size={56} />
                  )}
                  {/* Cắt 2 dòng ở span trong: cắt ngay ở khung có padding thì lộ một phần dòng thứ 3 */}
                  <span className="kj-stop-name"><span>{title}</span></span>
                </button>
              </li>
            </Fragment>
          );
        })}

        <li
          className="kj-link"
          aria-hidden="true"
          data-walked={lastStop.status === 'done' ? 'true' : 'false'}
        />
        <li className="kj-end">
          <Lotus
            size={finished ? 88 : 64}
            className={finished ? 'kj-lotus is-bloom' : 'kj-lotus'}
          />
        </li>
      </ol>
    </div>
  );
}
