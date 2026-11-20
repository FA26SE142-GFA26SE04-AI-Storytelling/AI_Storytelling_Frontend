"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Square, Volume2 } from "lucide-react";

/** Preview narration for mock stories only; does not represent generated backend audio. */
export default function StorySampleAudio({ title, text, active }: { title: string; text: string; active: boolean }) {
  const [playing, setPlaying] = useState(false);
  const [message, setMessage] = useState("");
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);
  useEffect(() => {
    window.speechSynthesis?.getVoices();
    return () => {
      if (utterance.current) {
        utterance.current.onend = null;
        utterance.current.onerror = null;
        window.speechSynthesis?.cancel();
        utterance.current = null;
      }
    };
  }, []);

  const toggle = () => {
    if (!("speechSynthesis" in window)) { setMessage("Thiết bị chưa hỗ trợ nghe thử."); return; }
    if (playing) {
      window.speechSynthesis.cancel();
      utterance.current = null;
      setPlaying(false);
      return;
    }
    const voice = window.speechSynthesis.getVoices().find((item) => item.lang.toLowerCase().startsWith("vi"));
    if (!voice) { setMessage("Chưa có giọng tiếng Việt trên thiết bị. Hãy cài giọng tiếng Việt để nghe thử."); return; }
    setMessage("");
    const speech = new SpeechSynthesisUtterance(`${title}. ${text}`);
    speech.lang = "vi-VN";
    speech.voice = voice;
    speech.rate = 0.9;
    speech.onend = () => { setPlaying(false); utterance.current = null; };
    speech.onerror = () => { setPlaying(false); utterance.current = null; setMessage("Chưa phát được giọng đọc. Bạn có thể thử lại."); };
    utterance.current = speech;
    setPlaying(true);
    window.speechSynthesis.speak(speech);
  };

  return (
    <div className="ld-sample-audio">
      <span className="ld-audio-label"><Volume2 size={15} aria-hidden /> Giọng đọc</span>
      <button type="button" className="ld-text-action" onClick={toggle} disabled={!active} tabIndex={active ? 0 : -1} aria-label={`${playing ? "Dừng nghe" : "Nghe thử"}: ${title}`}>
        {playing ? <Square size={16} aria-hidden /> : <Play size={16} aria-hidden />}
        {playing ? "Dừng nghe" : "Nghe thử"}
      </button>
      <small>{active ? "Giọng đọc mẫu từ thiết bị" : "Chuyển đến thẻ này để nghe thử"}</small>
      {message && <p role="status">{message}</p>}
    </div>
  );
}
