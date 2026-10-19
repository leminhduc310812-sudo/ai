import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Lightbulb,
  Check,
  AlertCircle,
  ListOrdered,
  BookOpen,
  ArrowRight,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import { QuizItem, QuizQuestion } from '../../types';
import { isQuestionAnswerCorrect } from '../../hooks/useQuizzes';

interface QuizPlayerProps {
  quiz: QuizItem;
  onExitQuiz: () => void;
  onSelectAnotherQuiz?: () => void;
}

export type ReviewTimingMode = 'immediate' | 'at_end';

export const QuizPlayer: React.FC<QuizPlayerProps> = ({
  quiz,
  onExitQuiz,
  onSelectAnotherQuiz,
}) => {
  // Current active question index (0-based)
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // Chế độ xem kết quả:
  // 'immediate': Xem kết quả & gợi ý ôn lại ngay sau mỗi câu
  // 'at_end': Làm cả bài rồi xem kết quả tổng kết sau lượt quiz
  const [reviewMode, setReviewMode] = useState<ReviewTimingMode>('immediate');

  // Lưu câu trả lời độc lập THEO TỪNG CÂU (Record<questionId, answer>)
  // Đảm bảo không dùng state của câu cuối để chấm cho cả bài!
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});

  // Lưu trạng thái đã kiểm tra kết quả THEO TỪNG CÂU (Record<questionId, boolean>)
  const [checkedQuestions, setCheckedQuestions] = useState<Record<string, boolean>>({});

  // Trạng thái hiển thị gợi ý (Hint)
  const [showHint, setShowHint] = useState<boolean>(false);

  // Trạng thái đã nộp bài / xem tổng kết cả lượt quiz
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  // Danh sách câu hỏi đang làm (mặc định là toàn bộ quiz, có thể lọc câu sai khi ôn lại)
  const [activeQuestions, setActiveQuestions] = useState<QuizQuestion[]>(quiz.questions || []);

  // Update active questions if quiz changes
  useEffect(() => {
    setActiveQuestions(quiz.questions || []);
    setCurrentIndex(0);
    setUserAnswers({});
    setCheckedQuestions({});
    setIsSubmitted(false);
  }, [quiz]);

  const currentQuestion: QuizQuestion | undefined = activeQuestions[currentIndex];

  // Reset hint khi đổi câu hỏi
  useEffect(() => {
    setShowHint(false);
  }, [currentIndex]);

  if (!currentQuestion || activeQuestions.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-4 max-w-xl mx-auto">
        <p className="text-slate-400">Bộ quiz này hiện chưa có câu hỏi nào.</p>
        <button
          onClick={onExitQuiz}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
        >
          Quay lại danh sách Quiz
        </button>
      </div>
    );
  }

  // Câu trả lời và trạng thái câu hiện tại
  const currentAnswer = userAnswers[currentQuestion.id] || '';
  const isCurrentChecked = Boolean(checkedQuestions[currentQuestion.id]);
  const isCurrentCorrect = isQuestionAnswerCorrect(currentQuestion, currentAnswer);

  // Cập nhật câu trả lời cho câu hỏi cụ thể (lưu theo questionId)
  const handleAnswerChange = (answer: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: answer,
    }));

    // Nếu đang ở chế độ xem kết quả ngay sau mỗi câu và là trắc nghiệm, tự động kích hoạt kiểm tra
    if (reviewMode === 'immediate' && currentQuestion.type === 'multiple_choice') {
      setCheckedQuestions((prev) => ({
        ...prev,
        [currentQuestion.id]: true,
      }));
    }
  };

  // Kiểm tra đáp án cho câu hỏi hiện tại
  const handleCheckCurrentQuestion = () => {
    if (!currentAnswer.trim()) {
      alert('Vui lòng chọn hoặc nhập câu trả lời trước khi kiểm tra!');
      return;
    }
    setCheckedQuestions((prev) => ({
      ...prev,
      [currentQuestion.id]: true,
    }));
  };

  // Nộp bài và chấm điểm toàn bộ bài quiz (sau mỗi lượt quiz)
  const handleSubmitQuiz = () => {
    // Đánh dấu tất cả câu hỏi là đã kiểm tra để học sinh biết mình đúng hay sai
    const allChecked: Record<string, boolean> = {};
    activeQuestions.forEach((q) => {
      allChecked[q.id] = true;
    });
    setCheckedQuestions(allChecked);
    setIsSubmitted(true);
  };

  // Làm lại toàn bộ bài quiz
  const handleRetryAll = () => {
    setActiveQuestions(quiz.questions || []);
    setUserAnswers({});
    setCheckedQuestions({});
    setCurrentIndex(0);
    setIsSubmitted(false);
    setShowHint(false);
  };

  // Tính năng tự học: Chỉ làm lại những câu đã trả lời sai
  const handleRetryWrongQuestionsOnly = () => {
    const wrongQuestions = activeQuestions.filter(
      (q) => !isQuestionAnswerCorrect(q, userAnswers[q.id])
    );
    if (wrongQuestions.length === 0) {
      handleRetryAll();
      return;
    }
    setActiveQuestions(wrongQuestions);
    // Xóa câu trả lời cũ của các câu sai để học sinh tự làm lại
    setUserAnswers((prev) => {
      const next = { ...prev };
      wrongQuestions.forEach((q) => {
        delete next[q.id];
      });
      return next;
    });
    setCheckedQuestions((prev) => {
      const next = { ...prev };
      wrongQuestions.forEach((q) => {
        delete next[q.id];
      });
      return next;
    });
    setCurrentIndex(0);
    setIsSubmitted(false);
    setShowHint(false);
  };

  // Thống kê kết quả cuối cùng: phản ánh chuẩn xác số câu đúng / tổng số câu
  const totalQuestions = activeQuestions.length;
  const correctCount = activeQuestions.filter((q) =>
    isQuestionAnswerCorrect(q, userAnswers[q.id])
  ).length;
  const wrongCount = totalQuestions - correctCount;
  const scorePercent = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  // =========================================================================
  // MÀN HÌNH TỔNG KẾT KẾT QUẢ SAU MỖI LƯỢT QUIZ (KHÔNG GAME HÓA RƯỜM RÀ)
  // =========================================================================
  if (isSubmitted) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl animate-fade-in max-w-3xl mx-auto">
        {/* Header Kết Quả Tự Học (Tập trung sư phạm, không cúp vàng/điểm thưởng rườm rà) */}
        <div className="space-y-3 pb-5 border-b border-slate-800">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold">
              Tổng kết lượt quiz: {quiz.subjectName}
            </span>
            <span className="text-xs text-slate-400">
              Chế độ tự học & kiểm tra kiến thức
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {quiz.title}
          </h2>

          {/* Bảng phản ánh đúng số câu đúng / tổng số câu */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80">
              <span className="text-xs text-slate-400 block font-medium">Kết quả thực tế</span>
              <div className="flex items-baseline gap-1 mt-1">
                <strong className="text-2xl sm:text-3xl font-black text-white font-['Space_Grotesk']">
                  {correctCount}
                </strong>
                <span className="text-slate-400 text-sm">/ {totalQuestions} câu đúng</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30">
              <span className="text-xs text-emerald-400 block font-medium">Tỷ lệ chính xác</span>
              <div className="flex items-baseline gap-1 mt-1">
                <strong className="text-2xl sm:text-3xl font-black text-emerald-400 font-['Space_Grotesk']">
                  {scorePercent}%
                </strong>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80">
              <span className="text-xs text-slate-400 block font-medium">Số câu cần ôn lại</span>
              <div className="flex items-baseline gap-1 mt-1">
                <strong className={`text-2xl sm:text-3xl font-black font-['Space_Grotesk'] ${
                  wrongCount > 0 ? 'text-amber-400' : 'text-slate-300'
                }`}>
                  {wrongCount}
                </strong>
                <span className="text-slate-400 text-sm">câu</span>
              </div>
            </div>
          </div>
        </div>

        {/* Danh sách rà soát chi tiết từng câu hỏi & gợi ý ngắn để ôn lại */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              <ListOrdered className="w-4 h-4 text-sky-400" />
              <span>Rà soát chi tiết & Gợi ý ôn tập:</span>
            </h3>
            <span className="text-[11px] text-slate-400">
              Đúng: <strong className="text-emerald-400">{correctCount}</strong> | Chưa đúng: <strong className="text-rose-400">{wrongCount}</strong>
            </span>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {activeQuestions.map((q, idx) => {
              const answer = userAnswers[q.id] || '(Chưa điền câu trả lời)';
              const isCorrect = isQuestionAnswerCorrect(q, userAnswers[q.id]);

              return (
                <div
                  key={q.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isCorrect
                      ? 'bg-emerald-950/15 border-emerald-500/25'
                      : 'bg-rose-950/15 border-rose-500/30'
                  }`}
                >
                  {/* Trạng thái Đúng / Sai */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <span
                        className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                          isCorrect
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-white leading-snug">
                          {q.question}
                        </h4>

                        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                          <span className="text-slate-400">
                            Câu trả lời của em:{' '}
                            <strong className={isCorrect ? 'text-emerald-400' : 'text-rose-400 font-semibold'}>
                              {answer}
                            </strong>
                          </span>
                          {!isCorrect && (
                            <span className="text-slate-400">
                              Đáp án chuẩn:{' '}
                              <strong className="text-emerald-400 font-semibold">{q.correctAnswer}</strong>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5">
                      {isCorrect ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Đúng</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-lg border border-rose-500/20">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Sai</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Lời giải thích */}
                  {q.explanation && (
                    <div className="mt-3 pt-2 border-t border-slate-800/80 text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-xl">
                      <strong className="text-sky-400 block mb-0.5">Giải thích:</strong>
                      {q.explanation}
                    </div>
                  )}

                  {/* Gợi ý ngắn để ôn lại (Review Tip) */}
                  {(q.reviewTip || q.hint) && (
                    <div className="mt-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-2">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong>Gợi ý ôn lại:</strong> {q.reviewTip || q.hint}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Nút hành động tự học */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {wrongCount > 0 && (
              <button
                onClick={handleRetryWrongQuestionsOnly}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all cursor-pointer"
                title="Chỉ làm lại những câu chưa chính xác để củng cố kiến thức"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Chỉ ôn lại {wrongCount} câu sai</span>
              </button>
            )}

            <button
              onClick={handleRetryAll}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Làm lại toàn bộ</span>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onSelectAnotherQuiz && (
              <button
                onClick={onSelectAnotherQuiz}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold transition-all shadow-md shadow-sky-500/20 cursor-pointer"
              >
                Chọn bài Quiz khác
              </button>
            )}

            <button
              onClick={onExitQuiz}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
            >
              Thoát
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MÀN HÌNH LÀM BÀI QUIZ (TỪNG CÂU HỎI & XEM KẾT QUẢ SAU MỖI CÂU)
  // =========================================================================
  const isLastQuestion = currentIndex === activeQuestions.length - 1;
  const answeredCount = Object.keys(userAnswers).filter((k) => userAnswers[k]?.trim()).length;

  return (
    <div id="quiz-player" className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-6 max-w-3xl mx-auto">
      {/* Top Header: Tiêu đề quiz, Chế độ xem kết quả & Palette câu hỏi */}
      <div className="space-y-4 pb-4 border-b border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30 text-xs font-semibold">
                {quiz.subjectName}
              </span>
              <span className="text-xs text-slate-400 hidden sm:inline">
                • {quiz.gradeLevel || 'Luyện tập'}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white mt-1">
              {quiz.title}
            </h2>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Tùy chọn xem kết quả sau mỗi câu hoặc sau cả lượt */}
            <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700/60 text-xs">
              <button
                type="button"
                onClick={() => setReviewMode('immediate')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer font-medium flex items-center gap-1 ${
                  reviewMode === 'immediate'
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Biết ngay đúng hay sai kèm gợi ý sau mỗi câu"
              >
                <Eye className="w-3 h-3" />
                <span>Xem sau mỗi câu</span>
              </button>

              <button
                type="button"
                onClick={() => setReviewMode('at_end')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer font-medium flex items-center gap-1 ${
                  reviewMode === 'at_end'
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Làm liền một mạch rồi xem tổng kết ở cuối"
              >
                <span>Xem ở cuối bài</span>
              </button>
            </div>

            <button
              onClick={onExitQuiz}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Thoát
            </button>
          </div>
        </div>

        {/* Thanh Palette các câu hỏi (Bấm vào để nhảy nhanh sang bất kỳ câu nào) */}
        <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
            {activeQuestions.map((q, idx) => {
              const isCurrent = idx === currentIndex;
              const hasAnswer = Boolean(userAnswers[q.id]?.trim());
              const isChecked = Boolean(checkedQuestions[q.id]);
              const isCorrect = isChecked && isQuestionAnswerCorrect(q, userAnswers[q.id]);

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center border ${
                    isCurrent
                      ? 'bg-sky-500 text-white border-sky-400 ring-2 ring-sky-500/30 scale-105'
                      : isChecked
                      ? isCorrect
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                      : hasAnswer
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                      : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                  title={`Câu ${idx + 1}: ${
                    isChecked
                      ? isCorrect
                        ? 'Đúng'
                        : 'Chưa đúng'
                      : hasAnswer
                      ? 'Đã làm'
                      : 'Chưa làm'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-300 font-medium">
              Tiến độ: <strong className="text-white">{answeredCount}</strong> / {totalQuestions} câu
            </span>
            {answeredCount > 0 && !isLastQuestion && (
              <button
                type="button"
                onClick={handleSubmitQuiz}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer underline transition-colors"
                title="Nộp bài và xem tổng kết điểm các câu đã làm"
              >
                Nộp bài & Tổng kết
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Vùng hiển thị câu hỏi hiện tại */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-sky-400 font-['Space_Grotesk'] text-sm">
            Câu {currentIndex + 1} / {totalQuestions}
          </span>

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
              {currentQuestion.type === 'multiple_choice' ? 'Trắc nghiệm A, B, C, D' : 'Điền từ / Trả lời ngắn'}
            </span>

            {currentQuestion.hint && (
              <button
                type="button"
                onClick={() => setShowHint(!showHint)}
                className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 cursor-pointer"
                title="Xem gợi ý nếu gặp khó khăn"
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>{showHint ? 'Ẩn gợi ý' : 'Gợi ý'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Nội dung câu hỏi */}
        <div className="bg-slate-950/50 p-4 sm:p-5 rounded-2xl border border-slate-800">
          <h3 className="text-base sm:text-lg font-bold text-white leading-relaxed">
            {currentQuestion.question}
          </h3>

          {showHint && currentQuestion.hint && (
            <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-2 animate-fade-in">
              <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>Gợi ý:</strong> {currentQuestion.hint}
              </div>
            </div>
          )}
        </div>

        {/* Lựa chọn đáp án hoặc ô trả lời */}
        {currentQuestion.type === 'multiple_choice' && currentQuestion.options ? (
          /* TRẮC NGHIỆM */
          <div className="space-y-2.5 pt-1">
            {currentQuestion.options.map((option, optIdx) => {
              const letter = option.charAt(0).toUpperCase();
              const isSelected =
                currentAnswer.toUpperCase() === letter ||
                currentAnswer.toUpperCase() === option.toUpperCase();

              // Highlight màu nếu đã kiểm tra câu này
              let statusStyle = 'bg-slate-800/60 border-slate-700/70 text-slate-300 hover:bg-slate-800 hover:text-white';
              if (isCurrentChecked) {
                const isThisOptionCorrect =
                  isQuestionAnswerCorrect(currentQuestion, letter) ||
                  isQuestionAnswerCorrect(currentQuestion, option);
                if (isThisOptionCorrect) {
                  statusStyle = 'bg-emerald-500/15 border-emerald-500/60 text-emerald-200 font-semibold ring-1 ring-emerald-500/40';
                } else if (isSelected && !isCurrentCorrect) {
                  statusStyle = 'bg-rose-500/15 border-rose-500/60 text-rose-200 ring-1 ring-rose-500/40';
                }
              } else if (isSelected) {
                statusStyle = 'bg-sky-500/15 border-sky-500/60 text-white ring-1 ring-sky-500/40';
              }

              return (
                <button
                  key={optIdx}
                  type="button"
                  onClick={() => handleAnswerChange(letter)}
                  className={`w-full p-3.5 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 group ${statusStyle}`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                          : 'bg-slate-700 text-slate-300 group-hover:bg-slate-600'
                      }`}
                    >
                      {letter}
                    </span>
                    <span className="text-xs sm:text-sm font-medium">{option}</span>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'border-sky-500 bg-sky-500 text-white'
                        : 'border-slate-600'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          /* ĐIỀN TỪ / TRẢ LỜI NGẮN */
          <div className="space-y-2 pt-1">
            <label className="block text-xs font-semibold text-slate-300">
              Nhập câu trả lời của em:
            </label>
            <div className="relative">
              <input
                type="text"
                value={currentAnswer}
                onChange={(e) => handleAnswerChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCheckCurrentQuestion();
                  }
                }}
                placeholder="Gõ từ hoặc đáp án cần điền vào đây..."
                className={`w-full px-4 py-3 bg-slate-800/80 border rounded-2xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-1 ${
                  isCurrentChecked
                    ? isCurrentCorrect
                      ? 'border-emerald-500 ring-emerald-500/30'
                      : 'border-rose-500 ring-rose-500/30'
                    : 'border-slate-700 focus:border-sky-500 focus:ring-sky-500'
                }`}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Hệ thống tự động bỏ qua viết hoa/thường và khoảng trắng thừa.
            </p>
          </div>
        )}

        {/* Nút Kiểm Tra Kết Quả cho câu này */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleCheckCurrentQuestion}
            disabled={!currentAnswer.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Kiểm tra câu này</span>
          </button>

          {/* Phản hồi đúng/sai cơ bản ngay tại câu để học sinh biết mình đúng hay sai */}
          {isCurrentChecked && (
            <div className="flex items-center gap-1.5 animate-fade-in text-xs font-bold">
              {isCurrentCorrect ? (
                <span className="text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Em đã trả lời đúng!</span>
                </span>
              ) : (
                <span className="text-rose-400 flex items-center gap-1 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/30">
                  <XCircle className="w-4 h-4" />
                  <span>Chưa chính xác!</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Khối phản hồi chi tiết & gợi ý ngắn để ôn lại (sau mỗi câu) */}
        {isCurrentChecked && (
          <div
            className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-2.5 animate-fade-in ${
              isCurrentCorrect
                ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                : 'bg-rose-950/20 border-rose-500/30 text-rose-200'
            }`}
          >
            <div className="flex items-center justify-between font-bold">
              <span>{isCurrentCorrect ? '✓ Câu trả lời chính xác!' : '✗ Câu trả lời chưa chính xác!'}</span>
              {!isCurrentCorrect && (
                <span className="text-slate-200">
                  Đáp án đúng: <strong className="text-emerald-400">{currentQuestion.correctAnswer}</strong>
                </span>
              )}
            </div>

            {currentQuestion.explanation && (
              <p className="text-slate-300 pt-1 border-t border-slate-800/80">
                <strong>Giải thích:</strong> {currentQuestion.explanation}
              </p>
            )}

            {/* Gợi ý ngắn để ôn lại */}
            {(currentQuestion.reviewTip || currentQuestion.hint) && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 flex items-start gap-2 text-[11px]">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Gợi ý ôn lại:</strong> {currentQuestion.reviewTip || currentQuestion.hint}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Footer: Điều hướng Câu trước / Câu sau & Nộp bài */}
      <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
          className="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Câu trước</span>
        </button>

        <div className="flex items-center gap-2">
          {isLastQuestion ? (
            <button
              type="button"
              onClick={handleSubmitQuiz}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <span>Xem kết quả lượt quiz</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setCurrentIndex((prev) => Math.min(activeQuestions.length - 1, prev + 1))}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold transition-all shadow-md shadow-sky-500/20 cursor-pointer"
            >
              <span>Câu tiếp</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
