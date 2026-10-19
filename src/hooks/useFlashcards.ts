import { useState, useEffect, useCallback } from 'react';
import { FlashcardItem, FlashcardGenerationRequest, FlashcardCategory } from '../types';
import { INITIAL_FLASHCARDS } from '../data/flashcardLibrary';

const STORAGE_KEY = 'echolingo_flashcards';

export function useFlashcards() {
  const [cards, setCards] = useState<FlashcardItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load flashcards from localStorage:', e);
    }
    return INITIAL_FLASHCARDS;
  });

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Lưu trữ liên tục vào LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
    } catch (e) {
      console.error('Failed to save flashcards to localStorage:', e);
    }
  }, [cards]);

  // Thêm một thẻ mới
  const addCard = useCallback((cardData: {
    front: string;
    back: string;
    category: FlashcardCategory;
    subjectId: string;
    subjectName: string;
    sourceMaterialId?: string;
    sourceTitle?: string;
    notes?: string;
    exampleSentence?: string;
  }): FlashcardItem => {
    const newCard: FlashcardItem = {
      ...cardData,
      id: `fc-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      mastered: false,
      reviewCount: 0,
      createdAt: new Date().toISOString(),
    };

    setCards((prev) => [newCard, ...prev]);
    return newCard;
  }, []);

  // Thêm hàng loạt thẻ (từ AI hoặc nguồn học liệu)
  const addBatchCards = useCallback((newCardsData: Array<{
    front: string;
    back: string;
    category: FlashcardCategory;
    subjectId: string;
    subjectName: string;
    sourceMaterialId?: string;
    sourceTitle?: string;
    notes?: string;
    exampleSentence?: string;
  }>): FlashcardItem[] => {
    const createdItems: FlashcardItem[] = newCardsData.map((data, index) => ({
      ...data,
      id: `fc-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 6)}`,
      mastered: false,
      reviewCount: 0,
      createdAt: new Date().toISOString(),
    }));

    setCards((prev) => [...createdItems, ...prev]);
    return createdItems;
  }, []);

  // Cập nhật thông tin thẻ
  const updateCard = useCallback((id: string, updates: Partial<FlashcardItem>) => {
    setCards((prev) =>
      prev.map((card) => (card.id === id ? { ...card, ...updates } : card))
    );
  }, []);

  // Xóa thẻ
  const deleteCard = useCallback((id: string) => {
    setCards((prev) => prev.filter((card) => card.id !== id));
  }, []);

  // Đổi trạng thái đã thuộc / cần ôn lại
  const toggleMastered = useCallback((id: string) => {
    setCards((prev) =>
      prev.map((card) =>
        card.id === id
          ? {
              ...card,
              mastered: !card.mastered,
              reviewCount: (card.reviewCount || 0) + 1,
              lastReviewedAt: new Date().toISOString(),
            }
          : card
      )
    );
  }, []);

  // Ghi nhận ôn tập thẻ
  const recordReview = useCallback((id: string, isMastered: boolean) => {
    setCards((prev) =>
      prev.map((card) =>
        card.id === id
          ? {
              ...card,
              mastered: isMastered,
              reviewCount: (card.reviewCount || 0) + 1,
              lastReviewedAt: new Date().toISOString(),
            }
          : card
      )
    );
  }, []);

  // Đặt lại dữ liệu mẫu ban đầu
  const resetToDefault = useCallback(() => {
    setCards(INITIAL_FLASHCARDS);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_FLASHCARDS));
    } catch (e) {
      console.warn('Failed to reset flashcards:', e);
    }
  }, []);

  // Xóa tất cả thẻ
  const clearAll = useCallback(() => {
    setCards([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear flashcards:', e);
    }
  }, []);

  // Tạo flashcard tự động bằng AI từ nguồn học liệu hoặc chủ đề
  const generateAiFlashcards = useCallback(
    async (request: FlashcardGenerationRequest): Promise<FlashcardItem[]> => {
      setIsGenerating(true);
      setGenerationError(null);

      try {
        const response = await fetch('/api/flashcards/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
        });

        if (!response.ok) {
          throw new Error(`Server returned error: ${response.status}`);
        }

        const data = await response.json();
        const generatedCards = Array.isArray(data.cards) ? data.cards : [];

        if (generatedCards.length > 0) {
          const added = addBatchCards(
            generatedCards.map((c: any) => ({
              front: c.front || '',
              back: c.back || '',
              category: (c.category as FlashcardCategory) || 'khai_niem',
              subjectId: request.subjectId,
              subjectName: request.subjectName,
              sourceMaterialId: request.sourceMaterialId,
              sourceTitle: request.topicTitle,
              notes: c.notes || '',
              exampleSentence: c.exampleSentence || '',
            }))
          );
          setIsGenerating(false);
          return added;
        } else {
          throw new Error('Không nhận được dữ liệu thẻ từ AI');
        }
      } catch (err: any) {
        console.warn('AI generation error, creating intelligent local cards:', err);
        // Fallback tạo cục bộ nếu mạng yếu hoặc server chưa cấu hình API key
        const fallbackCards = createLocalFallbackCards(request);
        const added = addBatchCards(fallbackCards);
        setIsGenerating(false);
        return added;
      }
    },
    [addBatchCards]
  );

  // Lắng nghe sự kiện khôi phục snapshot để đồng bộ lại cards từ localStorage
  useEffect(() => {
    const handleSync = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          setCards(JSON.parse(saved));
        }
      } catch (e) {
        console.warn('Lỗi đồng bộ flashcards sau khi restore:', e);
      }
    };

    window.addEventListener('study_snapshot_restored', handleSync);
    return () => window.removeEventListener('study_snapshot_restored', handleSync);
  }, []);

  // Khôi phục / Đồng bộ hóa flashcards cho một môn học (Snapshot Restore)
  const restoreSubjectFlashcards = useCallback((subjectId: string, newCards: FlashcardItem[]) => {
    setCards((prev) => {
      const others = prev.filter((c) => c.subjectId !== subjectId);
      const updated = [...newCards, ...others];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save restored flashcards:', e);
      }
      return updated;
    });
  }, []);

  // Xóa toàn bộ flashcard của một môn học
  const deleteFlashcardsBySubject = useCallback((subjectId: string) => {
    setCards((prev) => {
      const updated = prev.filter((c) => c.subjectId !== subjectId);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save flashcards after delete:', e);
      }
      return updated;
    });
  }, []);

  return {
    cards,
    isGenerating,
    generationError,
    addCard,
    addBatchCards,
    updateCard,
    deleteCard,
    toggleMastered,
    recordReview,
    resetToDefault,
    clearAll,
    generateAiFlashcards,
    restoreSubjectFlashcards,
    deleteFlashcardsBySubject,
  };
}

// Fallback thông minh cục bộ khi offline hoặc chưa có API key
function createLocalFallbackCards(request: FlashcardGenerationRequest) {
  const content = request.sourceContent || request.topicTitle || 'Bài học';
  const subjectName = request.subjectName || 'Học tập';

  return [
    {
      front: `[Khái niệm cốt lõi] ${request.topicTitle || 'Kiến thức trọng tâm'}`,
      back: `Nội dung then chốt của bài học: "${content.slice(0, 140)}...". Nắm vững bản chất giúp áp dụng giải quyết bài tập nhanh chóng.`,
      category: 'khai_niem' as FlashcardCategory,
      subjectId: request.subjectId,
      subjectName,
      sourceMaterialId: request.sourceMaterialId,
      sourceTitle: request.topicTitle,
      notes: 'Đọc kỹ từ khóa chính trước khi giải thích',
    },
    {
      front: `[Định nghĩa thuật ngữ] Ý nghĩa của thuật ngữ trong "${request.topicTitle || subjectName}"`,
      back: `Định nghĩa rõ ràng, súc tích: Diễn giải chính xác phạm vi, thuộc tính cơ bản của đối tượng được nhắc đến trong bài học.`,
      category: 'dinh_nghia' as FlashcardCategory,
      subjectId: request.subjectId,
      subjectName,
      sourceMaterialId: request.sourceMaterialId,
      sourceTitle: request.topicTitle,
      notes: 'Học sinh từ lớp 7 cần phân biệt định nghĩa với mô tả thông thường',
    },
    {
      front: `[Ví dụ thực hành] Đặt câu hoặc tình huống vận dụng cho "${request.topicTitle || subjectName}"`,
      back: `Ví dụ tiêu biểu: Áp dụng kiến thức vào thực tế để ghi nhớ sâu sắc và không bị học vẹt.`,
      category: 'vi_du' as FlashcardCategory,
      subjectId: request.subjectId,
      subjectName,
      sourceMaterialId: request.sourceMaterialId,
      sourceTitle: request.topicTitle,
      exampleSentence: 'Ví dụ minh họa thực tiễn giúp liên hệ bài học vào cuộc sống.',
    },
    {
      front: `[Phân biệt & So sánh] Điểm dễ nhầm lẫn trong "${request.topicTitle || subjectName}" là gì?`,
      back: `Lưu ý so sánh: Chú ý sự khác biệt giữa các khái niệm có vẻ tương đồng để tránh mất điểm đáng tiếc trong bài kiểm tra.`,
      category: 'phan_biet' as FlashcardCategory,
      subjectId: request.subjectId,
      subjectName,
      sourceMaterialId: request.sourceMaterialId,
      sourceTitle: request.topicTitle,
      notes: 'Lập bảng đối chiếu 2 cột để dễ nhớ',
    },
    {
      front: `[Quy tắc / Lưu ý] Ghi nhớ quan trọng khi làm bài hoặc áp dụng "${request.topicTitle || subjectName}"`,
      back: `Quy tắc vàng: Luôn kiểm tra điều kiện áp dụng, các trường hợp ngoại lệ và các bước thực hiện tuần tự.`,
      category: 'quy_tac' as FlashcardCategory,
      subjectId: request.subjectId,
      subjectName,
      sourceMaterialId: request.sourceMaterialId,
      sourceTitle: request.topicTitle,
      notes: 'Ghi chú vào sổ tay học tập để ôn lại trước kỳ thi',
    },
  ];
}
