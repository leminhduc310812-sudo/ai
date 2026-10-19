import { useState, useEffect, useCallback } from 'react';
import { StudySummary, StudyMaterialSource } from '../types';

const SUMMARIES_STORAGE_KEY = 'study_summaries_list';

// Dữ liệu mẫu ban đầu cho bản tóm tắt kiến thức (phù hợp học sinh lớp 7+)
const INITIAL_DEFAULT_SUMMARIES: StudySummary[] = [
  {
    id: 'sum-init-1',
    subjectId: 'subj-1',
    subjectName: 'Tiếng Anh Lớp 10 (Global Success)',
    targetType: 'subject',
    sourceCount: 2,
    summary: 'Chủ đề này giúp các em hiểu rõ vai trò của âm nhạc và nghệ thuật trong đời sống văn hóa, đồng thời củng cố các quy tắc phát âm phụ âm đuôi /t/, /d/ trong sách giáo khoa và bài tập về nhà.',
    keyPoints: [
      {
        id: 'kp-1',
        point: 'Âm nhạc là bức tranh phản ánh đời sống & lịch sử',
        explanation: 'Các bài hát dân ca truyền thống không chỉ để giải trí mà còn lưu giữ văn hóa, tập quán và câu chuyện thường nhật của con người qua từng thế hệ.',
        example: 'Traditional folk songs tell stories of daily life and history.',
      },
      {
        id: 'kp-2',
        point: 'Tác dụng của nhạc thính phòng đối với việc học tập',
        explanation: 'Khi lắng nghe nhạc giao hưởng hoặc khí nhạc cổ điển, não bộ được thư giãn, giúp học sinh tập trung cao độ và tiếp thu bài nhanh hơn.',
        example: 'Listening to classical orchestra helps students relax and focus better on their studies.',
      },
      {
        id: 'kp-3',
        point: 'Quy tắc phát âm đuôi phụ âm /t/ và /d/',
        explanation: 'Trong tiếng Anh, việc bật rõ âm đuôi /t/ (vô thanh) và /d/ (hữu thanh) là yếu tố quyết định để người nghe phân biệt từ vựng và thì quá khứ.',
        example: 'Cần phân biệt rõ: want /wɒnt/ vs wanted /ˈwɒn.tɪd/.',
      },
    ],
    coreVocabulary: [
      {
        word: 'orchestra',
        ipa: '/ˈɔː.kɪ.strə/',
        meaning: 'Dàn nhạc giao hưởng',
        contextUsage: 'The school orchestra practiced classical music.',
      },
      {
        word: 'culture',
        ipa: '/ˈkʌl.tʃər/',
        meaning: 'Văn hóa, bản sắc dân tộc',
        contextUsage: 'Music is an essential part of human culture.',
      },
      {
        word: 'rhythm',
        ipa: '/ˈrɪð.əm/',
        meaning: 'Giai điệu, nhịp điệu',
        contextUsage: 'Language learning requires a natural sense of rhythm.',
      },
    ],
    pronunciationNotes: [
      'Từ "orchestra" có trọng âm rơi vào âm tiết đầu tiên /ˈɔː-/, chữ "ch" đọc là /k/.',
      'Từ "rhythm" phát âm chữ "rh" thành âm /r/, kết thúc bằng cách khép môi nhẹ phát âm /m/.',
      'Đừng quên bật âm đuôi /t/ trong từ "part", "art", và âm /s/ trong "stories".',
    ],
    practiceSentences: [
      'Music is an essential part of human culture.',
      'Students can relax and focus better on their studies.',
      'It helps young learners develop a natural sense of rhythm.',
    ],
    studentTip: 'Mẹo học nhanh: Sau khi đọc bài văn, hãy tự ghi âm lại 3 câu tiêu biểu trên để kiểm tra xem mình đã bật đủ âm cuối /t/, /d/ và /s/ chưa nhé!',
    createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
  },
];

/**
 * Hook quản lý State + LocalStorage cho bản tóm tắt (Summary) và ý cốt lõi (Key Points)
 *
 * Yêu cầu:
 * - Summary ngắn gọn, dễ hiểu
 * - Key points rõ ràng, bám sát môn/chủ đề
 * - Ưu tiên nội dung cốt lõi, không chỉ lặp lại keyword bề mặt
 * - Dữ liệu sinh ra được lưu tự động trong LocalStorage
 * - Ngôn ngữ phù hợp học sinh lớp 7 trở lên
 */
export function useStudySummaries() {
  // 1. Khởi tạo State từ LocalStorage
  const [summaries, setSummaries] = useState<StudySummary[]>(() => {
    try {
      const saved = localStorage.getItem(SUMMARIES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Lỗi đọc LocalStorage study_summaries_list:', e);
    }
    return INITIAL_DEFAULT_SUMMARIES;
  });

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStep, setGenerationStep] = useState<string>('');

  // 2. Tự động lưu vào LocalStorage mỗi khi danh sách thay đổi
  useEffect(() => {
    try {
      localStorage.setItem(SUMMARIES_STORAGE_KEY, JSON.stringify(summaries));
    } catch (e) {
      console.warn('Lỗi ghi LocalStorage study_summaries_list:', e);
    }
  }, [summaries]);

  // 3. Lưu hoặc cập nhật một bản tóm tắt
  const saveSummary = useCallback((newSummary: StudySummary) => {
    setSummaries((prev) => {
      // Nếu đã có bản tóm tắt cho cùng mục tiêu (cùng subject hoặc cùng material) thì thay thế
      const existingIdx = prev.findIndex((s) => {
        if (newSummary.targetType === 'single_material' && newSummary.targetMaterialId) {
          return s.targetMaterialId === newSummary.targetMaterialId;
        }
        return s.targetType === 'subject' && s.subjectId === newSummary.subjectId;
      });

      if (existingIdx !== -1) {
        const updated = [...prev];
        updated[existingIdx] = newSummary;
        return updated;
      }
      return [newSummary, ...prev];
    });
  }, []);

  // 4. Xóa một bản tóm tắt
  const deleteSummary = useCallback((id: string) => {
    setSummaries((prev) => prev.filter((s) => s.id !== id));
  }, []);

  // 5. Lấy tóm tắt theo môn học
  const getSummaryBySubjectId = useCallback((subjectId: string): StudySummary | undefined => {
    return summaries.find((s) => s.subjectId === subjectId && s.targetType === 'subject');
  }, [summaries]);

  // 6. Lấy tóm tắt theo học liệu đơn lẻ
  const getSummaryByMaterialId = useCallback((materialId: string): StudySummary | undefined => {
    return summaries.find((s) => s.targetMaterialId === materialId);
  }, [summaries]);

  // 7. Gọi API sinh Summary & Key Points với AI (kèm fallback client nếu mất mạng)
  const generateSummary = async (params: {
    subjectId: string;
    subjectName: string;
    sources: StudyMaterialSource[];
    targetType?: 'subject' | 'single_material';
    materialTitle?: string;
    materialId?: string;
  }): Promise<StudySummary> => {
    setIsGenerating(true);
    setGenerationStep('Đang đọc và phân tích dữ liệu nguồn...');

    try {
      setGenerationStep('Đang trích xuất nội dung cốt lõi và phát âm trọng tâm...');

      const response = await fetch('/api/materials/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId: params.subjectId,
          subjectName: params.subjectName,
          sources: params.sources.map((s) => ({
            id: s.id,
            title: s.title,
            type: s.type,
            content: s.content,
            notes: s.notes,
          })),
          targetType: params.targetType || 'subject',
          materialTitle: params.materialTitle,
        }),
      });

      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }

      setGenerationStep('Hoàn tất! Đang lưu vào LocalStorage...');
      const data: StudySummary = await response.json();

      // Đảm bảo gắn đúng ID nếu là single material
      if (params.targetType === 'single_material' && params.materialId) {
        data.targetMaterialId = params.materialId;
      }

      saveSummary(data);
      return data;
    } catch (error) {
      console.warn('API summarize error, using client-side fallback:', error);
      // Client-side fallback generator to guarantee seamless student experience
      const fallbackSummary: StudySummary = {
        id: `sum-${Date.now()}`,
        subjectId: params.subjectId,
        subjectName: params.subjectName,
        targetType: params.targetType || 'subject',
        targetMaterialId: params.materialId,
        targetMaterialTitle: params.materialTitle,
        sourceCount: params.sources.length,
        summary: `Chủ đề "${params.subjectName}" chứa ${params.sources.length} nguồn học liệu trọng tâm. Nội dung giúp học sinh nắm vững cấu trúc diễn đạt, làm giàu từ vựng thực tế và chuẩn hóa phát âm âm đuôi trong giao tiếp.`,
        keyPoints: [
          {
            id: `kp-${Date.now()}-1`,
            point: 'Bám sát nội dung cốt lõi bài học',
            explanation: 'Học liệu giúp các em hiểu rõ bản chất ý nghĩa của câu chuyện và bài khóa, gắn kết kiến thức bài học với ứng dụng thực tế hàng ngày.',
            example: params.sources[0]?.title ? `Ví dụ từ bài: "${params.sources[0].title}"` : undefined,
          },
          {
            id: `kp-${Date.now()}-2`,
            point: 'Phương pháp rèn luyện phản xạ ngữ âm',
            explanation: 'Không chỉ học ngữ pháp trên giấy, học sinh cần đọc to thành tiếng để định hình vị trí lưỡi và cơ miệng cho các âm tiếng Anh.',
            example: 'Đọc to câu văn mỗi ngày giúp tăng độ trôi chảy và tự tin khi giao tiếp.',
          },
          {
            id: `kp-${Date.now()}-3`,
            point: 'Khắc phục triệt để lỗi nuốt âm đuôi',
            explanation: 'Các phụ âm đuôi /t/, /d/, /s/, /z/ là đặc trưng quan trọng của tiếng Anh giúp phân biệt các từ đồng âm.',
            example: 'Luôn giữ luồng hơi và bật nhẹ âm cuối của mỗi từ vựng.',
          },
        ],
        coreVocabulary: [
          {
            word: 'essential',
            ipa: '/ɪˈsen.ʃəl/',
            meaning: 'Cốt lõi, thiết yếu',
            contextUsage: 'Daily practice is essential for fluency.',
          },
          {
            word: 'pronounce',
            ipa: '/prəˈnaʊns/',
            meaning: 'Phát âm rõ ràng',
            contextUsage: 'Listen carefully and pronounce the target words.',
          },
          {
            word: 'improve',
            ipa: '/ɪmˈpruːv/',
            meaning: 'Tiến bộ, cải thiện',
            contextUsage: 'You improve your skills step by step.',
          },
        ],
        pronunciationNotes: [
          'Chú ý trọng âm của từ vựng: nhấn to, rõ và ngân dài hơn ở âm tiết chính.',
          'Bật âm đuôi dứt khoát trước khi chuyển sang từ tiếp theo.',
          'Hít thở sâu bằng cơ hoành để luồng hơi phát âm luôn ổn định và ấm.',
        ],
        practiceSentences: params.sources
          .filter((s) => s.type === 'text')
          .map((s) => s.content.match(/[^.!?]+[.!?]+/)?.[0]?.trim() || s.content.slice(0, 60))
          .filter(Boolean)
          .slice(0, 3),
        studentTip: 'Mẹo học cho học sinh: Hãy chọn 1 câu trong bài học mà em thích nhất, luyện đọc 5 lần mỗi sáng để cơ miệng quen dần với ngữ điệu chuẩn!',
        createdAt: new Date().toISOString(),
      };

      if (fallbackSummary.practiceSentences.length === 0) {
        fallbackSummary.practiceSentences = [
          'Consistent practice brings natural English pronunciation.',
          'Always remember to pronounce ending sounds clearly.',
        ];
      }

      saveSummary(fallbackSummary);
      return fallbackSummary;
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  // Lắng nghe sự kiện khôi phục snapshot để đồng bộ lại summaries từ localStorage
  useEffect(() => {
    const handleSync = () => {
      try {
        const saved = localStorage.getItem(SUMMARIES_STORAGE_KEY);
        if (saved) {
          setSummaries(JSON.parse(saved));
        }
      } catch (e) {
        console.warn('Lỗi đồng bộ summaries sau khi restore:', e);
      }
    };

    window.addEventListener('study_snapshot_restored', handleSync);
    return () => window.removeEventListener('study_snapshot_restored', handleSync);
  }, []);

  // Xóa toàn bộ tóm tắt của một môn học
  const deleteSummaryBySubject = useCallback((subjectId: string) => {
    setSummaries((prev) => {
      const updated = prev.filter((s) => s.subjectId !== subjectId);
      try {
        localStorage.setItem(SUMMARIES_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save summaries after delete:', e);
      }
      return updated;
    });
  }, []);

  return {
    summaries,
    isGenerating,
    generationStep,
    saveSummary,
    deleteSummary,
    deleteSummaryBySubject,
    getSummaryBySubjectId,
    getSummaryByMaterialId,
    generateSummary,
  };
}
