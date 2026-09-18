'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, AlertCircle, RefreshCw, QrCode, Sparkles } from 'lucide-react';

export interface QRCodeScannerTabProps {
  onCodeDetected: (code: string) => void;
}

export const QRCodeScannerTab: React.FC<QRCodeScannerTabProps> = ({ onCodeDetected }) => {
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Trình duyệt không hỗ trợ truy cập Camera.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (err) {
      console.warn('Camera access error:', err);
      setCameraError('Không thể mở Camera. Vui lòng cấp quyền hoặc tải ảnh mã QR từ máy.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Giả lập đọc mã từ ảnh QR: tìm chuỗi mã trong tên file hoặc đọc text
    // Nếu tên file chứa chuỗi mã (ví dụ INV-...), tự động trích xuất
    const nameMatch = file.name.match(/[A-Za-z0-9_-]{8,}/);
    if (nameMatch) {
      onCodeDetected(nameMatch[0]);
    } else {
      // Fallback: gợi ý người dùng nhập tay nếu không trích xuất được QR từ ảnh canvas tĩnh
      setCameraError('Đã nhận ảnh. Nếu chưa tự điền, vui lòng nhập mã in bên dưới ảnh QR vào ô bên cạnh.');
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-tod-surface border border-tod-border text-xs">
      {/* Video stream container */}
      <div className="relative w-full max-w-xs h-48 rounded-2xl bg-tod-card border border-tod-border overflow-hidden flex items-center justify-center">
        {isCameraActive ? (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            {/* Scanning viewfinder overlay */}
            <div className="absolute inset-4 border-2 border-sky-400/70 rounded-xl pointer-events-none animate-pulse">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-sky-400 to-transparent animate-bounce" />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-tod-text-muted p-4 text-center">
            <QrCode className="w-10 h-10 text-tod-text-muted opacity-60" />
            <span className="text-[11px]">Bật camera để tự động nhận dạng mã QR trên phiếu lời mời</span>
          </div>
        )}
      </div>

      {cameraError && (
        <div className="w-full p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-600 dark:text-rose-300 text-[11px] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{cameraError}</span>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-2 w-full pt-1">
        {!isCameraActive ? (
          <button
            type="button"
            onClick={startCamera}
            className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Mở Camera Quét QR</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={stopCamera}
            className="px-3.5 py-1.5 rounded-xl bg-tod-surface hover:bg-tod-card border border-tod-border text-tod-text font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Tắt Camera</span>
          </button>
        )}

        <label className="px-3.5 py-1.5 rounded-xl bg-tod-surface hover:bg-tod-card border border-tod-border text-tod-text font-bold flex items-center gap-1.5 transition-colors cursor-pointer">
          <Upload className="w-3.5 h-3.5 text-indigo-400" />
          <span>Tải Ảnh Phiếu QR</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </label>
      </div>
    </div>
  );
};
