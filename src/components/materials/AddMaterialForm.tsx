import React, { useState, useRef } from 'react';
import { FileText, Image as ImageIcon, Globe, Upload, CheckCircle2, Sparkles, AlertCircle, Trash2, BookMarked } from 'lucide-react';
import { SourceType, StudyMaterialSource } from '../../types';

interface AddMaterialFormProps {
  currentSubjectId: string;
  currentSubjectName: string;
  onAddMaterial: (material: Omit<StudyMaterialSource, 'id' | 'createdAt'>) => void;
}

const SAMPLE_TEXT_SNIPPETS = [
  {
    title: 'Bài đọc: Sở thích & Thời gian rảnh',
    text: 'In my free time, I enjoy reading scientific magazines and practicing English with my friends. We usually meet on weekends at a quiet local library to share interesting stories and study together.',
    notes: 'Trích từ bài nói mẫu - Chú ý phát âm: scientific /ˌsaɪənˈtɪf.ɪk/, library /ˈlaɪ.brər.i/.',
  },
  {
    title: 'Hội thoại: Hỏi đường du lịch',
    text: 'Excuse me, could you please tell me how to get to the national theatre? Go straight ahead for two blocks, then turn left at the traffic lights. It will be right on your right-hand side.',
    notes: 'Mẫu câu chỉ đường thông dụng - Luyện nối âm: turn left, traffic lights.',
  },
  {
    title: 'Đoạn văn: Bảo vệ môi trường',
    text: 'Protecting the environment is crucial for our future. We can reduce plastic waste by carrying reusable bottles and sorting household garbage every single day.',
    notes: 'Từ vựng môi trường - Chú ý âm đuôi /st/ trong waste và /d/ trong household.',
  },
];

const SAMPLE_WEBSITE_LINKS = [
  { title: 'BBC Learning English: 6 Minute English', url: 'https://www.bbc.co.uk/learningenglish/english/features/6-minute-english' },
  { title: 'Từ điển Anh - Anh Cambridge', url: 'https://dictionary.cambridge.org/' },
  { title: 'VOA Learning English (Trình độ cơ bản)', url: 'https://learningenglish.voanews.com/' },
];

export const AddMaterialForm: React.FC<AddMaterialFormProps> = ({
  currentSubjectId,
  currentSubjectName,
  onAddMaterial,
}) => {
  // Text-first: default is 'text'
  const [activeTab, setActiveTab] = useState<SourceType>('text');

  // Form Fields
  const [title, setTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  const [notes, setNotes] = useState('');
  const [urlContent, setUrlContent] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper for word count
  const calculateWordCount = (text: string) => {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  };

  const handleImageUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file hình ảnh (PNG, JPG, WEBP).');
      return;
    }
    setImageFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDropImage = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files[0]);
    }
  };

  const handleApplySample = (sample: { title: string; text: string; notes: string }) => {
    setTitle(sample.title);
    setTextContent(sample.text);
    setNotes(sample.notes);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let contentToSave = '';
    let finalTitle = title.trim();

    if (activeTab === 'text') {
      if (!textContent.trim()) return;
      contentToSave = textContent.trim();
      if (!finalTitle) finalTitle = `Đoạn văn: ${contentToSave.slice(0, 30)}...`;
    } else if (activeTab === 'image') {
      if (!imagePreview) return;
      contentToSave = imageFileName || 'Ảnh chụp tài liệu học tập';
      if (!finalTitle) finalTitle = `Ảnh chụp: ${imageFileName || 'Trang sách bài tập'}`;
    } else if (activeTab === 'url') {
      if (!urlContent.trim()) return;
      contentToSave = urlContent.trim();
      if (!finalTitle) finalTitle = `Liên kết: ${urlContent.replace(/^https?:\/\//, '').slice(0, 30)}`;
    }

    onAddMaterial({
      subjectId: currentSubjectId,
      subjectName: currentSubjectName,
      title: finalTitle,
      type: activeTab,
      content: contentToSave,
      imageUrl: activeTab === 'image' ? imagePreview || undefined : undefined,
      notes: notes.trim() || undefined,
      wordCount: activeTab === 'text' ? calculateWordCount(contentToSave) : 0,
      tags: [currentSubjectName],
    });

    // Reset Form
    setTitle('');
    setTextContent('');
    setNotes('');
    setUrlContent('');
    setImagePreview(null);
    setImageFileName('');

    // Show friendly success confirmation
    setSuccessMessage('Đã thêm học liệu mới vào bài học của em thành công! 🎉');
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
      {/* Decorative ambient light */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <BookMarked className="w-4 h-4 text-sky-400" />
            <span>Thêm Học Liệu Đầu Vào</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Môn học hiện tại: <span className="font-semibold text-sky-300">{currentSubjectName}</span>
          </p>
        </div>

        {/* Source Type Switcher (Text-first highlighted) */}
        <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700/80">
          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'text'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Văn bản & Ghi chú</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('image')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'image'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Ảnh trang sách</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'url'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Đường dẫn web</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Tên bài học hoặc tiêu đề học liệu:
          </label>
          <input
            type="text"
            placeholder={
              activeTab === 'text'
                ? 'Ví dụ: Bài đọc Unit 2, Mẫu hội thoại gọi món, Đoạn văn giới thiệu bản thân...'
                : activeTab === 'image'
                ? 'Ví dụ: Trang 35 SGK Tiếng Anh 10, Bài tập phát âm cô giáo giao...'
                : 'Ví dụ: Bài báo BBC Learning English, Tra từ điển Oxford...'
            }
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        {/* 1. TEXT INPUT VIEW (Text-first) */}
        {activeTab === 'text' && (
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300">
                  Nội dung đoạn văn tiếng Anh hoặc danh sách từ:
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  {calculateWordCount(textContent)} từ | {textContent.length} ký tự
                </span>
              </div>
              <textarea
                required
                rows={5}
                placeholder="Dán hoặc gõ đoạn văn tiếng Anh, lời thoại bài học, hoặc danh sách các từ em muốn luyện phát âm và ghi nhớ vào đây..."
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 leading-relaxed font-sans"
              />
            </div>

            {/* Quick Sample Snippets for Students */}
            <div>
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mb-1.5">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Gợi ý mẫu đoạn văn tiếng Anh thông dụng cho học sinh (bấm để điền nhanh):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {SAMPLE_TEXT_SNIPPETS.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplySample(sample)}
                    className="p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-800 text-left transition-all cursor-pointer group"
                  >
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-sky-300 block truncate">
                      {sample.title}
                    </span>
                    <span className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">
                      {sample.text}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 2. IMAGE INPUT VIEW */}
        {activeTab === 'image' && (
          <div className="space-y-3">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleImageUpload(e.target.files[0]);
                }
              }}
            />

            {!imagePreview ? (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDropImage}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-sky-500/60 rounded-2xl p-6 text-center bg-slate-800/30 hover:bg-slate-800/60 transition-all cursor-pointer"
              >
                <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 mx-auto flex items-center justify-center mb-2">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-200">
                  Nhấn để chọn ảnh hoặc kéo thả ảnh chụp trang sách vào đây
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Hỗ trợ ảnh chụp sách giáo khoa, vở ghi từ mới, đề thi hoặc phiếu học tập (PNG, JPG, WEBP)
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700 flex flex-col sm:flex-row items-center gap-4">
                <img
                  src={imagePreview}
                  alt="Xem trước ảnh học liệu"
                  className="w-28 h-28 object-cover rounded-xl border border-slate-700 shadow-md shrink-0"
                />
                <div className="flex-1 min-w-0 text-center sm:text-left">
                  <span className="text-xs font-semibold text-emerald-400 flex items-center justify-center sm:justify-start gap-1 mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Đã tải ảnh lên thành công
                  </span>
                  <p className="text-xs text-slate-200 font-medium truncate">
                    {imageFileName || 'Ảnh trang sách học tập'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Ảnh sẽ được lưu an toàn cùng ghi chú của em trong bài học.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null);
                      setImageFileName('');
                    }}
                    className="mt-2 text-xs text-rose-400 hover:text-rose-300 flex items-center justify-center sm:justify-start gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Chọn ảnh khác</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. URL INPUT VIEW */}
        {activeTab === 'url' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Đường dẫn liên kết trang web (URL):
              </label>
              <input
                type="url"
                required
                placeholder="https://www.bbc.co.uk/learningenglish/..."
                value={urlContent}
                onChange={(e) => setUrlContent(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Quick Educational Link Suggestions */}
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                Gợi ý các trang web học tiếng Anh uy tín:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {SAMPLE_WEBSITE_LINKS.map((link, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setTitle(link.title);
                      setUrlContent(link.url);
                    }}
                    className="p-2 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-800 text-left transition-all cursor-pointer group"
                  >
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-sky-300 block truncate">
                      {link.title}
                    </span>
                    <span className="text-[10px] text-slate-500 truncate block mt-0.5">
                      {link.url}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Optional Notes Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Ghi chú học tập của em (Tùy chọn):
          </label>
          <input
            type="text"
            placeholder="Ví dụ: Lưu ý các từ khó phát âm, cô giáo dặn kiểm tra 15 phút tuần tới..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex items-center justify-end">
          <button
            type="submit"
            id="btn-save-material"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 active:scale-95 text-white font-bold text-xs shadow-md shadow-sky-500/25 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Lưu Vào Bài Học Của Em</span>
          </button>
        </div>
      </form>
    </div>
  );
};
