import React, { useState, useEffect } from 'react';
import { Navbar, AppViewMode } from './components/Navbar';
import { CategorySelector } from './components/CategorySelector';
import { PronunciationCard } from './components/PronunciationCard';
import { AiFeedbackPanel } from './components/AiFeedbackPanel';
import { PracticeHistory } from './components/PracticeHistory';
import { DailyGoalCard } from './components/DailyGoalCard';
import { CustomPracticeModal } from './components/CustomPracticeModal';
import { StudyMaterialsScreen } from './components/materials/StudyMaterialsScreen';
import { FlashcardsScreen } from './components/flashcards/FlashcardsScreen';
import { QuizScreen } from './components/quiz/QuizScreen';
import { GroundedChatbotScreen } from './components/chatbot/GroundedChatbotScreen';
import { SnapshotManagerModal } from './components/snapshots/SnapshotManagerModal';
import { useStudyMaterials } from './hooks/useStudyMaterials';
import { useFlashcards } from './hooks/useFlashcards';
import { useQuizzes } from './hooks/useQuizzes';
import { useStudySummaries } from './hooks/useStudySummaries';
import { useQaSeeds } from './hooks/useQaSeeds';
import { useSubjectSnapshots } from './hooks/useSubjectSnapshots';
import { INITIAL_PRACTICE_ITEMS } from './data/practiceLibrary';
import { DEFAULT_STUDY_SUBJECTS } from './data/studySubjects';
import {
  PracticeItem,
  DifficultyLevel,
  CategoryKey,
  AiEvaluationResult,
  UserPracticeHistoryItem,
  PracticeGoal,
  StudySubject,
  StudyMaterialSource,
  SubjectSnapshot,
} from './types';
import { BookOpen, Sparkles, Award, Mic, Volume2, ShieldCheck, Zap, CheckCircle2, FolderOpen, Save, X, RotateCcw } from 'lucide-react';

export default function App() {
  const [activeView, setActiveView] = useState<AppViewMode>('materials');
  const [currentLevel, setCurrentLevel] = useState<DifficultyLevel>('beginner');
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('ending_sounds');
  const [customItem, setCustomItem] = useState<PracticeItem | null>(null);
  const [itemIndex, setItemIndex] = useState<number>(0);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState<boolean>(false);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluation, setEvaluation] = useState<AiEvaluationResult | null>(null);

  // =========================================================================
  // BUỔI 2 & BUỔI 4: Quản lý State + LocalStorage cho danh sách nguồn học liệu & Snapshots
  // - Mỗi nguồn có: id, loại nguồn (type), tiêu đề ngắn (title), nội dung hoặc liên kết (content)
  // - Dữ liệu tự động lưu và giữ nguyên khi người dùng F5 tải lại trang
  // - Hoàn toàn client-side không cần backend, cú pháp useState + useEffect cơ bản, dễ hiểu
  // =========================================================================
  const {
    materials,
    addMaterial: handleAddMaterial,
    deleteMaterial: handleDeleteMaterial,
    resetToDefault: handleResetMaterials,
    restoreSubjectMaterials,
    deleteMaterialsBySubject,
  } = useStudyMaterials();

  // Flashcards state (LocalStorage)
  const {
    cards: flashcards,
    restoreSubjectFlashcards,
    deleteFlashcardsBySubject,
  } = useFlashcards();

  // Quizzes state (LocalStorage)
  const {
    quizzes,
    restoreSubjectQuizzes,
    deleteQuizzesBySubject,
  } = useQuizzes();

  // Study Summaries state (LocalStorage)
  const {
    summaries,
    saveSummary,
    deleteSummaryBySubject,
  } = useStudySummaries();

  // Chatbot active prompt state
  const [chatbotPrompt, setChatbotPrompt] = useState<string>('');

  // Study Subjects State (Chủ đề / Môn học)
  const [subjects, setSubjects] = useState<StudySubject[]>(() => {
    try {
      const saved = localStorage.getItem('echolingo_subjects');
      return saved ? JSON.parse(saved) : DEFAULT_STUDY_SUBJECTS;
    } catch {
      return DEFAULT_STUDY_SUBJECTS;
    }
  });

  const [currentSubjectId, setCurrentSubjectId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('echolingo_current_subject_id');
      if (saved) return saved;
    } catch {}
    return subjects[0]?.id || 'subj-1';
  });

  // Q&A Seeds state for chatbot
  const {
    currentSubjectSeeds: qaSeeds,
    restoreSubjectSeeds,
    deleteSeedsBySubject,
  } = useQaSeeds(currentSubjectId);

  // Snapshot Management Hook (Save/Load Working Copy)
  const {
    snapshots,
    activeSnapshotId,
    setActiveSnapshotId,
    lastRestoredSnapshot,
    setLastRestoredSnapshot,
    saveSnapshot,
    renameSnapshot,
    deleteSnapshot,
    exportSnapshotToFile,
    importSnapshotFromFile,
  } = useSubjectSnapshots();

  const [isSnapshotModalOpen, setIsSnapshotModalOpen] = useState<boolean>(false);
  const [snapshotModalTab, setSnapshotModalTab] = useState<'versions' | 'save' | 'regenerate'>('versions');
  const [restoreNotification, setRestoreNotification] = useState<{
    title: string;
    subjectName: string;
    sourcesCount: number;
    flashcardsCount: number;
    quizzesCount: number;
  } | null>(null);

  // Lưu môn học vào localStorage
  useEffect(() => {
    try {
      localStorage.setItem('echolingo_subjects', JSON.stringify(subjects));
    } catch (e) {
      console.warn('Failed to persist subjects:', e);
    }
  }, [subjects]);

  // Lưu môn học đang chọn để khi mở lại trang vẫn giữ nguyên môn đã học
  useEffect(() => {
    try {
      localStorage.setItem('echolingo_current_subject_id', currentSubjectId);
    } catch (e) {
      console.warn('Failed to persist currentSubjectId:', e);
    }
  }, [currentSubjectId]);

  const [history, setHistory] = useState<UserPracticeHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('echolingo_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });


  const [goal, setGoal] = useState<PracticeGoal>(() => {
    try {
      const saved = localStorage.getItem('echolingo_goal');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return {
      dailyTarget: 5,
      minTargetScore: 80,
      focusPhoneme: 'Âm đuôi /t/, /d/, /s/',
    };
  });

  // Calculate today's history items
  const isToday = (dateString: string) => {
    try {
      const d = new Date(dateString);
      const now = new Date();
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      );
    } catch {
      return false;
    }
  };

  const todayHistory = history.filter((h) => isToday(h.timestamp));

  // Sync goal to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('echolingo_goal', JSON.stringify(goal));
    } catch (e) {
      console.warn('Failed to persist goal:', e);
    }
  }, [goal]);

  // Filter items based on active category
  const filteredItems = INITIAL_PRACTICE_ITEMS.filter(
    (item) => item.category === activeCategory
  );

  const activeItem: PracticeItem =
    customItem ||
    (filteredItems.length > 0
      ? filteredItems[itemIndex % filteredItems.length]
      : INITIAL_PRACTICE_ITEMS[0]);

  // Sync history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('echolingo_history', JSON.stringify(history));
    } catch (e) {
      console.warn('Failed to persist history:', e);
    }
  }, [history]);

  const handleSelectCategory = (cat: CategoryKey) => {
    setActiveCategory(cat);
    setCustomItem(null);
    setItemIndex(0);
    setEvaluation(null);
  };

  const handleSelectLevel = (level: DifficultyLevel) => {
    setCurrentLevel(level);
    // find first item with this level
    const idx = filteredItems.findIndex((i) => i.level === level);
    if (idx !== -1) {
      setItemIndex(idx);
    }
    setCustomItem(null);
    setEvaluation(null);
  };

  const handleNextItem = () => {
    setCustomItem(null);
    setEvaluation(null);
    if (filteredItems.length > 0) {
      setItemIndex((prev) => (prev + 1) % filteredItems.length);
    }
  };

  const handleEvaluate = async (payload: {
    targetText: string;
    targetIpa: string;
    userTranscript: string;
    audioBase64?: string;
    difficultyLevel: string;
    focusArea: string;
  }) => {
    setIsEvaluating(true);
    try {
      const response = await fetch('/api/pronunciation/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Evaluation failed with status: ${response.status}`);
      }

      const data: AiEvaluationResult = await response.json();
      setEvaluation(data);

      // Save to personal practice history
      const newHistoryItem: UserPracticeHistoryItem = {
        id: `hist-${Date.now()}`,
        itemId: activeItem.id,
        targetText: data.targetText,
        ipa: payload.targetIpa,
        overallScore: data.overallScore,
        accuracyScore: data.accuracyScore,
        stressScore: data.stressScore,
        weakPoints: data.detectedErrors || [],
        timestamp: new Date().toISOString(),
      };

      setHistory((prev) => [newHistoryItem, ...prev]);
    } catch (error) {
      console.error('Error in handleEvaluate:', error);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleApplyPersonalizedDrill = (drillText: string, drillIpa: string) => {
    const drillItem: PracticeItem = {
      id: `drill-${Date.now()}`,
      category: activeCategory,
      level: currentLevel,
      text: drillText,
      ipa: drillIpa || '/.../',
      translation: 'Bài tập khắc phục cá nhân do AI chỉ định',
      focusSound: 'Khắc phục lỗi vừa mắc',
      tip: 'Tập trung vào vị trí lưỡi và âm đuôi theo gợi ý của AI ở bài đánh giá trước.',
    };
    setCustomItem(drillItem);
    setEvaluation(null);
  };

  const handleCustomPracticeSubmit = (text: string, ipa?: string, translation?: string) => {
    const item: PracticeItem = {
      id: `custom-${Date.now()}`,
      category: activeCategory,
      level: currentLevel,
      text,
      ipa: ipa || '/tự do/',
      translation: translation || 'Nội dung tự chọn của bạn',
      focusSound: 'Tập trung phát âm & ngữ điệu',
      tip: 'Thả lỏng hàm, nghe mẫu phát âm bản xứ trước và bật âm đuôi rõ ràng.',
    };
    setCustomItem(item);
    setEvaluation(null);
  };

  const handleSelectPracticeFromHistory = (targetText: string, ipa: string) => {
    const found = INITIAL_PRACTICE_ITEMS.find((i) => i.text === targetText);
    if (found) {
      setCustomItem(null);
      setActiveCategory(found.category);
      const catItems = INITIAL_PRACTICE_ITEMS.filter((i) => i.category === found.category);
      const idx = catItems.findIndex((i) => i.id === found.id);
      if (idx !== -1) setItemIndex(idx);
    } else {
      setCustomItem({
        id: `hist-re-${Date.now()}`,
        category: activeCategory,
        level: currentLevel,
        text: targetText,
        ipa,
        translation: 'Luyện lại từ lịch sử',
        focusSound: 'Củng cố trí nhớ cơ miệng',
        tip: 'Lắng nghe phát âm mẫu và chú ý không lặp lại lỗi trước đó.',
      });
    }
    setEvaluation(null);
  };

  const handleAddSubject = (newSubject: Omit<StudySubject, 'id'>) => {
    const created: StudySubject = {
      ...newSubject,
      id: `subj-${Date.now()}`,
    };
    setSubjects((prev) => [...prev, created]);
    setCurrentSubjectId(created.id);
  };

  const handleRenameSubject = (subjectId: string, newName: string) => {
    const cleanName = newName.trim();
    if (!cleanName) return;
    setSubjects((prev) =>
      prev.map((s) => (s.id === subjectId ? { ...s, name: cleanName } : s))
    );
  };

  const handleDeleteSubject = (subjectId: string) => {
    if (subjects.length <= 1) {
      alert('Cần giữ lại ít nhất 1 môn học trong hệ thống.');
      return;
    }
    const remaining = subjects.filter((s) => s.id !== subjectId);
    setSubjects(remaining);

    // Dọn dẹp dữ liệu của môn học đã xóa
    deleteMaterialsBySubject(subjectId);
    deleteFlashcardsBySubject(subjectId);
    deleteQuizzesBySubject(subjectId);
    deleteSummaryBySubject(subjectId);
    deleteSeedsBySubject(subjectId);

    // Chuyển sang môn học còn lại
    if (currentSubjectId === subjectId) {
      setCurrentSubjectId(remaining[0].id);
    }
  };

  /**
   * Khôi phục (restore) toàn bộ snapshot working copy về ứng dụng:
   * - Môn học (subject)
   * - Học liệu nguồn (sources)
   * - Bản tóm tắt phân tích (analysisPreview)
   * - Bộ ôn tập studyPack (flashcards, qaSeeds, quizzes)
   */
  const handleRestoreSnapshot = (snapshot: SubjectSnapshot) => {
    // 1. Cập nhật hoặc thêm môn học vào danh sách subjects
    setSubjects((prev) => {
      const idx = prev.findIndex((s) => s.id === snapshot.subject.id);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = { ...snapshot.subject };
        return updated;
      }
      return [snapshot.subject, ...prev];
    });

    // 2. Chuyển ngay môn học hiện tại về môn của snapshot
    setCurrentSubjectId(snapshot.subject.id);

    // 3. Khôi phục danh sách học liệu nguồn (sources)
    if (snapshot.sources) {
      restoreSubjectMaterials(snapshot.subject.id, snapshot.sources);
    }

    // 4. Khôi phục bản tóm tắt phân tích (analysisPreview)
    if (snapshot.analysisPreview) {
      saveSummary(snapshot.analysisPreview);
    }

    // 5. Khôi phục bộ ôn tập studyPack
    if (snapshot.studyPack) {
      if (snapshot.studyPack.flashcards) {
        restoreSubjectFlashcards(snapshot.subject.id, snapshot.studyPack.flashcards);
      }
      if (snapshot.studyPack.qaSeeds) {
        restoreSubjectSeeds(snapshot.subject.id, snapshot.studyPack.qaSeeds);
      }
      if (snapshot.studyPack.quizzes) {
        restoreSubjectQuizzes(snapshot.subject.id, snapshot.studyPack.quizzes);
      }
    }

    // 6. Ghi nhận snapshot đang active
    setActiveSnapshotId(snapshot.id);
    setLastRestoredSnapshot(snapshot);

    // 7. Hiển thị thông báo trực quan trên giao diện để học sinh nhận biết rõ ràng
    setRestoreNotification({
      title: `Đã khôi phục thành công: "${snapshot.title}"`,
      subjectName: snapshot.subject.name,
      sourcesCount: snapshot.sources?.length || 0,
      flashcardsCount: snapshot.studyPack?.flashcards?.length || 0,
      quizzesCount: snapshot.studyPack?.quizzes?.length || 0,
    });

    // Phát sự kiện đồng bộ toàn app
    window.dispatchEvent(
      new CustomEvent('study_snapshot_restored', {
        detail: { subjectId: snapshot.subject.id, snapshotId: snapshot.id },
      })
    );
  };

  const handleOpenSnapshotModal = (mode: 'saved_list' | 'save_current' | 'regenerate' = 'saved_list') => {
    if (mode === 'save_current') {
      const curSubj = subjects.find((s) => s.id === currentSubjectId) || subjects[0];
      const curSources = materials.filter((m) => m.subjectId === currentSubjectId);
      const curAnalysis = summaries.find((s) => s.subjectId === currentSubjectId) || null;
      const curPack = {
        flashcards: flashcards.filter((f) => f.subjectId === currentSubjectId),
        qaSeeds: qaSeeds,
        quizzes: quizzes.filter((q) => q.subjectId === currentSubjectId),
      };
      const saved = saveSnapshot({
        subject: curSubj,
        sources: curSources,
        analysisPreview: curAnalysis,
        studyPack: curPack,
      });
      setRestoreNotification({
        title: `Đã lưu snapshot: "${saved.title}"`,
        subjectName: curSubj.name,
        sourcesCount: curSources.length,
        flashcardsCount: curPack.flashcards.length,
        quizzesCount: curPack.quizzes.length,
      });
      return;
    }
    setSnapshotModalTab(mode === 'regenerate' ? 'regenerate' : 'versions');
    setIsSnapshotModalOpen(true);
  };

  const handlePracticeFromMaterial = (sentenceText: string, materialTitle: string) => {
    setCustomItem({
      id: `mat-prac-${Date.now()}`,
      category: activeCategory,
      level: currentLevel,
      text: sentenceText,
      ipa: '/.../',
      translation: `Trích từ: ${materialTitle}`,
      focusSound: 'Ngữ điệu tự nhiên & Âm đuôi',
      tip: 'Lắng nghe phát âm mẫu, chú ý nhấn đúng trọng âm câu và bật âm cuối.',
    });
    setEvaluation(null);
    setActiveView('practice');
  };

  // Đối tượng working copy của môn học hiện tại để snapshot
  const currentSubject = subjects.find((s) => s.id === currentSubjectId) || subjects[0];
  const currentSources = materials.filter((m) => m.subjectId === currentSubjectId);
  const currentAnalysis = summaries.find((s) => s.subjectId === currentSubjectId) || null;
  const currentStudyPack = {
    flashcards: flashcards.filter((f) => f.subjectId === currentSubjectId),
    qaSeeds: qaSeeds,
    quizzes: quizzes.filter((q) => q.subjectId === currentSubjectId),
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* App Shell Navbar */}
      <Navbar
        currentLevel={currentLevel}
        onSelectLevel={handleSelectLevel}
        onOpenCustomModal={() => setIsCustomModalOpen(true)}
        practiceCount={history.length}
        goal={goal}
        todayCompletedCount={todayHistory.length}
        activeView={activeView}
        onSelectView={setActiveView}
        materialCount={materials.length}
        flashcardCount={flashcards.length}
        quizCount={quizzes.length}
        onOpenSnapshotModal={handleOpenSnapshotModal}
        snapshotsCount={snapshots.length}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Restore Snapshot Notice Banner (Phản hồi UI trực quan khi nạp snapshot) */}
        {restoreNotification && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-emerald-950/40 border border-emerald-500/40 text-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white flex items-center gap-2 flex-wrap">
                  <span>{restoreNotification.title}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                    ✓ Đã Khôi Phục Snapshot
                  </span>
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Môn: <strong className="text-white">{restoreNotification.subjectName}</strong> • {restoreNotification.sourcesCount} học liệu • {restoreNotification.flashcardsCount} flashcard • {restoreNotification.quizzesCount} quiz
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
              <button
                onClick={() => setActiveView('materials')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
              >
                Xem Học Liệu
              </button>
              <button
                onClick={() => setActiveView('flashcards')}
                className="px-3 py-1.5 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-semibold cursor-pointer transition-colors"
              >
                Xem Flashcards
              </button>
              <button
                onClick={() => setActiveView('quiz')}
                className="px-3 py-1.5 rounded-xl bg-emerald-600/80 hover:bg-emerald-600 text-white text-xs font-semibold cursor-pointer transition-colors"
              >
                Làm Quiz
              </button>
              <button
                onClick={() => setRestoreNotification(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"
                title="Đóng thông báo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* VIEW 1: STUDY MATERIALS SCREEN (HỌC LIỆU ĐẦU VÀO) */}
        {activeView === 'materials' && (
          <StudyMaterialsScreen
            subjects={subjects}
            currentSubjectId={currentSubjectId}
            onSelectSubject={setCurrentSubjectId}
            onAddSubject={handleAddSubject}
            materials={materials}
            onAddMaterial={handleAddMaterial}
            onDeleteMaterial={handleDeleteMaterial}
            onResetMaterials={handleResetMaterials}
            onPracticeFromMaterial={handlePracticeFromMaterial}
            onNavigateToPractice={() => setActiveView('practice')}
            onNavigateToFlashcards={() => setActiveView('flashcards')}
            onNavigateToQuiz={() => setActiveView('quiz')}
            onNavigateToChatbot={(prompt) => {
              setChatbotPrompt(prompt || '');
              setActiveView('chatbot');
            }}
            onOpenFlashcardWithMaterial={(mat) => {
              setActiveView('flashcards');
            }}
            onOpenSnapshotModal={handleOpenSnapshotModal}
            snapshotsCount={snapshots.length}
            activeSnapshotTitle={
              snapshots.find((s) => s.id === activeSnapshotId)?.title ||
              (lastRestoredSnapshot && lastRestoredSnapshot.subject.id === currentSubjectId
                ? lastRestoredSnapshot.title
                : undefined)
            }
            onRenameSubject={handleRenameSubject}
            onDeleteSubject={handleDeleteSubject}
          />
        )}

        {/* VIEW 2: FLASHCARD QUICK STUDY & LIBRARY */}
        {activeView === 'flashcards' && (
          <FlashcardsScreen
            subjects={subjects}
            currentSubjectId={currentSubjectId}
            materials={materials}
            onNavigateToPractice={handlePracticeFromMaterial}
            onNavigateToMaterials={() => setActiveView('materials')}
          />
        )}

        {/* VIEW 3: QUIZ MODE SCREEN */}
        {activeView === 'quiz' && (
          <QuizScreen
            subjects={subjects}
            currentSubjectId={currentSubjectId}
            onNavigateToMaterials={() => setActiveView('materials')}
            onNavigateToFlashcards={() => setActiveView('flashcards')}
          />
        )}

        {/* VIEW 4: GROUNDED CHATBOT SCREEN (HỖ TRỢ ÔN BÀI CHO CHỦ ĐỀ HIỆN TẠI) */}
        {activeView === 'chatbot' && (
          <GroundedChatbotScreen
            subjects={subjects}
            currentSubjectId={currentSubjectId}
            onSelectSubject={setCurrentSubjectId}
            materials={materials}
            summaries={summaries}
            flashcards={flashcards}
            qaSeeds={qaSeeds}
            quizzes={quizzes}
            initialPrompt={chatbotPrompt}
            onNavigateToMaterials={() => setActiveView('materials')}
            onNavigateToFlashcards={() => setActiveView('flashcards')}
            onNavigateToQuiz={() => setActiveView('quiz')}
          />
        )}

        {/* VIEW 5: PRONUNCIATION PRACTICE ROOM */}
        {activeView === 'practice' && (
          <div>
            {/* Category Tab Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Chọn chủ đề trọng tâm phát âm:
                </span>
                {customItem ? (
                  <button
                    onClick={() => setCustomItem(null)}
                    className="text-xs text-sky-400 hover:text-sky-300 underline font-medium cursor-pointer"
                  >
                    Quay lại thư viện bài học chuẩn
                  </button>
                ) : (
                  <button
                    onClick={() => setActiveView('materials')}
                    className="text-xs text-slate-400 hover:text-sky-300 flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <span>Lấy bài từ kho học liệu</span>
                    <span>→</span>
                  </button>
                )}
              </div>
              <CategorySelector
                activeCategory={activeCategory}
                onSelectCategory={handleSelectCategory}
              />
            </div>

            {/* 2-Column Responsive Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Main Interactive Practice Column (8 cols) */}
              <div className="lg:col-span-8 space-y-6">
                {/* Pronunciation Target Card */}
                <PronunciationCard
                  item={activeItem}
                  onEvaluate={handleEvaluate}
                  isEvaluating={isEvaluating}
                  onNextItem={handleNextItem}
                  hasEvaluation={Boolean(evaluation)}
                />

                {/* AI Review & Personalized Feedback */}
                <AiFeedbackPanel
                  evaluation={evaluation}
                  isLoading={isEvaluating}
                  onApplyPersonalizedDrill={handleApplyPersonalizedDrill}
                />
              </div>

              {/* Sidebar (4 cols): Personal History & Core Phonetics Guide */}
              <div className="lg:col-span-4 space-y-6">
                {/* Daily Practice Targets & Goal Tracking */}
                <DailyGoalCard
                  goal={goal}
                  onUpdateGoal={setGoal}
                  todayHistory={todayHistory}
                  streakDays={1}
                />

                {/* Personal Practice History & Analytics */}
                <PracticeHistory
                  history={history}
                  onSelectPracticeItem={handleSelectPracticeFromHistory}
                  onClearHistory={() => setHistory([])}
                />

                {/* Vietnamese English Pronunciation Guide Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-sky-400" />
                    <h4 className="text-sm font-bold text-white">
                      Mẹo Sửa Lỗi Thường Gặp Cùng AI
                    </h4>
                  </div>

                  <div className="space-y-2.5 text-xs text-slate-300">
                    <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
                      <span className="font-semibold text-sky-300 block mb-0.5">
                        1. Tránh nuốt âm đuôi (Ending Consonants)
                      </span>
                      <p className="text-slate-400 leading-relaxed">
                        Tiếng Việt là ngôn ngữ đơn âm tiết không bật âm đuôi. Trong tiếng Anh, các âm /t/, /d/, /s/, /z/, /tʃ/ ở đuôi từ quyết định trực tiếp nghĩa của câu.
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
                      <span className="font-semibold text-indigo-300 block mb-0.5">
                        2. Âm /θ/ (Voiceless TH)
                      </span>
                      <p className="text-slate-400 leading-relaxed">
                        Không thay thế /θ/ bằng "th" tiếng Việt hay /t/. Luôn kẹp nhẹ đầu lưỡi giữa hai hàm răng và thổi luồng hơi ra (ví dụ: Think, Thought).
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
                      <span className="font-semibold text-emerald-300 block mb-0.5">
                        3. Trọng âm & Nhịp điệu (Stress & Rhythm)
                      </span>
                      <p className="text-slate-400 leading-relaxed">
                        Âm tiết được nhấn cần nói to hơn, dài hơn và cao giọng hơn. Các âm không nhấn thường lướt nhẹ thành âm Schwa /ə/.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Study Tips Info */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-300">
                  <div className="flex items-center gap-1.5 font-semibold text-sky-300 mb-1">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Lộ trình ôn tập gợi ý</span>
                  </div>
                  <p className="leading-relaxed text-slate-400">
                    Nắm chắc học liệu nguồn → Ôn phản xạ bằng Flashcard → Kiểm tra kiến thức với Quiz → Hỏi đáp chuyên sâu cùng Chatbot.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>


      {/* Custom Practice Input Modal */}
      <CustomPracticeModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onSubmit={handleCustomPracticeSubmit}
      />

      {/* Modal Quản lý và Lưu/Nạp Snapshot Môn Học */}
      <SnapshotManagerModal
        isOpen={isSnapshotModalOpen}
        onClose={() => setIsSnapshotModalOpen(false)}
        initialTab={snapshotModalTab}
        currentSubject={currentSubject}
        currentSources={currentSources}
        currentAnalysis={currentAnalysis}
        currentStudyPack={currentStudyPack}
        snapshots={snapshots}
        activeSnapshotId={activeSnapshotId}
        onSaveSnapshot={saveSnapshot}
        onRestoreSnapshot={handleRestoreSnapshot}
        onRenameSnapshot={renameSnapshot}
        onDeleteSnapshot={deleteSnapshot}
        onExportSnapshot={exportSnapshotToFile}
        onImportSnapshot={importSnapshotFromFile}
        onDeleteSubject={handleDeleteSubject}
      />
    </div>
  );
}
