"use client";

import { useCallback, useState } from "react";
import { MessageCircleHeart, Smile, Star, Trash2 } from "lucide-react";
import Dialog from "@/app/components/Dialog";
import IconButton from "@/app/components/IconButton";
import SafeImage from "@/app/components/SafeImage";
import { confirmDialog } from "@/app/lib/confirm";
import { showToast } from "@/app/lib/toast";
import { parentReadingFeedbackService } from "@/app/services/childReadingService";
import { EMOTION_FACE, shortDate, usePopupData } from "./learningData";

/** Popup "Cảm nhận": cảm xúc, cảnh thích nhất và lời bé gửi bố mẹ (xoá được lời). */
export default function ReflectionDialog({ childId, sessionId, title, onClose, onNoteRemoved }: {
  childId: number;
  sessionId: number;
  title: string;
  onClose: () => void;
  onNoteRemoved: () => void;
}) {
  const load = useCallback((signal: AbortSignal) => parentReadingFeedbackService.reflection(childId, sessionId, signal), [childId, sessionId]);
  const { data, setData, refresh } = usePopupData(load, onClose);
  const [busy, setBusy] = useState(false);

  const removeNote = async () => {
    if (busy || !(await confirmDialog("Xoá lời bé gửi? Chữ và bản ghi âm sẽ bị xoá và không khôi phục được."))) return;
    setBusy(true);
    const r = await parentReadingFeedbackService.removeReflectionNote(childId, sessionId);
    setBusy(false);
    showToast(r.success ? r.message || "Đã xoá lời của bé." : r.message, r.success ? "ok" : "err");
    if (!r.success) return;
    setData((d) => d && { ...d, noteText: null, noteAudioUrl: null, noteSentAt: null });
    onNoteRemoved();
  };

  const scene = data?.favoriteScene;
  const hasNote = !!(data?.noteText || data?.noteAudioUrl);

  return (
    <Dialog title={"Cảm nhận · " + title} onClose={onClose} wide>
      {data == null ? (
        <p className="sub">Đang tải…</p>
      ) : data.emotions.length === 0 && !scene && !hasNote ? (
        <p className="sub">Bé chưa gửi cảm nhận.</p>
      ) : (
        <div className="lr-refl">
          {data.emotions.length > 0 && (
            <div className="lr-sum-part">
              <b className="lr-sum-h"><Smile className="ic" aria-hidden />Cảm xúc</b>
              <div className="chips">
                {data.emotions.map((e) => <span key={e.code} className="pill wait">{EMOTION_FACE[e.code] ?? ""} {e.label}</span>)}
              </div>
            </div>
          )}
          {scene && (
            <div className="lr-sum-part">
              <b className="lr-sum-h"><Star className="ic" aria-hidden />Cảnh thích nhất</b>
              <div className="lr-fav">
                <SafeImage src={scene.illustrationUrl} alt={`Tranh cảnh ${scene.sceneIndex + 1}`} onError={refresh} />
                <div className="lr-flag-body">
                  <span className="pill wait">Cảnh {scene.sceneIndex + 1}</span>
                  <p className="lr-flag-text">{scene.sceneText}</p>
                </div>
              </div>
            </div>
          )}
          {hasNote && (
            <div className="lr-sum-part">
              <b className="lr-sum-h">
                <MessageCircleHeart className="ic" aria-hidden />Lời bé gửi
                {data.noteSentAt && <span className="pill draft">{shortDate(data.noteSentAt)}</span>}
                <span className="grow" />
                <IconButton icon={Trash2} label="Xoá lời bé gửi" disabled={busy} onClick={() => void removeNote()} />
              </b>
              {data.noteText && <b className="lr-flag-q">“{data.noteText}”</b>}
              {data.noteAudioUrl && <audio controls preload="none" src={data.noteAudioUrl} onError={refresh} aria-label="Nghe lời bé gửi" />}
            </div>
          )}
        </div>
      )}
    </Dialog>
  );
}
