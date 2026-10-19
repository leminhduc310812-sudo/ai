import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Volume2,
  CheckCircle,
  XCircle,
  Trash2,
  Edit2,
  Sparkles,
  Plus,
  BookOpen,
  Lightbulb,
  CheckCircle2,
  GitCompare,
  AlertCircle,
  RotateCw,
  FolderOpen,
} from 'lucide-react';
import { FlashcardItem, FlashcardCategory } from '../../types';
import { FLASHCARD_CATEGORIES, AVAILABLE_SUBJECT_PRESETS } from '../../data/flashcardLibrary';

interface FlashcardListProps {
  cards: FlashcardItem[];
  onToggleMastered: (id: string) => void;
  onDeleteCard: (id: string) => void;
  onOpenAddModal: () => void;
  onPracticeCard?: (card: FlashcardItem) => void;
}

export const FlashcardList: React.FC<FlashcardListProps> = ({
  cards,
  onToggleMastered,
  onDeleteCard,
  onOpenAddModal,
  onPracticeCard,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'unmastered' | 'mastered'>('all');
  const [flippedCardIds, setFlippedCardIds] = useState<Record<string, boolean>>({});

  // Toggle individual card flip
  const toggleCardFlip = (id: string) => {
    setFlippedCardIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Text-To-Speech
  const handleSpeak = (text: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const isEnglish = /[a-zA-Z]{4,}/.test(text) && !/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(text);
    utterance.lang = isEnglish ? 'en-US' : 'vi-VN';
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  // Extract unique subjects from cards
  const subjectsInUse = useMemo(() => {
    const map = new Map<string, string>();
    cards.forEach((c) => {
      if (c.subjectId && c.subjectName) {
        map.set(c.subjectId, c.subjectName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [cards]);

  // Filtered Cards
  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchFront = card.front.toLowerCase().includes(query);
        const matchBack = card.back.toLowerCase().includes(query);
        const matchSubject = card.subjectName.toLowerCase().includes(query);
        const matchNotes = (card.notes || '').toLowerCase().includes(query);
        if (!matchFront && !matchBack && !matchSubject && !matchNotes) {
          return false;
        }
      }

      // Subject filter
      if (selectedSubject !== 'all' && card.subjectId !== selectedSubject) {
        return false;
      }

      // Category filter (5 nhóm ưu tiên)
      if (selectedCategory !== 'all' && card.category !== selectedCategory) {
        return false;
      }

      // Status filter
      if (selectedStatus === 'mastered' && !card.mastered) {
        return false;
      }
      if (selectedStatus === 'unmastered' && card.mastered) {
        return false;
      }

      return true;
    });
  }, [cards, searchQuery, selectedSubject, selectedCategory, selectedStatus]);

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

  return (
    <div id="flashcard-list" className="space-y-6">
      {/* Filters & Search Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo từ khóa, câu hỏi hoặc đáp án..."
              className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-3 py-2 bg-slate-800/90 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              <option value="all">Tất cả môn học ({cards.length})</option>
              {subjectsInUse.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="px-3 py-2 bg-slate-800/90 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="unmastered">Cần ôn lại ({cards.filter((c) => !c.mastered).length})</option>
              <option value="mastered">Đã thuộc ({cards.filter((c) => c.mastered).length})</option>
            </select>

            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-500/20 whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Thẻ</span>
            </button>
          </div>
        </div>

        {/* 5 Priority Categories Filter Pills */}
        <div className="space-y-1.5 border-t border-slate-800/80 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
              <Filter className="w-3 h-3 text-sky-400" />
              Lọc theo 5 nhóm trọng tâm (Khái niệm, Định nghĩa, Ví dụ, Phân biệt, Quy tắc):
            </span>
            <span className="text-[11px] text-slate-400">
              Hiển thị: <strong className="text-white">{filteredCards.length}</strong> / {cards.length} thẻ
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Tất cả nhóm
            </button>

            {(Object.keys(FLASHCARD_CATEGORIES) as FlashcardCategory[]).map((catKey) => {
              const meta = FLASHCARD_CATEGORIES[catKey];
              const countInCat = cards.filter((c) => c.category === catKey).length;
              const isActive = selectedCategory === catKey;

              return (
                <button
                  key={catKey}
                  onClick={() => setSelectedCategory(catKey)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                    isActive
                      ? `${meta.badgeBg} ${meta.badgeText} ${meta.borderColor} ring-1 ring-sky-500/40`
                      : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-slate-200'
                  }`}
                >
                  {renderCategoryIcon(catKey)}
                  <span>{meta.shortLabel}</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900/60 text-slate-300">
                    {countInCat}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      {filteredCards.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <FolderOpen className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-white">Không tìm thấy thẻ nào phù hợp</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Hãy thử tìm bằng từ khóa khác hoặc đặt lại bộ lọc để xem toàn bộ danh sách thẻ ghi nhớ.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedSubject('all');
              setSelectedCategory('all');
              setSelectedStatus('all');
            }}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Xóa bộ lọc
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCards.map((card) => {
            const meta = FLASHCARD_CATEGORIES[card.category] || FLASHCARD_CATEGORIES.khai_niem;
            const isFlipped = Boolean(flippedCardIds[card.id]);

            return (
              <div
                key={card.id}
                className={`rounded-2xl border transition-all duration-200 flex flex-col justify-between p-5 relative overflow-hidden group ${
                  card.mastered
                    ? 'bg-slate-900/70 border-emerald-500/20 hover:border-emerald-500/40'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Header: Category Badge + Subject + Audio */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${meta.badgeBg} ${meta.badgeText} ${meta.borderColor}`}
                      >
                        {renderCategoryIcon(card.category)}
                        <span>{meta.label}</span>
                      </span>

                      <span className="text-[10px] text-slate-400 truncate max-w-[160px]">
                        {card.subjectName}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleSpeak(isFlipped ? card.back : card.front, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-sky-300 hover:bg-sky-500/10 transition-colors cursor-pointer"
                      title="Nghe phát âm"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => toggleCardFlip(card.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Lật thẻ xem mặt trước / sau"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Card Content Area (Clickable to Flip) */}
                <div
                  onClick={() => toggleCardFlip(card.id)}
                  className="cursor-pointer space-y-2 py-1 select-none"
                >
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <span>{isFlipped ? 'Mặt sau (Đáp án & Giải thích)' : 'Mặt trước (Câu hỏi)'}</span>
                    <span className="text-slate-400 group-hover:text-sky-400 transition-colors">
                      {isFlipped ? 'Nhấn để lật lại' : 'Nhấn để xem đáp án'}
                    </span>
                  </div>

                  {!isFlipped ? (
                    /* Front */
                    <h3 className="text-sm sm:text-base font-bold text-white leading-snug line-clamp-3">
                      {card.front}
                    </h3>
                  ) : (
                    /* Back */
                    <div className="text-xs text-slate-200 leading-relaxed bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 whitespace-pre-line">
                      {card.back}
                    </div>
                  )}

                  {/* Example if exists and flipped */}
                  {isFlipped && card.exampleSentence && (
                    <p className="text-[11px] text-emerald-300 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                      <strong>Ví dụ:</strong> {card.exampleSentence}
                    </p>
                  )}

                  {/* Notes if exists */}
                  {card.notes && (
                    <p className="text-[11px] text-amber-300/90 italic flex items-center gap-1">
                      <Lightbulb className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>{card.notes}</span>
                    </p>
                  )}
                </div>

                {/* Footer Actions: Mastered Toggle + Delete */}
                <div className="flex items-center justify-between border-t border-slate-800/80 pt-3 mt-3 text-xs">
                  <button
                    onClick={() => onToggleMastered(card.id)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                      card.mastered
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    {card.mastered ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Đã thuộc</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5 text-slate-400" />
                        <span>Cần ôn lại</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400">
                      Ôn {card.reviewCount || 0} lần
                    </span>

                    <button
                      onClick={() => {
                        if (window.confirm('Bạn có chắc chắn muốn xóa thẻ ghi nhớ này?')) {
                          onDeleteCard(card.id);
                        }
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Xóa thẻ"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
