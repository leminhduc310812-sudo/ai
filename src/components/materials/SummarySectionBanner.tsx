import React from 'react';
import { Sparkles, BookOpen, BookmarkCheck, ArrowRight, RefreshCw, Database, Eye, FileText, CheckCircle2 } from 'lucide-react';
import { StudySummary, StudyMaterialSource } from '../../types';

interface SummarySectionBannerProps {
  summary: StudySummary | null;
  subjectName: string;
  sourceCount: number;
  onOpenSummaryModal: () => void;
  onGenerateSummary: () => void;
  isGenerating: boolean;
  generationStep: string;
}

export const SummarySectionBanner: React.FC<SummarySectionBannerProps> = ({
  summary,
  subjectName,
  sourceCount,
  onOpenSummaryModal,
  onGenerateSummary,
  isGenerating,
  generationStep,
}) => {
  return (
    <div
      id="summary-section-banner"
      className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-900/40 hover:border-indigo-800/60 rounded-3xl p-5 shadow-xl transition-all relative overflow-hidden"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left Information */}
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>AI Tổng Hợp Trọng Tâm</span>
            </span>

            {summary ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-[11px] font-medium">
                <Database className="w-3 h-3" />
                <span>Đã có tóm tắt trong LocalStorage</span>
              </span>
            ) : (
              <span className="text-slate-400 text-xs">
                Dựa trên {sourceCount} nguồn học liệu của môn học
              </span>
            )}
          </div>

          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <span>Tóm Tắt & Điểm Cốt Lõi: {subjectName}</span>
          </h2>

          {summary ? (
            <div className="space-y-2">
              <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 leading-relaxed bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/60 font-sans">
                "{summary.summary}"
              </p>

              {/* Key points preview pills */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[11px] text-slate-400 font-semibold">Ý cốt lõi:</span>
                {summary.keyPoints.slice(0, 2).map((kp, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/60 text-[11px] truncate max-w-xs"
                  >
                    <BookmarkCheck className="w-3 h-3 text-indigo-400 shrink-0" />
                    <span className="truncate">{kp.point}</span>
                  </span>
                ))}
                {summary.keyPoints.length > 2 && (
                  <span className="text-[10px] text-indigo-300 font-medium">
                    +{summary.keyPoints.length - 2} ý nữa
                  </span>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 leading-relaxed">
              Nhấn nút bên dưới để AI tự động phân tích tất cả các nguồn học liệu đã thêm trong môn này, tạo bản tóm tắt ngắn gọn và trích xuất các điểm cốt lõi, từ vựng tiêu biểu cùng lưu ý phát âm!
            </p>
          )}
        </div>

        {/* Right CTA Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
          {summary ? (
            <>
              <button
                type="button"
                id="btn-view-summary-detail"
                onClick={onOpenSummaryModal}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer whitespace-nowrap"
              >
                <Eye className="w-4 h-4" />
                <span>Xem Toàn Bộ Summary & Key Points</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onGenerateSummary}
                disabled={isGenerating || sourceCount === 0}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                title="Tạo lại bản tóm tắt mới nhất từ các nguồn học liệu"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>{isGenerating ? 'Đang tạo...' : 'Làm mới AI'}</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              id="btn-generate-subject-summary"
              onClick={onGenerateSummary}
              disabled={isGenerating || sourceCount === 0}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-400 hover:to-sky-400 active:scale-95 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? generationStep || 'AI Đang Tổng Hợp...' : '✨ Tạo Summary & Key Points Chủ Đề'}</span>
              {!isGenerating && <ArrowRight className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
