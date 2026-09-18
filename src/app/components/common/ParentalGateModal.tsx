'use client';

import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { animateModalPop } from '../../utils/gsapAnimations';
import { Lock, ShieldAlert, X, CheckCircle, RefreshCw } from 'lucide-react';

gsap.registerPlugin(useGSAP);

export interface ParentalGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
}

export const ParentalGateModal: React.FC<ParentalGateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = 'Cổng Bảo Vệ Phụ Huynh (Parental Gate)',
  description = 'Để thoát phiên đọc của bé hoặc quay lại khu vực quản trị người lớn, vui lòng hoàn thành phép tính dưới đây:',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [numA, setNumA] = useState<number>(7);
  const [numB, setNumB] = useState<number>(8);
  const [answerInput, setAnswerInput] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const generateProblem = () => {
    const a = Math.floor(6 + Math.random() * 7); // 6 to 12
    const b = Math.floor(4 + Math.random() * 9); // 4 to 12
    setNumA(a);
    setNumB(b);
    setAnswerInput('');
    setErrorMsg(null);
  };

  useEffect(() => {
    if (isOpen) {
      generateProblem();
    }
  }, [isOpen]);

  useGSAP(() => {
    if (isOpen) {
      animateModalPop('.parental-gate-card');
    }
  }, { scope: modalRef, dependencies: [isOpen] });

  if (!isOpen) return null;

  const correctAnswer = numA * numB;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const val = parseInt(answerInput.trim(), 10);
    if (isNaN(val) || val !== correctAnswer) {
      setErrorMsg('Kết quả chưa chính xác. Vui lòng thử lại!');
      return;
    }

    onSuccess();
  };

  return (
    <div
      ref={modalRef}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 pointer-events-auto flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-lg overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="parental-gate-card pointer-events-auto w-full max-w-md rounded-3xl bg-zinc-950/95 border border-indigo-500/40 shadow-[0_25px_60px_rgba(0,0,0,0.9)] p-5 sm:p-6 text-white space-y-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">{title}</h3>
              <span className="text-[10px] text-zinc-400">Xác thực người lớn giám sát</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Prompt Description */}
        <p className="text-xs text-zinc-300 leading-relaxed">{description}</p>

        {/* Math Challenge Box */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-700 flex flex-col items-center justify-center gap-2">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Câu hỏi xác minh
            </span>
            <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400 tracking-wider">
              {numA} × {numB} = ?
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-zinc-300">Nhập kết quả phép nhân:</label>
            <input
              type="number"
              value={answerInput}
              onChange={(e) => {
                setAnswerInput(e.target.value);
                setErrorMsg(null);
              }}
              placeholder="VD: 56"
              autoFocus
              className="dashboard-input text-center text-lg font-black font-mono tracking-widest"
            />
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-medium text-center">
              {errorMsg}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={generateProblem}
              className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Đổi câu hỏi khác</span>
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black text-xs shadow-lg shadow-indigo-500/25 cursor-pointer transition-all hover:scale-105"
              >
                Xác Nhận Mở Khóa
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
