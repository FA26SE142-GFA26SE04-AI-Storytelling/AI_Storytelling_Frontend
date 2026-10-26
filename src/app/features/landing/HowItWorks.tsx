"use client";

import { useState } from "react";
import { Check, Mic, ShieldCheck, WandSparkles } from "lucide-react";
import { useSwap } from "@/app/lib/motion";
import { STEPS } from "./landingContent";

/** Hình minh hoạ nhỏ cho từng bước, dựng bằng chính kiểu giao diện của app (không phải ảnh chụp). */
function Preview({ id }: { id: string }) {
  switch (id) {
    case "idea":
      return (
        <div className="ld-mock">
          <span className="ld-mock-label">Ý tưởng câu chuyện</span>
          <p className="ld-mock-input">Rùa Bông mang đèn lồng đến hội Trung thu, gặp bạn Thỏ bị lạc</p>
          <span className="ld-mock-label">Bài học</span>
          <p className="ld-mock-input">Biết giúp đỡ bạn bè</p>
          <div className="ld-mock-chips"><span className="on">Cổ tích</span><span>Vừa · 300 tiếng</span><span>Kèm câu đố</span></div>
        </div>
      );
    case "safety":
      return (
        <div className="ld-mock">
          {["Chủ đề nằm trong danh sách cho phép", "Không có thông tin cá nhân của bé", "Không dùng nhân vật có bản quyền"].map((t) => (
            <p key={t} className="ld-mock-check"><Check aria-hidden />{t}</p>
          ))}
          <p className="ld-mock-ok"><ShieldCheck aria-hidden />An toàn, AI bắt đầu viết dàn ý</p>
        </div>
      );
    case "outline":
      return (
        <div className="ld-mock">
          {[["Mở đầu", "Đêm Trung thu, Rùa Bông chậm rãi xách đèn lồng ra bờ ao."], ["Diễn biến", "Bông nghe tiếng khóc, gặp Thỏ Út lạc đường giữa đám đông."], ["Kết thúc", "Hai bạn soi đèn tìm về nhà Thỏ, cùng ngắm trăng."]].map(([h, t]) => (
            <div key={h} className="ld-mock-beat"><b>{h}</b><span>{t}</span></div>
          ))}
          <div className="ld-mock-actions"><span className="ghost">Viết lại</span><span className="primary"><Check aria-hidden />Duyệt dàn ý</span></div>
        </div>
      );
    case "story":
      return (
        <div className="ld-mock">
          <p className="ld-mock-story">Bông giơ cao chiếc đèn lồng. <mark>Ánh sáng vàng ấm trải dài trên mặt nước</mark>, và Thỏ Út nín khóc.</p>
          <p className="ld-mock-ai"><WandSparkles aria-hidden />Nhờ AI sửa đoạn này: “Viết ngắn hơn, dễ hiểu cho bé 4 tuổi”</p>
          <div className="ld-mock-chips"><span>4 từ mới</span><span>3 câu đố</span><span>2 câu hỏi thảo luận</span></div>
        </div>
      );
    default:
      return (
        <div className="ld-mock ld-mock-media">
          <span className="ld-mock-cover" aria-hidden />
          <div className="grow">
            <b>Rùa Bông và đèn lồng Trung thu</b>
            <span className="ld-mock-wave" aria-hidden>{Array.from({ length: 18 }, (_, i) => <i key={i} style={{ height: `${30 + ((i * 37) % 60)}%` }} />)}</span>
            <span className="ld-mock-voice"><Mic aria-hidden />Giọng đọc đã sẵn sàng</span>
          </div>
          <span className="pill ok">Bé đã thấy truyện</span>
        </div>
      );
  }
}

/** "Cách hoạt động": danh sách 5 bước bên trái, bấm bước nào thì khung bên phải đổi theo. */
export default function HowItWorks() {
  const [cur, setCur] = useState(0);
  const step = STEPS[cur];
  const panelRef = useSwap<HTMLDivElement>(cur);

  return (
    <div className="ld-how">
      <ol className="ld-how-list">
        {STEPS.map((s, i) => (
          <li key={s.id}>
            <button type="button" className={i === cur ? "on" : ""} aria-pressed={i === cur} aria-controls="ld-how-panel" onClick={() => setCur(i)}>
              <span className="ld-how-num" aria-hidden>{i < cur ? <Check /> : i + 1}</span>
              <span className="ld-how-label">{s.label}</span>
            </button>
          </li>
        ))}
      </ol>
      <div id="ld-how-panel" className="ld-how-panel" aria-live="polite">
        <div ref={panelRef} className="ld-how-inner">
          <h3 className="display">{step.title}</h3>
          <p>{step.text}</p>
          <Preview id={step.id} />
        </div>
      </div>
    </div>
  );
}
