import React, { useState, useMemo } from 'react';
import {
  HelpCircle,
  Award,
  Play,
  CheckCircle2,
  ListOrdered,
  Plus,
  BookOpen,
  Sparkles,
  RotateCcw,
  Trash2,
  FolderOpen,
  ArrowRight,
  Database,
  Layers,
  X,
} from 'lucide-react';
import { StudySubject, QuizItem, QuizQuestion } from '../../types';
import { useQuizzes } from '../../hooks/useQuizzes';
import { QuizPlayer } from './QuizPlayer';

interface QuizScreenProps {
  subjects: StudySubject[];
  currentSubjectId: string;
  onNavigateToMaterials?: () => void;
  onNavigateToFlashcards?: () => void;
}

export const QuizScreen: React.FC<QuizScreenProps> = ({
  subjects,
  currentSubjectId,
  onNavigateToMaterials,
  onNavigateToFlashcards,
}) => {
  const { quizzes, addQuiz, deleteQuiz, resetToDefault } = useQuizzes(currentSubjectId);
  const [activeQuiz, setActiveQuiz] = useState<QuizItem | null>(null);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>(currentSubjectId || 'all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Đồng bộ bộ lọc quiz khi môn học hiện tại thay đổi hoặc được restore
  React.useEffect(() => {
    if (currentSubjectId) {
      setSelectedSubjectFilter(currentSubjectId);
      setNewSubjectId(currentSubjectId);
    }
  }, [currentSubjectId]);

  // Đóng modal tạo quiz khi nhấn phím Escape
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsCreateModalOpen(false);
    };
    if (isCreateModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isCreateModalOpen]);

  // New Quiz Form State
  const [newTitle, setNewTitle] = useState('');
  const [newSubjectId, setNewSubjectId] = useState(currentSubjectId || subjects[0]?.id || 'subj-1');
  const [newDescription, setNewDescription] = useState('');
  const [newQuestions, setNewQuestions] = useState<Array<{
    question: string;
    type: 'multiple_choice' | 'fill_in';
    options: string[];
    correctAnswer: string;
    explanation: string;
  }>>([
    {
      question: '',
      type: 'multiple_choice',
      options: ['A. ', 'B. ', 'C. ', 'D. '],
      correctAnswer: 'A',
      explanation: '',
      reviewTip: '',
    },
  ]);

  // Filter quizzes by selected subject
  const filteredQuizzes = useMemo(() => {
    if (selectedSubjectFilter === 'all') return quizzes;
    return quizzes.filter((q) => q.subjectId === selectedSubjectFilter);
  }, [quizzes, selectedSubjectFilter]);

  // Overall Statistics
  const totalQuizzes = quizzes.length;
  const totalQuestions = quizzes.reduce((sum, q) => sum + (q.questions?.length || 0), 0);

  // Thêm một câu hỏi vào form tạo quiz
  const handleAddQuestionToForm = () => {
    setNewQuestions((prev) => [
      ...prev,
      {
        question: '',
        type: 'multiple_choice',
        options: ['A. ', 'B. ', 'C. ', 'D. '],
        correctAnswer: 'A',
        explanation: '',
        reviewTip: '',
      },
    ]);
  };

  // Submit tạo bài Quiz mới
  const handleCreateQuizSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      alert('Vui lòng nhập tiêu đề bài Quiz!');
      return;
    }

    const validQuestions: QuizQuestion[] = newQuestions
      .filter((q) => q.question.trim() && q.correctAnswer.trim())
      .map((q, idx) => ({
        id: `q-${Date.now()}-${idx}`,
        type: q.type,
        question: q.question.trim(),
        options: q.type === 'multiple_choice' ? q.options : undefined,
        correctAnswer: q.correctAnswer.trim(),
        explanation: q.explanation.trim() || 'Đáp án chính xác.',
        reviewTip: q.reviewTip?.trim() || undefined,
      }));

    if (validQuestions.length === 0) {
      alert('Vui lòng nhập ít nhất một câu hỏi có nội dung và đáp án!');
      return;
    }

    const sub = subjects.find((s) => s.id === newSubjectId);

    const created = addQuiz({
      subjectId: newSubjectId,
      subjectName: sub?.name || 'Môn học chung',
      title: newTitle.trim(),
      description: newDescription.trim() || 'Bài kiểm tra ôn tập kiến thức.',
      gradeLevel: sub?.gradeLevel || 'Luyện tập',
      questions: validQuestions,
    });

    setIsCreateModalOpen(false);
    setNewTitle('');
    setNewDescription('');
    setActiveQuiz(created);
  };

  // Nếu đang làm một bài quiz -> Hiển thị QuizPlayer
  if (activeQuiz) {
    return (
      <QuizPlayer
        quiz={activeQuiz}
        onExitQuiz={() => setActiveQuiz(null)}
        onSelectAnotherQuiz={() => setActiveQuiz(null)}
      />
    );
  }

  return (
    <div id="quiz-screen" className="space-y-6 animate-fade-in">
      {/* Top Banner: Quiz Mode */}
      <div className="bg-gradient-to-r from-emerald-950/70 via-slate-900 to-sky-950/60 border border-emerald-800/40 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" />
                Chế Độ Trắc Nghiệm & Kiểm Tra (Quiz Mode)
              </span>
              <span className="text-xs text-slate-400">
                | Chấm điểm độc lập từng câu • Phản hồi đúng/sai tức thì
              </span>
            </div>

            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Luyện Tập Đánh Giá Kiến Thức
            </h1>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              Các bài quiz được lưu sẵn trong hệ thống giúp học sinh tự kiểm tra mức độ hiểu bài. Mỗi câu hỏi được lưu câu trả lời độc lập, có phản hồi giải thích chi tiết, không lo bị nhầm lẫn kết quả!
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Bài Quiz Mới</span>
            </button>

            <button
              onClick={() => {
                if (window.confirm('Khôi phục danh sách các bài Quiz mẫu ban đầu?')) {
                  resetToDefault();
                }
              }}
              className="flex items-center gap-1 px-3 py-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 text-xs transition-colors cursor-pointer"
              title="Khôi phục các bài quiz mẫu"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Khôi phục mẫu</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-5 mt-4 border-t border-slate-800/80 max-w-xl">
          <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700/60 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Số bài Quiz đã lưu</span>
              <strong className="text-white text-base font-['Space_Grotesk']">{totalQuizzes}</strong>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700/60 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold">
              <ListOrdered className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Tổng số câu hỏi</span>
              <strong className="text-sky-400 text-base font-['Space_Grotesk']">{totalQuestions}</strong>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700/60 flex items-center gap-3 col-span-2 sm:col-span-1">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Lưu trữ LocalStorage</span>
              <strong className="text-indigo-300 text-xs font-semibold">Tự động giữ lại khi F5</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Filter by Subject */}
      <div className="flex items-center justify-between gap-3 bg-slate-900/60 p-2 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <span className="text-xs text-slate-400 font-semibold whitespace-nowrap pl-2">
            Môn học:
          </span>
          <button
            onClick={() => setSelectedSubjectFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedSubjectFilter === 'all'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Tất cả ({quizzes.length})
          </button>

          {subjects.map((sub) => {
            const count = quizzes.filter((q) => q.subjectId === sub.id).length;
            const isSelected = selectedSubjectFilter === sub.id;

            return (
              <button
                key={sub.id}
                onClick={() => setSelectedSubjectFilter(sub.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{sub.name.split('(')[0].trim()}</span>
                {count > 0 && (
                  <span className="text-[10px] bg-slate-800 px-1.5 rounded-full text-slate-300">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Saved Quiz Items */}
      {filteredQuizzes.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <FolderOpen className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">Chưa có bài Quiz nào trong mục này</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Học sinh có thể tạo bài Quiz mới hoặc bấm nút <strong>Khôi phục mẫu</strong> ở góc trên để tải lại các bài kiểm tra có sẵn.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            + Tạo Bài Quiz Mới
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredQuizzes.map((quizItem) => {
            const mcCount = quizItem.questions.filter((q) => q.type === 'multiple_choice').length;
            const fillCount = quizItem.questions.filter((q) => q.type === 'fill_in').length;

            return (
              <div
                key={quizItem.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      {quizItem.subjectName.split('(')[0].trim()}
                    </span>
                    <span className="text-[11px] text-slate-400 font-['Space_Grotesk']">
                      {quizItem.questions.length} câu hỏi
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-2">
                    {quizItem.title}
                  </h3>

                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {quizItem.description}
                  </p>

                  <div className="flex items-center gap-2 pt-1 flex-wrap text-[11px] text-slate-400">
                    {mcCount > 0 && <span>• {mcCount} câu trắc nghiệm</span>}
                    {fillCount > 0 && <span>• {fillCount} câu điền từ</span>}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-4 mt-4 border-t border-slate-800/80">
                  <button
                    onClick={() => setActiveQuiz(quizItem)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Làm bài Quiz này</span>
                  </button>

                  <button
                    onClick={() => {
                      if (window.confirm(`Bạn có chắc muốn xóa bài quiz "${quizItem.title}"?`)) {
                        deleteQuiz(quizItem.id);
                      }
                    }}
                    className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                    title="Xóa bài quiz này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Tạo Bài Quiz Mới */}
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsCreateModalOpen(false)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/90">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Tạo Bài Quiz Mới</h3>
                  <p className="text-[11px] text-slate-400">
                    Lưu trữ vào LocalStorage để học sinh ôn tập bất kỳ lúc nào
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Đóng modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuizSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Môn học</label>
                  <select
                    value={newSubjectId}
                    onChange={(e) => setNewSubjectId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Tiêu đề bài Quiz <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Ví dụ: Kiểm tra ngữ pháp Unit 3, v.v."
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Mô tả bài Quiz</label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Mục tiêu hoặc phạm vi kiến thức của bài kiểm tra..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Danh sách câu hỏi trong bài quiz */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-bold">
                    Danh sách câu hỏi ({newQuestions.length} câu)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddQuestionToForm}
                    className="text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
                  >
                    + Thêm câu hỏi
                  </button>
                </div>

                {newQuestions.map((q, qIndex) => (
                  <div
                    key={qIndex}
                    className="p-3.5 bg-slate-800/60 border border-slate-700/80 rounded-2xl space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sky-400">Câu {qIndex + 1}</span>
                      <select
                        value={q.type}
                        onChange={(e) => {
                          const val = e.target.value as 'multiple_choice' | 'fill_in';
                          setNewQuestions((prev) =>
                            prev.map((item, i) => (i === qIndex ? { ...item, type: val } : item))
                          );
                        }}
                        className="px-2 py-1 bg-slate-700 border border-slate-600 rounded-lg text-white text-[11px]"
                      >
                        <option value="multiple_choice">Trắc nghiệm A, B, C, D</option>
                        <option value="fill_in">Điền từ / Trả lời ngắn</option>
                      </select>
                    </div>

                    <div>
                      <input
                        type="text"
                        value={q.question}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewQuestions((prev) =>
                            prev.map((item, i) => (i === qIndex ? { ...item, question: val } : item))
                          );
                        }}
                        placeholder="Nội dung câu hỏi..."
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>

                    {q.type === 'multiple_choice' ? (
                      <div className="space-y-1.5">
                        <label className="text-[11px] text-slate-400 font-medium">Các phương án A, B, C, D:</label>
                        {['A', 'B', 'C', 'D'].map((letter, optIdx) => (
                          <input
                            key={optIdx}
                            type="text"
                            value={q.options[optIdx] || `${letter}. `}
                            onChange={(e) => {
                              const newOpts = [...q.options];
                              newOpts[optIdx] = e.target.value;
                              setNewQuestions((prev) =>
                                prev.map((item, i) =>
                                  i === qIndex ? { ...item, options: newOpts } : item
                                )
                              );
                            }}
                            className="w-full px-3 py-1 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                          />
                        ))}

                        <div className="pt-1">
                          <label className="text-[11px] text-slate-400 font-medium">Đáp án đúng:</label>
                          <select
                            value={q.correctAnswer}
                            onChange={(e) => {
                              const val = e.target.value;
                              setNewQuestions((prev) =>
                                prev.map((item, i) =>
                                  i === qIndex ? { ...item, correctAnswer: val } : item
                                )
                              );
                            }}
                            className="w-full mt-0.5 px-3 py-1 bg-slate-700 border border-slate-600 rounded-lg text-white"
                          >
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                            <option value="D">D</option>
                          </select>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="text-[11px] text-slate-400 font-medium">Đáp án từ cần điền:</label>
                        <input
                          type="text"
                          value={q.correctAnswer}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNewQuestions((prev) =>
                              prev.map((item, i) =>
                                i === qIndex ? { ...item, correctAnswer: val } : item
                              )
                            );
                          }}
                          placeholder="Ví dụ: tell, went, vo thanh..."
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
                          required
                        />
                      </div>
                    )}

                    <div>
                      <input
                        type="text"
                        value={q.explanation}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewQuestions((prev) =>
                            prev.map((item, i) =>
                              i === qIndex ? { ...item, explanation: val } : item
                            )
                          );
                        }}
                        placeholder="Giải thích vì sao đáp án này đúng..."
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
                      />
                    </div>

                    <div>
                      <input
                        type="text"
                        value={q.reviewTip || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewQuestions((prev) =>
                            prev.map((item, i) =>
                              i === qIndex ? { ...item, reviewTip: val } : item
                            )
                          );
                        }}
                        placeholder="Gợi ý ngắn để ôn lại (ví dụ: Xem lại quy tắc SGK trang 32)..."
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Lưu Bài Quiz
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
