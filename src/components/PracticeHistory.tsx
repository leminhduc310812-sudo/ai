import React from 'react';
import { History, TrendingUp, AlertCircle, RotateCcw, Award } from 'lucide-react';
import { UserPracticeHistoryItem } from '../types';

interface PracticeHistoryProps {
  history: UserPracticeHistoryItem[];
  onSelectPracticeItem: (targetText: string, ipa: string) => void;
  onClearHistory: () => void;
}

export const PracticeHistory: React.FC<PracticeHistoryProps> = ({
  history,
  onSelectPracticeItem,
  onClearHistory,
}) => {
  if (history.length === 0) {
    return (
      <div id="practice-history-empty" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center">
        <History className="w-5 h-5 text-slate-500 mx-auto mb-2" />
        <p className="text-xs font-semibold text-slate-300">Lịch sử tập cá nhân trống</p>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Các bài phát âm bạn vừa thực hành sẽ được lưu tại đây để theo dõi tiến độ.
        </p>
      </div>
    );
  }

  // Calculate statistics
  const avgScore = Math.round(
    history.reduce((acc, curr) => acc + curr.overallScore, 0) / history.length
  );

  // Aggregate weak points
  const weakPointCounts: Record<string, number> = {};
  history.forEach((h) => {
    h.weakPoints?.forEach((w) => {
      weakPointCounts[w] = (weakPointCounts[w] || 0) + 1;
    });
  });
  const sortedWeakPoints = Object.entries(weakPointCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <div id="practice-history-panel" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-sky-400" />
          <h4 className="text-sm font-bold text-white">Lịch sử tập cá nhân</h4>
        </div>
        <button
          id="btn-clear-history"
          onClick={onClearHistory}
          className="text-[11px] text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
        >
          Xóa
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-800">
          <span className="text-[11px] text-slate-400 block">Điểm trung bình</span>
          <span className="text-base font-bold text-sky-400 font-['Space_Grotesk']">
            {avgScore}%
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-800">
          <span className="text-[11px] text-slate-400 block">Đã luyện tập</span>
          <span className="text-base font-bold text-emerald-400 font-['Space_Grotesk']">
            {history.length} lượt
          </span>
        </div>
      </div>

      {/* Weak points highlight */}
      {sortedWeakPoints.length > 0 && (
        <div className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-900/30 text-xs">
          <span className="font-semibold text-amber-400 flex items-center gap-1 mb-1">
            <AlertCircle className="w-3.5 h-3.5" />
            Âm hay gặp lỗi nhất:
          </span>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {sortedWeakPoints.map(([sound, count]) => (
              <span
                key={sound}
                className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px]"
              >
                {sound} ({count} lần)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent attempts list */}
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {history.slice(0, 8).map((item) => (
          <div
            key={item.id}
            className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800/80 flex items-center justify-between gap-2 hover:border-slate-700 transition-colors"
          >
            <div className="min-w-0 flex-1">
              <span className="font-semibold text-xs text-white truncate block">
                {item.targetText}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {item.ipa}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  item.overallScore >= 80
                    ? 'text-emerald-400 bg-emerald-500/10'
                    : item.overallScore >= 60
                    ? 'text-sky-400 bg-sky-500/10'
                    : 'text-rose-400 bg-rose-500/10'
                }`}
              >
                {item.overallScore}%
              </span>

              <button
                id={`btn-retake-${item.id}`}
                onClick={() => onSelectPracticeItem(item.targetText, item.ipa)}
                title="Luyện lại từ này"
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
