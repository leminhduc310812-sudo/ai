export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export type CategoryKey = 
  | 'ending_sounds'
  | 'minimal_pairs'
  | 'word_stress'
  | 'connected_speech'
  | 'business_daily';

export interface PracticeItem {
  id: string;
  category: CategoryKey;
  level: DifficultyLevel;
  text: string;
  ipa: string;
  translation: string;
  focusSound: string;
  tip: string;
  exampleSentence?: string;
}

export interface PhonemeAnalysis {
  phoneme: string;
  soundType: string;
  accuracy: number; // 0 - 100
  status: 'excellent' | 'good' | 'needs_work';
  feedback: string;
}

export interface AiEvaluationResult {
  targetText: string;
  overallScore: number;
  accuracyScore: number;
  stressScore: number;
  fluencyScore: number;
  clarityAssessment: string;
  phonemeBreakdown: PhonemeAnalysis[];
  detectedErrors: string[];
  mouthPositionAdvice: {
    tongue: string;
    lips: string;
    airflow: string;
  };
  personalizedDrill: {
    title: string;
    exerciseText: string;
    exerciseIpa: string;
    practiceReason: string;
  };
  coachNote: string;
  evaluatedAt: string;
}

export interface UserPracticeHistoryItem {
  id: string;
  itemId?: string;
  targetText: string;
  ipa: string;
  overallScore: number;
  accuracyScore: number;
  stressScore: number;
  weakPoints: string[];
  timestamp: string;
}

export interface PracticeGoal {
  dailyTarget: number; // e.g. 5 sentences/words per day
  minTargetScore: number; // e.g. 80% accuracy
  focusPhoneme: string; // e.g. '/θ/' or 'Âm đuôi /t/, /s/'
  customNotes?: string;
}

export type SourceType = 'text' | 'image' | 'url';

export interface StudySubject {
  id: string;
  name: string;
  gradeLevel?: string;
  icon?: string;
  color?: string;
  description?: string;
}

export interface KeyPointItem {
  id: string;
  point: string;
  explanation: string;
  example?: string;
}

export interface VocabularyHighlight {
  word: string;
  ipa: string;
  meaning: string;
  contextUsage?: string;
}

export interface StudySummary {
  id: string;
  subjectId: string;
  subjectName: string;
  targetType: 'subject' | 'single_material';
  targetMaterialId?: string;
  targetMaterialTitle?: string;
  sourceCount: number;
  summary: string;
  keyPoints: KeyPointItem[];
  coreVocabulary: VocabularyHighlight[];
  pronunciationNotes: string[];
  practiceSentences: string[];
  studentTip: string;
  createdAt: string;
}

export interface StudyMaterialSource {
  // 4 trường dữ liệu cốt lõi (Phạm vi Buổi 2)
  id: string;              // Mã định danh duy nhất của nguồn học liệu
  type: SourceType;        // Loại nguồn: 'text' | 'image' | 'url'
  title: string;           // Tiêu đề ngắn của học liệu
  content: string;         // Nội dung văn bản hoặc liên kết URL

  // Thuộc tính bổ trợ & ngữ cảnh học tập
  subjectId?: string;      // ID môn học liên kết
  subjectName?: string;    // Tên môn học
  imageUrl?: string;       // URL ảnh (nếu là dạng ảnh chụp sách)
  notes?: string;          // Ghi chú thêm
  wordCount?: number;      // Số lượng từ (nếu là dạng văn bản)
  createdAt?: string;      // Thời gian tạo
  tags?: string[];
  summaryId?: string;      // ID bản tóm tắt liên kết (nếu có)
}

// 5 nhóm nội dung trọng tâm cho thẻ ghi nhớ (Phù hợp nhiều môn học & ôn tập nhanh)
export type FlashcardCategory =
  | 'khai_niem'    // Khái niệm (Concept / Idea)
  | 'dinh_nghia'   // Định nghĩa (Definition / Meaning)
  | 'vi_du'        // Ví dụ (Example / Application)
  | 'phan_biet'    // Phân biệt (Distinction / Comparison)
  | 'quy_tac';     // Quy tắc / Lưu ý (Rule / Important Note)

export interface FlashcardItem {
  id: string;
  front: string;               // Mặt trước thẻ (Thuật ngữ, câu hỏi, tình huống, bài toán...)
  back: string;                // Mặt sau thẻ (Giải thích, định nghĩa, kết quả, lời giải...)
  category: FlashcardCategory; // 1 trong 5 nhóm ưu tiên
  subjectId: string;           // ID môn học
  subjectName: string;         // Tên môn học
  sourceMaterialId?: string;   // ID nguồn học liệu tạo ra thẻ (nếu có)
  sourceTitle?: string;        // Tiêu đề học liệu nguồn
  notes?: string;              // Mẹo ghi nhớ / Lưu ý thêm cho học sinh
  exampleSentence?: string;    // Câu ví dụ hoặc ngữ cảnh thực tế
  mastered: boolean;           // Trạng thái: Đã thuộc (true) / Cần ôn lại (false)
  reviewCount: number;         // Số lần đã ôn tập thẻ này
  lastReviewedAt?: string;     // Thời điểm ôn tập gần nhất
  createdAt: string;
}

export interface FlashcardCategoryMeta {
  key: FlashcardCategory;
  label: string;
  shortLabel: string;
  description: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  iconName: string;
}

export interface FlashcardGenerationRequest {
  subjectId: string;
  subjectName: string;
  topicTitle?: string;
  sourceContent?: string;
  sourceMaterialId?: string;
  count?: number;
}

// Q&A SEED: Danh sách câu hỏi gợi mở & câu trả lời ngắn ban đầu (Chuẩn bị cho Chatbot ôn bài ở buổi sau)
export type QaCategory = 'ngu_am' | 'ngu_phap' | 'tu_vung' | 'meo_ghi_nho' | 'van_dung';

export interface QaSeedItem {
  id: string;
  subjectId: string;
  question: string;         // Câu hỏi gợi mở / câu hỏi thực tế học sinh thường hỏi
  shortAnswer: string;      // Câu trả lời ngắn gọn, chuẩn xác, dễ hiểu cho học sinh lớp 7+
  category: QaCategory;     // Phân loại: Ngữ âm, Ngữ pháp, Từ vựng, Mẹo học, Vận dụng
  categoryLabel: string;    // Nhãn tiếng Việt hiển thị
  exampleNote?: string;     // Ví dụ hoặc lưu ý bổ trợ
  suggestedPrompt?: string; // Câu hỏi mẫu để gửi cho chatbot sau này
  isFavorite?: boolean;     // Đánh dấu câu hỏi tâm đắc
  createdAt?: string;
}

// QUIZ MODE TYPES
export type QuestionType = 'multiple_choice' | 'fill_in';

export interface QuizQuestion {
  id: string;                      // Mã định danh câu hỏi
  type: QuestionType;              // Loại câu hỏi: trắc nghiệm (multiple_choice) hoặc điền từ (fill_in)
  question: string;                // Nội dung câu hỏi hiển thị rõ ràng
  options?: string[];              // Danh sách các lựa chọn (cho câu trắc nghiệm)
  correctAnswer: string;           // Đáp án chính xác (index chữ A, B, C, D hoặc từ cần điền)
  explanation: string;             // Phản hồi / Lời giải thích ngắn gọn, dễ hiểu
  hint?: string;                   // Gợi ý cho học sinh nếu cần
  reviewTip?: string;              // Gợi ý ngắn để ôn lại kiến thức khi tự học
}

export interface QuizItem {
  id: string;                      // Mã bộ quiz
  subjectId: string;               // ID môn học liên kết
  subjectName: string;             // Tên môn học
  title: string;                   // Tiêu đề bài quiz (ví dụ: Ôn tập Unit 3, Trắc nghiệm âm đuôi)
  description: string;             // Mô tả ngắn bài quiz
  gradeLevel?: string;             // Khối lớp (ví dụ: Lớp 10, THCS...)
  questions: QuizQuestion[];       // Danh sách câu hỏi
  createdAt: string;               // Thời gian tạo
  updatedAt?: string;
}

export interface QuizUserAnswer {
  questionId: string;
  answer: string;
  isChecked?: boolean;
  isCorrect?: boolean;
}

// GROUNDED CHATBOT TYPES
export interface GroundedContextPayload {
  subjectId: string;
  subjectName: string;
  sources: Array<{
    id: string;
    title: string;
    content: string;
    notes?: string;
    tags?: string[];
  }>;
  analysisPreview?: {
    summary: string;
    keyPoints: Array<{ point: string; explanation: string; example?: string }>;
    coreVocabulary: Array<{ word: string; ipa: string; meaning: string; contextUsage?: string }>;
    pronunciationNotes?: string[];
    practiceSentences?: string[];
    studentTip?: string;
  } | null;
  studyPack: {
    flashcards: Array<{
      front: string;
      back: string;
      category: string;
      notes?: string;
      exampleSentence?: string;
    }>;
    qaSeeds: Array<{
      question: string;
      shortAnswer: string;
      categoryLabel: string;
      exampleNote?: string;
    }>;
    quizQuestions?: Array<{
      question: string;
      correctAnswer: string;
      explanation: string;
      reviewTip?: string;
    }>;
  };
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  isGrounded?: boolean;
  isOutOfScope?: boolean;
  groundedSourceTags?: string[];
}

// SNAPSHOT WORKING COPY TYPES (Save / Load cho Môn học hoặc Bộ ôn tập)
export interface SubjectSnapshot {
  id: string;                      // Mã định danh snapshot
  title: string;                   // Tên hiển thị của snapshot (có thể đổi tên ngắn)
  savedAt: string;                 // Thời gian lưu snapshot
  version: string;                 // Phiên bản dữ liệu (vd: '1.0')
  subject: StudySubject;           // Thông tin môn học
  sources: StudyMaterialSource[];  // Toàn bộ học liệu nguồn của môn
  analysisPreview: StudySummary | null; // Bản phân tích tóm tắt
  studyPack: {
    flashcards: FlashcardItem[];   // Thẻ flashcard của môn
    qaSeeds: QaSeedItem[];         // Câu hỏi gợi mở Q&A
    quizzes: QuizItem[];           // Bài kiểm tra quiz
  };
  metadata: {
    sourceCount: number;
    flashcardCount: number;
    qaSeedCount: number;
    quizCount: number;
    description?: string;
    note?: string;
    versionNumber?: number;
    isRegenerated?: boolean;
    regeneratedAt?: string;
    generatorModel?: string;
  };
}





