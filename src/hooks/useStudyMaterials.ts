import { useState, useEffect } from 'react';
import { StudyMaterialSource, SourceType } from '../types';
import { INITIAL_STUDY_MATERIALS } from '../data/studySubjects';

/**
 * Key lưu trữ trong LocalStorage của trình duyệt
 */
const STORAGE_KEY = 'study_materials_list';

/**
 * Hook quản lý State + LocalStorage cho danh sách nguồn học liệu (Phạm vi Buổi 2)
 *
 * Yêu cầu:
 * - Mỗi nguồn gồm: id, loại nguồn (type), tiêu đề ngắn (title), nội dung hoặc liên kết (content)
 * - Dữ liệu được giữ lại khi tải lại trang (F5) nhờ LocalStorage
 * - Không cần backend, ưu tiên triển khai cơ bản và dễ hiểu
 */
export function useStudyMaterials() {
  // 1. Khởi tạo State từ LocalStorage (Lazy initialization)
  // Chỉ chạy 1 lần duy nhất khi component được render lần đầu
  const [materials, setMaterials] = useState<StudyMaterialSource[]>(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        return JSON.parse(savedData);
      }
    } catch (error) {
      console.warn('Lỗi đọc LocalStorage:', error);
    }
    // Dữ liệu mẫu ban đầu nếu chưa có dữ liệu trong LocalStorage
    return INITIAL_STUDY_MATERIALS;
  });

  // 2. Tự động đồng bộ vào LocalStorage mỗi khi state `materials` thay đổi
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(materials));
    } catch (error) {
      console.warn('Lỗi lưu LocalStorage:', error);
    }
  }, [materials]);

  /**
   * 3. Thêm một nguồn học liệu mới
   * Đảm bảo đủ: id (tự sinh), loại nguồn (type), tiêu đề ngắn (title), nội dung hoặc liên kết (content)
   */
  const addMaterial = (newSource: {
    type: SourceType;
    title: string;
    content: string;
    subjectId?: string;
    subjectName?: string;
    imageUrl?: string;
    notes?: string;
    wordCount?: number;
    tags?: string[];
  }) => {
    const item: StudyMaterialSource = {
      id: `source-${Date.now()}`,                       // 1. id duy nhất
      type: newSource.type,                             // 2. loại nguồn: 'text' | 'image' | 'url'
      title: newSource.title.trim() || 'Học liệu mới', // 3. tiêu đề ngắn
      content: newSource.content.trim(),                // 4. nội dung hoặc liên kết
      subjectId: newSource.subjectId || 'subj-1',
      subjectName: newSource.subjectName || 'Tiếng Anh',
      imageUrl: newSource.imageUrl,
      notes: newSource.notes,
      wordCount: newSource.wordCount || (newSource.type === 'text' ? newSource.content.trim().split(/\s+/).length : 0),
      createdAt: new Date().toISOString(),
      tags: newSource.tags || [],
    };

    // Cập nhật state (đưa nguồn mới lên đầu danh sách)
    setMaterials((prevList) => [item, ...prevList]);
    return item;
  };

  /**
   * 4. Xóa một nguồn học liệu theo id
   */
  const deleteMaterial = (id: string) => {
    setMaterials((prevList) => prevList.filter((item) => item.id !== id));
  };

  // Lắng nghe sự kiện khôi phục snapshot để đồng bộ lại danh sách học liệu từ localStorage
  useEffect(() => {
    const handleSync = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          setMaterials(JSON.parse(saved));
        }
      } catch (e) {
        console.warn('Lỗi đồng bộ materials sau khi restore:', e);
      }
    };

    window.addEventListener('study_snapshot_restored', handleSync);
    return () => window.removeEventListener('study_snapshot_restored', handleSync);
  }, []);

  /**
   * 6. Khôi phục / Đồng bộ hóa danh sách học liệu của một môn học (Snapshot Restore)
   */
  const restoreSubjectMaterials = (subjectId: string, newSources: StudyMaterialSource[]) => {
    setMaterials((prev) => {
      const others = prev.filter((m) => m.subjectId !== subjectId);
      const updated = [...newSources, ...others];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Error saving restored materials to localStorage:', e);
      }
      return updated;
    });
  };

  /**
   * 7. Xóa toàn bộ học liệu của một môn học
   */
  const deleteMaterialsBySubject = (subjectId: string) => {
    setMaterials((prev) => {
      const updated = prev.filter((m) => m.subjectId !== subjectId);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Error saving materials after delete to localStorage:', e);
      }
      return updated;
    });
  };

  /**
   * 5. Khôi phục về dữ liệu mặc định ban đầu
   */
  const resetToDefault = () => {
    setMaterials(INITIAL_STUDY_MATERIALS);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_STUDY_MATERIALS));
    } catch (e) {
      console.warn('Lỗi reset LocalStorage:', e);
    }
  };

  return {
    materials,
    addMaterial,
    deleteMaterial,
    resetToDefault,
    restoreSubjectMaterials,
    deleteMaterialsBySubject,
  };
}
