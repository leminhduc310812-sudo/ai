import { useState, useEffect, useCallback } from 'react';
import { QaSeedItem, QaCategory } from '../types';
import { INITIAL_QA_SEEDS } from '../data/qaSeedLibrary';

const STORAGE_KEY = 'echolingo_qa_seeds';

export function useQaSeeds(currentSubjectId: string) {
  const [seeds, setSeeds] = useState<QaSeedItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load QA seeds from localStorage:', e);
    }
    return INITIAL_QA_SEEDS;
  });

  // Sync to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeds));
    } catch (e) {
      console.error('Failed to save QA seeds to localStorage:', e);
    }
  }, [seeds]);

  // Current Subject Seeds
  const currentSubjectSeeds = seeds.filter((s) => s.subjectId === currentSubjectId);

  // Add new seed
  const addSeed = useCallback((data: {
    subjectId: string;
    question: string;
    shortAnswer: string;
    category: QaCategory;
    categoryLabel: string;
    exampleNote?: string;
    suggestedPrompt?: string;
  }) => {
    const newItem: QaSeedItem = {
      ...data,
      id: `qa-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      isFavorite: false,
      createdAt: new Date().toISOString(),
    };
    setSeeds((prev) => [newItem, ...prev]);
    return newItem;
  }, []);

  // Toggle favorite
  const toggleFavorite = useCallback((id: string) => {
    setSeeds((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
      )
    );
  }, []);

  // Delete seed
  const deleteSeed = useCallback((id: string) => {
    setSeeds((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Reset to default
  const resetToDefault = useCallback(() => {
    setSeeds(INITIAL_QA_SEEDS);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_QA_SEEDS));
    } catch (e) {
      console.warn('Failed to reset QA seeds:', e);
    }
  }, []);

  // Lắng nghe sự kiện khôi phục snapshot để đồng bộ lại qa seeds từ localStorage
  useEffect(() => {
    const handleSync = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          setSeeds(JSON.parse(saved));
        }
      } catch (e) {
        console.warn('Lỗi đồng bộ qa seeds sau khi restore:', e);
      }
    };

    window.addEventListener('study_snapshot_restored', handleSync);
    return () => window.removeEventListener('study_snapshot_restored', handleSync);
  }, []);

  // Khôi phục / Đồng bộ câu hỏi gợi mở cho môn học (Snapshot Restore)
  const restoreSubjectSeeds = useCallback((subjectId: string, newSeeds: QaSeedItem[]) => {
    setSeeds((prev) => {
      const others = prev.filter((item) => item.subjectId !== subjectId);
      const updated = [...newSeeds, ...others];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save restored qa seeds:', e);
      }
      return updated;
    });
  }, []);

  // Xóa toàn bộ câu hỏi gợi mở của một môn học
  const deleteSeedsBySubject = useCallback((subjectId: string) => {
    setSeeds((prev) => {
      const updated = prev.filter((item) => item.subjectId !== subjectId);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save qa seeds after delete:', e);
      }
      return updated;
    });
  }, []);

  return {
    seeds,
    currentSubjectSeeds,
    addSeed,
    toggleFavorite,
    deleteSeed,
    resetToDefault,
    restoreSubjectSeeds,
    deleteSeedsBySubject,
  };
}
