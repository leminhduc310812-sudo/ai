import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Plus,
  BookOpen,
  Lightbulb,
  CheckCircle2,
  GitCompare,
  AlertCircle,
  FileText,
  HelpCircle,
  Wand2,
} from 'lucide-react';
import { FlashcardItem, FlashcardCategory, StudySubject, StudyMaterialSource } from '../../types';
import { FLASHCARD_CATEGORIES, AVAILABLE_SUBJECT_PRESETS } from '../../data/flashcardLibrary';

interface AddFlashcardModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: StudySubject[];
  materials: StudyMaterialSource[];
  defaultSubjectId?: string;
  onAddCard: (card: {
    front: string;
    back: string;
    category: FlashcardCategory;
    subjectId: string;
    subjectName: string;
    sourceMaterialId?: string;
    sourceTitle?: string;
    notes?: string;
    exampleSentence?: string;
  }) => void;
  onGenerateAiCards: (params: {
    subjectId: string;
    subjectName: string;
    topicTitle: string;
    sourceContent: string;
    sourceMaterialId?: string;
  }) => Promise<FlashcardItem[]>;
  isGenerating?: boolean;
}

export const AddFlashcardModal: React.FC<AddFlashcardModalProps> = ({
  isOpen,
  onClose,
  subjects,
  materials,
  defaultSubjectId,
  onAddCard,
  onGenerateAiCards,
  isGenerating = false,
}) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'ai'>('manual');

  // Đóng modal khi nhấn Escape
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Manual Form State
  const [subjectId, setSubjectId] = useState<string>(defaultSubjectId || subjects[0]?.id || 'subj-1');
  const [customSubjectName, setCustomSubjectName] = useState<string>('');
  const [category, setCategory] = useState<FlashcardCategory>('khai_niem');
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [notes, setNotes] = useState('');
  const [exampleSentence, setExampleSentence] = useState('');

  // AI Generator Form State
  const [aiSubjectId, setAiSubjectId] = useState<string>(defaultSubjectId || subjects[0]?.id || 'subj-1');
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');
  const [customTopicTitle, setCustomTopicTitle] = useState<string>('');
  const [customTopicContent, setCustomTopicContent] = useState<string>('');
  const [aiSuccessMessage, setAiSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentSubjectObj = subjects.find((s) => s.id === subjectId) || subjects[0];

  // Quick Category Templates for Students
  const applyCategoryTemplate = (cat: FlashcardCategory) => {
    setCategory(cat);
    switch (cat) {
      case 'khai_niem':
        setFront('Khái niệm [Tên khái niệm] trong bài học này là gì?');
        setBack('Bản chất cốt lõi: Là hiện tượng / ý niệm thể hiện ...\nĐặc điểm chính: ...');
        setNotes('Đọc kỹ từ khóa trước khi suy luận');
        break;
      case 'dinh_nghia':
        setFront('Định nghĩa [Thuật ngữ / Công thức] là gì?');
        setBack('Định nghĩa: [Phát biểu chuẩn xác].\nCông thức / Ký hiệu: ...');
        setNotes('Chú ý các điều kiện đi kèm (nếu có)');
        break;
      case 'vi_du':
        setFront('Cho ví dụ thực tế minh họa cho [Chủ đề bài học]?');
        setBack('Ví dụ tiêu biểu: "..."\nPhân tích: Ở đây đối tượng đã áp dụng quy tắc ...');
        setExampleSentence('Mẫu câu thực tế giúp ứng dụng vào bài thi');
        break;
      case 'phan_biet':
        setFront('Phân biệt sự khác nhau giữa [Khái niệm A] và [Khái niệm B]?');
        setBack('• Giống nhau: Đều là ...\n• Khác nhau:\n  - [Khái niệm A]: ...\n  - [Khái niệm B]: ...');
        setNotes('Nhớ lập bảng so sánh 2 cột');
        break;
      case 'quy_tac':
        setFront('Quy tắc hoặc lưu ý quan trọng cần nhớ khi [Tên tình huống / Phép tính]?');
        setBack('Quy tắc bắt buộc:\n1. Bước 1: ...\n2. Bước 2: ...\nLưu ý tránh bẫy: ...');
        setNotes('Không được bỏ qua các ngoại lệ đặc biệt');
        break;
    }
  };

  // Submit manual form
  const handleSubmitManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!front.trim() || !back.trim()) {
      alert('Vui lòng nhập cả mặt trước (câu hỏi) và mặt sau (đáp án/giải nghĩa).');
      return;
    }

    const subName = customSubjectName.trim() || currentSubjectObj?.name || 'Môn học chung';

    onAddCard({
      front: front.trim(),
      back: back.trim(),
      category,
      subjectId,
      subjectName: subName,
      notes: notes.trim() || undefined,
      exampleSentence: exampleSentence.trim() || undefined,
    });

    // Reset fields
    setFront('');
    setBack('');
    setNotes('');
    setExampleSentence('');
    onClose();
  };

  // Submit AI Generation
  const handleGenerateAi = async () => {
    const selectedMat = materials.find((m) => m.id === selectedMaterialId);
    const subObj = subjects.find((s) => s.id === aiSubjectId) || subjects[0];

    const topicTitle = selectedMat?.title || customTopicTitle || subObj?.name || 'Bài học';
    const content = selectedMat?.content || customTopicContent || selectedMat?.notes || topicTitle;

    setAiSuccessMessage(null);
    try {
      const generated = await onGenerateAiCards({
        subjectId: aiSubjectId,
        subjectName: subObj?.name || 'Môn học',
        topicTitle,
        sourceContent: content,
        sourceMaterialId: selectedMat?.id,
      });

      setAiSuccessMessage(`Đã tạo thành công ${generated.length} thẻ ghi nhớ theo 5 nhóm trọng tâm!`);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      alert('Không thể tạo thẻ lúc này. Vui lòng thử lại!');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Tạo Thẻ Ghi Nhớ (Flashcard)</h3>
              <p className="text-[11px] text-slate-400">
                Ưu tiên 5 nhóm: Khái niệm • Định nghĩa • Ví dụ • Phân biệt • Quy tắc/Lưu ý
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection: Tạo Thủ Công vs Tạo Bằng AI */}
        <div className="flex border-b border-slate-800 px-6 pt-2 bg-slate-900/50">
          <button
            onClick={() => setActiveTab('manual')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'manual'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tạo thẻ thủ công</span>
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'ai'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tạo nhanh bằng AI từ học liệu</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {activeTab === 'manual' ? (
            /* MANUAL FORM */
            <form onSubmit={handleSubmitManual} className="space-y-4 text-xs">
              {/* Subject Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Môn học / Chủ đề</label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-sky-500"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                    <option value="custom">+ Nhập môn học khác...</option>
                  </select>
                </div>

                {subjectId === 'custom' && (
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Tên môn học mới</label>
                    <input
                      type="text"
                      value={customSubjectName}
                      onChange={(e) => setCustomSubjectName(e.target.value)}
                      placeholder="Ví dụ: Toán Hình Học 8, Hóa Học 9..."
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                )}
              </div>

              {/* 5 Priority Categories Selection */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Nhóm nội dung ưu tiên (Chọn 1 trong 5 nhóm cốt lõi)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(Object.keys(FLASHCARD_CATEGORIES) as FlashcardCategory[]).map((catKey) => {
                    const meta = FLASHCARD_CATEGORIES[catKey];
                    const isSelected = category === catKey;

                    return (
                      <button
                        key={catKey}
                        type="button"
                        onClick={() => applyCategoryTemplate(catKey)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? `${meta.badgeBg} ${meta.badgeText} ${meta.borderColor} ring-1 ring-sky-500/50`
                            : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        <span className="font-bold text-xs">{meta.label}</span>
                        <span className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                          {meta.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Front (Mặt trước) */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Mặt trước: Câu hỏi / Thuật ngữ / Tình huống <span className="text-rose-400">*</span>
                </label>
                <textarea
                  value={front}
                  onChange={(e) => setFront(e.target.value)}
                  placeholder="Ví dụ: Âm đuôi /t/ và /d/ khác nhau như thế nào? hoặc Định nghĩa Số hữu tỉ?"
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-sky-500 placeholder-slate-400"
                  required
                />
              </div>

              {/* Back (Mặt sau) */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Mặt sau: Định nghĩa / Lời giải / Phân biệt / Quy tắc <span className="text-rose-400">*</span>
                </label>
                <textarea
                  value={back}
                  onChange={(e) => setBack(e.target.value)}
                  placeholder="Diễn giải súc tích, gạch đầu dòng rõ ràng, dễ hiểu cho học sinh lớp 7 trở lên..."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-sky-500 placeholder-slate-400"
                  required
                />
              </div>

              {/* Optional: Example & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Ví dụ minh họa (tùy chọn)</label>
                  <input
                    type="text"
                    value={exampleSentence}
                    onChange={(e) => setExampleSentence(e.target.value)}
                    placeholder="Câu văn hoặc bài tập áp dụng thực tế..."
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-sky-500 placeholder-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Mẹo nhớ / Lưu ý (tùy chọn)</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Mẹo nhớ nhanh để không bị quên..."
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-sky-500 placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-xl font-bold transition-all shadow-md shadow-sky-500/20 cursor-pointer"
                >
                  Lưu Thẻ Flashcard
                </button>
              </div>
            </form>
          ) : (
            /* AI GENERATOR TAB */
            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Trợ lý AI sẽ tự động phân tích văn bản nguồn và tạo ra <strong>bộ 5 thẻ ghi nhớ</strong> chuẩn xác theo đúng 5 nhóm: <em>Khái niệm, Định nghĩa, Ví dụ, Phân biệt, Quy tắc/Lưu ý</em>.
                </p>
              </div>

              {/* Select Subject */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Môn học</label>
                <select
                  value={aiSubjectId}
                  onChange={(e) => setAiSubjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-sky-500"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Existing Study Material (if any) */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Chọn từ nguồn học liệu đã lưu trong kho ({materials.length} nguồn)
                </label>
                <select
                  value={selectedMaterialId}
                  onChange={(e) => {
                    setSelectedMaterialId(e.target.value);
                    const mat = materials.find((m) => m.id === e.target.value);
                    if (mat) {
                      setCustomTopicTitle(mat.title);
                      setCustomTopicContent(mat.content);
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="">-- Hoặc nhập chủ đề tùy ý bên dưới --</option>
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      [{m.type.toUpperCase()}] {m.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Topic Title & Content */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Tiêu đề bài học / Chủ đề</label>
                <input
                  type="text"
                  value={customTopicTitle}
                  onChange={(e) => setCustomTopicTitle(e.target.value)}
                  placeholder="Ví dụ: Đoạn văn Unit 3 Âm nhạc, Bất đẳng thức Cô-si, Biện pháp Tu từ..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-sky-500 placeholder-slate-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nội dung đoạn văn hoặc ghi chú</label>
                <textarea
                  value={customTopicContent}
                  onChange={(e) => setCustomTopicContent(e.target.value)}
                  placeholder="Dán đoạn văn tiếng Anh, công thức hoặc tóm tắt bài học vào đây để AI tạo thẻ..."
                  rows={4}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-sky-500 placeholder-slate-400"
                />
              </div>

              {aiSuccessMessage && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{aiSuccessMessage}</span>
                </div>
              )}

              {/* Action */}
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition-colors cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleGenerateAi}
                  disabled={isGenerating || (!customTopicTitle && !customTopicContent && !selectedMaterialId)}
                  className="px-5 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 disabled:opacity-50 disabled:pointer-events-none text-white rounded-xl font-bold transition-all shadow-md shadow-indigo-500/20 cursor-pointer flex items-center gap-1.5"
                >
                  <Wand2 className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span>{isGenerating ? 'AI Đang Tạo 5 Thẻ...' : 'Tạo 5 Thẻ Bằng AI'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
