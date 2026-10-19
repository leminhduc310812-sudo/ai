import { useState, useEffect, useCallback } from 'react';
import {
  SubjectSnapshot,
  StudySubject,
  StudyMaterialSource,
  StudySummary,
  FlashcardItem,
  QaSeedItem,
  QuizItem,
} from '../types';

const SNAPSHOTS_STORAGE_KEY = 'echolingo_subject_snapshots';

export function useSubjectSnapshots() {
  const [snapshots, setSnapshots] = useState<SubjectSnapshot[]>(() => {
    try {
      const saved = localStorage.getItem(SNAPSHOTS_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Lỗi đọc snapshots từ LocalStorage:', e);
    }
    return [];
  });

  const [activeSnapshotId, setActiveSnapshotId] = useState<string | null>(null);
  const [lastRestoredSnapshot, setLastRestoredSnapshot] = useState<SubjectSnapshot | null>(null);

  // Lưu danh sách snapshot vào LocalStorage khi state thay đổi
  useEffect(() => {
    try {
      localStorage.setItem(SNAPSHOTS_STORAGE_KEY, JSON.stringify(snapshots));
    } catch (e) {
      console.warn('Lỗi lưu snapshots vào LocalStorage:', e);
    }
  }, [snapshots]);

  // Lấy các snapshot/version của một môn học cụ thể
  const getSnapshotsBySubject = useCallback(
    (subjectId: string) => {
      return snapshots
        .filter((s) => s.subject.id === subjectId)
        .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
    },
    [snapshots]
  );

  /**
   * 1. Lưu snapshot working copy hiện tại:
   * Bao gồm tối thiểu: subject, sources, analysisPreview, studyPack, metadata
   */
  const saveSnapshot = useCallback(
    (params: {
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
    }): SubjectSnapshot => {
      const now = new Date();
      const existingSubjectVersions = snapshots.filter((s) => s.subject.id === params.subject.id);
      const nextVersionNum = existingSubjectVersions.length + 1;
      const versionLabel = params.customVersion || `v${nextVersionNum}.0${params.isRegenerated ? ' (Re-generated)' : ''}`;

      const defaultTitle = params.title?.trim() || `${params.subject.name} - ${versionLabel}`;

      const newSnapshot: SubjectSnapshot = {
        id: `snap-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: defaultTitle,
        savedAt: now.toISOString(),
        version: versionLabel,
        subject: { ...params.subject },
        sources: params.sources.map((s) => ({ ...s })),
        analysisPreview: params.analysisPreview ? { ...params.analysisPreview } : null,
        studyPack: {
          flashcards: params.studyPack.flashcards.map((f) => ({ ...f })),
          qaSeeds: params.studyPack.qaSeeds.map((q) => ({ ...q })),
          quizzes: params.studyPack.quizzes.map((qz) => ({ ...qz })),
        },
        metadata: {
          sourceCount: params.sources.length,
          flashcardCount: params.studyPack.flashcards.length,
          qaSeedCount: params.studyPack.qaSeeds.length,
          quizCount: params.studyPack.quizzes.length,
          note: params.note || (params.isRegenerated ? 'Được tạo mới bằng AI Re-generate' : 'Working copy snapshot'),
          description: `Môn: ${params.subject.name} • ${params.sources.length} nguồn • ${params.studyPack.flashcards.length} thẻ • ${params.studyPack.quizzes.length} quiz`,
          versionNumber: nextVersionNum,
          isRegenerated: Boolean(params.isRegenerated),
          regeneratedAt: params.isRegenerated ? now.toISOString() : undefined,
        },
      };

      setSnapshots((prev) => [newSnapshot, ...prev]);
      setActiveSnapshotId(newSnapshot.id);
      return newSnapshot;
    },
    [snapshots]
  );

  /**
   * 2. Đổi tên ngắn cho snapshot
   */
  const renameSnapshot = useCallback((id: string, newTitle: string) => {
    const cleanTitle = newTitle.trim();
    if (!cleanTitle) return;

    setSnapshots((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: cleanTitle } : s))
    );
  }, []);

  /**
   * 3. Xóa snapshot không cần thiết
   */
  const deleteSnapshot = useCallback((id: string) => {
    setSnapshots((prev) => prev.filter((s) => s.id !== id));
    setActiveSnapshotId((prev) => (prev === id ? null : prev));
  }, []);

  /**
   * 4. Xuất snapshot ra file JSON để sao lưu ngoại tuyến
   */
  const exportSnapshotToFile = useCallback((snapshot: SubjectSnapshot) => {
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(snapshot, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute(
        'download',
        `echolingo-${snapshot.subject.name.replace(/\s+/g, '_')}-${snapshot.version}-${new Date().toISOString().slice(0, 10)}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e) {
      console.warn('Lỗi xuất file snapshot:', e);
    }
  }, []);

  /**
   * 5. Nhập snapshot từ file JSON
   */
  const importSnapshotFromFile = useCallback((jsonContent: string): SubjectSnapshot | null => {
    try {
      const parsed: SubjectSnapshot = JSON.parse(jsonContent);
      if (!parsed.id || !parsed.subject || !parsed.sources || !parsed.studyPack) {
        throw new Error('Định dạng file snapshot không hợp lệ');
      }

      // Tạo id mới tránh trùng lặp
      const imported: SubjectSnapshot = {
        ...parsed,
        id: `snap-imp-${Date.now()}`,
        title: parsed.title ? `[Nhập] ${parsed.title}` : `[Nhập] ${parsed.subject.name}`,
        savedAt: new Date().toISOString(),
      };

      setSnapshots((prev) => [imported, ...prev]);
      return imported;
    } catch (e) {
      console.warn('Lỗi nhập snapshot:', e);
      return null;
    }
  }, []);

  return {
    snapshots,
    activeSnapshotId,
    setActiveSnapshotId,
    lastRestoredSnapshot,
    setLastRestoredSnapshot,
    getSnapshotsBySubject,
    saveSnapshot,
    renameSnapshot,
    deleteSnapshot,
    exportSnapshotToFile,
    importSnapshotFromFile,
  };
}
