'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Lock,
  Unlock,
  CheckCircle2,
  FileText,
  Sparkles,
} from 'lucide-react';
import { flow4Service } from '../../../services/flow4Service';
import { InterventionCaseItem, InterventionStatus } from '../../../types/flow4Types';
import { useAuth } from '../../../context/AuthContext';

export const InterventionHoldModeSection: React.FC = () => {
  const { user } = useAuth();
  const [cases, setCases] = useState<InterventionCaseItem[]>([]);
  const [selectedCase, setSelectedCase] = useState<InterventionCaseItem | null>(null);
  const [skillGapNotes, setSkillGapNotes] = useState<string>('');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const loadCases = () => {
    setCases(flow4Service.getInterventions());
  };

  useEffect(() => {
    loadCases();
    flow4Service.fetchInterventionsFromApi().then((data) => {
      if (data && data.length > 0) {
        setCases(data);
      }
    });
  }, []);

  const handleOpenUnlockModal = (c: InterventionCaseItem) => {
    setSelectedCase(c);
    setSkillGapNotes(c.skillGapNotes || '');
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;

    const teacherUserId = user?.id ? Number(user.id) : 12;
    const teacherName = user?.fullName || user?.username || 'Giáo viên phụ trách';

    flow4Service.unlockHoldMode(
      selectedCase.id,
      skillGapNotes || 'Giáo viên đã hướng dẫn bé trực tiếp 1-1 về liên kết ngữ cảnh.',
      teacherUserId,
      teacherName
    );

    loadCases();
    setSelectedCase(null);
    setFeedbackMsg(`Đã mở khóa học tập thành công cho bé ${selectedCase.childName}!`);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className="p-4 rounded-2xl flex items-center justify-between border border-amber-500/30 bg-amber-500/10 backdrop-blur-xl text-tod-text shadow-sm transition-colors duration-500">
        <div>
          <h3 className="text-base font-extrabold text-tod-text flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <span>Can Thiệp Sư Phạm & Chế Độ Hỗ Trợ (Hold Mode)</span>
          </h3>
          <p className="text-xs text-tod-text-muted mt-0.5">
            Tự động kích hoạt khi tỷ lệ đọc hiểu liên tục dưới 70%. Giáo viên phân tích lỗ hổng kỹ năng để mở khóa.
          </p>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Case cards */}
      <div className="space-y-3">
        {cases.map((item) => {
          const isHoldMode = item.status === InterventionStatus.OpenHoldMode;

          return (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border transition-all ${
                isHoldMode
                  ? 'bg-amber-500/5 border-amber-500/30 shadow-lg shadow-amber-500/5'
                  : 'bg-tod-card border-tod-border'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`p-3 rounded-2xl ${
                      isHoldMode
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {isHoldMode ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-tod-text">{item.childName}</h4>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                          isHoldMode
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}
                      >
                        {isHoldMode ? 'Đang bật Hold Mode' : 'Đã mở khóa'}
                      </span>
                    </div>

                    <p className="text-xs text-tod-text-muted mt-1">
                      Tỷ lệ đọc hiểu ghi nhận: <b className="text-rose-400 font-bold">{item.comprehensionRate}%</b> (ngưỡng an toàn &ge; 70%)
                    </p>

                    {item.triggeringStoryTitle && (
                      <p className="text-[11px] text-tod-text-muted mt-0.5">
                        Tác phẩm liên quan: {item.triggeringStoryTitle}
                      </p>
                    )}

                    {item.skillGapNotes && (
                      <div className="mt-2 p-2 rounded-xl bg-tod-surface/80 border border-tod-border text-xs text-tod-text">
                        <span className="font-bold text-tod-text-muted">Ghi chú sư phạm:</span> {item.skillGapNotes}
                      </div>
                    )}
                  </div>
                </div>

                {isHoldMode && (
                  <button
                    onClick={() => handleOpenUnlockModal(item)}
                    className="px-4 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 hover:opacity-95 flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer self-start sm:self-auto shrink-0"
                  >
                    <Unlock className="w-4 h-4" />
                    <span>Hướng dẫn & Mở khóa</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 4.5.4: Báo cáo ngày tổng hợp định kỳ */}
      <div className="p-4 rounded-2xl bg-tod-surface/60 border border-tod-border space-y-2">
        <h4 className="text-xs font-extrabold text-tod-text flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-400" />
          <span>Báo Cáo Tổng Hợp Ngày (Daily Report Service)</span>
        </h4>
        <p className="text-[11px] text-tod-text-muted">
          Hệ thống chạy định kỳ tự động độc lập mỗi ngày để tổng hợp thời lượng đọc, tiến bộ từ vựng và gửi thông báo trực tiếp tới phụ huynh.
        </p>
      </div>

      {/* Modal Unlock Hold Mode */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200 pointer-events-auto">
          <div className="w-full max-w-md p-6 rounded-3xl border border-amber-500/30 bg-tod-surface/95 backdrop-blur-2xl shadow-2xl space-y-4 text-tod-text">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                <Unlock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-tod-text">Mở Khóa Lộ Trình Cho Bé</h3>
                <p className="text-xs text-tod-text-muted">
                  Bé: {selectedCase.childName} (Tỷ lệ hiểu: {selectedCase.comprehensionRate}%)
                </p>
              </div>
            </div>

            <form onSubmit={handleUnlock} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-tod-text mb-1.5">
                  Phân tích lỗ hổng kỹ năng & giải pháp đã hỗ trợ:
                </label>
                <textarea
                  rows={4}
                  value={skillGapNotes}
                  onChange={(e) => setSkillGapNotes(e.target.value)}
                  placeholder="Ghi chú cách bạn đã hướng dẫn bé (VD: giải thích từ vựng, đọc chậm từng đoạn, đặt câu hỏi gợi mở)..."
                  className="dashboard-input w-full p-3 rounded-xl text-xs resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-tod-border">
                <button
                  type="button"
                  onClick={() => setSelectedCase(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-tod-text-muted hover:text-tod-text hover:bg-tod-surface transition-all cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-emerald-500 to-teal-500 text-zinc-950 flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Xác nhận Mở khóa</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
