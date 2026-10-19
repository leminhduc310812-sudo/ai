import React, { useState, useMemo } from 'react';
import { FileText, Image as ImageIcon, Globe, Search, Filter, Mic, X, ExternalLink, Copy, Check, BookOpen, Layers, Sparkles } from 'lucide-react';
import { SourceType, StudyMaterialSource } from '../../types';
import { MaterialCard } from './MaterialCard';

interface MaterialListProps {
  materials: StudyMaterialSource[];
  currentSubjectId: string;
  currentSubjectName: string;
  onPracticeFromMaterial: (text: string, title: string) => void;
  onDeleteMaterial: (id: string) => void;
  onSummarizeMaterial?: (material: StudyMaterialSource) => void;
  hasSummaryForMaterial?: (id: string) => boolean;
  onOpenFlashcards?: (material: StudyMaterialSource) => void;
}

export const MaterialList: React.FC<MaterialListProps> = ({
  materials,
  currentSubjectId,
  currentSubjectName,
  onPracticeFromMaterial,
  onDeleteMaterial,
  onSummarizeMaterial,
  hasSummaryForMaterial,
  onOpenFlashcards,
}) => {
  const [filterType, setFilterType] = useState<SourceType | 'all'>('all');
  const [filterByCurrentSubjectOnly, setFilterByCurrentSubjectOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModalMaterial, setActiveModalMaterial] = useState<StudyMaterialSource | null>(null);
  const [copied, setCopied] = useState(false);

  // Filtered materials
  const filteredMaterials = useMemo(() => {
    return materials.filter((item) => {
      // Subject filter
      if (filterByCurrentSubjectOnly && item.subjectId !== currentSubjectId) {
        return false;
      }
      // Type filter
      if (filterType !== 'all' && item.type !== filterType) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const inTitle = item.title.toLowerCase().includes(query);
        const inContent = item.content.toLowerCase().includes(query);
        const inNotes = item.notes?.toLowerCase().includes(query) || false;
        const inSubject = item.subjectName.toLowerCase().includes(query);
        return inTitle || inContent || inNotes || inSubject;
      }
      return true;
    });
  }, [materials, filterByCurrentSubjectOnly, currentSubjectId, filterType, searchQuery]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Top Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-400" />
              <span>Danh Sách Học Liệu Đã Thêm ({filteredMaterials.length})</span>
            </h3>
            <span className="text-[11px] text-slate-400">
              {filterByCurrentSubjectOnly ? `Đang xem môn: ${currentSubjectName}` : 'Tất cả các môn học'}
            </span>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm học liệu, từ vựng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                filterType === 'all'
                  ? 'bg-sky-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Tất cả ({materials.length})
            </button>

            <button
              onClick={() => setFilterType('text')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                filterType === 'text'
                  ? 'bg-sky-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3 h-3" />
              <span>Văn bản ({materials.filter((m) => m.type === 'text').length})</span>
            </button>

            <button
              onClick={() => setFilterType('image')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                filterType === 'image'
                  ? 'bg-sky-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <ImageIcon className="w-3 h-3" />
              <span>Ảnh sách ({materials.filter((m) => m.type === 'image').length})</span>
            </button>

            <button
              onClick={() => setFilterType('url')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                filterType === 'url'
                  ? 'bg-sky-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe className="w-3 h-3" />
              <span>Trang web ({materials.filter((m) => m.type === 'url').length})</span>
            </button>
          </div>

          {/* Subject Scope Toggle */}
          <button
            onClick={() => setFilterByCurrentSubjectOnly(!filterByCurrentSubjectOnly)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all cursor-pointer ${
              filterByCurrentSubjectOnly
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            {filterByCurrentSubjectOnly ? '✓ Đang lọc theo môn này' : 'Chỉ xem môn hiện tại'}
          </button>
        </div>
      </div>

      {/* Grid of Material Cards */}
      {filteredMaterials.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMaterials.map((item) => (
            <MaterialCard
              key={item.id}
              material={item}
              onPracticeFromMaterial={onPracticeFromMaterial}
              onViewDetails={(mat) => setActiveModalMaterial(mat)}
              onDelete={onDeleteMaterial}
              onSummarizeMaterial={onSummarizeMaterial}
              hasSummary={hasSummaryForMaterial ? hasSummaryForMaterial(item.id) : false}
              onOpenFlashcards={onOpenFlashcards}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 mx-auto flex items-center justify-center mb-3">
            <BookOpen className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-white mb-1">
            Chưa có học liệu nào trong mục này
          </h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            Em có thể gõ hoặc dán đoạn văn tiếng Anh, tải ảnh chụp trang sách giáo khoa hoặc thêm đường dẫn tài liệu ở khung phía trên để bắt đầu tích lũy bài học!
          </p>
        </div>
      )}

      {/* Detail Viewer Modal */}
      {activeModalMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 text-xs font-semibold">
                  {activeModalMaterial.type === 'text' ? 'Văn bản' : activeModalMaterial.type === 'image' ? 'Ảnh chụp' : 'Đường dẫn'}
                </span>
                <h3 className="text-base font-bold text-white truncate max-w-md">
                  {activeModalMaterial.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveModalMaterial(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>Môn học: <strong className="text-slate-200">{activeModalMaterial.subjectName}</strong></span>
                {activeModalMaterial.wordCount ? (
                  <span>Độ dài: <strong className="text-slate-200">{activeModalMaterial.wordCount} từ</strong></span>
                ) : null}
              </div>

              {/* Text type */}
              {activeModalMaterial.type === 'text' && (
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 font-sans text-sm text-slate-200 leading-relaxed whitespace-pre-wrap select-text">
                  {activeModalMaterial.content}
                </div>
              )}

              {/* Image type */}
              {activeModalMaterial.type === 'image' && (
                <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex justify-center">
                  {activeModalMaterial.imageUrl ? (
                    <img
                      src={activeModalMaterial.imageUrl}
                      alt={activeModalMaterial.title}
                      className="max-h-96 object-contain"
                    />
                  ) : (
                    <p className="p-8 text-slate-400">Ảnh tài liệu</p>
                  )}
                </div>
              )}

              {/* URL type */}
              {activeModalMaterial.type === 'url' && (
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <span className="text-slate-400 block mb-1">Đường dẫn trang web:</span>
                  <a
                    href={activeModalMaterial.content}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-400 hover:text-sky-300 font-semibold break-all flex items-center gap-1.5"
                  >
                    <span>{activeModalMaterial.content}</span>
                    <ExternalLink className="w-4 h-4 shrink-0" />
                  </a>
                </div>
              )}

              {/* Notes */}
              {activeModalMaterial.notes && (
                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 text-slate-300">
                  <strong className="text-sky-300 block mb-1">Ghi chú học tập của em:</strong>
                  <p className="text-slate-400 leading-relaxed">{activeModalMaterial.notes}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
              <button
                onClick={() => handleCopy(activeModalMaterial.content)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Đã sao chép' : 'Sao chép nội dung'}</span>
              </button>

              <div className="flex items-center gap-2">
                {onSummarizeMaterial && (
                  <button
                    onClick={() => {
                      const mat = activeModalMaterial;
                      setActiveModalMaterial(null);
                      onSummarizeMaterial(mat);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Tóm tắt bài này</span>
                  </button>
                )}

                {activeModalMaterial.type === 'text' && (
                  <button
                    onClick={() => {
                      const firstSentence = activeModalMaterial.content.match(/[^.!?]+[.!?]+/)?.[0]?.trim() || activeModalMaterial.content.slice(0, 80);
                      onPracticeFromMaterial(firstSentence, activeModalMaterial.title);
                      setActiveModalMaterial(null);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-md shadow-sky-500/25 transition-all cursor-pointer"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>Luyện phát âm câu này</span>
                  </button>
                )}

                <button
                  onClick={() => setActiveModalMaterial(null)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
