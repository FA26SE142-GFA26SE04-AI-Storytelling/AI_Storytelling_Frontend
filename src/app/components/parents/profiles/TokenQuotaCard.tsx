'use client';

import React from 'react';
import { Coins, Zap, RefreshCw } from 'lucide-react';
import { TokenQuotaStatus } from '../../../types/childProfile';

export interface TokenQuotaCardProps {
  tokenQuota: TokenQuotaStatus | null;
  isLoadingDetail: boolean;
  onRefresh: () => void;
}

export const TokenQuotaCard: React.FC<TokenQuotaCardProps> = ({
  tokenQuota,
  isLoadingDetail,
  onRefresh,
}) => {
  return (
    <div className="laptop-tab-content-row p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold text-zinc-200">
            Hạn Mức AI Tokens Của Bé
          </h3>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          title="Làm mới hạn mức"
          className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3 h-3 ${isLoadingDetail ? 'animate-spin text-sky-400' : ''}`} />
        </button>
      </div>

      {isLoadingDetail ? (
        <div className="py-4 flex items-center justify-center gap-2 text-zinc-400 text-xs">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
          <span>Đang nạp dữ liệu hạn mức token...</span>
        </div>
      ) : tokenQuota ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex flex-col gap-0.5">
            <span className="text-[10px] text-zinc-500 font-medium">Trạng thái gói</span>
            <span className="font-bold text-amber-300 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              {tokenQuota.isUnlimited ? 'Không giới hạn' : 'Có định mức'}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex flex-col gap-0.5">
            <span className="text-[10px] text-zinc-500 font-medium">Hạn mức tối đa</span>
            <span className="font-bold text-zinc-200">
              {tokenQuota.quotaLimit != null ? tokenQuota.quotaLimit.toLocaleString() : 'Vô hạn'}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex flex-col gap-0.5">
            <span className="text-[10px] text-zinc-500 font-medium">Đã sử dụng</span>
            <span className="font-bold text-sky-400">
              {tokenQuota.quotaUsed != null ? tokenQuota.quotaUsed.toLocaleString() : '0'}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex flex-col gap-0.5">
            <span className="text-[10px] text-zinc-500 font-medium">Còn lại</span>
            <span className="font-bold text-emerald-400">
              {tokenQuota.remaining != null ? tokenQuota.remaining.toLocaleString() : '∞'}
            </span>
          </div>
        </div>
      ) : (
        <div className="text-[11px] text-zinc-500 italic">
          Chưa có dữ liệu hạn mức token cho hồ sơ này.
        </div>
      )}
    </div>
  );
};
