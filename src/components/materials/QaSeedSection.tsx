import React, { useState } from 'react';
import {
  HelpCircle,
  MessageSquare,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Star,
  Copy,
  Check,
  Plus,
  Bot,
  Lightbulb,
  BookOpen,
  Volume2,
  Trash2,
  Send,
} from 'lucide-react';
import { QaSeedItem, QaCategory, StudySubject } from '../../types';

interface QaSeedSectionProps {
  currentSubject: StudySubject;
  seeds: QaSeedItem[];
  onAddSeed: (data: {
    subjectId: string;
    question: string;
    shortAnswer: string;
    category: QaCategory;
    categoryLabel: string;
    exampleNote?: string;
    suggestedPrompt?: string;
  }) => void;
  onToggleFavorite: (id: string) => void;
  onDeleteSeed?: (id: string) => void;
  onAskChatbot?: (prompt: string) => void;
}

export const QaSeedSection: React.FC<QaSeedSectionProps> = ({
  currentSubject,
  seeds,
  onAddSeed,
  onToggleFavorite,
  onDeleteSeed,
  onAskChatbot,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(seeds[0]?.id || null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Form State
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [newCategory, setNewCategory] = useState<QaCategory>('ngu_am');
  const [newExample, setNewExample] = useState('');

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleToggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleSubmitNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || !newAnswer.trim()) {
      alert('Vui lòng nhập cả câu hỏi gợi mở và câu trả lời ngắn.');
      return;
    }

    const categoryLabels: Record<QaCategory, string> = {
      ngu_am: 'Ngữ âm & Phát âm',
      ngu_phap: 'Ngữ pháp cốt lõi',
      tu_vung: 'Từ vựng & Mẫu câu',
      meo_ghi_nho: 'Mẹo ôn thi',
      van_dung: 'Giao tiếp thực tế',
    };

    onAddSeed({
      subjectId: currentSubject.id,
      question: newQuestion.trim(),
      shortAnswer: newAnswer.trim(),
      category: newCategory,
      categoryLabel: categoryLabels[newCategory],
      exampleNote: newExample.trim() || undefined,
      suggestedPrompt: newQuestion.trim(),
    });

    setNewQuestion('');
    setNewAnswer('');
    setNewExample('');
    setIsAddingNew(false);
  };

  // Category Badge Color
  const getCategoryBadgeClass = (category: QaCategory) => {
    switch (category) {
      case 'ngu_am':
        return 'bg-sky-500/15 text-sky-400 border-sky-500/30';
      case 'ngu_phap':
        return 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30';
      case 'tu_vung':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'meo_ghi_nho':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'van_dung':
        return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  return (
    <div id="qa-seed-section" className="space-y-4">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-indigo-400" />
                Q&A Seed Khởi Tạo (Chuẩn Bị Chatbot)
              </span>
              <span className="text-xs text-slate-400">
                | Môn: <strong className="text-white">{currentSubject.name}</strong>
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>Câu Hỏi Gợi Mở & Giải Đáp Ngắn Cốt Lõi</span>
              <span className="px-2 py-0.2 rounded-full text-[11px] bg-slate-800 text-sky-400 border border-slate-700 font-normal">
                {seeds.length} câu hỏi
              </span>
            </h3>

            <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
              Tập hợp các câu hỏi thực tế mà học sinh hay thắc mắc nhất khi học chủ đề này. Dữ liệu câu trả lời ngắn gọn được lưu sẵn trong LocalStorage, đóng vai trò tri thức mẫu để kết nối Chatbot ở giai đoạn tiếp theo.
            </p>
          </div>

          <button
            onClick={() => setIsAddingNew(!isAddingNew)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600/90 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAddingNew ? 'Đóng form thêm' : '+ Thêm Câu Hỏi Mới'}</span>
          </button>
        </div>

        {/* Form to add a new Q&A Seed */}
        {isAddingNew && (
          <form
            onSubmit={handleSubmitNew}
            className="mt-4 pt-4 border-t border-slate-800/80 space-y-3 bg-slate-950/50 p-4 rounded-2xl border border-indigo-900/40 text-xs"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Khởi tạo câu hỏi gợi mở cho chủ đề này:
              </span>
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Câu hỏi thực tế của học sinh <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="Ví dụ: Làm sao để nhớ đuôi -ed? hoặc Phân biệt present perfect với past simple?"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 placeholder-slate-400"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Phân loại câu hỏi</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as QaCategory)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="ngu_am">Ngữ âm & Phát âm</option>
                  <option value="ngu_phap">Ngữ pháp cốt lõi</option>
                  <option value="tu_vung">Từ vựng & Mẫu câu</option>
                  <option value="meo_ghi_nho">Mẹo ôn thi</option>
                  <option value="van_dung">Giao tiếp thực tế</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Mẹo nhớ hoặc ví dụ bổ trợ (tùy chọn)</label>
                <input
                  type="text"
                  value={newExample}
                  onChange={(e) => setNewExample(e.target.value)}
                  placeholder="Ví dụ câu hoặc câu khẩu quyết..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 placeholder-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Câu trả lời ngắn gọn (2-3 câu, dễ hiểu cho học sinh lớp 7+) <span className="text-rose-400">*</span>
              </label>
              <textarea
                value={newAnswer}
                onChange={(e) => setNewAnswer(e.target.value)}
                placeholder="Giải thích ngắn gọn, chuẩn xác, không lan man..."
                rows={3}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 placeholder-slate-400"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md cursor-pointer"
              >
                Lưu vào Q&A Seed
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Seeds Accordion / List */}
      <div className="space-y-3">
        {seeds.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center space-y-2">
            <p className="text-xs text-slate-400">
              Chưa có Q&A seed nào cho chủ đề này. Hãy nhấn <strong>+ Thêm Câu Hỏi Mới</strong> để tạo câu hỏi khởi tạo ban đầu!
            </p>
          </div>
        ) : (
          seeds.map((seed, index) => {
            const isExpanded = expandedId === seed.id;
            const badgeClass = getCategoryBadgeClass(seed.category);

            return (
              <div
                key={seed.id}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  isExpanded
                    ? 'bg-slate-900 border-indigo-500/40 shadow-lg shadow-indigo-950/30'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Question Header */}
                <div
                  onClick={() => handleToggleExpand(seed.id)}
                  className="p-4 flex items-start justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-lg bg-slate-800 text-sky-400 flex items-center justify-center text-xs font-bold shrink-0 font-['Space_Grotesk'] mt-0.5">
                      Q{index + 1}
                    </span>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`inline-block px-2 py-0.2 rounded-md text-[10px] font-bold border ${badgeClass}`}
                        >
                          {seed.categoryLabel}
                        </span>

                        {seed.isFavorite && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-400 font-semibold">
                            <Star className="w-3 h-3 fill-amber-400" />
                            <span>Câu hỏi hay</span>
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors">
                        {seed.question}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(seed.id);
                      }}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        seed.isFavorite
                          ? 'text-amber-400 bg-amber-500/10'
                          : 'text-slate-500 hover:text-amber-400 hover:bg-slate-800'
                      }`}
                      title={seed.isFavorite ? 'Bỏ đánh dấu câu hay' : 'Đánh dấu câu hỏi hay'}
                    >
                      <Star className={`w-3.5 h-3.5 ${seed.isFavorite ? 'fill-amber-400' : ''}`} />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(seed.question, seed.id);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-sky-300 hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Sao chép câu hỏi"
                    >
                      {copiedId === seed.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <div className="p-1 text-slate-400">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-sky-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Short Answer Body (Expandable) */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-slate-800/80 bg-slate-950/30 space-y-3 animate-fade-in text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-indigo-400 font-semibold text-[11px]">
                        <Lightbulb className="w-3.5 h-3.5" />
                        <span>Câu trả lời ngắn gọn (Short Answer):</span>
                      </div>
                      <p className="text-slate-200 leading-relaxed bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                        {seed.shortAnswer}
                      </p>
                    </div>

                    {seed.exampleNote && (
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-[11px] leading-relaxed">
                        <strong>📌 Lưu ý / Mẹo nhớ:</strong> {seed.exampleNote}
                      </div>
                    )}

                    {/* Pre-configured Prompt for Chatbot */}
                    {seed.suggestedPrompt && (
                      <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-indigo-950/40 border border-indigo-900/50 text-[11px] flex-wrap">
                        <div className="flex items-center gap-1.5 text-indigo-300 truncate">
                          <Bot className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span className="truncate">
                            <strong>Chatbot prompt gợi ý:</strong> "{seed.suggestedPrompt}"
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {onAskChatbot && (
                            <button
                              type="button"
                              onClick={() => onAskChatbot(seed.suggestedPrompt || seed.question)}
                              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] cursor-pointer flex items-center gap-1 shadow-sm"
                              title="Gửi câu hỏi này sang Chatbot Ôn bài"
                            >
                              <span>Hỏi Gia Sư</span>
                              <Send className="w-2.5 h-2.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleCopy(seed.suggestedPrompt!, `prompt-${seed.id}`)}
                            className="px-2 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 font-medium cursor-pointer"
                          >
                            {copiedId === `prompt-${seed.id}` ? 'Đã chép' : 'Sao chép'}
                          </button>
                        </div>
                      </div>
                    )}

                    {onDeleteSeed && (
                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('Xóa câu hỏi này khỏi danh sách Q&A Seed?')) {
                              onDeleteSeed(seed.id);
                            }
                          }}
                          className="text-[11px] text-slate-500 hover:text-rose-400 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Xóa câu hỏi này</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
