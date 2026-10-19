import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Check, GraduationCap, Sparkles, FolderPlus, X, Save, FolderOpen, Edit2, Trash2 } from 'lucide-react';
import { StudySubject } from '../../types';

interface SubjectSelectorProps {
  subjects: StudySubject[];
  selectedSubjectId: string;
  onSelectSubject: (subjectId: string) => void;
  onAddSubject: (subject: Omit<StudySubject, 'id'>) => void;
  materialCountBySubject: Record<string, number>;
  onOpenSnapshotModal?: (mode: 'saved_list' | 'save_current' | 'regenerate') => void;
  snapshotsCount?: number;
  activeSnapshotTitle?: string;
  onRenameSubject?: (subjectId: string, newName: string) => void;
  onDeleteSubject?: (subjectId: string) => void;
}

export const SubjectSelector: React.FC<SubjectSelectorProps> = ({
  subjects,
  selectedSubjectId,
  onSelectSubject,
  onAddSubject,
  materialCountBySubject,
  onOpenSnapshotModal,
  snapshotsCount = 0,
  activeSnapshotTitle,
  onRenameSubject,
  onDeleteSubject,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newGradeLevel, setNewGradeLevel] = useState('Lớp 10');
  const [newDescription, setNewDescription] = useState('');

  // Inline rename state for current subject
  const [isRenamingSubject, setIsRenamingSubject] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  // Đóng modal khi nhấn Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsModalOpen(false);
    };
    if (isModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isModalOpen]);

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];

  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;

    onAddSubject({
      name: newSubjectName.trim(),
      gradeLevel: newGradeLevel,
      description: newDescription.trim() || 'Chủ đề bài học do em tạo',
      color: 'from-sky-500 to-blue-600',
    });

    setNewSubjectName('');
    setNewDescription('');
    setIsModalOpen(false);
  };

  const handleSaveRename = () => {
    if (renameValue.trim() && onRenameSubject && selectedSubject) {
      onRenameSubject(selectedSubject.id, renameValue.trim());
    }
    setIsRenamingSubject(false);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Môn Học & Chủ Đề Của Em
            </h2>
            <p className="text-xs text-slate-400">
              Chọn chủ đề bài học để gom học liệu và theo dõi lộ trình ôn luyện
            </p>
          </div>
        </div>

        {/* Action Buttons: Save / Load Snapshots + Re-generate + Add New Subject */}
        <div className="flex items-center gap-2 flex-wrap">
          {onOpenSnapshotModal && (
            <>
              <button
                id="btn-save-subject-snapshot"
                onClick={() => onOpenSnapshotModal('save_current')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 active:scale-95 text-sky-300 border border-sky-500/30 text-xs font-semibold transition-all cursor-pointer"
                title="Lưu working copy của chủ đề này (sources, summary, studyPack, metadata)"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Lưu chủ đề này</span>
              </button>

              <button
                id="btn-regenerate-subject-pack"
                onClick={() => onOpenSnapshotModal('regenerate')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600/30 to-purple-600/30 hover:from-indigo-600/40 hover:to-purple-600/40 active:scale-95 text-indigo-300 border border-indigo-500/40 text-xs font-bold transition-all cursor-pointer shadow-sm"
                title="Re-generate toàn bộ Study Pack (Summary, Quiz, Flashcard, Q&A) từ nguồn gốc bằng Gemini AI"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                <span>Re-generate (AI)</span>
              </button>

              <button
                id="btn-open-snapshots-list"
                onClick={() => onOpenSnapshotModal('saved_list')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 border border-slate-700 text-xs font-semibold transition-all cursor-pointer"
                title="Mở hoặc quản lý các phiên bản đã lưu"
              >
                <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>Phiên bản ({snapshotsCount})</span>
              </button>
            </>
          )}

          <button
            id="btn-add-subject"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-semibold transition-all cursor-pointer w-fit"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>+ Tạo môn mới</span>
          </button>
        </div>
      </div>

      {/* Subject Chips / Carousel */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
        {subjects.map((subj) => {
          const isSelected = subj.id === selectedSubjectId;
          const count = materialCountBySubject[subj.id] || 0;

          return (
            <button
              key={subj.id}
              id={`subject-pill-${subj.id}`}
              onClick={() => onSelectSubject(subj.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-left transition-all shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-gradient-to-r from-sky-500/20 to-indigo-500/20 border-2 border-sky-500 text-white shadow-md shadow-sky-500/10'
                  : 'bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-300'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-sky-400 animate-pulse' : 'bg-slate-500'}`} />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold whitespace-nowrap">
                    {subj.name}
                  </span>
                  {subj.gradeLevel && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-400 border border-slate-700">
                      {subj.gradeLevel}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-400 block">
                  {count} học liệu đã lưu
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Subject Focus Banner */}
      {selectedSubject && (
        <div className="px-3.5 py-2 rounded-xl bg-sky-950/20 border border-sky-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-300 flex-1">
            <span className="text-sky-400 font-semibold shrink-0">Đang học:</span>
            {isRenamingSubject ? (
              <div className="flex items-center gap-1.5 flex-1 max-w-sm">
                <input
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveRename()}
                  className="px-2 py-0.5 bg-slate-900 border border-sky-500 rounded text-white text-xs w-full focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={handleSaveRename}
                  className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold"
                >
                  Lưu
                </button>
                <button
                  onClick={() => setIsRenamingSubject(false)}
                  className="px-2 py-0.5 rounded bg-slate-700 text-slate-300"
                >
                  Hủy
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 truncate">
                <span className="font-bold text-white truncate">{selectedSubject.name}</span>
                {onRenameSubject && (
                  <button
                    onClick={() => {
                      setRenameValue(selectedSubject.name);
                      setIsRenamingSubject(true);
                    }}
                    className="p-1 rounded text-slate-400 hover:text-sky-300 transition-colors"
                    title="Đổi tên ngắn cho môn học này"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                )}
                {onDeleteSubject && subjects.length > 1 && (
                  <button
                    onClick={() => {
                      if (window.confirm(`Bạn có chắc muốn xóa môn "${selectedSubject.name}"?`)) {
                        onDeleteSubject(selectedSubject.id);
                      }
                    }}
                    className="p-1 rounded text-slate-400 hover:text-rose-400 transition-colors"
                    title="Xóa môn không dùng"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            {activeSnapshotTitle && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Bộ nạp: {activeSnapshotTitle}
              </span>
            )}
            <span className="text-[11px] text-sky-400 font-medium whitespace-nowrap">
              {materialCountBySubject[selectedSubject.id] || 0} bài học
            </span>
          </div>
        </div>
      )}

      {/* Add Subject Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <FolderPlus className="w-5 h-5 text-sky-400" />
              <h3 className="text-base font-bold text-white">Thêm Môn Học Hoặc Chủ Đề Mới</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Tạo không gian bài học riêng để dễ dàng lưu trữ và sắp xếp các bài đọc, ảnh sách, đường dẫn tài liệu.
            </p>

            <form onSubmit={handleCreateSubject} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tên môn / Tên bài học (Bắt buộc):
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Tiếng Anh 11 - Unit 4, Luyện thi HSG, Từ vựng phim ảnh..."
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Cấp độ / Lớp học:
                </label>
                <select
                  value={newGradeLevel}
                  onChange={(e) => setNewGradeLevel(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="Lớp 6">Lớp 6</option>
                  <option value="Lớp 7">Lớp 7</option>
                  <option value="Lớp 8">Lớp 8</option>
                  <option value="Lớp 9">Lớp 9</option>
                  <option value="Lớp 10">Lớp 10</option>
                  <option value="Lớp 11">Lớp 11</option>
                  <option value="Lớp 12">Lớp 12</option>
                  <option value="Ôn Thi Vào 10">Ôn Thi Vào 10</option>
                  <option value="Ôn Thi Tốt Nghiệp THPT">Ôn Thi Tốt Nghiệp THPT</option>
                  <option value="Giao Tiếp Tự Do">Giao Tiếp Tự Do</option>
                  <option value="IELTS / TOEIC">IELTS / TOEIC</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Ghi chú mục tiêu bài học (Tùy chọn):
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Mục tiêu nắm chắc từ vựng và luyện phát âm chuẩn âm đuôi"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 active:scale-95 text-white font-bold text-xs shadow-md shadow-sky-500/25 transition-all cursor-pointer"
                >
                  Tạo môn học
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
