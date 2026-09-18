'use client';

import React from 'react';
import {
  Shield,
  X,
  Info,
  AlertCircle,
  RefreshCw,
  BarChart3,
  BookOpen,
  ShieldCheck,
} from 'lucide-react';
import {
  SupervisionRelationship,
  SupervisionPermissionKey,
  SYSTEM_PERMISSIONS_LIST,
} from '../../../types/childProfile';

export interface SupervisionPermissionsModalProps {
  targetSupervisor: SupervisionRelationship | null;
  childNickname: string;
  onClose: () => void;
  supervisorPermissions: string[];
  isLoadingPermissions: boolean;
  permissionModalError: string | null;
  togglingPermissionKey: string | null;
  handleTogglePermission: (key: SupervisionPermissionKey) => void;
}

export const SupervisionPermissionsModal: React.FC<SupervisionPermissionsModalProps> = ({
  targetSupervisor,
  childNickname,
  onClose,
  supervisorPermissions,
  isLoadingPermissions,
  permissionModalError,
  togglingPermissionKey,
  handleTogglePermission,
}) => {
  if (!targetSupervisor) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl max-h-[85vh] rounded-3xl bg-zinc-950 border border-sky-500/40 shadow-2xl flex flex-col overflow-hidden text-white">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 bg-gradient-to-r from-sky-950/60 via-zinc-900 to-zinc-950 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-300 shadow-md">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
                <span>Phân Quyền Giám Sát</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-950 border border-sky-500/40 text-sky-300 font-mono">
                  Supervisor #{targetSupervisor.supervisorUserId}
                </span>
              </h3>
              <p className="text-[11px] text-zinc-400">
                Hồ sơ bé: <strong className="text-zinc-200">{childNickname}</strong> (Mối quan hệ #{targetSupervisor.id})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Summary Banner */}
        <div className="px-4 py-2.5 bg-zinc-900/60 border-b border-zinc-800/80 flex items-center justify-between text-xs shrink-0">
          <span className="text-zinc-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-sky-400" />
            Quyền có hiệu lực tức thời khi bật/tắt
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 border border-sky-500/30 text-sky-300 font-extrabold text-[11px]">
            {supervisorPermissions.length} / {SYSTEM_PERMISSIONS_LIST.length} Quyền Đã Cấp
          </span>
        </div>

        {permissionModalError && (
          <div className="m-4 p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{permissionModalError}</span>
          </div>
        )}

        {/* Modal Body: List of Permissions */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 dashboard-scrollbar">
          {isLoadingPermissions ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-zinc-400 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin text-sky-400" />
              <span>Đang tải danh sách quyền từ hệ thống...</span>
            </div>
          ) : (
            <>
              {/* Group 1: Monitoring */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5" />
                  1. Giám Sát & Báo Cáo Tiến Trình
                </span>
                <div className="space-y-2">
                  {SYSTEM_PERMISSIONS_LIST.filter((p) => p.category === 'monitoring').map((perm) => {
                    const isGranted = supervisorPermissions.includes(perm.key);
                    const isToggling = togglingPermissionKey === perm.key;

                    return (
                      <div
                        key={perm.key}
                        className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                          isGranted
                            ? 'bg-sky-950/30 border-sky-500/40 shadow-sm'
                            : 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>{perm.label}</span>
                          </span>
                          <p className="text-[11px] text-zinc-400 leading-relaxed">{perm.description}</p>
                        </div>

                        <button
                          type="button"
                          disabled={isToggling}
                          onClick={() => handleTogglePermission(perm.key)}
                          className={`w-12 h-6 rounded-full transition-all relative cursor-pointer shrink-0 disabled:opacity-50 ${
                            isGranted ? 'bg-sky-500' : 'bg-zinc-700'
                          }`}
                          title={isGranted ? 'Bấm để thu hồi quyền' : 'Bấm để cấp quyền'}
                        >
                          <div
                            className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform flex items-center justify-center ${
                              isGranted ? 'left-7' : 'left-1'
                            }`}
                          >
                            {isToggling && <RefreshCw className="w-2.5 h-2.5 animate-spin text-zinc-900" />}
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Group 2: Content & Story */}
              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  2. Quản Lý Truyện & Cấp Độ Đọc
                </span>
                <div className="space-y-2">
                  {SYSTEM_PERMISSIONS_LIST.filter((p) => p.category === 'content').map((perm) => {
                    const isGranted = supervisorPermissions.includes(perm.key);
                    const isToggling = togglingPermissionKey === perm.key;

                    return (
                      <div
                        key={perm.key}
                        className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                          isGranted
                            ? 'bg-purple-950/30 border-purple-500/40 shadow-sm'
                            : 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>{perm.label}</span>
                          </span>
                          <p className="text-[11px] text-zinc-400 leading-relaxed">{perm.description}</p>
                        </div>

                        <button
                          type="button"
                          disabled={isToggling}
                          onClick={() => handleTogglePermission(perm.key)}
                          className={`w-12 h-6 rounded-full transition-all relative cursor-pointer shrink-0 disabled:opacity-50 ${
                            isGranted ? 'bg-purple-500' : 'bg-zinc-700'
                          }`}
                          title={isGranted ? 'Bấm để thu hồi quyền' : 'Bấm để cấp quyền'}
                        >
                          <div
                            className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform flex items-center justify-center ${
                              isGranted ? 'left-7' : 'left-1'
                            }`}
                          >
                            {isToggling && <RefreshCw className="w-2.5 h-2.5 animate-spin text-zinc-900" />}
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Group 3: Safety Settings */}
              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  3. Quản Lý An Toàn & Bộ Lọc Nội Dung
                </span>
                <div className="space-y-2">
                  {SYSTEM_PERMISSIONS_LIST.filter((p) => p.category === 'safety').map((perm) => {
                    const isGranted = supervisorPermissions.includes(perm.key);
                    const isToggling = togglingPermissionKey === perm.key;

                    return (
                      <div
                        key={perm.key}
                        className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                          isGranted
                            ? 'bg-emerald-950/30 border-emerald-500/40 shadow-sm'
                            : 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>{perm.label}</span>
                          </span>
                          <p className="text-[11px] text-zinc-400 leading-relaxed">{perm.description}</p>
                        </div>

                        <button
                          type="button"
                          disabled={isToggling}
                          onClick={() => handleTogglePermission(perm.key)}
                          className={`w-12 h-6 rounded-full transition-all relative cursor-pointer shrink-0 disabled:opacity-50 ${
                            isGranted ? 'bg-emerald-500' : 'bg-zinc-700'
                          }`}
                          title={isGranted ? 'Bấm để thu hồi quyền' : 'Bấm để cấp quyền'}
                        >
                          <div
                            className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform flex items-center justify-center ${
                              isGranted ? 'left-7' : 'left-1'
                            }`}
                          >
                            {isToggling && <RefreshCw className="w-2.5 h-2.5 animate-spin text-zinc-900" />}
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/90 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-zinc-400 font-medium">
            Thay đổi quyền hạn được lưu và áp dụng ngay lập tức
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs cursor-pointer transition-colors"
          >
            Hoàn Tất & Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
