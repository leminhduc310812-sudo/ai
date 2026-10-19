import React, { useState, useMemo } from 'react';
import {
  X,
  Save,
  FolderOpen,
  RotateCcw,
  Trash2,
  Edit2,
  Check,
  Download,
  Upload,
  Sparkles,
  BookOpen,
  Layers,
  HelpCircle,
  Clock,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  Key,
  ShieldCheck,
  RefreshCw,
  GitBranch,
  Eye,
  FileText,
} from 'lucide-react';
import {
  SubjectSnapshot,
  StudySubject,
  StudyMaterialSource,
  StudySummary,
  FlashcardItem,
  QaSeedItem,
  QuizItem,
} from '../../types';
import { useLocalGeminiKey } from '../../hooks/useLocalGeminiKey';

interface SnapshotManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSubject: StudySubject;
  currentSources: StudyMaterialSource[];
  currentAnalysis: StudySummary | null;
  currentStudyPack: {
    flashcards: FlashcardItem[];
    qaSeeds: QaSeedItem[];
    quizzes: QuizItem[];
  };
  snapshots: SubjectSnapshot[];
  activeSnapshotId: string | null;
  onSaveSnapshot: (params: {
    title?: string;
    subject: StudySubject;
    sources: StudyMaterialSource[];
    analysisPreview: StudySummary | null;
    studyPack: {
      flashcards: FlashcardItem[];
      qaSeeds: QaSeedItem[];
      quizzes: QuizItem[];
    };
    note?: string;
    isRegenerated?: boolean;
    customVersion?: string;
  }) => SubjectSnapshot;
  onRestoreSnapshot: (snapshot: SubjectSnapshot) => void;
  onRenameSnapshot: (id: string, newTitle: string) => void;
  onDeleteSnapshot: (id: string) => void;
  onExportSnapshot: (snapshot: SubjectSnapshot) => void;
  onImportSnapshot: (jsonContent: string) => SubjectSnapshot | null;
  onDeleteSubject?: (subjectId: string) => void;
  initialTab?: 'versions' | 'save' | 'regenerate';
}

export const SnapshotManagerModal: React.FC<SnapshotManagerModalProps> = ({
  isOpen,
  onClose,
  currentSubject,
  currentSources,
  currentAnalysis,
  currentStudyPack,
  snapshots,
  activeSnapshotId,
  onSaveSnapshot,
  onRestoreSnapshot,
  onRenameSnapshot,
  onDeleteSnapshot,
  onExportSnapshot,
  onImportSnapshot,
  initialTab = 'versions',
}) => {
  const [activeTab, setActiveTab] = useState<'versions' | 'save' | 'regenerate'>(initialTab);

  // Gemini API Key Local-Only Hook
  const { apiKey: localApiKey, hasKey, maskedKey, saveKey, clearKey } = useLocalGeminiKey();
  const [apiKeyInput, setApiKeyInput] = useState<string>(localApiKey);
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [keySavedToast, setKeySavedToast] = useState<boolean>(false);

  // Save new snapshot state
  const [newTitle, setNewTitle] = useState<string>(
    `${currentSubject?.name || 'Môn học'} - Bản lưu ${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
  );
  const [newNote, setNewNote] = useState<string>('');
  const [justSavedSnapshot, setJustSavedSnapshot] = useState<SubjectSnapshot | null>(null);

  // Inline rename state
  const [editingSnapshotId, setEditingSnapshotId] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState<string>('');

  // Comparison drawer state
  const [comparingSnapshot, setComparingSnapshot] = useState<SubjectSnapshot | null>(null);

  // Re-generate loading & progress state
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [regenStep, setRegenStep] = useState<string>('');
  const [regenSuccessInfo, setRegenSuccessInfo] = useState<{
    versionName: string;
    message: string;
    model: string;
  } | null>(null);
  const [regenError, setRegenError] = useState<string | null>(null);

  // Filter snapshots for current subject first, then others
  const subjectSnapshots = useMemo(() => {
    return snapshots.filter((s) => s.subject.id === currentSubject?.id);
  }, [snapshots, currentSubject?.id]);

  const otherSnapshots = useMemo(() => {
    return snapshots.filter((s) => s.subject.id !== currentSubject?.id);
  }, [snapshots, currentSubject?.id]);

  // Đóng modal khi nhấn phím Escape
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSaveApiKey = () => {
    saveKey(apiKeyInput);
    setKeySavedToast(true);
    setTimeout(() => setKeySavedToast(false), 2500);
  };

  const handleQuickSave = () => {
    if (!currentSubject) return;
    const saved = onSaveSnapshot({
      title: newTitle.trim(),
      subject: currentSubject,
      sources: currentSources,
      analysisPreview: currentAnalysis,
      studyPack: currentStudyPack,
      note: newNote.trim(),
    });
    setJustSavedSnapshot(saved);
    setActiveTab('versions');
  };

  const handleStartRename = (snap: SubjectSnapshot) => {
    setEditingSnapshotId(snap.id);
    setEditTitleValue(snap.title);
  };

  const handleFinishRename = (id: string) => {
    if (editTitleValue.trim()) {
      onRenameSnapshot(id, editTitleValue.trim());
    }
    setEditingSnapshotId(null);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const imported = onImportSnapshot(content);
        if (imported) {
          alert(`Đã nhập thành công snapshot: "${imported.title}"`);
        } else {
          alert('Tệp dữ liệu không hợp lệ. Vui lòng chọn tệp snapshot JSON đúng định dạng.');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  /**
   * PROMPT 05: Re-generate toàn bộ study pack từ nguồn học liệu gốc bằng Gemini API key local-only
   * - Làm mới summary, quiz, flashcard, Q&A
   * - Giữ nguyên 100% nguồn gốc ban đầu
   * - Tạo thành một version mới
   */
  const handleRegenerateStudyPack = async () => {
    if (currentSources.length === 0) {
      alert('Chưa có nguồn học liệu gốc nào. Vui lòng thêm ít nhất 1 bài đọc hoặc ghi chú trước khi re-generate!');
      return;
    }

    setIsRegenerating(true);
    setRegenError(null);
    setRegenSuccessInfo(null);

    try {
      setRegenStep('1/4 Đang đọc và phân tích nguồn học liệu gốc...');

      const nextVersionNum = subjectSnapshots.length + 1;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (localApiKey) {
        headers['x-gemini-api-key'] = localApiKey;
      }

      setRegenStep('2/4 Gemini AI đang tổng hợp bản tóm tắt & trích xuất key points...');

      const response = await fetch('/api/study-pack/regenerate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          subject: currentSubject,
          sources: currentSources, // Nguồn gốc được giữ nguyên vẹn
          apiKey: localApiKey || undefined,
          versionNumber: nextVersionNum,
        }),
      });

      if (!response.ok) {
        throw new Error(`Máy chủ phản hồi mã lỗi: ${response.status}`);
      }

      setRegenStep('3/4 Đang tạo mới 5 nhóm Flashcard, bộ Quiz trắc nghiệm và câu hỏi Q&A...');

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Quá trình Re-generate không thành công');
      }

      setRegenStep('4/4 Đang đóng gói thành Phiên bản mới và lưu trữ...');

      // Tạo thành một version mới
      const newVersionSnapshot = onSaveSnapshot({
        title: `${currentSubject.name} - Version ${nextVersionNum} (Re-generated)`,
        subject: currentSubject,
        sources: currentSources, // NGUỒN GỐC ĐƯỢC GIỮ NGUYÊN VẸN 100%
        analysisPreview: data.summary,
        studyPack: {
          flashcards: data.flashcards || [],
          qaSeeds: data.qaSeeds || [],
          quizzes: data.quizzes || [],
        },
        isRegenerated: true,
        customVersion: `v${nextVersionNum}.0`,
        note: `Re-generated bằng ${data.model || 'Gemini AI'} (${data.usedLocalKey ? 'Khóa Local-only' : 'Chế độ AI thông minh'})`,
      });

      // Tự động khôi phục ngay version mới về app để người dùng học tiếp
      onRestoreSnapshot(newVersionSnapshot);

      setRegenSuccessInfo({
        versionName: `v${nextVersionNum}.0`,
        message: data.message || 'Đã làm mới hoàn toàn Summary, Quiz, Flashcard và Q&A!',
        model: data.model || 'Gemini 3.8 Flash',
      });

      // Chuyển sang tab Versions để người dùng xem trực quan
      setActiveTab('versions');
    } catch (err: any) {
      console.error('Lỗi Re-generate:', err);
      setRegenError(err.message || 'Không thể kết nối đến AI. Vui lòng kiểm tra lại API key hoặc kết nối mạng.');
    } finally {
      setIsRegenerating(false);
      setRegenStep('');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in font-['Plus_Jakarta_Sans',sans-serif]"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800/80 flex items-center justify-between gap-4 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20 shrink-0">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Quản Lý Phiên Bản & Working Copy
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30 text-[10px] font-bold">
                  {currentSubject?.name || 'Môn học'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Lưu snapshot toàn diện, re-generate làm mới bằng Gemini AI và quản lý lịch sử phiên bản
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Đóng modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-slate-800/80 bg-slate-900/60 overflow-x-auto scrollbar-none">
          <button
            id="tab-versions-list"
            onClick={() => setActiveTab('versions')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'versions'
                ? 'border-sky-500 text-sky-400 bg-sky-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitBranch className="w-4 h-4" />
            <span>Danh Sách Version ({subjectSnapshots.length})</span>
          </button>

          <button
            id="tab-regenerate-study-pack"
            onClick={() => setActiveTab('regenerate')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'regenerate'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>Re-generate bằng Gemini AI</span>
          </button>

          <button
            id="tab-save-snapshot"
            onClick={() => setActiveTab('save')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'save'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>Lưu Snapshot Mới</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Notification on Re-generate Success */}
          {regenSuccessInfo && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-indigo-950/40 border border-emerald-500/40 text-emerald-200 flex items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    <span>Re-generate Thành Công Phiên Bản {regenSuccessInfo.versionName}!</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                      Mô hình: {regenSuccessInfo.model}
                    </span>
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">{regenSuccessInfo.message}</p>
                </div>
              </div>
              <button
                onClick={() => setRegenSuccessInfo(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* TAB 1: DANH SÁCH VERSION & BỘ ĐÃ LƯU (PROMPT 06) */}
          {activeTab === 'versions' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/30 p-4 rounded-2xl border border-slate-800">
                <div>
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    <span>Lịch sử phiên bản môn "{currentSubject?.name}"</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {subjectSnapshots.length} phiên bản
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Mở lại phiên bản cũ để so sánh, ôn tập tiếp hoặc xóa các bản nháp không dùng
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <label
                    htmlFor="import-snapshot-input"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                    title="Nhập bản lưu từ file JSON"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Nhập JSON</span>
                    <input
                      id="import-snapshot-input"
                      type="file"
                      accept=".json"
                      onChange={handleFileImport}
                      className="hidden"
                    />
                  </label>

                  <button
                    onClick={() => setActiveTab('save')}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-md shadow-sky-500/20 transition-all cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>+ Lưu bản hiện tại</span>
                  </button>
                </div>
              </div>

              {/* Version Cards List */}
              {subjectSnapshots.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-950/20 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                    <FolderOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-sm">Chưa có phiên bản nào cho môn này</h5>
                    <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                      Hãy bấm <strong>"Lưu Snapshot Mới"</strong> hoặc dùng tính năng <strong>"Re-generate bằng Gemini AI"</strong> để tự động tạo phiên bản ôn tập đầu tiên!
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => setActiveTab('save')}
                      className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold cursor-pointer transition-all"
                    >
                      Lưu Working Copy Hiện Tại
                    </button>
                    <button
                      onClick={() => setActiveTab('regenerate')}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      Re-generate với Gemini
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {subjectSnapshots.map((snap, idx) => {
                    const isActive = snap.id === activeSnapshotId;
                    const isLatest = idx === 0;
                    const isEditing = editingSnapshotId === snap.id;

                    return (
                      <div
                        key={snap.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          isActive
                            ? 'bg-slate-900 border-sky-500/80 shadow-lg shadow-sky-500/10'
                            : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                          {/* Left Details */}
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Version Tag */}
                              <span className="px-2.5 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold font-['Space_Grotesk']">
                                {snap.version || `v${subjectSnapshots.length - idx}.0`}
                              </span>

                              {/* Badges for New / Old / Active */}
                              {isLatest && (
                                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                                  🔥 Mới nhất
                                </span>
                              )}

                              {!isLatest && idx === subjectSnapshots.length - 1 && (
                                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-semibold">
                                  Bản gốc v1.0
                                </span>
                              )}

                              {isActive && (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                                  <Check className="w-3 h-3" />
                                  Đang học bản này
                                </span>
                              )}

                              {snap.metadata?.isRegenerated && (
                                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-semibold flex items-center gap-1">
                                  <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                                  Re-generated AI
                                </span>
                              )}

                              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-500" />
                                {new Date(snap.savedAt).toLocaleDateString('vi-VN')} {new Date(snap.savedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            {/* Title (Editable) */}
                            {isEditing ? (
                              <div className="flex items-center gap-2 max-w-md pt-1">
                                <input
                                  type="text"
                                  value={editTitleValue}
                                  onChange={(e) => setEditTitleValue(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && handleFinishRename(snap.id)}
                                  className="px-2.5 py-1 bg-slate-950 border border-sky-500 rounded-lg text-white text-xs w-full focus:outline-none"
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleFinishRename(snap.id)}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg cursor-pointer"
                                >
                                  Lưu
                                </button>
                                <button
                                  onClick={() => setEditingSnapshotId(null)}
                                  className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded-lg cursor-pointer"
                                >
                                  Hủy
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <h5 className="font-bold text-white text-sm truncate">
                                  {snap.title}
                                </h5>
                                <button
                                  onClick={() => handleStartRename(snap)}
                                  className="text-slate-500 hover:text-sky-400 p-1 rounded transition-colors cursor-pointer"
                                  title="Đổi tên ngắn"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}

                            {/* Stats Summary */}
                            <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap pt-0.5">
                              <span className="inline-flex items-center gap-1 text-slate-300">
                                <FileText className="w-3.5 h-3.5 text-sky-400" />
                                {snap.sources?.length || 0} nguồn gốc
                              </span>
                              <span>•</span>
                              <span className="inline-flex items-center gap-1 text-slate-300">
                                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                                {snap.studyPack?.flashcards?.length || 0} thẻ
                              </span>
                              <span>•</span>
                              <span className="inline-flex items-center gap-1 text-slate-300">
                                <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                                {snap.studyPack?.quizzes?.length || 0} quiz
                              </span>
                              <span>•</span>
                              <span className="text-slate-400">
                                {snap.studyPack?.qaSeeds?.length || 0} câu Q&A
                              </span>
                            </div>
                          </div>

                          {/* Right Actions */}
                          <div className="flex items-center gap-2 self-start md:self-auto shrink-0 flex-wrap">
                            <button
                              onClick={() => setComparingSnapshot(snap)}
                              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                              title="So sánh với dữ liệu hiện tại"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>So sánh</span>
                            </button>

                            <button
                              onClick={() => onExportSnapshot(snap)}
                              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs transition-colors cursor-pointer"
                              title="Tải về file JSON"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                if (window.confirm(`Xóa version "${snap.title}"? Thao tác này không thể hoàn tác.`)) {
                                  onDeleteSnapshot(snap.id);
                                }
                              }}
                              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 text-xs transition-colors cursor-pointer"
                              title="Xóa version này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                onRestoreSnapshot(snap);
                                onClose();
                              }}
                              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                isActive
                                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 cursor-default'
                                  : 'bg-sky-500 hover:bg-sky-400 text-white shadow-md shadow-sky-500/20 active:scale-95'
                              }`}
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>{isActive ? 'Đang Mở' : 'Mở / Học Tiếp'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Other subjects snapshots section if exists */}
              {otherSnapshots.length > 0 && (
                <div className="pt-4 border-t border-slate-800/80 space-y-2">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Các môn học khác ({otherSnapshots.length} bản lưu)
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {otherSnapshots.map((other) => (
                      <div
                        key={other.id}
                        className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="truncate">
                          <span className="font-bold text-white block truncate">{other.title}</span>
                          <span className="text-[11px] text-slate-400">{other.subject.name} • {other.version}</span>
                        </div>
                        <button
                          onClick={() => {
                            onRestoreSnapshot(other);
                            onClose();
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 font-semibold cursor-pointer shrink-0"
                        >
                          Mở môn này
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: RE-GENERATE STUDY PACK (GEMINI API) (PROMPT 05) */}
          {activeTab === 'regenerate' && (
            <div className="space-y-5">
              {/* Informative Intro Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/60 via-slate-900 to-sky-950/40 border border-indigo-500/30 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">
                      Re-generate Toàn Bộ Study Pack Bằng Gemini AI
                    </h4>
                    <p className="text-xs text-slate-300">
                      Tự động phân tích nguồn học liệu gốc để làm mới hoàn toàn <strong>Summary</strong>, <strong>5 nhóm Flashcard</strong>, <strong>Quiz trắc nghiệm</strong>, và <strong>Q&A</strong>.
                    </p>
                  </div>
                </div>

                {/* Key Commitments Checklist */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block text-[11px]">Không mất nguồn gốc</strong>
                      <span className="text-slate-400 text-[10px]">Toàn bộ {currentSources.length} bài đọc nguồn được giữ nguyên vẹn 100%.</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block text-[11px]">Làm mới 4 thành phần</strong>
                      <span className="text-slate-400 text-[10px]">Tóm tắt + 5 nhóm Flashcard + Quiz trắc nghiệm + Câu hỏi Q&A.</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block text-[11px]">Tạo version mới</strong>
                      <span className="text-slate-400 text-[10px]">Đóng gói thành phiên bản v{subjectSnapshots.length + 1}.0 để dễ so sánh.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gemini API Key Local-Only Box */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-amber-400" />
                    <h5 className="font-bold text-xs text-white">
                      Khóa Gemini API Key (Local-Only)
                    </h5>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Lưu cục bộ tại trình duyệt máy em</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Nhập khóa Gemini API key của em để re-generate trực tiếp. Khóa này chỉ được lưu trong LocalStorage của trình duyệt này và không bao giờ gửi đi lưu trữ trên máy chủ.
                </p>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder="Dán mã API key (vd: AIzaSy...)"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-[11px]"
                    >
                      {showApiKey ? 'Ẩn' : 'Hiện'}
                    </button>
                  </div>

                  <button
                    onClick={handleSaveApiKey}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors cursor-pointer shrink-0"
                  >
                    Lưu key
                  </button>

                  {hasKey && (
                    <button
                      onClick={() => {
                        clearKey();
                        setApiKeyInput('');
                      }}
                      className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 text-xs transition-colors cursor-pointer shrink-0"
                      title="Xóa khóa đã lưu"
                    >
                      Xóa
                    </button>
                  )}
                </div>

                {keySavedToast && (
                  <p className="text-xs text-emerald-400 flex items-center gap-1 font-semibold animate-fade-in">
                    <Check className="w-3.5 h-3.5" /> Đã lưu khóa API an toàn vào LocalStorage của trình duyệt!
                  </p>
                )}

                {hasKey && !keySavedToast && (
                  <p className="text-[11px] text-slate-400">
                    Trạng thái: <strong className="text-emerald-400">✓ Đang dùng khóa local ({maskedKey})</strong>
                  </p>
                )}
              </div>

              {/* Source Materials Preview (Confirming that sources will be retained) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-sky-400" />
                    Nguồn học liệu gốc sẽ dùng để Re-generate ({currentSources.length} nguồn):
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    Giữ nguyên 100% trong môn học
                  </span>
                </div>

                {currentSources.length === 0 ? (
                  <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Môn học này chưa có nguồn học liệu nào. Vui lòng thêm bài đọc trước khi bấm Re-generate.</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                    {currentSources.map((s, idx) => (
                      <div
                        key={s.id}
                        className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <strong className="text-white truncate">#{idx + 1} {s.title}</strong>
                          <span className="text-[10px] text-slate-400 uppercase">{s.type}</span>
                        </div>
                        <p className="text-slate-400 text-[11px] line-clamp-1">
                          {s.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Error Alert */}
              {regenError && (
                <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{regenError}</span>
                </div>
              )}

              {/* Action Button & Progress */}
              <div className="pt-2">
                {isRegenerating ? (
                  <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/40 space-y-2 text-center">
                    <div className="flex items-center justify-center gap-2 text-indigo-400 font-bold text-sm">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Đang Re-generate toàn bộ Study Pack...</span>
                    </div>
                    <p className="text-xs text-slate-300 font-medium">{regenStep}</p>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-gradient-to-r from-indigo-500 to-sky-400 h-1.5 w-full animate-pulse" />
                    </div>
                  </div>
                ) : (
                  <button
                    id="btn-confirm-regenerate-study-pack"
                    onClick={handleRegenerateStudyPack}
                    disabled={currentSources.length === 0}
                    className={`w-full py-3.5 px-6 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer ${
                      currentSources.length === 0
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-500 hover:from-indigo-500 hover:to-sky-400 shadow-indigo-600/30 active:scale-98'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Bắt Đầu Re-generate Thành Version {subjectSnapshots.length + 1}.0 Mới</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: LƯU SNAPSHOT MỚI */}
          {activeTab === 'save' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800 space-y-2">
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <Save className="w-4 h-4 text-emerald-400" />
                  <span>Lưu Snapshot Working Copy Hiện Tại</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Snapshot sẽ lưu toàn vẹn trạng thái hiện tại của môn học gồm: thông tin môn, toàn bộ học liệu nguồn, bản tóm tắt phân tích và bộ ôn tập (flashcard, quiz, Q&A).
                </p>
              </div>

              {/* Working Copy Content Preview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Môn học</span>
                  <strong className="text-white text-xs block truncate">{currentSubject?.name}</strong>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Nguồn học liệu</span>
                  <strong className="text-sky-400 text-sm font-['Space_Grotesk']">{currentSources.length} bài</strong>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Thẻ Flashcard</span>
                  <strong className="text-indigo-400 text-sm font-['Space_Grotesk']">{currentStudyPack.flashcards.length} thẻ</strong>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Quiz kiểm tra</span>
                  <strong className="text-emerald-400 text-sm font-['Space_Grotesk']">{currentStudyPack.quizzes.length} bộ</strong>
                </div>
              </div>

              {/* Title & Note Input */}
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tên hiển thị snapshot (có thể đổi ngắn gọn)
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="VD: Tiếng Anh - Ôn tập Unit 3 trước kỳ thi"
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Ghi chú thêm (tùy chọn)
                  </label>
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="VD: Đã hoàn thành 5 thẻ âm đuôi và 1 bài test trắc nghiệm"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  id="btn-confirm-save-snapshot"
                  onClick={handleQuickSave}
                  className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Xác Nhận Lưu Snapshot Working Copy Ngay</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Comparison Drawer / Modal (So sánh Version) */}
        {comparingSnapshot && (
          <div className="absolute inset-0 z-20 bg-slate-950/95 p-6 flex flex-col overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-sky-400" />
                <h4 className="font-bold text-white text-sm">
                  So Sánh Version "{comparingSnapshot.version}" Với Dữ Liệu Hiện Tại
                </h4>
              </div>
              <button
                onClick={() => setComparingSnapshot(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 flex-1">
              {/* Working Copy Column */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                    Hiện Tại (Working Copy)
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    Đang mở trong App
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <p className="text-slate-300">
                    <strong>Nguồn học liệu:</strong> {currentSources.length} bài
                  </p>
                  <p className="text-slate-300">
                    <strong>Flashcards:</strong> {currentStudyPack.flashcards.length} thẻ
                  </p>
                  <p className="text-slate-300">
                    <strong>Quizzes:</strong> {currentStudyPack.quizzes.length} bộ quiz
                  </p>
                  <p className="text-slate-300">
                    <strong>Q&A Seeds:</strong> {currentStudyPack.qaSeeds.length} câu
                  </p>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-xs">
                    <strong className="text-slate-200 block mb-1">Tóm tắt hiện tại:</strong>
                    {currentAnalysis?.summary || 'Chưa có bản tóm tắt nào'}
                  </div>
                </div>
              </div>

              {/* Compared Version Column */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-indigo-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                    Version: {comparingSnapshot.version}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
                    {new Date(comparingSnapshot.savedAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <p className="text-slate-300">
                    <strong>Nguồn học liệu:</strong> {comparingSnapshot.sources?.length || 0} bài
                  </p>
                  <p className="text-slate-300">
                    <strong>Flashcards:</strong> {comparingSnapshot.studyPack?.flashcards?.length || 0} thẻ
                  </p>
                  <p className="text-slate-300">
                    <strong>Quizzes:</strong> {comparingSnapshot.studyPack?.quizzes?.length || 0} bộ quiz
                  </p>
                  <p className="text-slate-300">
                    <strong>Q&A Seeds:</strong> {comparingSnapshot.studyPack?.qaSeeds?.length || 0} câu
                  </p>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-xs">
                    <strong className="text-slate-200 block mb-1">Tóm tắt của version này:</strong>
                    {comparingSnapshot.analysisPreview?.summary || 'Không có tóm tắt'}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      onRestoreSnapshot(comparingSnapshot);
                      setComparingSnapshot(null);
                      onClose();
                    }}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer transition-colors"
                  >
                    Mở & Học Tiếp Version Này
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800/80 bg-slate-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="text-slate-400 text-[11px]">
            Đang quản lý: <strong className="text-white">{currentSubject?.name}</strong> • {subjectSnapshots.length} phiên bản đã lưu
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
