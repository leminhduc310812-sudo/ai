import React, { useState, useMemo } from 'react';
import {
  BookMarked,
  Sparkles,
  Mic,
  FileText,
  Image as ImageIcon,
  Globe,
  ArrowRight,
  Database,
  RotateCcw,
  BookmarkCheck,
} from 'lucide-react';
import { StudySubject, StudyMaterialSource, StudySummary } from '../../types';
import { SubjectSelector } from './SubjectSelector';
import { AddMaterialForm } from './AddMaterialForm';
import { MaterialList } from './MaterialList';
import { SummarySectionBanner } from './SummarySectionBanner';
import { SummaryViewerModal } from './SummaryViewerModal';
import { QaSeedSection } from './QaSeedSection';
import { useStudySummaries } from '../../hooks/useStudySummaries';
import { useQaSeeds } from '../../hooks/useQaSeeds';
import { Layers, HelpCircle, Bot } from 'lucide-react';

interface StudyMaterialsScreenProps {
  subjects: StudySubject[];
  currentSubjectId: string;
  onSelectSubject: (subjectId: string) => void;
  onAddSubject: (subject: Omit<StudySubject, 'id'>) => void;
  materials: StudyMaterialSource[];
  onAddMaterial: (material: Omit<StudyMaterialSource, 'id' | 'createdAt'>) => void;
  onDeleteMaterial: (id: string) => void;
  onPracticeFromMaterial: (text: string, title: string) => void;
  onNavigateToPractice: () => void;
  onNavigateToFlashcards?: () => void;
  onNavigateToQuiz?: () => void;
  onNavigateToChatbot?: (prompt?: string) => void;
  onOpenFlashcardWithMaterial?: (material: StudyMaterialSource) => void;
  onResetMaterials?: () => void;
  onOpenSnapshotModal?: (mode: 'saved_list' | 'save_current' | 'regenerate') => void;
  snapshotsCount?: number;
  activeSnapshotTitle?: string;
  onRenameSubject?: (subjectId: string, newName: string) => void;
  onDeleteSubject?: (subjectId: string) => void;
}

export const StudyMaterialsScreen: React.FC<StudyMaterialsScreenProps> = ({
  subjects,
  currentSubjectId,
  onSelectSubject,
  onAddSubject,
  materials,
  onAddMaterial,
  onDeleteMaterial,
  onPracticeFromMaterial,
  onNavigateToPractice,
  onNavigateToFlashcards,
  onNavigateToQuiz,
  onNavigateToChatbot,
  onOpenFlashcardWithMaterial,
  onResetMaterials,
  onOpenSnapshotModal,
  snapshotsCount,
  activeSnapshotTitle,
  onRenameSubject,
  onDeleteSubject,
}) => {
  const currentSubject = subjects.find((s) => s.id === currentSubjectId) || subjects[0];

  // Hook quản lý Q&A seed cho chủ đề học tập hiện tại (chuẩn bị chatbot buổi sau)
  const {
    currentSubjectSeeds,
    addSeed,
    toggleFavorite,
    deleteSeed,
  } = useQaSeeds(currentSubject.id);

  // Hook quản lý tóm tắt & key points cốt lõi (LocalStorage)
  const {
    summaries,
    isGenerating,
    generationStep,
    deleteSummary,
    getSummaryBySubjectId,
    getSummaryByMaterialId,
    generateSummary,
  } = useStudySummaries();

  // State cho Modal xem chi tiết tóm tắt
  const [selectedSummary, setSelectedSummary] = useState<StudySummary | null>(null);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);

  // Bản tóm tắt hiện tại của môn học đang chọn
  const currentSubjectSummary = getSummaryBySubjectId(currentSubject.id) || null;

  // Danh sách học liệu thuộc môn học đang chọn
  const subjectMaterials = useMemo(() => {
    return materials.filter((m) => m.subjectId === currentSubject.id);
  }, [materials, currentSubject.id]);

  // Count materials per subject
  const materialCountBySubject = useMemo(() => {
    const map: Record<string, number> = {};
    materials.forEach((m) => {
      map[m.subjectId] = (map[m.subjectId] || 0) + 1;
    });
    return map;
  }, [materials]);

  // Overall counts
  const textCount = materials.filter((m) => m.type === 'text').length;
  const imageCount = materials.filter((m) => m.type === 'image').length;
  const urlCount = materials.filter((m) => m.type === 'url').length;

  // Xử lý tạo tóm tắt cho toàn bộ chủ đề/môn học
  const handleGenerateSubjectSummary = async () => {
    const sourcesToUse = subjectMaterials.length > 0 ? subjectMaterials : materials;
    if (sourcesToUse.length === 0) {
      alert('Vui lòng thêm ít nhất một nguồn học liệu trước khi tạo tóm tắt.');
      return;
    }

    setIsSummaryModalOpen(true);
    setSelectedSummary(null);

    const generated = await generateSummary({
      subjectId: currentSubject.id,
      subjectName: currentSubject.name,
      sources: sourcesToUse,
      targetType: 'subject',
    });

    setSelectedSummary(generated);
  };

  // Xử lý tóm tắt cho một học liệu riêng lẻ
  const handleSummarizeMaterial = async (material: StudyMaterialSource) => {
    const existing = getSummaryByMaterialId(material.id);
    if (existing) {
      setSelectedSummary(existing);
      setIsSummaryModalOpen(true);
      return;
    }

    setIsSummaryModalOpen(true);
    setSelectedSummary(null);

    const generated = await generateSummary({
      subjectId: material.subjectId || currentSubject.id,
      subjectName: material.subjectName || currentSubject.name,
      sources: [material],
      targetType: 'single_material',
      materialTitle: material.title,
      materialId: material.id,
    });

    setSelectedSummary(generated);
  };

  // Xử lý làm mới lại bản tóm tắt trong modal
  const handleRegenerateFromModal = () => {
    if (selectedSummary?.targetType === 'single_material' && selectedSummary.targetMaterialId) {
      const foundMat = materials.find((m) => m.id === selectedSummary.targetMaterialId);
      if (foundMat) {
        handleSummarizeMaterial(foundMat);
        return;
      }
    }
    handleGenerateSubjectSummary();
  };

  return (
    <div id="study-materials-screen" className="space-y-6">
      {/* Friendly Student Banner */}
      <div className="bg-gradient-to-r from-sky-900/40 via-indigo-900/30 to-slate-900 border border-sky-800/40 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-semibold flex items-center gap-1">
                <BookMarked className="w-3.5 h-3.5" />
                Góc Học Liệu Của Em
              </span>
              <span className="text-xs text-slate-400">| Trải nghiệm nhập liệu ưu tiên văn bản & tóm tắt AI</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Kho Tài Liệu & Tóm Tắt Trọng Tâm
            </h1>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              Dán đoạn văn tiếng Anh, ảnh chụp trang sách hoặc lưu bài đọc. AI sẽ tự động phân tích trích xuất <strong>bản tóm tắt ngắn</strong> và các <strong>điểm cốt lõi</strong>, giúp các em ôn tập nhẹ nhàng và luyện phát âm ngay!
            </p>
          </div>

          {/* Quick Actions to Flashcards, Quiz and Practice Room */}
          <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
            {onNavigateToFlashcards && (
              <button
                id="btn-go-to-flashcards"
                onClick={onNavigateToFlashcards}
                className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 transition-all cursor-pointer whitespace-nowrap"
              >
                <Layers className="w-4 h-4" />
                <span>Thẻ Flashcard</span>
              </button>
            )}

            {onNavigateToQuiz && (
              <button
                id="btn-go-to-quiz"
                onClick={onNavigateToQuiz}
                className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 transition-all cursor-pointer whitespace-nowrap"
              >
                <HelpCircle className="w-4 h-4" />
                <span>Quiz Ôn Tập</span>
              </button>
            )}

            {onNavigateToChatbot && (
              <button
                id="btn-go-to-chatbot"
                onClick={() => onNavigateToChatbot()}
                className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 transition-all cursor-pointer whitespace-nowrap"
              >
                <Bot className="w-4 h-4" />
                <span>Chatbot Ôn Bài</span>
              </button>
            )}

            <button
              id="btn-go-to-practice"
              onClick={onNavigateToPractice}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 active:scale-95 text-white font-bold text-xs shadow-lg shadow-sky-500/25 transition-all cursor-pointer whitespace-nowrap"
            >
              <Mic className="w-4 h-4" />
              <span>Vào Phòng Luyện Phát Âm</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Material Stats Counters & LocalStorage status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-5 mt-4 border-t border-slate-800/80">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Bài đọc & Văn bản</span>
                <strong className="text-white text-sm font-['Space_Grotesk']">{textCount}</strong>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                <ImageIcon className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Ảnh chụp sách</span>
                <strong className="text-white text-sm font-['Space_Grotesk']">{imageCount}</strong>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                <Globe className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Đường dẫn web</span>
                <strong className="text-white text-sm font-['Space_Grotesk']">{urlCount}</strong>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                <BookmarkCheck className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Bản tóm tắt đã lưu</span>
                <strong className="text-white text-sm font-['Space_Grotesk']">{summaries.length}</strong>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[11px] font-medium">
              <Database className="w-3.5 h-3.5" />
              <span>LocalStorage: Tự động lưu</span>
            </div>
            {onResetMaterials && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Khôi phục danh sách học liệu về dữ liệu mẫu ban đầu?')) {
                    onResetMaterials();
                  }
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 text-[11px] transition-colors cursor-pointer"
                title="Khôi phục dữ liệu mẫu ban đầu"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Đặt lại mẫu</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 1. Subject Selector: Chọn hoặc mở môn/chủ đề đang học */}
      <SubjectSelector
        subjects={subjects}
        selectedSubjectId={currentSubjectId}
        onSelectSubject={onSelectSubject}
        onAddSubject={onAddSubject}
        materialCountBySubject={materialCountBySubject}
        onOpenSnapshotModal={onOpenSnapshotModal}
        snapshotsCount={snapshotsCount}
        activeSnapshotTitle={activeSnapshotTitle}
        onRenameSubject={onRenameSubject}
        onDeleteSubject={onDeleteSubject}
      />

      {/* 2. SUMMARY & KEY POINTS BANNER (Tạo hoặc xem tóm tắt của môn học) */}
      <SummarySectionBanner
        summary={currentSubjectSummary}
        subjectName={currentSubject.name}
        sourceCount={subjectMaterials.length}
        onOpenSummaryModal={() => {
          setSelectedSummary(currentSubjectSummary);
          setIsSummaryModalOpen(true);
        }}
        onGenerateSummary={handleGenerateSubjectSummary}
        isGenerating={isGenerating}
        generationStep={generationStep}
      />

      {/* 3. Q&A SEED KHỞI TẠO CHO CHỦ ĐỀ HIỆN TẠI (Chuẩn bị dữ liệu cho Chatbot ôn bài ở buổi sau) */}
      <QaSeedSection
        currentSubject={currentSubject}
        seeds={currentSubjectSeeds}
        onAddSeed={addSeed}
        onToggleFavorite={toggleFavorite}
        onDeleteSeed={deleteSeed}
        onAskChatbot={onNavigateToChatbot}
      />

      {/* 4. Add Material Form: Thêm nguồn dạng Text (ưu tiên), Ảnh, hoặc URL */}
      <AddMaterialForm
        currentSubjectId={currentSubject.id}
        currentSubjectName={currentSubject.name}
        onAddMaterial={onAddMaterial}
      />

      {/* 5. List of Added Materials: Hiển thị danh sách nguồn đã thêm */}
      <MaterialList
        materials={materials}
        currentSubjectId={currentSubject.id}
        currentSubjectName={currentSubject.name}
        onPracticeFromMaterial={onPracticeFromMaterial}
        onDeleteMaterial={onDeleteMaterial}
        onSummarizeMaterial={handleSummarizeMaterial}
        hasSummaryForMaterial={(id) => Boolean(getSummaryByMaterialId(id))}
        onOpenFlashcards={onOpenFlashcardWithMaterial}
      />

      {/* 5. Summary Viewer Modal: Hiển thị trọn vẹn Summary & Key points */}
      <SummaryViewerModal
        summary={selectedSummary}
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        onRegenerate={handleRegenerateFromModal}
        onDelete={(id) => deleteSummary(id)}
        onPracticeSentence={onPracticeFromMaterial}
        onCreateFlashcards={(sum) => {
          if (onNavigateToFlashcards) {
            onNavigateToFlashcards();
          }
        }}
        isGenerating={isGenerating}
        generationStep={generationStep}
      />
    </div>
  );
};
