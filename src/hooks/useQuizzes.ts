import { useState, useEffect, useCallback } from 'react';
import { QuizItem, QuizQuestion } from '../types';
import { INITIAL_QUIZZES } from '../data/quizLibrary';

const STORAGE_KEY = 'echolingo_quizzes';

/**
 * Hàm chuẩn hóa và kiểm tra đáp án cho từng câu hỏi chuẩn xác 100%
 * Hỗ trợ cả multiple_choice và fill_in (xử lý cả ký tự A/B/C/D, nội dung chữ, bỏ qua hoa thường & dấu câu)
 */
export function isQuestionAnswerCorrect(question: QuizQuestion, userAnswer?: string): boolean {
  if (!userAnswer || !userAnswer.trim()) return false;

  const cleanUser = userAnswer.trim();
  const cleanCorrect = question.correctAnswer.trim();

  // 1. So khớp trực tiếp không phân biệt hoa thường
  if (cleanUser.toLowerCase() === cleanCorrect.toLowerCase()) {
    return true;
  }

  const stripPrefix = (str: string) => str.replace(/^[A-D][.)\s:]+/i, '').trim();
  const normalize = (str: string) =>
    str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')
      .replace(/\s+/g, ' ')
      .toLowerCase()
      .trim();

  // 2. Trường hợp trắc nghiệm (multiple_choice)
  if (question.type === 'multiple_choice') {
    // So sánh sau khi bỏ tiền tố A., B., C., D.
    const userStripped = stripPrefix(cleanUser);
    const correctStripped = stripPrefix(cleanCorrect);
    if (userStripped && correctStripped && normalize(userStripped) === normalize(correctStripped)) {
      return true;
    }

    // Xác định chỉ số của câu trả lời người dùng (0 = A, 1 = B, 2 = C, 3 = D)
    let userIdx = -1;
    const userLetterMatch = cleanUser.match(/^([A-D])($|[.)\s:])/i);
    if (userLetterMatch) {
      userIdx = userLetterMatch[1].toUpperCase().charCodeAt(0) - 65;
    } else if (question.options) {
      userIdx = question.options.findIndex((opt) =>
        opt.toLowerCase() === cleanUser.toLowerCase() ||
        stripPrefix(opt).toLowerCase() === stripPrefix(cleanUser).toLowerCase() ||
        normalize(stripPrefix(opt)) === normalize(stripPrefix(cleanUser))
      );
    }

    // Xác định chỉ số của đáp án đúng (0 = A, 1 = B, 2 = C, 3 = D)
    let correctIdx = -1;
    const correctLetterMatch = cleanCorrect.match(/^([A-D])($|[.)\s:])/i);
    if (correctLetterMatch) {
      correctIdx = correctLetterMatch[1].toUpperCase().charCodeAt(0) - 65;
    } else if (question.options) {
      correctIdx = question.options.findIndex((opt) =>
        opt.toLowerCase() === cleanCorrect.toLowerCase() ||
        stripPrefix(opt).toLowerCase() === stripPrefix(cleanCorrect).toLowerCase() ||
        normalize(stripPrefix(opt)) === normalize(stripPrefix(cleanCorrect))
      );
    }

    if (userIdx >= 0 && correctIdx >= 0) {
      return userIdx === correctIdx;
    }

    // Fallback: so khớp chữ cái đầu nếu cả 2 đều là ký tự A-D
    const userFirst = cleanUser.charAt(0).toUpperCase();
    const correctFirst = cleanCorrect.charAt(0).toUpperCase();
    if (['A', 'B', 'C', 'D'].includes(userFirst) && ['A', 'B', 'C', 'D'].includes(correctFirst)) {
      return userFirst === correctFirst;
    }
  }

  // 3. Trường hợp điền từ hoặc so khớp chuẩn hóa
  return normalize(cleanUser) === normalize(cleanCorrect);
}

export function useQuizzes(currentSubjectId?: string) {
  const [quizzes, setQuizzes] = useState<QuizItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load quizzes from localStorage:', e);
    }
    return INITIAL_QUIZZES;
  });

  // Lưu trữ liên tục vào LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(quizzes));
    } catch (e) {
      console.error('Failed to save quizzes to localStorage:', e);
    }
  }, [quizzes]);

  // Thêm một bài quiz mới
  const addQuiz = useCallback(
    (quizData: Omit<QuizItem, 'id' | 'createdAt'>): QuizItem => {
      const newQuiz: QuizItem = {
        ...quizData,
        id: `quiz-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        createdAt: new Date().toISOString(),
      };
      setQuizzes((prev) => [newQuiz, ...prev]);
      return newQuiz;
    },
    []
  );

  // Xóa bài quiz
  const deleteQuiz = useCallback((id: string) => {
    setQuizzes((prev) => prev.filter((q) => q.id !== id));
  }, []);

  // Đặt lại các bài quiz mẫu ban đầu
  const resetToDefault = useCallback(() => {
    setQuizzes(INITIAL_QUIZZES);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_QUIZZES));
    } catch (e) {
      console.warn('Failed to reset quizzes:', e);
    }
  }, []);

  // Lắng nghe sự kiện khôi phục snapshot để đồng bộ lại quizzes từ localStorage
  useEffect(() => {
    const handleSync = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          setQuizzes(JSON.parse(saved));
        }
      } catch (e) {
        console.warn('Lỗi đồng bộ quizzes sau khi restore:', e);
      }
    };

    window.addEventListener('study_snapshot_restored', handleSync);
    return () => window.removeEventListener('study_snapshot_restored', handleSync);
  }, []);

  // Khôi phục / Đồng bộ bài quiz cho một môn học (Snapshot Restore)
  const restoreSubjectQuizzes = useCallback((subjectId: string, newQuizzes: QuizItem[]) => {
    setQuizzes((prev) => {
      const others = prev.filter((q) => q.subjectId !== subjectId);
      const updated = [...newQuizzes, ...others];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save restored quizzes:', e);
      }
      return updated;
    });
  }, []);

  // Xóa toàn bộ quiz của một môn học
  const deleteQuizzesBySubject = useCallback((subjectId: string) => {
    setQuizzes((prev) => {
      const updated = prev.filter((q) => q.subjectId !== subjectId);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save quizzes after delete:', e);
      }
      return updated;
    });
  }, []);

  // Lọc quiz theo môn học hiện tại (nếu có)
  const currentSubjectQuizzes = currentSubjectId
    ? quizzes.filter((q) => q.subjectId === currentSubjectId)
    : quizzes;

  return {
    quizzes,
    currentSubjectQuizzes,
    addQuiz,
    deleteQuiz,
    resetToDefault,
    restoreSubjectQuizzes,
    deleteQuizzesBySubject,
  };
}
