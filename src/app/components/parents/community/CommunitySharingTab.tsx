'use client';

import React, { useState, useEffect } from 'react';
import {
  Share2,
  Users,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { flow4Service } from '../../../services/flow4Service';
import {
  SharedStoryItem,
  TeacherShareStatus,
  RecipientStatus,
} from '../../../types/flow4Types';

import { useAuth } from '../../../context/AuthContext';

export const CommunitySharingTab: React.FC = () => {
  const { user } = useAuth();
  const [sharedStories, setSharedStories] = useState<SharedStoryItem[]>([]);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const loadStories = () => {
    setSharedStories(flow4Service.getSharedStories());
  };

  useEffect(() => {
    loadStories();
    flow4Service.fetchSharedStoriesFromApi().then((data) => {
      if (data && data.length > 0) {
        setSharedStories(data);
      }
    });
  }, []);

  const handleTeacherReview = (id: number, approve: boolean) => {
    const teacherUserId = user?.id ? Number(user.id) : 12;
    const teacherName = user?.fullName || user?.username || 'Giáo viên phụ trách';

    flow4Service.reviewSharedStoryByTeacher(
      id,
      approve,
      approve ? 'Nội dung đạt chuẩn an toàn của lớp!' : 'Cần điều chỉnh thêm',
      teacherUserId,
      teacherName
    );
    loadStories();
    setFeedbackMsg(approve ? 'Giáo viên đã phê duyệt truyện chia sẻ cho lớp!' : 'Đã từ chối chia sẻ truyện.');
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleParentResponse = (storyId: number, recipientId: number, accept: boolean) => {
    flow4Service.respondSharedStoryByParent(storyId, recipientId, accept);
    loadStories();
    setFeedbackMsg(accept ? 'Đã đồng ý nhận truyện! Tác phẩm sẽ xuất hiện trên Kệ Sách của bé.' : 'Đã từ chối nhận truyện.');
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  return (
    <div className="space-y-4">
      {/* Banner - Synchronized with Theme */}
      <div className="p-4 rounded-2xl flex items-center justify-between border border-tod-border bg-tod-card/90 backdrop-blur-xl text-tod-text shadow-sm transition-colors duration-500">
        <div>
          <h3 className="text-base font-extrabold text-tod-text flex items-center gap-2">
            <Share2 className="w-5 h-5 text-purple-400" />
            <span>Chia Sẻ Truyện Cộng Đồng & Kiểm Duyệt Lớp Học</span>
          </h3>
          <p className="text-xs text-tod-text-muted mt-0.5">
            Cơ chế kiểm duyệt đa tầng: Giáo viên phê duyệt &rarr; Từng phụ huynh độc lập chấp thuận cho con đọc
          </p>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Stories list */}
      <div className="space-y-3">
        {sharedStories.map((story) => {
          const isTeacherApproved = story.teacherStatus === TeacherShareStatus.Approved;
          const isTeacherPending = story.teacherStatus === TeacherShareStatus.Pending;

          return (
            <div
              key={story.id}
              className="dashboard-card-interactive p-4 rounded-2xl border border-tod-border bg-tod-card space-y-3"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-tod-text">{story.storyTitle}</h4>
                    <p className="text-[11px] text-tod-text-muted flex items-center gap-1.5 mt-0.5">
                      <span>Bởi: <b className="text-tod-text">{story.sharedByName}</b></span>
                      <span>•</span>
                      <Users className="w-3 h-3 text-indigo-400" />
                      <span>{story.classGroupName}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isTeacherApproved ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <ShieldCheck className="w-3.5 h-3.5" /> Giáo viên đã duyệt
                    </span>
                  ) : isTeacherPending ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Clock className="w-3.5 h-3.5" /> Chờ giáo viên duyệt
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      <XCircle className="w-3.5 h-3.5" /> Đã từ chối
                    </span>
                  )}
                </div>
              </div>

              {/* Tầng 1: Quyền duyệt của Giáo viên */}
              {isTeacherPending && (
                <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="text-xs">
                    <p className="font-bold text-amber-400">Kiểm duyệt lớp học (Giáo viên phụ trách):</p>
                    <p className="text-[11px] text-tod-text-muted">
                      Rà soát nội dung trước khi thông báo tới các phụ huynh khác trong lớp
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleTeacherReview(story.id, false)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 border border-tod-border transition-all cursor-pointer"
                    >
                      Từ chối
                    </button>
                    <button
                      onClick={() => handleTeacherReview(story.id, true)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 text-zinc-950 hover:bg-emerald-400 flex items-center gap-1 transition-all cursor-pointer shadow-md shadow-emerald-500/20"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Phê duyệt cho lớp</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Tầng 2: Quyết định độc lập của từng Phụ huynh nhận */}
              {isTeacherApproved && (
                <div className="space-y-2 pt-2 border-t border-tod-border/40">
                  <p className="text-[11px] font-bold text-tod-text-muted uppercase tracking-wider">
                    Quyền đồng ý của phụ huynh nhận ({story.recipients.length}):
                  </p>
                  <div className="space-y-1.5">
                    {story.recipients.map((rec) => {
                      const isAccepted = rec.status === RecipientStatus.Accepted;
                      const isPending = rec.status === RecipientStatus.Pending;

                      return (
                        <div
                          key={rec.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-tod-surface/60 border border-tod-border text-xs"
                        >
                          <div>
                            <span className="font-extrabold text-tod-text">{rec.recipientName}</span>
                            <span className="text-[11px] text-tod-text-muted ml-2">
                              (Cho bé: {rec.childName})
                            </span>
                          </div>

                          <div>
                            {isAccepted ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-400">
                                <CheckCircle2 className="w-3 h-3" /> Đã nhận vào kệ sách bé
                              </span>
                            ) : isPending ? (
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleParentResponse(story.id, rec.id, false)}
                                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-zinc-400 hover:text-tod-text hover:bg-tod-surface transition-all cursor-pointer"
                                >
                                  Từ chối
                                </button>
                                <button
                                  onClick={() => handleParentResponse(story.id, rec.id, true)}
                                  className="px-3 py-1 rounded-lg text-[11px] font-bold bg-indigo-500 text-white hover:bg-indigo-400 transition-all cursor-pointer shadow-sm"
                                >
                                  Đồng ý cho bé đọc
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-zinc-500">Đã từ chối nhận</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
