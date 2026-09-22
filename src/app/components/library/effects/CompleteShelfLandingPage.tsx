'use client';

import React, { useState, useRef, CSSProperties } from 'react';

export interface CompleteShelfLandingPageProps {
  className?: string;
  style?: CSSProperties;
  onLoaded?: () => void;
}

const FRAME_SANDBOX = 'allow-downloads allow-forms allow-modals allow-popups allow-same-origin allow-scripts';

export const CompleteShelfLandingPage: React.FC<CompleteShelfLandingPageProps> = ({
  className = '',
  style,
  onLoaded,
}) => {
  const [isReady, setIsReady] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleLoad = () => {
    setIsReady(true);
    if (onLoaded) {
      onLoaded();
    }
  };

  return (
    <div
      className={`relative w-full h-full overflow-hidden bg-[#10131b] select-none ${className}`}
      data-state={isReady ? 'ready' : 'loading'}
      style={{
        position: 'relative',
        overflow: 'hidden',
        pointerEvents: 'auto',
        ...style,
      }}
    >
      {/* Loading Skeleton Indicator */}
      {!isReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-md z-10 transition-opacity duration-500">
          <div className="w-10 h-10 border-3 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
          <span className="text-xs font-bold text-amber-300 mt-3 tracking-wider uppercase animate-pulse">
            Đang tải Kệ Sách 3D...
          </span>
        </div>
      )}

      {/* Sandboxed Byte-Exact Three.js Complete Shelf Iframe */}
      <iframe
        ref={iframeRef}
        title="Working Volumes — Complete 3D Shelf"
        src="/landing-pages/complete-shelf-v2.html"
        sandbox={FRAME_SANDBOX}
        loading="eager"
        onLoad={handleLoad}
        className="w-full h-full border-0 block"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          border: 0,
          background: '#10131b',
        }}
      />
    </div>
  );
};
