'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  X,
  CheckCheck,
  AlertCircle,
  AlertTriangle,
  Sparkles,
  Share2,
  ShieldAlert,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { flow4Service } from '../../../services/flow4Service';
import { Flow4NotificationItem, Flow4NotificationType } from '../../../types/flow4Types';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction?: (type: Flow4NotificationType) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  onSelectAction,
}) => {
  const [notifications, setNotifications] = useState<Flow4NotificationItem[]>([]);

  const loadNotifications = () => {
    setNotifications(flow4Service.getNotifications());
  };

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
      flow4Service.fetchNotificationsFromApi().then((items) => {
        if (items && items.length > 0) {
          setNotifications(items);
        }
      });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleUpdate = () => {
      loadNotifications();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('flow4:notifications-updated', handleUpdate);
      return () => {
        window.removeEventListener('flow4:notifications-updated', handleUpdate);
      };
    }
  }, []);

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = () => {
    flow4Service.markAllNotificationsAsRead();
    loadNotifications();
  };

  const handleItemClick = (item: Flow4NotificationItem) => {
    if (!item.isRead) {
      flow4Service.markNotificationAsRead(item.id);
      loadNotifications();
    }
    if (onSelectAction) {
      onSelectAction(item.type);
    }
  };

  const getNotificationIcon = (type: Flow4NotificationType) => {
    switch (type) {
      case Flow4NotificationType.AssignmentCancelled:
        return <AlertCircle className="w-5 h-5 text-rose-400" />;
      case Flow4NotificationType.HoldModeAlert:
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case Flow4NotificationType.TeacherInteractionScore:
        return <Sparkles className="w-5 h-5 text-sky-400" />;
      case Flow4NotificationType.StoryShared:
        return <Share2 className="w-5 h-5 text-purple-400" />;
      case Flow4NotificationType.ContentReported:
      case Flow4NotificationType.ContentReportResolved:
        return <ShieldAlert className="w-5 h-5 text-emerald-400" />;
      default:
        return <Bell className="w-5 h-5 text-indigo-400" />;
    }
  };

  const getNotificationBadge = (type: Flow4NotificationType) => {
    switch (type) {
      case Flow4NotificationType.AssignmentCancelled:
        return <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">Hủy Bài Tập</span>;
      case Flow4NotificationType.HoldModeAlert:
        return <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">Chế Độ Hỗ Trợ</span>;
      case Flow4NotificationType.TeacherInteractionScore:
        return <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">+1 Sao Tương Tác</span>;
      case Flow4NotificationType.StoryShared:
        return <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">Truyện Lớp Học</span>;
      case Flow4NotificationType.ContentReported:
      case Flow4NotificationType.ContentReportResolved:
        return <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">An Toàn</span>;
      default:
        return <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">Thông Báo</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end pointer-events-auto bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md h-full bg-tod-surface border-l border-tod-border shadow-2xl flex flex-col backdrop-blur-2xl text-tod-text">
        {/* Drawer Header */}
        <div className="p-4 border-b border-tod-border flex items-center justify-between bg-tod-card/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-tod-text">Hộp Thư Thông Báo</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse">
                    {unreadCount} mới
                  </span>
                )}
              </div>
              <p className="text-[11px] text-tod-text-muted">
                Cập nhật bài tập, điểm thưởng và an toàn sư phạm
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="p-1.5 rounded-lg text-tod-text-muted hover:text-tod-text hover:bg-tod-card transition-all cursor-pointer"
                title="Đánh dấu tất cả là đã đọc"
              >
                <CheckCheck className="w-4 h-4 text-emerald-400" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-tod-text-muted hover:text-tod-text hover:bg-tod-card transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 dashboard-scrollbar">
          {notifications.length === 0 ? (
            <div className="text-center py-16 space-y-2 text-tod-text-muted">
              <CheckCircle2 className="w-10 h-10 text-emerald-400/60 mx-auto" />
              <p className="text-xs font-bold">Không có thông báo mới nào</p>
              <p className="text-[11px] opacity-70">Các thông báo mới về bài tập và học tập sẽ xuất hiện tại đây</p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  item.isRead
                    ? 'bg-tod-card/40 border-tod-border opacity-85 hover:opacity-100 hover:border-indigo-500/30'
                    : 'bg-indigo-950/20 border-indigo-500/40 shadow-sm shadow-indigo-500/10 hover:border-indigo-400'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-tod-card border border-tod-border shrink-0 mt-0.5">
                    {getNotificationIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className={`text-xs font-bold truncate ${item.isRead ? 'text-tod-text' : 'text-indigo-200'}`}>
                        {item.title}
                      </h4>
                      {getNotificationBadge(item.type)}
                    </div>
                    <p className="text-xs text-tod-text-muted leading-relaxed line-clamp-3">
                      {item.message}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2 text-[10px] text-tod-text-muted opacity-70">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(item.createdAt).toLocaleString('vi-VN')}</span>
                      {!item.isRead && (
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 ml-auto shrink-0" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
