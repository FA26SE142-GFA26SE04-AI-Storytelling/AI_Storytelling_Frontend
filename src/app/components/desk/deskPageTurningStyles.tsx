import React from 'react';

export const DeskPageTurningStyles: React.FC = () => {
  return (
    <style jsx global>{`
      .sb-full {
        position: absolute;
        inset: 0;
        border-radius: 16px;
        overflow: hidden;
      }
      .sb-full img {
        width: 100%;
        height: auto;
        display: block;
      }
      .sb-half {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 50%;
        overflow: hidden;
      }
      .sb-half.left {
        left: 0;
        border-top-left-radius: 16px;
        border-bottom-left-radius: 16px;
      }
      .sb-half.right {
        left: 50%;
        border-top-right-radius: 16px;
        border-bottom-right-radius: 16px;
      }
      .sb-half-img {
        width: 200%;
        max-width: none;
        height: 100%;
        display: block;
      }
      .sb-half-img.right {
        margin-left: -100%;
      }
      .gutter-shade {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 40%;
        pointer-events: none;
        opacity: calc(var(--shade, 0) * 0.65);
      }
      .gutter-shade.left {
        right: 0;
        background: linear-gradient(
          270deg,
          rgba(0, 0, 0, 0.35),
          rgba(0, 0, 0, 0) 80%
        );
      }
      .gutter-shade.right {
        left: 0;
        background: linear-gradient(
          90deg,
          rgba(0, 0, 0, 0.35),
          rgba(0, 0, 0, 0) 80%
        );
      }

      /* 3D Turning Nested Strips */
      .curl {
        position: absolute;
        top: 0;
        height: 100%;
        width: calc(var(--bw, 0px) * var(--span, 0.5));
        transform-style: preserve-3d;
        z-index: 6;
      }
      .curl.next {
        left: 50%;
        transform-origin: left center;
        transform: rotateY(calc(-1 * var(--tt, 0deg)));
      }
      .curl.prev {
        right: 50%;
        transform-origin: right center;
        transform: rotateY(var(--tt, 0deg));
      }
      .strip {
        position: absolute;
        top: 0;
        height: 100%;
        width: calc(var(--bw, 0px) * var(--span, 0.5) / var(--n, 18));
        transform-style: preserve-3d;
      }
      .curl.next .strip {
        transform-origin: left center;
      }
      .curl.prev .strip {
        transform-origin: right center;
      }
      .curl.next > .strip {
        left: 0;
      }
      .curl.prev > .strip {
        right: 0;
        left: auto;
      }
      .curl.next .strip .strip {
        left: 100%;
        transform: rotateY(var(--td, 0deg));
      }
      .curl.prev .strip .strip {
        right: 100%;
        transform: rotateY(calc(-1 * var(--td, 0deg)));
      }
      .face {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        right: -1.2px;
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
        background-repeat: no-repeat;
        background-size: var(--bw, 0px) 100%;
      }
      .face.back {
        transform: rotateY(180deg);
      }
      /* Bo viền các góc ngoài của trang sách khi đang lật / nhấc lên */
      .curl.next .strip.edge .face.front {
        border-top-right-radius: 16px;
        border-bottom-right-radius: 16px;
        overflow: hidden;
      }
      .curl.next .strip.edge .face.back {
        border-top-left-radius: 16px;
        border-bottom-left-radius: 16px;
        overflow: hidden;
      }
      .curl.prev .strip.edge .face.front {
        border-top-left-radius: 16px;
        border-bottom-left-radius: 16px;
        overflow: hidden;
      }
      .curl.prev .strip.edge .face.back {
        border-top-right-radius: 16px;
        border-bottom-right-radius: 16px;
        overflow: hidden;
      }
      .face .sh {
        position: absolute;
        inset: 0;
        pointer-events: none;
      }
      .curl.next .face.front .sh,
      .curl.prev .face.back .sh {
        background: linear-gradient(
          90deg,
          rgba(40, 25, 10, var(--a1, 0)),
          rgba(40, 25, 10, var(--a2, 0))
        );
      }
      .curl.next .face.back .sh,
      .curl.prev .face.front .sh {
        background: linear-gradient(
          90deg,
          rgba(40, 25, 10, var(--a2, 0)),
          rgba(40, 25, 10, var(--a1, 0))
        );
      }
      .face .gl {
        position: absolute;
        inset: 0;
        pointer-events: none;
        background: #ffffff;
        opacity: calc(
          var(--shade, 0) * var(--lit, 1) * var(--lit, 1) * 0.22
        );
      }
      .sb-zone {
        position: absolute;
        top: 0;
        bottom: 0;
        border: 0;
        background: transparent;
        cursor: grab;
        z-index: 20;
        touch-action: none;
      }
      .sb-zone:active {
        cursor: grabbing;
      }
      .sb-prev {
        left: 0;
        width: 50%;
      }
      .sb-next {
        right: 0;
        width: 50%;
      }
    `}</style>
  );
};
