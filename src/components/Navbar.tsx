import React from 'react';
import { Volume2, Sparkles, Flame, PlusCircle, Globe2, Target, BookMarked, Mic, Layers, HelpCircle, Bot, FolderOpen } from 'lucide-react';
import { DifficultyLevel, PracticeGoal } from '../types';

export type AppViewMode = 'materials' | 'flashcards' | 'quiz' | 'chatbot' | 'practice';

interface NavbarProps {
  currentLevel: DifficultyLevel;
  onSelectLevel: (level: DifficultyLevel) => void;
  onOpenCustomModal: () => void;
  practiceCount: number;
  goal?: PracticeGoal;
  todayCompletedCount?: number;
  activeView: AppViewMode;
  onSelectView: (view: AppViewMode) => void;
  materialCount?: number;
  flashcardCount?: number;
  quizCount?: number;
  onOpenSnapshotModal?: (mode: 'saved_list' | 'save_current') => void;
  snapshotsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentLevel,
  onSelectLevel,
  onOpenCustomModal,
  practiceCount,
  goal,
  todayCompletedCount = 0,
  activeView,
  onSelectView,
  materialCount = 0,
  flashcardCount = 0,
  quizCount = 0,
  onOpenSnapshotModal,
  snapshotsCount = 0,
}) => {
  return (
    <header id="app-header" className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-16 py-2.5 flex flex-wrap lg:flex-nowrap items-center justify-between gap-3">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 text-white font-bold shrink-0">
            <Volume2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white font-['Space_Grotesk']">
                EchoLingo <span className="text-sky-400">AI</span>
              </span>
              <span className="px-2 py-0.5 text-[11px] font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/30 rounded-full">
                Ôn Tập Đa Môn
              </span>
            </div>
            <p className="text-xs text-slate-300 hidden sm:block">
              Học liệu thông minh • Flashcard • Quiz • Chatbot • Phát âm
            </p>
          </div>
        </div>

        {/* View Switcher (Học liệu vs Flashcard vs Quiz Mode vs Luyện phát âm) */}
        <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700/80 overflow-x-auto max-w-full">
          <button
            id="tab-nav-materials"
            onClick={() => onSelectView('materials')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeView === 'materials'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookMarked className="w-3.5 h-3.5" />
            <span>Học Liệu</span>
            {materialCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeView === 'materials' ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-300'
              }`}>
                {materialCount}
              </span>
            )}
          </button>

          <button
            id="tab-nav-flashcards"
            onClick={() => onSelectView('flashcards')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeView === 'flashcards'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Flashcard</span>
            {flashcardCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeView === 'flashcards' ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-300'
              }`}>
                {flashcardCount}
              </span>
            )}
          </button>

          <button
            id="tab-nav-quiz"
            onClick={() => onSelectView('quiz')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeView === 'quiz'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Quiz Mode</span>
            {quizCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeView === 'quiz' ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-300'
              }`}>
                {quizCount}
              </span>
            )}
          </button>

          <button
            id="tab-nav-chatbot"
            onClick={() => onSelectView('chatbot')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeView === 'chatbot'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Chatbot Ôn Bài</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
              Grounded
            </span>
          </button>

          <button
            id="tab-nav-practice"
            onClick={() => onSelectView('practice')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeView === 'practice'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Luyện Phát Âm</span>
          </button>
        </div>

        {/* Level Controls & Stats */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Snapshots / Save & Restore Quick Button */}
          {onOpenSnapshotModal && (
            <button
              id="nav-btn-snapshots"
              onClick={() => onOpenSnapshotModal('saved_list')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 active:scale-95 text-slate-200 border border-slate-700 text-xs font-semibold transition-all cursor-pointer shadow-sm"
              title="Quản lý và nạp các bộ ôn tập / môn học đã lưu"
            >
              <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Bộ đã lưu</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-bold">
                {snapshotsCount}
              </span>
            </button>
          )}

          {/* Daily Goal Badge */}
          {goal && (
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-semibold">
              <Target className="w-3.5 h-3.5 text-sky-400" />
              <span>
                Mục tiêu: <strong className="text-white">{todayCompletedCount}/{goal.dailyTarget}</strong>
              </span>
            </div>
          )}

          {/* Difficulty Level Switcher (visible in practice mode) */}
          {activeView === 'practice' && (
            <div className="hidden md:flex items-center bg-slate-800/80 p-1 rounded-lg border border-slate-700/60 text-xs">
              {(['beginner', 'intermediate', 'advanced'] as DifficultyLevel[]).map((lvl) => {
                const labels: Record<DifficultyLevel, string> = {
                  beginner: 'Cơ bản',
                  intermediate: 'Trung cấp',
                  advanced: 'Nâng cao',
                };
                const active = currentLevel === lvl;
                return (
                  <button
                    key={lvl}
                    id={`level-btn-${lvl}`}
                    onClick={() => onSelectLevel(lvl)}
                    className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                      active
                        ? 'bg-sky-500 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                    }`}
                  >
                    {labels[lvl]}
                  </button>
                );
              })}
            </div>
          )}

          {/* Practice Streak/Count */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
            <Flame className="w-4 h-4 text-amber-400 fill-amber-400/20" />
            <span>{practiceCount} lượt</span>
          </div>

          {/* Custom Practice Button */}
          {activeView === 'practice' && (
            <button
              id="btn-custom-practice"
              onClick={onOpenCustomModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 active:scale-95 text-white text-xs font-semibold shadow-md shadow-sky-600/20 transition-all cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Từ/Câu tự chọn</span>
              <span className="sm:hidden">Tự chọn</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};


