import React, { useState, useEffect, useCallback } from 'react';
import {
  RotateCw,
  Volume2,
  CheckCircle,
  XCircle,
  Shuffle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Trophy,
  RotateCcw,
  BookOpen,
  Lightbulb,
  CheckCircle2,
  GitCompare,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { FlashcardItem, FlashcardCategory } from '../../types';
import { FLASHCARD_CATEGORIES } from '../../data/flashcardLibrary';

interface FlashcardPlayerProps {
  cards: FlashcardItem[];
  onRecordReview: (id: string, isMastered: boolean) => void;
  onOpenAddModal: () => void;
  onSwitchToLibrary: () => void;
}

export const FlashcardPlayer: React.FC<FlashcardPlayerProps> = ({
  cards,
  onRecordReview,
  onOpenAddModal,
  onSwitchToLibrary,
}) => {
  const [deck, setDeck] = useState<FlashcardItem[]>(cards);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [sessionResults, setSessionResults] = useState<{
    masteredCount: number;
    reviewAgainCount: number;
  }>({ masteredCount: 0, reviewAgainCount: 0 });

  // Update deck when incoming cards change
  useEffect(() => {
    setDeck(cards);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsCompleted(false);
  }, [cards]);

  const currentCard = deck[currentIndex];

  // Flip card
  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  // Text to Speech
  const handleSpeak = (text: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Check if text is predominantly English or Vietnamese
    const isEnglish = /[a-zA-Z]{4,}/.test(text) && !/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(text);
    utterance.lang = isEnglish ? 'en-US' : 'vi-VN';
    utterance.rate = 0.95;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Move to next card
  const handleNext = useCallback(() => {
    if (currentIndex < deck.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    } else {
      setIsCompleted(true);
    }
  }, [currentIndex, deck.length]);

  // Move to previous card
  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
    }
  }, [currentIndex]);

  // Action: Mastered
  const handleMastered = useCallback(() => {
    if (!currentCard) return;
    onRecordReview(currentCard.id, true);
    setSessionResults((prev) => ({ ...prev, masteredCount: prev.masteredCount + 1 }));
    handleNext();
  }, [currentCard, onRecordReview, handleNext]);

  // Action: Review Again
  const handleReviewAgain = useCallback(() => {
    if (!currentCard) return;
    onRecordReview(currentCard.id, false);
    setSessionResults((prev) => ({ ...prev, reviewAgainCount: prev.reviewAgainCount + 1 }));
    handleNext();
  }, [currentCard, onRecordReview, handleNext]);

  // Shuffle deck
  const handleShuffle = () => {
    const shuffled = [...deck].sort(() => Math.random() - 0.5);
    setDeck(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsCompleted(false);
    setSessionResults({ masteredCount: 0, reviewAgainCount: 0 });
  };

  // Restart all
  const handleRestartAll = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsCompleted(false);
    setSessionResults({ masteredCount: 0, reviewAgainCount: 0 });
  };

  // Restart unmastered only
  const handleRestartUnmastered = () => {
    const unmastered = deck.filter((c) => !c.mastered);
    if (unmastered.length === 0) {
      handleRestartAll();
      return;
    }
    setDeck(unmastered);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsCompleted(false);
    setSessionResults({ masteredCount: 0, reviewAgainCount: 0 });
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleFlip();
      } else if (e.code === 'ArrowRight' || e.key === '2') {
        e.preventDefault();
        handleMastered();
      } else if (e.code === 'ArrowLeft' || e.key === '1') {
        e.preventDefault();
        handleReviewAgain();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFlip, handleMastered, handleReviewAgain]);

  // Render Category Icon
  const renderCategoryIcon = (category: FlashcardCategory) => {
    switch (category) {
      case 'khai_niem':
        return <Lightbulb className="w-3.5 h-3.5 text-sky-400" />;
      case 'dinh_nghia':
        return <BookOpen className="w-3.5 h-3.5 text-indigo-400" />;
      case 'vi_du':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
      case 'phan_biet':
        return <GitCompare className="w-3.5 h-3.5 text-amber-400" />;
      case 'quy_tac':
        return <AlertCircle className="w-3.5 h-3.5 text-rose-400" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  // Empty deck state
  if (!deck || deck.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-10 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center mx-auto">
          <BookOpen className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-white">Chưa có thẻ ghi nhớ nào trong bộ lọc này</h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Các em có thể tạo thẻ mới bằng tay, tạo bằng AI từ học liệu đã lưu, hoặc chọn lại môn học khác.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={onOpenAddModal}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            + Tạo Flashcard Mới
          </button>
          <button
            onClick={onSwitchToLibrary}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            Xem Tất Cả Thẻ
          </button>
        </div>
      </div>
    );
  }

  // Completion state
  if (isCompleted) {
    const totalReviewed = deck.length;
    const masteredPercentage = Math.round((sessionResults.masteredCount / totalReviewed) * 100) || 0;

    return (
      <div className="bg-gradient-to-b from-slate-800/90 to-slate-900 border border-slate-700/80 rounded-3xl p-8 max-w-xl mx-auto shadow-2xl text-center space-y-6 animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center mx-auto shadow-xl shadow-amber-500/20 text-white">
          <Trophy className="w-10 h-10 animate-bounce" />
        </div>

        <div>
          <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-xs font-semibold">
            🎉 Hoàn thành vòng ôn tập nhanh!
          </span>
          <h2 className="text-2xl font-bold text-white mt-3 font-['Space_Grotesk']">
            Chúc mừng bạn đã hoàn thành {totalReviewed} thẻ!
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Ghi nhớ ngắt quãng (Spaced Repetition) mỗi ngày giúp bạn ghi nhớ kiến thức bền vững.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-2xl font-black text-emerald-400 font-['Space_Grotesk']">
              {sessionResults.masteredCount}
            </span>
            <p className="text-xs text-emerald-300 font-medium mt-1">Đã thuộc ({masteredPercentage}%)</p>
          </div>
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <span className="text-2xl font-black text-amber-400 font-['Space_Grotesk']">
              {sessionResults.reviewAgainCount}
            </span>
            <p className="text-xs text-amber-300 font-medium mt-1">Cần ôn lại</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {sessionResults.reviewAgainCount > 0 && (
            <button
              onClick={handleRestartUnmastered}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Chỉ ôn các thẻ cần ôn lại</span>
            </button>
          )}

          <button
            onClick={handleRestartAll}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
          >
            <RotateCw className="w-4 h-4" />
            <span>Ôn lại từ đầu</span>
          </button>

          <button
            onClick={onSwitchToLibrary}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-all cursor-pointer"
          >
            Xem danh sách thẻ
          </button>
        </div>
      </div>
    );
  }

  const categoryMeta = FLASHCARD_CATEGORIES[currentCard.category] || FLASHCARD_CATEGORIES.khai_niem;
  const progressPercent = Math.round(((currentIndex + 1) / deck.length) * 100);

  return (
    <div id="flashcard-player" className="max-w-2xl mx-auto space-y-4">
      {/* Top Header: Progress & Quick Actions */}
      <div className="flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white font-['Space_Grotesk'] text-sm">
            Thẻ {currentIndex + 1} / {deck.length}
          </span>
          <span className="text-slate-400">• {progressPercent}%</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShuffle}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Trộn ngẫu nhiên thứ tự thẻ"
          >
            <Shuffle className="w-3 h-3" />
            <span className="hidden sm:inline">Trộn thẻ</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 transition-colors cursor-pointer"
            title="Tạo thêm thẻ mới"
          >
            <span>+ Tạo thẻ</span>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* The 3D Interactive Flashcard Card */}
      <div
        id="interactive-flashcard"
        onClick={handleFlip}
        role="button"
        tabIndex={0}
        aria-label="Nhấn để lật mặt thẻ"
        className={`group relative min-h-[320px] sm:min-h-[360px] w-full rounded-3xl p-6 sm:p-8 cursor-pointer select-none transition-all duration-300 border shadow-2xl flex flex-col justify-between ${
          isFlipped
            ? 'bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-900 border-indigo-700/60 shadow-indigo-950/40 ring-1 ring-indigo-500/30'
            : 'bg-gradient-to-br from-slate-900 via-slate-900/95 to-sky-950/40 border-slate-700/80 hover:border-sky-500/50 shadow-black/50'
        }`}
      >
        {/* Card Header: Category Badge + Subject + Audio + Flip indicator */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Category Badge (1 trong 5 nhóm ưu tiên) */}
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${categoryMeta.badgeBg} ${categoryMeta.badgeText} ${categoryMeta.borderColor}`}
            >
              {renderCategoryIcon(currentCard.category)}
              <span>{categoryMeta.label}</span>
            </span>

            {/* Subject Tag */}
            <span className="text-[11px] text-slate-400 truncate max-w-[180px] hidden sm:inline">
              {currentCard.subjectName}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Button */}
            <button
              onClick={(e) => handleSpeak(isFlipped ? currentCard.back : currentCard.front, e)}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                isSpeaking
                  ? 'bg-sky-500 text-white animate-pulse'
                  : 'bg-slate-800/80 hover:bg-sky-500/20 text-slate-300 hover:text-sky-300'
              }`}
              title="Nghe phát âm nội dung thẻ"
            >
              <Volume2 className="w-4 h-4" />
            </button>

            {/* Front / Back Indicator Tag */}
            <span
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                isFlipped
                  ? 'bg-indigo-500/25 text-indigo-300 border border-indigo-500/40 ring-1 ring-indigo-500/30'
                  : 'bg-sky-500/25 text-sky-300 border border-sky-500/40 ring-1 ring-sky-500/30'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isFlipped ? 'bg-indigo-400' : 'bg-sky-400 animate-pulse'}`} />
              <span>{isFlipped ? 'MẶT SAU (LỜI GIẢI)' : 'MẶT TRƯỚC (CÂU HỎI)'}</span>
            </span>
          </div>
        </div>

        {/* Card Body: Dynamic Content Front vs Back */}
        <div className="py-6 flex-1 flex flex-col justify-center">
          {!isFlipped ? (
            /* FRONT OF CARD */
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-sky-400 uppercase tracking-widest block flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                  Câu hỏi / Thuật ngữ / Vấn đề cần nhớ:
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-white leading-relaxed tracking-tight">
                  {currentCard.front}
                </h2>
              </div>

              {currentCard.sourceTitle && (
                <p className="text-xs text-slate-400 italic">
                  Nguồn: {currentCard.sourceTitle}
                </p>
              )}
            </div>
          ) : (
            /* BACK OF CARD */
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest block flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  Đáp án / Định nghĩa / Lời giải chi tiết:
                </span>
                <div className="text-sm sm:text-base text-slate-100 leading-relaxed whitespace-pre-line font-medium bg-slate-800/60 p-4 rounded-2xl border border-slate-700/70 shadow-inner">
                  {currentCard.back}
                </div>
              </div>

              {/* Example sentence if any */}
              {currentCard.exampleSentence && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs">
                  <span className="font-bold text-emerald-400 block mb-0.5">📌 Ví dụ áp dụng:</span>
                  <p className="text-emerald-200">{currentCard.exampleSentence}</p>
                </div>
              )}

              {/* Notes / Mẹo ghi nhớ */}
              {currentCard.notes && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs flex items-start gap-2">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-amber-200 text-[11px] leading-relaxed">
                    <strong>Mẹo nhớ:</strong> {currentCard.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Card Footer: Flip Instruction Hint */}
        <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800/90 text-slate-200 border border-slate-700 font-semibold text-xs shadow-sm hover:bg-slate-700 transition-colors">
              <RotateCw className="w-3.5 h-3.5 text-sky-400" />
              <span>{isFlipped ? 'Bấm để lật về MẶT TRƯỚC' : 'Bấm để lật sang MẶT SAU'}</span>
            </span>
          </div>

          <div className="flex items-center gap-1">
            {currentCard.mastered && (
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md font-semibold">
                <CheckCircle className="w-3 h-3" />
                Đã nhớ trước đó
              </span>
            )}
            <span className="text-[10px] text-slate-400">
              Ôn {currentCard.reviewCount || 0} lần
            </span>
          </div>
        </div>
      </div>

      {/* Primary Flip & Navigation Action Bar */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="flex-1 flex items-center justify-center gap-1.5 px-3.5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-200 font-semibold text-xs transition-all cursor-pointer border border-slate-700"
          title="Chuyển về thẻ trước đó"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Thẻ trước</span>
        </button>

        <button
          id="btn-flip-card-center"
          onClick={handleFlip}
          className={`flex-[1.5] flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all shadow-lg active:scale-95 cursor-pointer ${
            isFlipped
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/25 ring-1 ring-indigo-400/40'
              : 'bg-sky-500 hover:bg-sky-400 text-white shadow-sky-500/25 ring-1 ring-sky-400/40'
          }`}
          title="Lật đổi giữa mặt trước và mặt sau (Phím Space)"
        >
          <RotateCw className="w-4 h-4" />
          <span>{isFlipped ? 'Lật lại Câu hỏi' : 'Lật xem Đáp án'}</span>
          <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 rounded bg-white/20 text-[10px] font-mono">
            Space
          </kbd>
        </button>

        <button
          onClick={handleNext}
          className="flex-1 flex items-center justify-center gap-1.5 px-3.5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-all cursor-pointer border border-slate-700"
          title="Chuyển sang thẻ tiếp theo"
        >
          <span>{currentIndex === deck.length - 1 ? 'Hoàn thành' : 'Thẻ sau'}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Evaluation & Quick Review Action Buttons */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <button
          id="btn-review-again"
          onClick={handleReviewAgain}
          className="flex items-center justify-center gap-2 p-3 sm:p-4 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 active:scale-95 border border-amber-500/30 text-amber-300 font-bold text-xs sm:text-sm transition-all shadow-md cursor-pointer group"
          title="Chưa thuộc hoặc cần ôn lại sớm (Phím 1 hoặc Mũi tên trái)"
        >
          <XCircle className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          <span>Cần Ôn Lại</span>
          <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 rounded bg-amber-900/40 text-[10px] text-amber-300 font-mono">
            Phím 1 / ←
          </kbd>
        </button>

        <button
          id="btn-mastered"
          onClick={handleMastered}
          className="flex items-center justify-center gap-2 p-3 sm:p-4 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 active:scale-95 border border-emerald-500/40 text-emerald-300 font-bold text-xs sm:text-sm transition-all shadow-md shadow-emerald-500/10 cursor-pointer group"
          title="Đã nhớ vững kiến thức này (Phím 2 hoặc Mũi tên phải)"
        >
          <CheckCircle className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          <span>Đã Thuộc Thẻ Này</span>
          <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 rounded bg-emerald-900/40 text-[10px] text-emerald-300 font-mono">
            Phím 2 / →
          </kbd>
        </button>
      </div>

      {/* Keyboard Shortcuts Helper Note */}
      <div className="text-center text-[11px] text-slate-400 pt-1">
        <span>
          Phím tắt: <strong className="text-slate-300">Space</strong> (Lật thẻ) • <strong className="text-slate-300">1 hoặc ←</strong> (Cần ôn lại) • <strong className="text-slate-300">2 hoặc →</strong> (Đã thuộc)
        </span>
      </div>
    </div>
  );
};
