"use client";

import "./kid.css";
import "@/app/features/review/review-tools.css";
import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { Camera, ImageUp } from "lucide-react";
import Dialog from "@/app/components/Dialog";
import { decodeQr, readKidCode } from "./kidQrCode";

type Cam = "starting" | "on" | "unsupported" | "denied" | "missing" | "error";

const CAM_TEXT: Record<Exclude<Cam, "on">, string> = {
  starting: "Đang mở camera…",
  unsupported: "Trình duyệt này chưa mở được camera. Bé chọn ảnh chụp mã QR ở dưới nhé.",
  denied: "Camera chưa được cho phép. Nhờ bố mẹ bật quyền camera cho trang này, hoặc chọn ảnh chụp mã QR.",
  missing: "Không tìm thấy camera trên máy này. Bé chọn ảnh chụp mã QR ở dưới nhé.",
  error: "Chưa mở được camera. Bé chọn ảnh chụp mã QR ở dưới nhé.",
};
const WRONG_CODE = "Mã này không phải mã vào đọc của bé. Nhờ bố mẹ mở mã QR trong mục Quyền truy cập của bé.";
const SCAN_EVERY_MS = 250;

/**
 * Luồng 1 Bước 1.10 — bé quét mã QR Easy Login ngay trong ứng dụng (camera hoặc ảnh chụp mã).
 * Đọc được mã thì trả về qua `onCode` một lần; việc đăng nhập do `KidEntry` làm như khi mở link QR.
 */
export default function KidQrScanner({ onCode, onClose }: { onCode: (code: string) => void; onClose: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const done = useRef(false);
  const onCodeRef = useRef(onCode);
  const [cam, setCam] = useState<Cam>("starting");
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => { onCodeRef.current = onCode; }, [onCode]);

  /** Trả true khi đã nhận được mã của bé. */
  const accept = useCallback((text: string) => {
    if (done.current) return true;
    const code = readKidCode(text);
    if (!code) { setHint(WRONG_CODE); return false; }
    done.current = true;
    onCodeRef.current(code);
    return true;
  }, []);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let timer = 0;
    let stopped = false;
    const canvas = document.createElement("canvas");
    void (async () => {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) { setCam("unsupported"); return; }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      } catch (e) {
        const name = e instanceof DOMException ? e.name : "";
        if (!stopped) setCam(name === "NotAllowedError" || name === "SecurityError" ? "denied" : name === "NotFoundError" || name === "OverconstrainedError" ? "missing" : "error");
        return;
      }
      const v = video.current;
      if (stopped || !v) { stream.getTracks().forEach((t) => t.stop()); return; }
      v.srcObject = stream;
      await v.play().catch(() => undefined);
      setCam("on");
      const tick = () => {
        if (stopped) return;
        const text = v.readyState >= 2 && v.videoWidth ? decodeQr(v, v.videoWidth, v.videoHeight, canvas, 800) : null;
        if (text && accept(text)) return;
        timer = window.setTimeout(tick, SCAN_EVERY_MS);
      };
      tick();
    })();
    // Đóng màn quét hoặc đã đọc được mã: tắt camera ngay.
    return () => { stopped = true; window.clearTimeout(timer); stream?.getTracks().forEach((t) => t.stop()); };
  }, [accept]);

  const pickImage = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setHint(null);
    try {
      const bmp = await createImageBitmap(file);
      const text = decodeQr(bmp, bmp.width, bmp.height, document.createElement("canvas"), 1600, true);
      bmp.close();
      if (!text) { setHint("Chưa thấy mã QR trong ảnh này. Bé thử ảnh rõ hơn, chụp thẳng và đủ sáng nhé."); return; }
      accept(text);
    } catch {
      setHint("Không mở được ảnh này. Bé chọn ảnh khác nhé.");
    }
  };

  return (
    <Dialog title="Bé quét mã để vào đọc" onClose={onClose} className="kqr">
      <p className="sub">Đưa mã QR bố mẹ tạo cho bé vào giữa khung. Thấy mã là vào đọc ngay.</p>
      <div className="kqr-view">
        <video ref={video} muted playsInline hidden={cam !== "on"} aria-label="Hình từ camera" />
        {cam === "on"
          ? <span className="kqr-frame" aria-hidden />
          : <div className="kqr-off" role="status"><Camera className="ic" aria-hidden /><span>{CAM_TEXT[cam]}</span></div>}
      </div>
      {hint && <div className="notice err" role="alert" data-inline-notice>{hint}</div>}
      <label className="btn btn-s btn-c">
        <ImageUp className="ic" aria-hidden />Chọn ảnh có mã QR
        <input type="file" accept="image/*" hidden onChange={(e) => void pickImage(e)} />
      </label>
    </Dialog>
  );
}
