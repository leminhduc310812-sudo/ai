import React, { useState, useMemo } from 'react';
import {
  Layers,
  Sparkles,
  BookOpen,
  CheckCircle,
  XCircle,
  RotateCcw,
  Plus,
  Play,
  Grid,
  Filter,
  Flame,
  Volume2,
  Mic,
  Database,
} from 'lucide-react';
import { StudySubject, StudyMaterialSource, FlashcardCategory } from '../../types';
import { useFlashcards } from '../../hooks/useFlashcards';
import { FlashcardPlayer } from './FlashcardPlayer';
import { FlashcardList } from './FlashcardList';
import { AddFlashcardModal } from './AddFlashcardModal';
import { FLASHCARD_CATEGORIES } from '../../data/flashcardLibrary';

interface FlashcardsScreenProps {
  subjects: StudySubject[];
  currentSubjectId: string;
  materials: StudyMaterialSource[];
  onNavigateToPractice?: (text: string, title: string) => void;
  onNavigateToMaterials?: () => void;
}

export const FlashcardsScreen: React.FC<FlashcardsScreenProps> = ({
  subjects,
  currentSubjectId,
  materials,
  onNavigateToPractice,
  onNavigateToMaterials,
}) => {
  const [viewMode, setViewMode] = useState<'player' | 'library'>('player');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>(currentSubjectId || 'all');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // Đồng bộ bộ lọc thẻ khi môn học hiện tại thay đổi hoặc được restore
  React.useEffect(() => {
    if (currentSubjectId) {
      setSelectedSubjectFilter(currentSubjectId);
    }
  }, [currentSubjectId]);

  const {
    cards,
    isGenerating,
    addCard,
    deleteCard,
    toggleMastered,
    recordReview,
    resetToDefault,
    generateAiFlashcards,
  } = useFlashcards();

  // Filter cards by selected subject if not 'all'
  const displayCards = useMemo(() => {
    if (selectedSubjectFilter === 'all') return cards;
    return cards.filter((c) => c.subjectId === selectedSubjectFilter);
  }, [cards, selectedSubjectFilter]);

  // Overall Statistics
  const totalCards = cards.length;
  const masteredCount = cards.filter((c) => c.mastered).length;
  const unmasteredCount = totalCards - masteredCount;
  const masteredPercent = totalCards > 0 ? Math.round((masteredCount / totalCards) * 100) : 0;

  // Count by 5 categories
  const categoryCounts = useMemo(() => {
    const counts: Record<FlashcardCategory, number> = {
      khai_niem: 0,
      dinh_nghia: 0,
      vi_du: 0,
      phan_biet: 0,
      quy_tac: 0,
    };
    cards.forEach((c) => {
      if (counts[c.category] !== undefined) {
        counts[c.category]++;
      }
    });
    return counts;
  }, [cards]);

  return (
    <div id="flashcards-screen" className="space-y-6 animate-fade-in">
      {/* Top Banner: Motivational and Stats */}
      <div className="bg-gradient-to-r from-indigo-950/70 via-slate-900 to-sky-950/50 border border-indigo-800/40 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" />
                Ôn Tập Nhanh Bằng Flashcard
              </span>
              <span className="text-xs text-slate-400">
                | 5 nhóm cốt lõi: Khái niệm • Định nghĩa • Ví dụ • Phân biệt • Quy tắc
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Thẻ Ghi Nhớ & Ôn Luyện Đa Môn Học
            </h1>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              Lật thẻ mặt trước ⇄ mặt sau để rèn phản xạ, nắm vững bản chất kiến thức Tiếng Anh, Toán học, KHTN, Ngữ văn. Dễ nhớ, không học vẹt, lưu trữ bền vững trên máy của bạn!
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              id="btn-add-flashcard-header"
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-sky-500 hover:bg-sky-400 active:scale-95 text-white font-bold text-xs shadow-lg shadow-sky-500/25 transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Thẻ Mới</span>
            </button>

            <button
              onClick={() => {
                if (window.confirm('Khôi phục danh sách thẻ mẫu đa môn học ban đầu?')) {
                  resetToDefault();
                }
              }}
              className="flex items-center gap-1 px-3 py-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 text-xs transition-colors cursor-pointer"
              title="Đặt lại bộ thẻ mẫu phong phú"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Thẻ mẫu</span>
            </button>
          </div>
        </div>

        {/* 4 Stats Cards + LocalStorage */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 mt-4 border-t border-slate-800/80">
          <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700/60 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Tổng số thẻ</span>
              <strong className="text-white text-base font-['Space_Grotesk']">{totalCards}</strong>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700/60 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
              <CheckCircle className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Đã thuộc ({masteredPercent}%)</span>
              <strong className="text-emerald-400 text-base font-['Space_Grotesk']">{masteredCount}</strong>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700/60 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
              <XCircle className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Cần ôn lại</span>
              <strong className="text-amber-400 text-base font-['Space_Grotesk']">{unmasteredCount}</strong>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700/60 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Bộ nhớ LocalStorage</span>
              <strong className="text-indigo-300 text-xs font-semibold">Tự động lưu</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Controls: Switcher (Ôn Nhanh vs Thư Viện) + Subject Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-2 rounded-2xl border border-slate-800">
        {/* Mode Switcher */}
        <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700/60 self-start sm:self-auto">
          <button
            id="tab-mode-player"
            onClick={() => setViewMode('player')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'player'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Ôn Tập Nhanh (Player)</span>
          </button>

          <button
            id="tab-mode-library"
            onClick={() => setViewMode('library')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'library'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Thư Viện Thẻ ({cards.length})</span>
          </button>
        </div>

        {/* Quick Subject Filter Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <span className="text-[11px] text-slate-400 font-semibold whitespace-nowrap hidden md:inline">
            Môn học:
          </span>
          <button
            onClick={() => setSelectedSubjectFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedSubjectFilter === 'all'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Tất cả ({cards.length})
          </button>

          {subjects.map((sub) => {
            const count = cards.filter((c) => c.subjectId === sub.id).length;
            const isSelected = selectedSubjectFilter === sub.id;

            return (
              <button
                key={sub.id}
                onClick={() => setSelectedSubjectFilter(sub.id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  isSelected ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'text-slate-400 hover:text-slate-200'
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

      {/* Main View Area */}
      {viewMode === 'player' ? (
        <FlashcardPlayer
          cards={displayCards}
          onRecordReview={recordReview}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onSwitchToLibrary={() => setViewMode('library')}
        />
      ) : (
        <FlashcardList
          cards={displayCards}
          onToggleMastered={toggleMastered}
          onDeleteCard={deleteCard}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onPracticeCard={(card) => {
            if (onNavigateToPractice) {
              onNavigateToPractice(card.front, card.subjectName);
            }
          }}
        />
      )}

      {/* Modal Add Flashcard */}
      <AddFlashcardModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        subjects={subjects}
        materials={materials}
        defaultSubjectId={currentSubjectId}
        onAddCard={addCard}
        onGenerateAiCards={generateAiFlashcards}
        isGenerating={isGenerating}
      />
    </div>
  );
};
