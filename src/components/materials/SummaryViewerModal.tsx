import React, { useState } from 'react';
import {
  Sparkles,
  BookOpen,
  Volume2,
  Mic,
  Copy,
  Check,
  X,
  Trash2,
  RefreshCw,
  Lightbulb,
  CheckCircle2,
  Database,
  ArrowRight,
  BookmarkCheck,
  Share2,
  Layers,
} from 'lucide-react';
import { StudySummary } from '../../types';

interface SummaryViewerModalProps {
  summary: StudySummary | null;
  isOpen: boolean;
  onClose: () => void;
  onRegenerate: () => void;
  onDelete?: (id: string) => void;
  onPracticeSentence: (sentence: string, contextTitle: string) => void;
  onCreateFlashcards?: (summary: StudySummary) => void;
  isGenerating?: boolean;
  generationStep?: string;
}

export const SummaryViewerModal: React.FC<SummaryViewerModalProps> = ({
  summary,
  isOpen,
  onClose,
  onRegenerate,
  onDelete,
  onPracticeSentence,
  onCreateFlashcards,
  isGenerating = false,
  generationStep = '',
}) => {
  const [copied, setCopied] = useState(false);
  const [activeSpeechWord, setActiveSpeechWord] = useState<string | null>(null);

  // Đóng modal khi nhấn phím Escape
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Speak word using Web Speech API
  const handleSpeak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.85; // tốc độ vừa phải cho học sinh
    setActiveSpeechWord(text);
    utterance.onend = () => setActiveSpeechWord(null);
    utterance.onerror = () => setActiveSpeechWord(null);
    window.speechSynthesis.speak(utterance);
  };

  const handleCopyAll = () => {
    if (!summary) return;
    const keyPointsText = summary.keyPoints
      .map((kp, idx) => `${idx + 1}. ${kp.point}: ${kp.explanation}${kp.example ? ` (Ví dụ: ${kp.example})` : ''}`)
      .join('\n');

    const vocabText = summary.coreVocabulary
      .map((v) => `• ${v.word} ${v.ipa}: ${v.meaning}`)
      .join('\n');

    const fullContent = `[TÓM TẮT & Ý CỐT LÕI - ${summary.subjectName.toUpperCase()}]
${summary.targetMaterialTitle ? `Học liệu: ${summary.targetMaterialTitle}\n` : ''}
1. TÓM TẮT TỔNG QUAN:
${summary.summary}

2. ĐIỂM CỐT LÕI (KEY POINTS):
${keyPointsText}

3. TỪ VỰNG THEN CHỐT:
${vocabText}

4. LƯU Ý PHÁT ÂM:
${summary.pronunciationNotes.map((n) => `• ${n}`).join('\n')}

5. MẸO HỌC TẬP:
${summary.studentTip}
`;

    navigator.clipboard.writeText(fullContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-start justify-between gap-4 bg-gradient-to-r from-sky-950/60 via-slate-900 to-indigo-950/40">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                <span>Summary & Key Points Cốt Lõi</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-medium">
                <Database className="w-3 h-3" />
                <span>Đã lưu LocalStorage</span>
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {summary ? (
                summary.targetType === 'single_material' && summary.targetMaterialTitle ? (
                  <span>Tóm Tắt Bài Học: {summary.targetMaterialTitle}</span>
                ) : (
                  <span>Tóm Tắt & Điểm Cốt Lõi: {summary.subjectName}</span>
                )
              ) : (
                <span>Tạo Bản Tóm Tắt Kiến Thức</span>
              )}
            </h2>
            <p className="text-xs text-slate-400">
              Ngôn ngữ tinh gọn, phân tích sâu nội dung cốt lõi, phù hợp học sinh từ lớp 7 trở lên.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {summary && !isGenerating && (
              <button
                type="button"
                onClick={onRegenerate}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition-colors cursor-pointer"
                title="Tạo lại bản tóm tắt bằng AI"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Làm mới AI</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Loading Overlay or Generating state */}
        {isGenerating ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-sky-500/20 flex items-center justify-center animate-pulse text-sky-400">
                <Sparkles className="w-8 h-8 animate-spin" />
              </div>
            </div>
            <div className="space-y-1.5 max-w-sm">
              <h3 className="text-base font-bold text-white">AI Đang Tổng Hợp Kiến Thức...</h3>
              <p className="text-xs text-sky-300 font-medium">{generationStep || 'Đang phân tích các nguồn học liệu...'}</p>
              <p className="text-[11px] text-slate-400">
                Trích xuất bản chất ngữ nghĩa, từ vựng cốt lõi và hướng dẫn phát âm cho học sinh.
              </p>
            </div>
          </div>
        ) : summary ? (
          /* Content Body */
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs text-slate-200">
            {/* 1. SHORT SUMMARY CARD */}
            <div className="bg-gradient-to-br from-sky-950/40 to-slate-900 border border-sky-800/40 rounded-2xl p-4 sm:p-5 shadow-inner space-y-2">
              <div className="flex items-center gap-2 text-sky-300 font-bold text-xs uppercase tracking-wider">
                <BookOpen className="w-4 h-4 text-sky-400" />
                <span>1. Tóm Tắt Tổng Quan (Summary Ngắn Gọn)</span>
              </div>
              <p className="text-sm text-slate-100 leading-relaxed font-sans font-medium pl-1">
                {summary.summary}
              </p>
            </div>

            {/* 2. CORE KEY POINTS (Không lặp keyword bề mặt) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs uppercase tracking-wider">
                  <BookmarkCheck className="w-4 h-4 text-indigo-400" />
                  <span>2. Điểm Cốt Lõi Then Chốt (Key Points)</span>
                </div>
                <span className="text-[11px] text-slate-400">
                  {summary.keyPoints.length} ý trọng tâm
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {summary.keyPoints.map((kp, idx) => (
                  <div
                    key={kp.id || idx}
                    className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-slate-700/80 transition-all space-y-1.5"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0 text-[11px] font-bold mt-0.5 font-['Space_Grotesk']">
                        {idx + 1}
                      </span>
                      <div className="space-y-1 flex-1">
                        <h4 className="text-xs sm:text-sm font-bold text-white">
                          {kp.point}
                        </h4>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {kp.explanation}
                        </p>
                        {kp.example && (
                          <div className="pt-1 text-[11px] text-sky-300 italic flex items-start gap-1">
                            <span className="font-semibold not-italic">Ví dụ minh họa:</span>
                            <span>"{kp.example}"</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. CORE VOCABULARY WITH PHONETICS */}
            {summary.coreVocabulary && summary.coreVocabulary.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs uppercase tracking-wider">
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                    <span>3. Từ Vựng Cốt Lõi & Phiên Âm IPA</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Nhấn biểu tượng loa để nghe mẫu phát âm</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {summary.coreVocabulary.map((v, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-sm font-bold text-white capitalize">{v.word}</span>
                        <button
                          type="button"
                          onClick={() => handleSpeak(v.word)}
                          className={`p-1 rounded-lg transition-colors cursor-pointer ${
                            activeSpeechWord === v.word
                              ? 'bg-emerald-500 text-white'
                              : 'text-slate-400 hover:text-emerald-400 hover:bg-slate-800'
                          }`}
                          title={`Nghe phát âm từ "${v.word}"`}
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-[11px] text-emerald-400 font-mono">
                        {v.ipa}
                      </div>

                      <div className="text-xs text-slate-300 font-medium">
                        {v.meaning}
                      </div>

                      {v.contextUsage && (
                        <div className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-800/80 truncate">
                          "{v.contextUsage}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. PRONUNCIATION HIGHLIGHTS (Bám đúng chuyên môn app luyện phát âm) */}
            {summary.pronunciationNotes && summary.pronunciationNotes.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-800/30 space-y-2">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  <span>4. Lưu Ý Phát Âm & Trọng Âm Cần Nhớ</span>
                </div>

                <ul className="space-y-1.5 pl-1">
                  {summary.pronunciationNotes.map((note, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 5. PRACTICE SENTENCES: CHUYỂN THẲNG SANG PHÒNG LUYỆN PHÁT ÂM */}
            {summary.practiceSentences && summary.practiceSentences.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sky-300 font-bold text-xs uppercase tracking-wider">
                    <Mic className="w-4 h-4 text-sky-400" />
                    <span>5. Câu Tiêu Biểu Luyện Nói Ngay</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Chọn câu để đưa vào phòng AI chấm điểm</span>
                </div>

                <div className="space-y-2">
                  {summary.practiceSentences.map((sentence, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-sky-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-all group"
                    >
                      <div className="flex items-start gap-2 flex-1">
                        <span className="text-slate-500 text-xs font-bold mt-0.5">#{idx + 1}</span>
                        <span className="text-xs sm:text-sm text-slate-100 font-medium group-hover:text-sky-300 transition-colors">
                          "{sentence}"
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleSpeak(sentence)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Nghe đọc mẫu câu"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            onPracticeSentence(sentence, summary.subjectName);
                            onClose();
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500 text-sky-300 hover:text-white border border-sky-500/30 text-xs font-semibold transition-all cursor-pointer"
                        >
                          <Mic className="w-3 h-3" />
                          <span>Luyện câu này</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. STUDENT TIP BOX */}
            {summary.studentTip && (
              <div className="p-3.5 rounded-2xl bg-slate-950/40 border border-slate-800/80 flex items-start gap-2.5 text-xs text-slate-300">
                <span className="text-lg">💡</span>
                <div className="space-y-0.5">
                  <strong className="text-white block font-semibold">Lời khuyên học tập cho em:</strong>
                  <p className="text-slate-400 leading-relaxed">{summary.studentTip}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400">Chưa có thông tin tóm tắt.</div>
        )}

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyAll}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Đã sao chép toàn bộ' : 'Sao chép nội dung'}</span>
            </button>

            {summary && onCreateFlashcards && (
              <button
                type="button"
                onClick={() => {
                  onCreateFlashcards(summary);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600/90 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Tạo Flashcard từ tóm tắt này</span>
              </button>
            )}

            {summary && onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Em có chắc chắn muốn xóa bản tóm tắt này khỏi LocalStorage không?')) {
                    onDelete(summary.id);
                    onClose();
                  }
                }}
                className="flex items-center gap-1 px-3 py-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 text-xs font-medium transition-colors cursor-pointer"
                title="Xóa bản tóm tắt này"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
