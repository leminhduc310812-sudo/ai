import React from 'react';
import { Sparkles, CheckCircle2, AlertTriangle, XCircle, ArrowRight, Zap, Target, BookOpen } from 'lucide-react';
import { AiEvaluationResult } from '../types';

interface AiFeedbackPanelProps {
  evaluation: AiEvaluationResult | null;
  isLoading: boolean;
  onApplyPersonalizedDrill: (drillText: string, drillIpa: string) => void;
}

export const AiFeedbackPanel: React.FC<AiFeedbackPanelProps> = ({
  evaluation,
  isLoading,
  onApplyPersonalizedDrill,
}) => {
  if (isLoading) {
    return (
      <div id="ai-feedback-loading" className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center animate-pulse">
        <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-400 mx-auto flex items-center justify-center mb-4">
          <Sparkles className="w-6 h-6 animate-spin" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">EchoLingo AI đang phân tích phát âm...</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Đang rà soát từng âm vị (phonemes), độ nhấn trọng âm, âm đuôi và so sánh với mô hình ngữ âm chuẩn bản xứ.
        </p>
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div id="ai-feedback-empty" className="bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl p-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 mx-auto flex items-center justify-center mb-3">
          <Target className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-200 mb-1">Chưa có kết quả phân tích</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Thu âm hoặc nhấn <span className="text-sky-400 font-medium">"Xem xét tập bằng AI"</span> để nhận phân tích chi tiết từng âm tiết, khẩu hình miệng và bài tập khắc phục cá nhân.
        </p>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (score >= 70) return 'text-sky-400 border-sky-500/30 bg-sky-500/10';
    if (score >= 50) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
  };

  return (
    <div id="ai-feedback-panel" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Title & Overall Score Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-sky-400" />
            <h3 className="text-lg font-bold text-white tracking-tight">
              Đánh Giá Cá Nhân Hoá từ AI
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Mục tiêu: <span className="font-semibold text-slate-200">"{evaluation.targetText}"</span>
          </p>
        </div>

        {/* Big Overall Score Badge */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Điểm tổng quan</span>
            <span className="text-xs font-medium text-slate-300">
              {evaluation.overallScore >= 80 ? 'Rất tốt' : evaluation.overallScore >= 65 ? 'Khá' : 'Cần cải thiện'}
            </span>
          </div>
          <div
            id="overall-score-badge"
            className={`w-16 h-16 rounded-2xl border flex items-center justify-center font-['Space_Grotesk'] text-2xl font-black shadow-inner ${getScoreColor(
              evaluation.overallScore
            )}`}
          >
            {evaluation.overallScore}
          </div>
        </div>
      </div>

      {/* Sub-scores Metrics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-800 text-center">
          <span className="text-[11px] text-slate-400 block mb-1">Độ chuẩn âm vị</span>
          <span className="text-lg font-bold text-sky-400">{evaluation.accuracyScore}%</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-800 text-center">
          <span className="text-[11px] text-slate-400 block mb-1">Trọng âm & Nhịp</span>
          <span className="text-lg font-bold text-indigo-400">{evaluation.stressScore}%</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-800 text-center">
          <span className="text-[11px] text-slate-400 block mb-1">Độ trôi chảy</span>
          <span className="text-lg font-bold text-emerald-400">{evaluation.fluencyScore}%</span>
        </div>
      </div>

      {/* Clarity Summary */}
      <div className="p-3.5 rounded-xl bg-slate-800/30 border border-slate-700/50 text-xs text-slate-300 leading-relaxed">
        <span className="font-semibold text-white block mb-1">Nhận xét độ rõ:</span>
        {evaluation.clarityAssessment}
      </div>

      {/* Phoneme Breakdown */}
      {evaluation.phonemeBreakdown && evaluation.phonemeBreakdown.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-sky-400" />
            Chi tiết từng âm vị (Phoneme Breakdown):
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {evaluation.phonemeBreakdown.map((item, idx) => {
              const isGood = item.status === 'excellent' || item.status === 'good';
              return (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-start gap-2.5"
                >
                  <div className="mt-0.5">
                    {isGood ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-sm text-sky-300">
                        {item.phoneme}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400">
                        {item.soundType} ({item.accuracy}%)
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-normal">
                      {item.feedback}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Detected Errors */}
      {evaluation.detectedErrors && evaluation.detectedErrors.length > 0 && (
        <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/40">
          <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5" />
            Lỗi phát âm phát hiện được:
          </h4>
          <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
            {evaluation.detectedErrors.map((err, idx) => (
              <li key={idx} className="leading-relaxed">
                {err}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Anatomical Mouth Positioning Advice */}
      {evaluation.mouthPositionAdvice && (
        <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
          <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" />
            Hướng dẫn khẩu hình & vị trí đặt cơ miệng:
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="font-semibold text-slate-200 block mb-1">👅 Vị trí lưỡi:</span>
              <p className="text-slate-300 leading-relaxed">{evaluation.mouthPositionAdvice.tongue}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="font-semibold text-slate-200 block mb-1">👄 Khẩu hình môi:</span>
              <p className="text-slate-300 leading-relaxed">{evaluation.mouthPositionAdvice.lips}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="font-semibold text-slate-200 block mb-1">💨 Luồng hơi:</span>
              <p className="text-slate-300 leading-relaxed">{evaluation.mouthPositionAdvice.airflow}</p>
            </div>
          </div>
        </div>
      )}

      {/* AI Personalized Next Drill */}
      {evaluation.personalizedDrill && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-sky-950/40 to-indigo-950/40 border border-sky-800/40">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-sky-300 uppercase tracking-wider mb-1">
                <BookOpen className="w-4 h-4 text-sky-400" />
                <span>Bài tập cá nhân hoá tiếp theo (AI đề xuất):</span>
              </div>
              <h5 className="font-bold text-white text-base font-['Space_Grotesk']">
                {evaluation.personalizedDrill.exerciseText}{' '}
                {evaluation.personalizedDrill.exerciseIpa && (
                  <span className="text-sky-400 font-mono text-xs font-normal">
                    {evaluation.personalizedDrill.exerciseIpa}
                  </span>
                )}
              </h5>
              <p className="text-xs text-slate-300 mt-1">
                {evaluation.personalizedDrill.practiceReason}
              </p>
            </div>

            <button
              id="btn-apply-drill"
              onClick={() =>
                onApplyPersonalizedDrill(
                  evaluation.personalizedDrill.exerciseText,
                  evaluation.personalizedDrill.exerciseIpa
                )
              }
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 active:scale-95 text-white text-xs font-bold shadow-md shadow-sky-500/20 transition-all cursor-pointer whitespace-nowrap"
            >
              <span>Luyện bài này</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Coach Note */}
      {evaluation.coachNote && (
        <div className="text-xs text-slate-400 italic bg-slate-900/40 p-3 rounded-lg border border-slate-800">
          <span className="text-slate-300 font-medium">💬 Lời khuyên từ AI Coach: </span>
          {evaluation.coachNote}
        </div>
      )}
    </div>
  );
};
