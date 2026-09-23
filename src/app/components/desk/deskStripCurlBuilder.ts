import { PageSpread } from './deskSpreadsGenerator';

export const N_STRIPS = 18;
export const SPAN_RATIO = 0.5;
export const MAX_BETA_CURL = 0.6;

/**
 * Xây dựng chuỗi phân cấp 18 dải 3D strips lồng nhau để uốn cong trang sách
 */
export function buildCurl(
  dir: 'next' | 'prev',
  from: number,
  to: number,
  pageSpreads: PageSpread[],
  stripsRef: { current: HTMLDivElement[] }
): HTMLDivElement {
  stripsRef.current = [];
  const c = document.createElement('div');
  c.className = `curl ${dir}`;
  c.style.setProperty('--n', String(N_STRIPS));
  c.style.setProperty('--span', String(SPAN_RATIO));

  let host: HTMLElement = c;
  for (let i = 0; i < N_STRIPS; i++) {
    const s = document.createElement('div');
    s.className = 'strip';
    s.style.setProperty('--i', String(i));

    const gut = 'calc(var(--bw) * 0.5)';
    const sw = `calc(var(--bw) * ${SPAN_RATIO} / ${N_STRIPS})`;
    const A = `calc(-1 * (${gut} + ${i} * ${sw}))`; // faces from-page
    const B = `calc(${(i + 1)} * ${sw} - ${gut})`; // faces to-page

    const f = document.createElement('div');
    f.className = 'face front';
    const b = document.createElement('div');
    b.className = 'face back';

    const dress = (el: HTMLElement, url: string, px: string) => {
      el.style.backgroundImage = `url(${url})`;
      el.style.backgroundPositionX = px;
    };

    if (pageSpreads[from] && pageSpreads[to]) {
      dress(f, pageSpreads[from].dataUrl, dir === 'next' ? A : B);
      dress(b, pageSpreads[to].dataUrl, dir === 'next' ? B : A);
    }

    const shF = document.createElement('div');
    shF.className = 'sh';
    const glF = document.createElement('div');
    glF.className = 'gl';
    f.appendChild(shF);
    f.appendChild(glF);

    const shB = document.createElement('div');
    shB.className = 'sh';
    const glB = document.createElement('div');
    glB.className = 'gl';
    b.appendChild(shB);
    b.appendChild(glB);

    s.appendChild(f);
    s.appendChild(b);

    if (i === N_STRIPS - 1) {
      s.classList.add('edge');
    }

    host.appendChild(s);
    host = s;
    stripsRef.current.push(s);
  }

  return c;
}
