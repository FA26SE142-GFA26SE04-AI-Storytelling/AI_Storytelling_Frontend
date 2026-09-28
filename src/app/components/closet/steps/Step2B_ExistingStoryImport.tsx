'use client';

import React, { useState, useRef } from 'react';
import {
  FileText,
  UploadCloud,
  FileUp,
  Loader2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { existingStoryService } from '../../../services/existingStoryService';
import { ChildProfile } from '../../../types/childProfile';
import { ExistingStoryEvaluationDto } from '../../../types/story';
import { EvaluationBranchingCard } from '../subcomponents/EvaluationBranchingCard';

export interface Step2B_ExistingStoryImportProps {
  selectedChild: ChildProfile | null;
  onProceedToConvergence: (storyId: number) => void;
  onBack: () => void;
}

export const Step2B_ExistingStoryImport: React.FC<Step2B_ExistingStoryImportProps> = ({
  selectedChild,
  onProceedToConvergence,
  onBack,
}) => {
  // Input method: 'file' or 'paste'
  const [inputMethod, setInputMethod] = useState<'file' | 'paste'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [storyTitle, setStoryTitle] = useState<string>('');
  const [pastedContent, setPastedContent] = useState<string>('');

  // Processing & State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [importedStoryId, setImportedStoryId] = useState<number | null>(null);
  const [importedVersionId, setImportedVersionId] = useState<number | null>(null);
  const [evaluation, setEvaluation] = useState<ExistingStoryEvaluationDto | null>(null);

  // Manual edit modal/state
  const [isManualEditing, setIsManualEditing] = useState<boolean>(false);
  const [manualTitle, setManualTitle] = useState<string>('');
  const [manualContent, setManualContent] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('Dung lượng tệp vượt quá 5MB. Vui lòng chọn tệp nhỏ hơn.');
        return;
      }
      setSelectedFile(file);
      if (!storyTitle) {
        setStoryTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
      setErrorMessage(null);
    }
  };

  // Submit file or text for import & evaluation (Step B1 & B2)
  const handleImportAndEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsProcessing(true);

    try {
      let storyId: number | null = null;
      let versionId: number | null = null;

      if (inputMethod === 'file') {
        if (!selectedFile) {
          setErrorMessage('Vui lòng chọn một tệp văn bản (.docx hoặc .txt).');
          setIsProcessing(false);
          return;
        }

        const formData = new FormData();
        formData.append('File', selectedFile);
        formData.append('Title', storyTitle || selectedFile.name);
        formData.append('ChildProfileId', String(selectedChild?.id ?? 1));
        formData.append('Language', 'vi');

        const importRes = await existingStoryService.importStoryFile(formData);
        if (importRes.success && importRes.data) {
          storyId = importRes.data.storyId;
          versionId = importRes.data.storyVersionId;
        } else {
          setErrorMessage(importRes.message || 'Không thể nhập tệp câu chuyện.');
          setIsProcessing(false);
          return;
        }
      } else {
        if (!pastedContent.trim()) {
          setErrorMessage('Vui lòng dán nội dung văn bản câu chuyện.');
          setIsProcessing(false);
          return;
        }

        const importRes = await existingStoryService.importStory({
          title: storyTitle || 'Truyện Đã Nhập',
          content: pastedContent.trim(),
          childProfileId: selectedChild?.id ?? 1,
          language: 'vi',
          idempotencyKey: `import-paste-${Date.now()}`,
        });

        if (importRes.success && importRes.data) {
          storyId = importRes.data.storyId;
          versionId = importRes.data.storyVersionId;
        } else {
          setErrorMessage(importRes.message || 'Không thể lưu câu chuyện dán.');
          setIsProcessing(false);
          return;
        }
      }

      setImportedStoryId(storyId);
      setImportedVersionId(versionId);

      // Evaluate the imported version (Step B2)
      if (storyId && versionId) {
        const evalRes = await existingStoryService.evaluateStory(storyId, versionId);
        if (evalRes.success && evalRes.data) {
          setEvaluation(evalRes.data);
          setManualTitle(storyTitle);
          setManualContent(pastedContent);
        } else {
          setErrorMessage(evalRes.message || 'Lỗi khi đánh giá độ phù hợp của truyện.');
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Lỗi kết nối khi gửi câu chuyện.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Keep original and proceed to convergence (Step B3 branch 1)
  const handleKeepOriginal = async () => {
    if (!importedStoryId || !importedVersionId) return;
    setIsProcessing(true);
    try {
      const res = await existingStoryService.keepOriginal(importedStoryId, {
        storyId: importedStoryId,
        storyVersionId: importedVersionId,
      });
      if (res.success) {
        onProceedToConvergence(importedStoryId);
      } else {
        setErrorMessage(res.message || 'Không thể lưu phiên bản gốc.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Adapt with AI (Step B3 branch 2 option A)
  const handleAdapt = async () => {
    if (!importedStoryId || !importedVersionId) return;
    setIsProcessing(true);
    try {
      const res = await existingStoryService.adaptStory(importedStoryId, {
        storyId: importedStoryId,
        storyVersionId: importedVersionId,
        adaptationPrompt: 'Rút gọn các câu dài, sử dụng từ ngữ trong sáng và gần gũi với bé',
      });
      if (res.success && res.data) {
        // Re-evaluate adapted version
        const newVerId = res.data.storyVersionId;
        setImportedVersionId(newVerId);
        const evalRes = await existingStoryService.evaluateStory(importedStoryId, newVerId);
        if (evalRes.success && evalRes.data) {
          setEvaluation(evalRes.data);
        }
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Save manual edit
  const handleSaveManualEdit = async () => {
    if (!importedStoryId || !importedVersionId) return;
    setIsProcessing(true);
    try {
      const res = await existingStoryService.updateContent(importedStoryId, {
        storyId: importedStoryId,
        storyVersionId: importedVersionId,
        title: manualTitle,
        content: manualContent,
      });
      if (res.success && res.data) {
        setIsManualEditing(false);
        const newVerId = res.data.storyVersionId;
        setImportedVersionId(newVerId);
        const evalRes = await existingStoryService.evaluateStory(importedStoryId, newVerId);
        if (evalRes.success && evalRes.data) {
          setEvaluation(evalRes.data);
        }
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Archive story (Step B3 branch 3)
  const handleArchive = async () => {
    if (!importedStoryId || !importedVersionId) return;
    setIsProcessing(true);
    try {
      await existingStoryService.archiveStory(importedStoryId, {
        storyId: importedStoryId,
        storyVersionId: importedVersionId,
        reason: 'Phụ huynh chọn bỏ qua truyện này',
      });
      onBack();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-5">
      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-600 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 dark:text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* CHƯA CÓ KẾT QUẢ ĐÁNH GIÁ: HIỂN THỊ FORM NHẬP / TẢI TỆP */}
      {!evaluation && (
        <form onSubmit={handleImportAndEvaluate} className="space-y-4">
          {/* Tabs Chọn Hình Thức Nhập */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-tod-card border border-tod-border w-fit shadow-sm transition-colors duration-500">
            <button
              type="button"
              onClick={() => setInputMethod('file')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                inputMethod === 'file'
                  ? 'bg-amber-500 text-zinc-950 font-black shadow-md'
                  : 'text-tod-text-muted hover:text-tod-text'
              }`}
            >
              <UploadCloud className="w-4 h-4" /> Tải lên tệp Word/Text (.docx, .txt)
            </button>
            <button
              type="button"
              onClick={() => setInputMethod('paste')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                inputMethod === 'paste'
                  ? 'bg-amber-500 text-zinc-950 font-black shadow-md'
                  : 'text-tod-text-muted hover:text-tod-text'
              }`}
            >
              <FileText className="w-4 h-4" /> Dán đoạn văn trực tiếp
            </button>
          </div>

          {/* Tiêu đề truyện */}
          <div className="p-3.5 rounded-2xl bg-tod-card border border-tod-border shadow-sm transition-colors duration-500">
            <label className="text-[11px] font-bold text-tod-text-muted block mb-1">
              Tiêu đề câu chuyện (Tùy chọn)
            </label>
            <input
              type="text"
              value={storyTitle}
              onChange={(e) => setStoryTitle(e.target.value)}
              className="w-full text-xs text-tod-text bg-tod-surface/90 border border-tod-border rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 transition-colors"
              placeholder="Ví dụ: Rùa và Thỏ, Cô bé quàng khăn đỏ..."
            />
          </div>

          {/* Vùng Dropzone Tệp hoặc Vùng Textarea */}
          {inputMethod === 'file' ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-8 rounded-3xl border-2 border-dashed border-tod-border hover:border-amber-500/80 bg-tod-card/50 hover:bg-tod-card text-center transition-all cursor-pointer space-y-3"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.docx"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/30">
                <FileUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-tod-text">
                  {selectedFile ? (
                    <span className="text-amber-500 dark:text-amber-400 font-black">{selectedFile.name}</span>
                  ) : (
                    'Nhấn để chọn tệp Word (.docx) hoặc Text (.txt) từ máy tính'
                  )}
                </p>
                <p className="text-[11px] text-tod-text-muted mt-1">Dung lượng hỗ trợ tối đa 5 MB</p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-tod-card border border-tod-border shadow-sm transition-colors duration-500">
              <label className="text-[11px] font-bold text-tod-text-muted block mb-1">
                Nội dung câu chuyện
              </label>
              <textarea
                value={pastedContent}
                onChange={(e) => setPastedContent(e.target.value)}
                rows={6}
                className="w-full text-xs text-tod-text bg-tod-surface/90 border border-tod-border rounded-xl p-3 focus:outline-none focus:border-amber-500 leading-relaxed placeholder:text-tod-text-muted/60 transition-colors"
                placeholder="Dán toàn văn câu chuyện hoặc bài đọc vào đây..."
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 rounded-xl text-xs font-bold text-tod-text-muted hover:text-tod-text transition-colors cursor-pointer"
            >
              Quay lại chọn hình thức
            </button>
            <button
              type="submit"
              disabled={isProcessing || (inputMethod === 'file' ? !selectedFile : !pastedContent.trim())}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-zinc-950 font-black text-xs flex items-center gap-2 shadow-xl shadow-amber-950/20 transition-all cursor-pointer hover:scale-[1.02] disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Đang thẩm định truyện...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Thẩm Định & Phân Tích Độ Tuổi
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* ĐÃ CÓ KẾT QUẢ ĐÁNH GIÁ (STEP B3 BRANCHING) */}
      {evaluation && !isManualEditing && (
        <div className="space-y-4">
          <EvaluationBranchingCard
            evaluation={evaluation}
            onKeepOriginal={handleKeepOriginal}
            onAdapt={handleAdapt}
            onManualEdit={() => setIsManualEditing(true)}
            onArchive={handleArchive}
            isLoadingAction={isProcessing}
          />
          <div className="text-right">
            <button
              type="button"
              onClick={() => {
                setEvaluation(null);
                setSelectedFile(null);
                setPastedContent('');
              }}
              className="text-xs text-tod-text-muted hover:text-tod-text underline cursor-pointer"
            >
              Tải lên hoặc dán tệp truyện khác
            </button>
          </div>
        </div>
      )}

      {/* CHỈNH SỬA THỦ CÔNG */}
      {isManualEditing && (
        <div className="p-5 rounded-2xl bg-tod-card border border-tod-border space-y-4 shadow-xl transition-colors duration-500">
          <h4 className="text-sm font-extrabold text-tod-text flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-500" /> Tự tay chỉnh sửa lại lời văn cho bé
          </h4>
          <input
            type="text"
            value={manualTitle}
            onChange={(e) => setManualTitle(e.target.value)}
            className="w-full text-xs text-tod-text bg-tod-surface/90 border border-tod-border rounded-xl px-3 py-2 transition-colors"
            placeholder="Tiêu đề truyện..."
          />
          <textarea
            value={manualContent}
            onChange={(e) => setManualContent(e.target.value)}
            rows={8}
            className="w-full text-xs text-tod-text bg-tod-surface/90 border border-tod-border rounded-xl p-3 leading-relaxed transition-colors"
            placeholder="Nội dung truyện..."
          />
          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsManualEditing(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-tod-text-muted hover:text-tod-text cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleSaveManualEdit}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs cursor-pointer"
            >
              Lưu & Đánh giá lại
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
