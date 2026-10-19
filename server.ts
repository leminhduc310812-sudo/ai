import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '15mb' }));

let aiClient: GoogleGenAI | null = null;

function getGenAI(customApiKey?: string): GoogleGenAI | null {
  const apiKey = (customApiKey && typeof customApiKey === 'string' && customApiKey.trim())
    ? customApiKey.trim()
    : process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return null;
  }

  // If a custom local-only key is provided, instantiate fresh client
  if (customApiKey && customApiKey.trim()) {
    return new GoogleGenAI({
      apiKey: customApiKey.trim(),
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', app: 'EchoLingo AI', version: '0.1.0' });
});

// AI Pronunciation Assessment Endpoint
app.post('/api/pronunciation/evaluate', async (req: Request, res: Response) => {
  try {
    const {
      targetText,
      targetIpa,
      userTranscript,
      audioBase64,
      audioMimeType = 'audio/webm',
      difficultyLevel = 'intermediate',
      focusArea,
    } = req.body;

    if (!targetText) {
      return res.status(400).json({ error: 'targetText is required' });
    }

    const ai = getGenAI();

    // If Gemini API is not configured yet or fails, provide an intelligent deterministic assessment
    if (!ai) {
      return res.json(createFallbackEvaluation(targetText, targetIpa, userTranscript));
    }

    const systemPrompt = `You are an expert English Phonetics & Pronunciation Coach in EchoLingo AI, specializing in helping non-native learners (particularly Vietnamese speakers who frequently encounter difficulties with ending consonants, word stress, vowel distinctions, and consonant clusters).

Evaluate the user's spoken attempt against the target English text and IPA.
Target English text: "${targetText}"
Target IPA: "${targetIpa || 'auto-infer'}"
Transcribed speech from user: "${userTranscript || 'User audio provided'}"
Difficulty level: "${difficultyLevel}"
Focus area: "${focusArea || 'General Pronunciation'}"

Carefully analyze:
1. Overall accuracy score (0-100)
2. Syllable & phoneme accuracy: break down key sound segments (vowels, ending consonants, stress)
3. Specific detected errors (e.g. dropped ending /t/ or /s/, /θ/ sounded like /t/ or /s/, misplaced stress)
4. Mouth, tongue, and airflow positioning advice explained clearly in Vietnamese so the user can physically execute the correction.
5. A personalized next micro-drill (a targeted phrase or word to fix the exact mistake detected).
6. Encouraging coach note in friendly Vietnamese.`;

    // Build multimodal or text prompt
    const contents: any[] = [];
    if (audioBase64) {
      contents.push({
        inlineData: {
          mimeType: audioMimeType,
          data: audioBase64,
        },
      });
    }
    contents.push({
      text: `Please evaluate this pronunciation attempt.\nTarget: ${targetText}\nUser Speech Transcript: ${userTranscript || 'Audio input'}\nProvide detailed actionable assessment in JSON.`,
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: contents.length === 1 ? contents[0].text : { parts: contents },
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallScore: { type: Type.INTEGER, description: 'Overall score from 0 to 100' },
            accuracyScore: { type: Type.INTEGER, description: 'Sound precision score from 0 to 100' },
            stressScore: { type: Type.INTEGER, description: 'Stress and rhythm score from 0 to 100' },
            fluencyScore: { type: Type.INTEGER, description: 'Flow and tempo score from 0 to 100' },
            clarityAssessment: { type: Type.STRING, description: 'Concise summary of speech clarity in Vietnamese' },
            phonemeBreakdown: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  phoneme: { type: Type.STRING },
                  soundType: { type: Type.STRING },
                  accuracy: { type: Type.INTEGER },
                  status: { type: Type.STRING, description: 'excellent, good, or needs_work' },
                  feedback: { type: Type.STRING },
                },
                required: ['phoneme', 'soundType', 'accuracy', 'status', 'feedback'],
              },
            },
            detectedErrors: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of specific phonetic mistakes detected in Vietnamese',
            },
            mouthPositionAdvice: {
              type: Type.OBJECT,
              properties: {
                tongue: { type: Type.STRING, description: 'Vị trí lưỡi' },
                lips: { type: Type.STRING, description: 'Khẩu hình môi' },
                airflow: { type: Type.STRING, description: 'Cách lấy hơi và bật luồng khí' },
              },
              required: ['tongue', 'lips', 'airflow'],
            },
            personalizedDrill: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                exerciseText: { type: Type.STRING },
                exerciseIpa: { type: Type.STRING },
                practiceReason: { type: Type.STRING },
              },
              required: ['title', 'exerciseText', 'exerciseIpa', 'practiceReason'],
            },
            coachNote: { type: Type.STRING, description: 'Lời động viên và lời khuyên từ AI Coach bằng tiếng Việt' },
          },
          required: [
            'overallScore',
            'accuracyScore',
            'stressScore',
            'fluencyScore',
            'clarityAssessment',
            'phonemeBreakdown',
            'detectedErrors',
            'mouthPositionAdvice',
            'personalizedDrill',
            'coachNote',
          ],
        },
      },
    });

    const textOutput = response.text?.trim();
    if (!textOutput) {
      throw new Error('Empty response from Gemini model');
    }

    const parsed = JSON.parse(textOutput);
    return res.json({
      targetText,
      ...parsed,
      evaluatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error evaluating pronunciation:', error);
    // Return structured graceful fallback with feedback
    const fallback = createFallbackEvaluation(
      req.body.targetText || 'Practice',
      req.body.targetIpa || '',
      req.body.userTranscript
    );
    return res.json(fallback);
  }
});

// AI Summarization & Core Key Points Extraction Endpoint
app.post('/api/materials/summarize', async (req: Request, res: Response) => {
  try {
    const {
      subjectId = 'subj-1',
      subjectName = 'Tiếng Anh',
      sources = [],
      targetType = 'subject',
      materialTitle,
    } = req.body;

    if (!sources || sources.length === 0) {
      return res.status(400).json({ error: 'At least one source is required to generate a summary' });
    }

    const ai = getGenAI();

    // If Gemini API is not configured yet or fails, provide intelligent deterministic summary
    if (!ai) {
      const fallback = createFallbackSummary(subjectId, subjectName, sources, targetType, materialTitle);
      return res.json(fallback);
    }

    // Format content from sources
    const sourcesContext = sources
      .map((s: any, idx: number) => {
        return `[Nguồn ${idx + 1}] (${s.type === 'text' ? 'Văn bản' : s.type === 'image' ? 'Ảnh sách' : 'Liên kết web'}) - Tiêu đề: "${s.title}"\nNội dung: ${s.content}${s.notes ? `\nGhi chú: ${s.notes}` : ''}`;
      })
      .join('\n\n');

    const promptText = `Chủ đề/Môn học: "${subjectName}"\nPhạm vi tóm tắt: ${
      targetType === 'single_material' ? `Học liệu cụ thể: "${materialTitle || 'Bài học'}"` : `Toàn bộ nguồn học liệu của chủ đề "${subjectName}"`
    }\n\nDanh sách dữ liệu nguồn đã có:\n${sourcesContext}\n\nHãy phân tích và tạo bản tóm tắt súc tích kèm key points cốt lõi phù hợp với học sinh từ lớp 7 trở lên.`;

    const systemPrompt = `Bạn là Cố Vấn Học Tập Tiếng Anh chuyên sâu trong ứng dụng EchoLingo AI, hướng dẫn cho học sinh từ lớp 7 trở lên (THCS và THPT).
Nhiệm vụ của bạn là phân tích các nguồn học liệu được cung cấp (thuộc môn/chủ đề tiếng Anh) để tạo ra bản tóm tắt và các điểm then chốt cốt lõi:
1. Summary: Ngắn gọn (2-3 câu), diễn đạt tự nhiên, dễ hiểu cho học sinh lớp 7 trở lên, nắm trọn thông điệp chính và giá trị của bài học.
2. Key Points: 3-5 ý cốt lõi quan trọng. TUYỆT ĐỐI không chỉ lặp lại keyword bề mặt; mỗi ý phải giải thích bản chất kiến thức, cách dùng thực tế hoặc hàm ý bài học.
3. Core Vocabulary: 3-5 từ hoặc cụm từ đắt giá nhất trong bài kèm phiên âm IPA chuẩn xác và giải nghĩa thực tế.
4. Pronunciation Notes: 2-3 lưu ý phát âm đặc biệt (ví dụ âm đuôi /t/, /d/, /s/, /z/, trọng âm, nối âm) bám sát nội dung bài học.
5. Practice Sentences: 2-3 câu tiếng Anh ngắn gọn, chuẩn mực để học sinh luyện nói và rèn phát âm ngay.
6. Student Tip: Lời khuyên học tập, mẹo ghi nhớ gần gũi, khích lệ học sinh.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptText,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: 'Tóm tắt ngắn gọn 2-3 câu, diễn đạt dễ hiểu cho học sinh lớp 7 trở lên',
            },
            keyPoints: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  point: { type: Type.STRING, description: 'Tiêu đề ý chính cốt lõi' },
                  explanation: { type: Type.STRING, description: 'Diễn giải bản chất, ý nghĩa hoặc cách ứng dụng thực tế' },
                  example: { type: Type.STRING, description: 'Ví dụ hoặc mẫu câu minh họa' },
                },
                required: ['point', 'explanation'],
              },
            },
            coreVocabulary: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING },
                  ipa: { type: Type.STRING },
                  meaning: { type: Type.STRING },
                  contextUsage: { type: Type.STRING },
                },
                required: ['word', 'ipa', 'meaning'],
              },
            },
            pronunciationNotes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '2-3 lưu ý ngữ âm, âm đuôi hoặc trọng âm cần nhớ',
            },
            practiceSentences: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '2-3 câu tiếng Anh tiêu biểu để luyện phát âm',
            },
            studentTip: {
              type: Type.STRING,
              description: 'Mẹo học tập và ghi nhớ dành cho học sinh',
            },
          },
          required: [
            'summary',
            'keyPoints',
            'coreVocabulary',
            'pronunciationNotes',
            'practiceSentences',
            'studentTip',
          ],
        },
      },
    });

    const outputText = response.text?.trim();
    if (!outputText) {
      throw new Error('Empty response from model for summary');
    }

    const parsed = JSON.parse(outputText);
    return res.json({
      id: `sum-${Date.now()}`,
      subjectId,
      subjectName,
      targetType,
      targetMaterialTitle: materialTitle,
      sourceCount: sources.length,
      ...parsed,
      createdAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error generating summary:', error);
    const fallback = createFallbackSummary(
      req.body.subjectId || 'subj-1',
      req.body.subjectName || 'Tiếng Anh',
      req.body.sources || [],
      req.body.targetType || 'subject',
      req.body.materialTitle
    );
    return res.json(fallback);
  }
});

// AI Flashcard Generation Endpoint (5 Nhóm ưu tiên: Khái niệm, Định nghĩa, Ví dụ, Phân biệt, Quy tắc/Lưu ý)
app.post('/api/flashcards/generate', async (req: Request, res: Response) => {
  try {
    const {
      subjectId = 'subj-1',
      subjectName = 'Tiếng Anh',
      topicTitle = '',
      sourceContent = '',
      sourceMaterialId,
      count = 5,
    } = req.body;

    const ai = getGenAI();

    // Fallback nếu chưa cấu hình GEMINI_API_KEY
    if (!ai) {
      const fallbackCards = createFallbackFlashcards(subjectId, subjectName, topicTitle, sourceContent, sourceMaterialId);
      return res.json({ cards: fallbackCards });
    }

    const systemPrompt = `Bạn là Chuyên Gia Sư Phạm tạo Thẻ Ghi Nhớ (Flashcard) hàng đầu, chuyên thiết kế học liệu ôn tập nhanh cho học sinh từ lớp 7 trở lên (THCS và THPT).
Nhiệm vụ: Dựa trên môn học và nội dung được cung cấp, hãy tạo ra 5 thẻ ghi nhớ ngắn gọn, súc tích, dễ nhớ, bám sát ĐÚNG 5 nhóm nội dung trọng tâm:
1. "khai_niem": Khái niệm cốt lõi, hiện tượng hoặc tư tưởng then chốt.
2. "dinh_nghia": Định nghĩa chính xác về thuật ngữ, công thức hoặc cấu trúc.
3. "vi_du": Ví dụ thực tế tiêu biểu, câu mẫu áp dụng hoặc tình huống vận dụng cụ thể.
4. "phan_biet": So sánh điểm giống/khác giữa hai khái niệm/từ vựng/quy tắc dễ gây nhầm lẫn.
5. "quy_tac": Quy tắc bắt buộc, mẹo ghi nhớ vàng hoặc lưu ý ngoại lệ thường gặp.

Yêu cầu trình bày:
- Mặt trước (front): Ngắn gọn, đặt câu hỏi hoặc nêu từ khóa/tình huống rõ ràng, kích thích tư duy.
- Mặt sau (back): Trả lời súc tích, gạch đầu dòng rõ ràng, dễ hiểu cho học sinh lớp 7 trở lên, không dài dòng lan man.
- category: Phải là một trong 5 giá trị chính xác: "khai_niem", "dinh_nghia", "vi_du", "phan_biet", "quy_tac".
- notes: Mẹo ghi nhớ nhanh ngắn gọn (1 câu).
- exampleSentence: Ví dụ minh họa thêm (nếu có).`;

    const promptText = `Môn học: "${subjectName}"
Chủ đề / Tiêu đề: "${topicTitle || 'Kiến thức trọng tâm'}"
Nội dung nguồn:
${sourceContent || topicTitle || 'Kiến thức bài học tổng quát'}

Hãy tạo đúng bộ thẻ ghi nhớ bao gồm 5 nhóm: Khái niệm, Định nghĩa, Ví dụ, Phân biệt, Quy tắc/Lưu ý.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptText,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            cards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  front: { type: Type.STRING, description: 'Mặt trước: Câu hỏi, thuật ngữ hoặc tình huống ngắn gọn' },
                  back: { type: Type.STRING, description: 'Mặt sau: Định nghĩa, lời giải, giải thích súc tích' },
                  category: {
                    type: Type.STRING,
                    description: 'Thuộc một trong: khai_niem | dinh_nghia | vi_du | phan_biet | quy_tac',
                  },
                  notes: { type: Type.STRING, description: 'Mẹo ghi nhớ nhanh' },
                  exampleSentence: { type: Type.STRING, description: 'Câu ví dụ minh họa' },
                },
                required: ['front', 'back', 'category'],
              },
            },
          },
          required: ['cards'],
        },
      },
    });

    const outputText = response.text?.trim();
    if (!outputText) {
      throw new Error('Empty response from model for flashcards');
    }

    const parsed = JSON.parse(outputText);
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error generating flashcards with AI:', error);
    const fallbackCards = createFallbackFlashcards(
      req.body.subjectId || 'subj-1',
      req.body.subjectName || 'Tiếng Anh',
      req.body.topicTitle || '',
      req.body.sourceContent || '',
      req.body.sourceMaterialId
    );
    return res.json({ cards: fallbackCards });
  }
});

// ============================================================================
// PROMPT 05: RE-GENERATE TOÀN BỘ STUDY PACK TỪ NGUỒN HỌC LIỆU GỐC (GEMINI API)
// Làm mới summary, quiz, flashcard, Q&A - giữ nguyên vẹn nguồn gốc ban đầu
// ============================================================================
app.post('/api/study-pack/regenerate', async (req: Request, res: Response) => {
  try {
    const {
      subject = { id: 'subj-1', name: 'Tiếng Anh' },
      sources = [],
      apiKey: bodyApiKey,
      versionNumber = 2,
    } = req.body;

    const localKey = (req.headers['x-gemini-api-key'] as string) || bodyApiKey;

    if (!sources || sources.length === 0) {
      return res.status(400).json({ error: 'Cần có ít nhất 1 nguồn học liệu gốc để re-generate study pack' });
    }

    const ai = getGenAI(localKey);

    const subjectId = subject.id || 'subj-1';
    const subjectName = subject.name || 'Tiếng Anh';

    // Format sources text context
    const sourcesContext = sources
      .map((s: any, idx: number) => {
        return `[Nguồn gốc #${idx + 1}] Loại: ${s.type || 'văn bản'} - Tiêu đề: "${s.title}"\nNội dung: ${s.content}${s.notes ? `\nGhi chú: ${s.notes}` : ''}`;
      })
      .join('\n\n');

    // If Gemini client not available, run deterministic generator
    if (!ai) {
      const fallbackPack = createDeterministicStudyPack(subjectId, subjectName, sources, versionNumber);
      return res.json({
        success: true,
        isAiGenerated: false,
        model: 'deterministic-fallback',
        usedLocalKey: false,
        message: 'Re-generate hoàn tất (chế độ dự phòng thông minh)',
        ...fallbackPack,
      });
    }

    const systemPrompt = `Bạn là Chuyên Gia Sư Phạm & Trợ Lý Học Tập AI cao cấp trong EchoLingo AI.
Nhiệm vụ của bạn là đọc các NGUỒN HỌC LIỆU GỐC được cung cấp để RE-GENERATE TOÀN BỘ BỘ ÔN TẬP (Study Pack) hoàn toàn mới, sắc sảo, chuẩn xác và sinh động cho học sinh từ lớp 7 trở lên (THCS và THPT).

BỘ ÔN TẬP BẮT BUỘC GỒM ĐỦ 4 PHẦN:
1. SUMMARY (Bản tóm tắt):
   - summary: Tóm tắt 2-3 câu ngắn gọn, súc tích, chạm đúng điểm nhấn bài học.
   - keyPoints: 3-4 luận điểm cốt lõi (point, explanation, example).
   - coreVocabulary: 3-4 từ/cụm từ đắt giá nhất kèm phiên âm IPA chuẩn xác và giải nghĩa thực tế (word, ipa, meaning, contextUsage).
   - pronunciationNotes: 2-3 lưu ý ngữ âm, âm đuôi hoặc trọng âm (ví dụ /t/, /d/, /s/, /z/, /θ/).
   - practiceSentences: 2-3 câu tiếng Anh tiêu biểu trích hoặc khái quát từ bài để luyện nói.
   - studentTip: 1 mẹo ghi nhớ gần gũi.

2. FLASHCARDS (Thẻ ghi nhớ):
   - ĐÚNG 5 thẻ ghi nhớ theo 5 nhóm bắt buộc:
     * "khai_niem": Khái niệm cốt lõi hoặc ý tưởng then chốt
     * "dinh_nghia": Định nghĩa chính xác thuật ngữ hoặc cấu trúc
     * "vi_du": Ví dụ thực tế tiêu biểu hoặc mẫu câu vận dụng
     * "phan_biet": Điểm khác biệt/so sánh giữa hai điều dễ nhầm lẫn
     * "quy_tac": Quy tắc vàng hoặc lưu ý ngoại lệ
   - Mỗi thẻ gồm: front, back, category, notes, exampleSentence.

3. QUIZ (Bài kiểm tra trắc nghiệm):
   - 3-4 câu trắc nghiệm bám sát nguồn học liệu.
   - Mỗi câu gồm: question, options (4 lựa chọn A, B, C, D), correctAnswer (chuỗi đáp án chính xác), explanation (giải thích tại sao đúng), reviewTip (lưu ý ôn tập).

4. QA SEEDS (Câu hỏi gợi mở & giải đáp):
   - 3-4 câu hỏi tự học hoặc câu hỏi học sinh thường thắc mắc về nội dung nguồn.
   - Mỗi câu gồm: question, shortAnswer, categoryLabel, exampleNote.`;

    const userPromptText = `Môn học: "${subjectName}" (Khối: ${subject.gradeLevel || 'Lớp 10'})
DƯỚI ĐÂY LÀ TOÀN BỘ NGUỒN HỌC LIỆU GỐC CẦN RE-GENERATE:
${sourcesContext}

Hãy phân tích kỹ và tạo mới toàn bộ Study Pack (Summary, 5 Flashcards, Quiz 3-4 câu, và 3-4 Q&A seeds) theo đúng cấu trúc JSON yêu cầu.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPromptText,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.OBJECT,
              properties: {
                summary: { type: Type.STRING },
                keyPoints: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      point: { type: Type.STRING },
                      explanation: { type: Type.STRING },
                      example: { type: Type.STRING },
                    },
                    required: ['point', 'explanation'],
                  },
                },
                coreVocabulary: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      word: { type: Type.STRING },
                      ipa: { type: Type.STRING },
                      meaning: { type: Type.STRING },
                      contextUsage: { type: Type.STRING },
                    },
                    required: ['word', 'ipa', 'meaning'],
                  },
                },
                pronunciationNotes: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                practiceSentences: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                studentTip: { type: Type.STRING },
              },
              required: ['summary', 'keyPoints', 'coreVocabulary', 'pronunciationNotes', 'practiceSentences', 'studentTip'],
            },
            flashcards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  front: { type: Type.STRING },
                  back: { type: Type.STRING },
                  category: { type: Type.STRING, description: 'khai_niem | dinh_nghia | vi_du | phan_biet | quy_tac' },
                  notes: { type: Type.STRING },
                  exampleSentence: { type: Type.STRING },
                },
                required: ['front', 'back', 'category'],
              },
            },
            quizTitle: { type: Type.STRING },
            quizDescription: { type: Type.STRING },
            quizQuestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  correctAnswer: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  reviewTip: { type: Type.STRING },
                },
                required: ['question', 'options', 'correctAnswer', 'explanation'],
              },
            },
            qaSeeds: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  shortAnswer: { type: Type.STRING },
                  categoryLabel: { type: Type.STRING },
                  exampleNote: { type: Type.STRING },
                },
                required: ['question', 'shortAnswer', 'categoryLabel'],
              },
            },
          },
          required: ['summary', 'flashcards', 'quizQuestions', 'qaSeeds'],
        },
      },
    });

    const outputText = response.text?.trim();
    if (!outputText) {
      throw new Error('Mô hình Gemini trả về nội dung rỗng');
    }

    const parsed = JSON.parse(outputText);
    const nowIso = new Date().toISOString();
    const stamp = Date.now();

    // Chuẩn hóa Summary
    const formattedSummary = {
      id: `sum-regen-${stamp}`,
      subjectId,
      subjectName,
      targetType: 'subject',
      sourceCount: sources.length,
      summary: parsed.summary.summary,
      keyPoints: (parsed.summary.keyPoints || []).map((kp: any, idx: number) => ({
        id: `kp-regen-${stamp}-${idx}`,
        point: kp.point,
        explanation: kp.explanation,
        example: kp.example,
      })),
      coreVocabulary: parsed.summary.coreVocabulary || [],
      pronunciationNotes: parsed.summary.pronunciationNotes || [],
      practiceSentences: parsed.summary.practiceSentences || [],
      studentTip: parsed.summary.studentTip || 'Luyện tập đều đặn mỗi ngày nhé!',
      createdAt: nowIso,
    };

    // Chuẩn hóa Flashcards
    const formattedFlashcards = (parsed.flashcards || []).map((f: any, idx: number) => ({
      id: `fc-regen-${stamp}-${idx}`,
      front: f.front,
      back: f.back,
      category: ['khai_niem', 'dinh_nghia', 'vi_du', 'phan_biet', 'quy_tac'].includes(f.category)
        ? f.category
        : (['khai_niem', 'dinh_nghia', 'vi_du', 'phan_biet', 'quy_tac'][idx % 5]),
      subjectId,
      subjectName,
      notes: f.notes || 'Thẻ được tạo mới bởi Gemini AI',
      exampleSentence: f.exampleSentence,
      mastered: false,
      reviewCount: 0,
      createdAt: nowIso,
    }));

    // Chuẩn hóa Quizzes
    const formattedQuizzes = [
      {
        id: `quiz-regen-${stamp}`,
        subjectId,
        subjectName,
        title: parsed.quizTitle || `Trắc nghiệm ôn tập: ${subjectName} (v${versionNumber})`,
        description: parsed.quizDescription || `Bài kiểm tra trắc nghiệm được tạo mới từ ${sources.length} nguồn học liệu gốc`,
        gradeLevel: subject.gradeLevel || 'Lớp 10',
        questions: (parsed.quizQuestions || []).map((q: any, idx: number) => ({
          id: `q-regen-${stamp}-${idx}`,
          type: 'multiple_choice' as const,
          question: q.question,
          options: q.options || [],
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || 'Đáp án chính xác dựa trên bài học.',
          hint: q.reviewTip,
          reviewTip: q.reviewTip || 'Xem lại phần tóm tắt để củng cố kiến thức.',
        })),
        createdAt: nowIso,
      },
    ];

    // Chuẩn hóa QA Seeds
    const formattedQaSeeds = (parsed.qaSeeds || []).map((q: any, idx: number) => ({
      id: `seed-regen-${stamp}-${idx}`,
      subjectId,
      question: q.question,
      shortAnswer: q.shortAnswer,
      category: 'van_dung' as const,
      categoryLabel: q.categoryLabel || 'Kiến thức cốt lõi',
      exampleNote: q.exampleNote || 'Gợi mở ôn tập với Chatbot',
      createdAt: nowIso,
    }));

    return res.json({
      success: true,
      isAiGenerated: true,
      model: 'gemini-3.8-flash',
      usedLocalKey: Boolean(localKey),
      message: 'Re-generate thành công bằng Gemini 3.8 Flash',
      versionName: `v${versionNumber}.0 (Gemini AI Re-generated)`,
      summary: formattedSummary,
      flashcards: formattedFlashcards,
      quizzes: formattedQuizzes,
      qaSeeds: formattedQaSeeds,
    });
  } catch (error: any) {
    console.error('Lỗi khi Re-generate với Gemini:', error);
    // Graceful intelligent fallback so the application never breaks
    const {
      subject = { id: 'subj-1', name: 'Tiếng Anh' },
      sources = [],
      versionNumber = 2,
    } = req.body;

    const fallbackPack = createDeterministicStudyPack(
      subject.id || 'subj-1',
      subject.name || 'Tiếng Anh',
      sources,
      versionNumber
    );

    return res.json({
      success: true,
      isAiGenerated: false,
      model: 'deterministic-fallback',
      usedLocalKey: false,
      message: `Đã Re-generate thành công (Chế độ dự phòng thông minh: ${error.message || 'Lỗi kết nối'})`,
      ...fallbackPack,
    });
  }
});

// Grounded Chatbot Endpoint (Chỉ trả lời trong phạm vi sources, analysisPreview, studyPack)
app.post('/api/chatbot/grounded-chat', async (req: Request, res: Response) => {
  try {
    const { question, history = [], context } = req.body;

    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'question is required' });
    }

    const ai = getGenAI();

    // Prepare context summaries for prompt
    const subjectName = context?.subjectName || 'Chủ đề hiện tại';
    const sources = context?.sources || [];
    const analysis = context?.analysisPreview || null;
    const studyPack = context?.studyPack || { flashcards: [], qaSeeds: [], quizQuestions: [] };

    // If Gemini API is not available or fails, use deterministic grounded fallback
    if (!ai) {
      const fallbackResult = createFallbackGroundedAnswer(question, subjectName, sources, analysis, studyPack);
      return res.json(fallbackResult);
    }

    // Format Sources Text
    const sourcesContextText = sources.length > 0
      ? sources.map((s: any, idx: number) => `--- NGUỒN ${idx + 1}: ${s.title} ---\nNội dung: ${s.content}\nGhi chú: ${s.notes || 'Không có'}\nTừ khóa: ${(s.tags || []).join(', ')}`).join('\n\n')
      : 'Không có tài liệu nguồn nào được tải lên cho chủ đề này.';

    // Format Analysis Preview Text
    const analysisContextText = analysis
      ? `--- BẢN TÓM TẮT & PHÂN TÍCH CHỦ ĐỀ ---
Tổng quan: ${analysis.summary}
Điểm cốt lõi:
${(analysis.keyPoints || []).map((kp: any) => `• ${kp.point}: ${kp.explanation} (Ví dụ: ${kp.example || 'N/A'})`).join('\n')}
Từ vựng trọng tâm:
${(analysis.coreVocabulary || []).map((v: any) => `• ${v.word} (${v.ipa}): ${v.meaning} - Sử dụng: ${v.contextUsage || 'N/A'}`).join('\n')}
Lưu ý phát âm:
${(analysis.pronunciationNotes || []).map((n: string) => `• ${n}`).join('\n')}
Câu thực hành:
${(analysis.practiceSentences || []).map((s: string) => `• ${s}`).join('\n')}
Mẹo học sinh: ${analysis.studentTip || 'N/A'}`
      : 'Chưa có bản phân tích chi tiết cho chủ đề này.';

    // Format Study Pack Text
    const flashcardsText = (studyPack.flashcards || []).length > 0
      ? `[Flashcard ôn nhanh]:\n` + studyPack.flashcards.map((f: any) => `• [${f.category}] Mặt trước: "${f.front}" -> Mặt sau: "${f.back}" (Ví dụ: ${f.exampleSentence || 'N/A'}, Mẹo: ${f.notes || 'N/A'})`).join('\n')
      : 'Không có thẻ flashcard.';

    const qaSeedsText = (studyPack.qaSeeds || []).length > 0
      ? `[Câu hỏi gợi mở & Trả lời chuẩn]:\n` + studyPack.qaSeeds.map((q: any) => `• [${q.categoryLabel}] Hỏi: "${q.question}" -> Đáp: "${q.shortAnswer}" (Ví dụ/Lưu ý: ${q.exampleNote || 'N/A'})`).join('\n')
      : 'Không có câu hỏi gợi mở.';

    const quizzesText = (studyPack.quizQuestions || []).length > 0
      ? `[Câu hỏi trắc nghiệm & ôn tập]:\n` + studyPack.quizQuestions.map((qz: any) => `• Hỏi: "${qz.question}" -> Đáp án đúng: "${qz.correctAnswer}" (Giải thích: ${qz.explanation || 'N/A'})`).join('\n')
      : '';

    const studyPackContextText = `${flashcardsText}\n\n${qaSeedsText}\n\n${quizzesText}`;

    const systemInstruction = `Bạn là Trợ lý Gia sư Ôn bài (Grounded AI Study Tutor) trong ứng dụng EchoLingo AI, chuyên hỗ trợ học sinh ôn tập cho chủ đề: "${subjectName}".

QUY TẮC CỐT LÕI (BẮT BUỘC TUÂN THỦ TUYỆT ĐỐI):
1. BẠN CHỈ ĐƯỢC TRẢ LỜI TRONG PHẠM VI DỮ LIỆU ĐƯỢC CUNG CẤP DƯỚI ĐÂY:
   - [SOURCES]: Toàn bộ học liệu nguồn (đoạn văn, bài đọc, ghi chú học tập).
   - [ANALYSIS_PREVIEW]: Bản phân tích tóm tắt (điểm cốt lõi, từ vựng, lưu ý phát âm, câu thực hành).
   - [STUDY_PACK]: Bộ tài liệu ôn tập gồm thẻ flashcard, câu hỏi gợi mở Q&A, và câu hỏi trắc nghiệm.

2. NẾU CÂU HỎI CỦA HỌC SINH KHÔNG CÓ TRONG TÀI LIỆU HOẶC KHÔNG THỂ SUY RA TRỰC TIẾP TỪ TÀI LIỆU:
   BẠN BẮT BUỘC PHẢI TRẢ LỜI RÕ RÀNG VÀ CHÍNH XÁC:
   "Nội dung này nằm ngoài phạm vi tài liệu đã cung cấp."
   (Sau câu này, bạn có thể thêm 1 câu gợi ý ngắn thân thiện về những nội dung học sinh CÓ THỂ hỏi dựa trên tài liệu bài học hiện tại).
   TUYỆT ĐỐI KHÔNG sử dụng kiến thức bên ngoài (ngoài vũ trụ, lịch sử ngoài bài, thời tiết, giải trí, lập trình, tán gẫu không liên quan).
   KHÔNG biến thành chatbot chung chung!

3. KHI CÂU HỎI NẰM TRONG PHẠM VI TÀI LIỆU:
   - Giải thích rõ ràng, đúng bản chất, sư phạm, ấm áp, ngôn ngữ tiếng Việt thân thiện, dễ hiểu cho học sinh lớp 7 trở lên.
   - Nêu rõ căn cứ từ đâu (ví dụ: "Theo tài liệu nguồn [Tên tài liệu]...", "Trong phần Điểm cốt lõi...", "Dựa vào thẻ ghi nhớ...").
   - Đưa ra ví dụ minh họa hoặc lời khuyên ôn bài súc tích.`;

    const userPrompt = `DƯỚI ĐÂY LÀ TOÀN BỘ PHẠM VI TÀI LIỆU ĐƯỢC PHÉP TRẢ LỜI CHO CHỦ ĐỀ "${subjectName}":

=== PHẠM VI 1: HỌC LIỆU NGUỒN (SOURCES) ===
${sourcesContextText}

=== PHẠM VI 2: BẢN TÓM TẮT & PHÂN TÍCH (ANALYSIS_PREVIEW) ===
${analysisContextText}

=== PHẠM VI 3: BỘ ÔN TẬP (STUDY_PACK) ===
${studyPackContextText}

--- LỊCH SỬ HỎI ĐÁP GẦN ĐÂY ---
${history.slice(-4).map((m: any) => `${m.sender === 'user' ? 'Học sinh' : 'Gia sư'}: ${m.text}`).join('\n')}

--- CÂU HỎI MỚI CỦA HỌC SINH ---
"${question}"

Hãy trả lời học sinh tuân thủ nghiêm ngặt quy tắc Grounding:`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.2, // Low temperature for high precision grounding
      },
    });

    const replyText = response.text?.trim() || 'Nội dung này nằm ngoài phạm vi tài liệu đã cung cấp.';
    const isOutOfScope = replyText.includes('Nội dung này nằm ngoài phạm vi tài liệu đã cung cấp');

    // Detect which sources were cited
    const sourceTags: string[] = [];
    if (!isOutOfScope) {
      if (sources.some((s: any) => replyText.toLowerCase().includes(s.title.toLowerCase()) || sourcesContextText.toLowerCase().includes(question.toLowerCase()))) {
        sourceTags.push('Học liệu nguồn (sources)');
      }
      if (analysis && (replyText.toLowerCase().includes('phân tích') || replyText.toLowerCase().includes('cốt lõi') || replyText.toLowerCase().includes('tóm tắt'))) {
        sourceTags.push('Bản phân tích (analysisPreview)');
      }
      if (studyPack && (replyText.toLowerCase().includes('thẻ') || replyText.toLowerCase().includes('flashcard') || replyText.toLowerCase().includes('gợi mở'))) {
        sourceTags.push('Bộ ôn tập (studyPack)');
      }
      if (sourceTags.length === 0) {
        sourceTags.push('Tài liệu chủ đề hiện tại');
      }
    }

    return res.json({
      answer: replyText,
      isGrounded: !isOutOfScope,
      isOutOfScope,
      groundedSourceTags: sourceTags,
    });
  } catch (error: any) {
    console.error('Error in grounded chat endpoint:', error);
    const { question, context } = req.body;
    const fallbackResult = createFallbackGroundedAnswer(
      question,
      context?.subjectName || 'Chủ đề hiện tại',
      context?.sources || [],
      context?.analysisPreview,
      context?.studyPack
    );
    return res.json(fallbackResult);
  }
});

// Fallback Grounded Answer Generator (Deterministic keyword & context match)
function createFallbackGroundedAnswer(
  question: string,
  subjectName: string,
  sources: any[],
  analysis: any,
  studyPack: any
) {
  const cleanQ = question.toLowerCase().trim();

  // Combine all ground truth texts
  const sourcesText = sources.map((s) => `${s.title} ${s.content} ${s.notes || ''}`).join(' ');
  const analysisText = analysis
    ? `${analysis.summary} ${(analysis.keyPoints || []).map((k: any) => `${k.point} ${k.explanation}`).join(' ')} ${(analysis.coreVocabulary || []).map((v: any) => `${v.word} ${v.meaning}`).join(' ')} ${(analysis.pronunciationNotes || []).join(' ')}`
    : '';
  const packText = studyPack
    ? `${(studyPack.flashcards || []).map((f: any) => `${f.front} ${f.back} ${f.notes || ''}`).join(' ')} ${(studyPack.qaSeeds || []).map((q: any) => `${q.question} ${q.shortAnswer}`).join(' ')}`
    : '';

  const combinedContext = `${sourcesText} ${analysisText} ${packText}`.toLowerCase();

  // Remove common question words to find key terms
  const searchTerms = cleanQ
    .replace(/[?,.!:;"'()]/g, '')
    .split(/\s+/)
    .filter((word) => word.length >= 2 && !['là', 'gì', 'thế', 'nào', 'sao', 'tại', 'sao', 'như', 'có', 'trong', 'bài', 'được', 'cho', 'em', 'hỏi', 'về', 'của', 'theo'].includes(word));

  // Cross-lingual semantic concept dictionary
  const conceptMap: Record<string, string[]> = {
    'nhạc': ['music', 'song', 'folk', 'orchestra', 'rhythm', 'art'],
    'âm nhạc': ['music', 'song', 'orchestra'],
    'văn hóa': ['culture', 'human culture'],
    'dân ca': ['folk', 'traditional folk'],
    'phát âm': ['pronunciation', 'sound', 'ipa', 'speak'],
    'âm đuôi': ['ending', 'sounds', 'consonants'],
    'trọng âm': ['stress', 'rhythm'],
    'khách sạn': ['hotel', 'room', 'check in'],
    'đặt phòng': ['check in', 'room', 'hotel'],
    'hỏi đường': ['route', 'direction', 'museum'],
    'tuyến đường': ['route', 'quickest'],
    'cảm ơn': ['assistance', 'thank you', 'pleasure', 'welcome'],
    'toán': ['math', 'hữu tỉ', 'phương trình', 'chuyển vế'],
    'hữu tỉ': ['rational', 'số hữu tỉ'],
    'chuyển vế': ['đổi dấu', 'quy tắc'],
    'quang hợp': ['photosynthesis', 'diệp lục', 'glucose', 'oxygen'],
    'khối lượng': ['mass', 'bảo toàn'],
    'so sánh': ['như', 'b', 'tu từ'],
    'ẩn dụ': ['ngầm', 'so sánh'],
  };

  const expandedTerms = [...searchTerms];
  for (const [concept, mapped] of Object.entries(conceptMap)) {
    if (cleanQ.includes(concept)) {
      expandedTerms.push(...mapped);
    }
  }

  const matchedTerms = expandedTerms.filter((term) => combinedContext.includes(term.toLowerCase()));

  // If no key terms from context are matched, reject strictly
  if (matchedTerms.length === 0 && searchTerms.length > 0) {
    return {
      answer: 'Nội dung này nằm ngoài phạm vi tài liệu đã cung cấp. Em hãy đặt câu hỏi liên quan đến bài đọc, từ vựng hoặc các điểm kiến thức cốt lõi của chủ đề nhé!',
      isGrounded: false,
      isOutOfScope: true,
      groundedSourceTags: [],
    };
  }

  // Look for exact match in QA Seeds
  if (studyPack?.qaSeeds) {
    const seedMatch = studyPack.qaSeeds.find((q: any) =>
      cleanQ.includes(q.question.toLowerCase().slice(0, 15)) ||
      matchedTerms.some((t) => q.question.toLowerCase().includes(t) && q.shortAnswer.toLowerCase().includes(t))
    );
    if (seedMatch) {
      return {
        answer: `Dựa trên câu hỏi gợi mở trong Bộ ôn tập:\n\n${seedMatch.shortAnswer}\n\n💡 Ví dụ/Lưu ý: ${seedMatch.exampleNote || 'Nắm vững kiến thức này để áp dụng vào bài học nhé!'}`,
        isGrounded: true,
        isOutOfScope: false,
        groundedSourceTags: ['Bộ ôn tập (studyPack)'],
      };
    }
  }

  // Look for match in Flashcards
  if (studyPack?.flashcards) {
    const cardMatch = studyPack.flashcards.find((f: any) =>
      matchedTerms.some((t) => f.front.toLowerCase().includes(t))
    );
    if (cardMatch) {
      return {
        answer: `Theo thẻ ghi nhớ "${cardMatch.front}":\n\n${cardMatch.back}\n\n📌 Ghi nhớ: ${cardMatch.notes || cardMatch.exampleSentence || 'Thực hành đều đặn để nhớ lâu hơn.'}`,
        isGrounded: true,
        isOutOfScope: false,
        groundedSourceTags: ['Thẻ ghi nhớ (studyPack)'],
      };
    }
  }

  // Look for match in Analysis Key Points or Core Vocabulary
  if (analysis?.keyPoints) {
    const kpMatch = analysis.keyPoints.find((kp: any) =>
      matchedTerms.some((t) => kp.point.toLowerCase().includes(t) || kp.explanation.toLowerCase().includes(t))
    );
    if (kpMatch) {
      return {
        answer: `Dựa trên Bản phân tích điểm cốt lõi của chủ đề "${subjectName}":\n\n• ${kpMatch.point}: ${kpMatch.explanation}\n\n📌 Ví dụ: ${kpMatch.example || 'Áp dụng vào bài đọc để hiểu sâu bản chất.'}`,
        isGrounded: true,
        isOutOfScope: false,
        groundedSourceTags: ['Bản phân tích (analysisPreview)'],
      };
    }
  }

  // Look for match in Sources
  if (sources.length > 0) {
    const srcMatch = sources.find((s) =>
      matchedTerms.some((t) => s.title.toLowerCase().includes(t) || s.content.toLowerCase().includes(t))
    );
    if (srcMatch) {
      return {
        answer: `Theo học liệu nguồn "${srcMatch.title}":\n\n"${srcMatch.content}"\n\n💡 Ghi chú bổ trợ: ${srcMatch.notes || 'Em hãy đọc kỹ các từ khóa chính trong đoạn văn.'}`,
        isGrounded: true,
        isOutOfScope: false,
        groundedSourceTags: ['Học liệu nguồn (sources)'],
      };
    }
  }

  // Fallback default grounded response
  return {
    answer: `Theo tài liệu tóm tắt của chủ đề "${subjectName}":\n\n${analysis?.summary || 'Chủ đề cung cấp các kiến thức nền tảng và bài học thực hành.'}\n\nEm có thể hỏi chi tiết hơn về các từ vựng hoặc câu hỏi ôn tập cụ thể trong bài nhé!`,
    isGrounded: true,
    isOutOfScope: false,
    groundedSourceTags: ['Tài liệu chủ đề hiện tại'],
  };
}

// Fallback generator for Flashcards (5 Nhóm ưu tiên)
function createFallbackFlashcards(
  subjectId: string,
  subjectName: string,
  topicTitle: string,
  sourceContent: string,
  sourceMaterialId?: string
) {
  const content = sourceContent || topicTitle || 'Bài học';
  const isEnglish = /tiếng anh|english|phát âm|unit|vocabulary/i.test(subjectName + ' ' + topicTitle);
  const isMath = /toán|math|đại số|hình học|phương trình/i.test(subjectName + ' ' + topicTitle);
  const isScience = /khoa học|vật lý|hóa học|sinh học|science/i.test(subjectName + ' ' + topicTitle);

  if (isEnglish) {
    return [
      {
        front: `Khái niệm then chốt trong "${topicTitle || 'Bài học Tiếng Anh'}" là gì?`,
        back: 'Nắm vững ngữ cảnh giao tiếp thực tế và cách phát âm chuẩn xác của từ khóa chính trong câu.',
        category: 'khai_niem',
        notes: 'Gắn từ vựng vào ngữ cảnh câu thay vì học từ đơn lẻ.',
        exampleSentence: 'Practice makes perfect in language learning.',
      },
      {
        front: `Định nghĩa cấu trúc hoặc hiện tượng ngữ pháp trong "${topicTitle || 'Chủ điểm này'}"?`,
        back: 'Cấu trúc quy định trật tự sắp xếp từ trong câu để truyền tải đúng ý nghĩa thời gian và mức độ chắc chắn của sự việc.',
        category: 'dinh_nghia',
        notes: 'Ghi nhớ công thức dạng S + V + O.',
        exampleSentence: 'She has already finished her assignment.',
      },
      {
        front: `Ví dụ câu giao tiếp hoặc bài đọc ứng dụng cho "${topicTitle || 'Chủ đề này'}"?`,
        back: 'Câu mẫu tự nhiên: "Could you please explain that again?" hoặc "I am interested in learning more about this topic."',
        category: 'vi_du',
        notes: 'Đọc to câu 3 lần để rèn phản xạ cơ miệng.',
        exampleSentence: 'Would you mind helping me with this question?',
      },
      {
        front: `Phân biệt điểm dễ gây nhầm lẫn trong chủ điểm "${topicTitle || 'Tiếng Anh'}"?`,
        back: '• Điểm giống: Đều dùng để diễn đạt ý nghĩa tương tự nhau.\n• Điểm khác biệt: Khác nhau ở mức độ trang trọng, giới từ đi kèm hoặc vị trí đứng trong câu.',
        category: 'phan_biet',
        notes: 'Chú ý các cặp từ đồng âm hoặc cặp từ gần nghĩa.',
      },
      {
        front: `Quy tắc hoặc Lưu ý vàng khi áp dụng "${topicTitle || 'Kiến thức này'}"?`,
        back: 'Luôn chú ý âm đuôi (ending sounds) và sự hòa hợp giữa chủ ngữ và động từ (subject-verb agreement).',
        category: 'quy_tac',
        notes: 'Không bỏ quên chia động từ theo ngôi số ít.',
      },
    ];
  }

  if (isMath) {
    return [
      {
        front: `Khái niệm cơ bản của "${topicTitle || 'Chuyên đề Toán học'}" là gì?`,
        back: 'Đối tượng toán học biểu diễn mối quan hệ số lượng hoặc hình học giữa các đại lượng trong không gian và mặt phẳng.',
        category: 'khai_niem',
        notes: 'Hiểu bản chất định lý trước khi làm bài tập tính toán.',
      },
      {
        front: `Định nghĩa công thức toán học trong "${topicTitle || 'Phần này'}"?`,
        back: 'Công thức toán học quy định mối liên hệ đẳng thức hoặc bất đẳng thức giữa các biến số và hằng số cho trước.',
        category: 'dinh_nghia',
        notes: 'Chú ý điều kiện xác định của các biến (mẫu khác 0, biểu thức trong căn ≥ 0).',
      },
      {
        front: `Ví dụ bài toán điển hình áp dụng "${topicTitle || 'Chủ đề này'}"?`,
        back: 'Bài toán mẫu: Cho biểu thức, rút gọn và tìm giá trị của biến x để biểu thức đạt giá trị nguyên.',
        category: 'vi_du',
        notes: 'Làm theo đúng 3 bước: Tìm điều kiện, biến đổi tương đương, đối chiếu kết quả.',
      },
      {
        front: `Phân biệt hai trường hợp hoặc hai dạng toán dễ nhầm trong "${topicTitle || 'Bài học'}"?`,
        back: '• Dạng 1: Đổi dấu khi chuyển vế hoặc nhân/chia hai vế với số âm.\n• Dạng 2: Giữ nguyên chiều khi nhân/chia hai vế với số dương.',
        category: 'phan_biet',
        notes: 'Rất nhiều học sinh quên đổi chiều bất đẳng thức khi nhân với số âm.',
      },
      {
        front: `Quy tắc / Lưu ý quan trọng nhất khi giải bài toán này?`,
        back: 'Luôn tìm điều kiện xác định đầu tiên trước khi biến đổi và phải thử lại nghiệm trước khi kết luận.',
        category: 'quy_tac',
        notes: 'Kiểm tra kỹ các bước tính toán trung gian.',
      },
    ];
  }

  // Fallback tổng quát cho mọi môn học khác
  return [
    {
      front: `[Khái niệm] Ý nghĩa cốt lõi của "${topicTitle || subjectName}" là gì?`,
      back: `Bản chất cốt lõi: ${content.slice(0, 120)}... Giúp hiểu sâu hiện tượng và bản chất tri thức thay vì học vẹt.`,
      category: 'khai_niem',
      notes: 'Đọc kỹ từ khóa chính trong câu hỏi.',
    },
    {
      front: `[Định nghĩa] Thuật ngữ hoặc nguyên lý then chốt trong "${topicTitle || subjectName}"?`,
      back: 'Phát biểu chính xác về phạm vi, thuộc tính và vai trò của đối tượng kiến thức được học sinh tiếp cận.',
      category: 'dinh_nghia',
      notes: 'Học sinh từ lớp 7 cần nắm chuẩn từng từ khóa then chốt.',
    },
    {
      front: `[Ví dụ] Tình huống hoặc dẫn chứng thực tế cho "${topicTitle || subjectName}"?`,
      back: 'Trường hợp minh họa thực tiễn: Giúp liên hệ bài học lý thuyết vào đời sống hằng ngày và giải quyết câu hỏi mở.',
      category: 'vi_du',
      exampleSentence: 'Liên hệ thực tế giúp củng cố tư duy phản biện.',
    },
    {
      front: `[Phân biệt] Điểm khác biệt quan trọng cần chú ý trong "${topicTitle || subjectName}"?`,
      back: '• Trường hợp A: Áp dụng trong điều kiện tiêu chuẩn.\n• Trường hợp B: Áp dụng khi có yếu tố biến đổi hoặc đối tượng đặc biệt.',
      category: 'phan_biet',
      notes: 'Lập sơ đồ tư duy hoặc bảng so sánh để tránh nhầm lẫn.',
    },
    {
      front: `[Quy tắc / Lưu ý] Ghi nhớ vàng khi ôn tập "${topicTitle || subjectName}"?`,
      back: 'Trình bày theo các bước logic rõ ràng, kiểm tra lại điều kiện tiên quyết và tránh các lỗi sai thường gặp.',
      category: 'quy_tac',
      notes: 'Ôn lại thẻ này ít nhất 2 lần/tuần để ghi nhớ dài hạn.',
    },
  ];
}


// Fallback generator for Study Summaries
function createFallbackSummary(
  subjectId: string,
  subjectName: string,
  sources: any[],
  targetType: string,
  materialTitle?: string
) {
  // Extract text contents to understand topic
  const combinedText = sources.map((s) => `${s.title} ${s.content} ${s.notes || ''}`).join(' ');
  const isMusicTopic = /music|song|folk|orchestra|rhythm|art/i.test(combinedText);
  const isTravelTopic = /hotel|room|route|museum|travel|check in/i.test(combinedText);
  const isScienceTopic = /science|ocean|nature|earth|environment/i.test(combinedText);

  let summary = '';
  let keyPoints: any[] = [];
  let coreVocabulary: any[] = [];
  let pronunciationNotes: string[] = [];
  let practiceSentences: string[] = [];
  let studentTip = '';

  if (isMusicTopic) {
    summary = 'Chủ đề giúp học sinh hiểu về vai trò của âm nhạc và nghệ thuật trong đời sống văn hóa nhân loại, đồng thời rèn luyện phản xạ phát âm chuẩn các thuật ngữ âm nhạc quốc tế.';
    keyPoints = [
      {
        point: 'Âm nhạc là tấm gương văn hóa và lịch sử',
        explanation: 'Các bài hát dân ca truyền thống lưu giữ câu chuyện đời sống, phong tục và lịch sử của từng dân tộc qua nhiều thế hệ.',
        example: 'Traditional folk songs tell stories of daily life and history.',
      },
      {
        point: 'Tác dụng của khí nhạc đối với sự tập trung học tập',
        explanation: 'Giai điệu giao hưởng và hòa tấu cổ điển giúp tinh thần thư giãn, tăng tuần hoàn sóng não giúp ghi nhớ bài học tốt hơn.',
        example: 'Listening to classical orchestra helps students relax and focus better.',
      },
      {
        point: 'Mối liên hệ giữa nhịp điệu âm nhạc và ngữ điệu tiếng Anh',
        explanation: 'Tiếng Anh là ngôn ngữ có trọng âm nhịp điệu (stress-timed). Học nhạc giúp học sinh cảm nhận tốt hơn các nhịp nhấn nhá trong câu nói.',
        example: 'It helps young learners develop a natural sense of rhythm.',
      },
    ];
    coreVocabulary = [
      { word: 'orchestra', ipa: '/ˈɔː.kɪ.strə/', meaning: 'Dàn nhạc giao hưởng', contextUsage: 'The school orchestra played beautifully.' },
      { word: 'culture', ipa: '/ˈkʌl.tʃər/', meaning: 'Văn hóa, bản sắc', contextUsage: 'Music is an essential part of culture.' },
      { word: 'rhythm', ipa: '/ˈrɪð.əm/', meaning: 'Giai điệu, nhịp điệu', contextUsage: 'Feel the rhythm of natural speech.' },
    ];
    pronunciationNotes = [
      'Từ "orchestra" có trọng âm rơi vào âm tiết đầu tiên /ˈɔː-/, âm "ch" đọc là /k/ chứ không phải /tʃ/.',
      'Từ "rhythm" phát âm chữ "rh" là /r/, âm đuôi kết thúc bằng /m/ ngậm môi nhẹ nhàng.',
      'Chú ý bật rõ âm đuôi /t/ trong "part", "art", và /st/ trong "relaxed".',
    ];
    practiceSentences = [
      'Music is an essential part of human culture.',
      'Students can relax and focus better on their studies.',
      'It helps young learners develop a natural sense of rhythm.',
    ];
    studentTip = 'Hãy vừa nghe các bài hát tiếng Anh yêu thích vừa nhẩm theo lời để luyện nhịp điệu và ngữ điệu tự nhiên nhất!';
  } else if (isTravelTopic) {
    summary = 'Tài liệu cung cấp các cấu trúc giao tiếp lịch sự khi đặt phòng khách sạn và hỏi đường, giúp học sinh tự tin ứng xử tự nhiên khi du lịch hoặc giao tiếp quốc tế.';
    keyPoints = [
      {
        point: 'Cấu trúc nhờ cậy lịch sự với "Could you please..."',
        explanation: 'Trong tiếng Anh giao tiếp chuẩn mực, thay vì dùng câu mệnh lệnh trực tiếp, người bản xứ thường dùng "Could you please + V?" để thể hiện sự tôn trọng.',
        example: 'Could you please show me the quickest route to the central museum?',
      },
      {
        point: 'Mẫu câu đặt phòng và xác nhận danh tính',
        explanation: 'Cụm từ "under the name of [Tên]" là cách thông dụng nhất để nhân viên lễ tân tìm hồ sơ phòng của khách hàng.',
        example: 'I would like to check in for a double room under the name of Nguyen.',
      },
      {
        point: 'Cách diễn đạt lời cảm ơn chân thành',
        explanation: 'Dùng "Thank you so much for your assistance" tạo ấn tượng nhã nhặn, chuyên nghiệp hơn hẳn câu cảm ơn ngắn.',
        example: 'Thank you so much for your assistance.',
      },
    ];
    coreVocabulary = [
      { word: 'assistance', ipa: '/əˈsɪs.təns/', meaning: 'Sự hỗ trợ, giúp đỡ', contextUsage: 'Thank you for your assistance.' },
      { word: 'route', ipa: '/ruːt/', meaning: 'Lộ trình, tuyến đường', contextUsage: 'What is the quickest route?' },
      { word: 'check in', ipa: '/tʃek ɪn/', meaning: 'Làm thủ tục nhận phòng', contextUsage: 'I would like to check in now.' },
    ];
    pronunciationNotes = [
      'Cụm "check in" thường được nối âm phụ âm sang nguyên âm thành /tʃe-kɪn/.',
      'Chú ý âm /s/ và /t/ trong từ "assistance" /əˈsɪs.təns/, không bỏ quên âm đuôi /s/.',
      'Ngữ điệu câu hỏi "Could you please...?" lên giọng nhẹ ở cuối câu để tăng tính lịch thiệp.',
    ];
    practiceSentences = [
      'Could you please show me the quickest route to the museum?',
      'I would like to check in for a double room under the name of Nguyen.',
      'Thank you so much for your assistance today.',
    ];
    studentTip = 'Thực hành đóng vai (role-play) cùng bạn bè: một bạn làm lễ tân, một bạn làm du khách để tăng phản xạ nói!';
  } else if (isScienceTopic) {
    summary = 'Bài học mở rộng thế giới quan về khoa học tự nhiên và sinh thái, giúp học sinh làm quen với văn phong học thuật và các thuật ngữ mô tả thế giới tự nhiên bằng tiếng Anh.';
    keyPoints = [
      {
        point: 'Khám phá thế giới đại dương và bảo vệ môi trường',
        explanation: 'Tài liệu cung cấp các góc nhìn khoa học về các loài sinh vật biển và tầm quan trọng của việc giữ gìn hệ sinh thái xanh.',
        example: 'Ocean ecosystems are vital for planetary climate balance.',
      },
      {
        point: 'Đọc hiểu văn bản khoa học tiếng Anh',
        explanation: 'Học sinh được rèn thói quen đọc tin tức từ các nguồn uy tín, làm quen với cách trình bày sự thật (facts) và số liệu.',
        example: 'Scientific reports explain natural phenomena clearly.',
      },
      {
        point: 'Cách phân tích từ ghép chuyên ngành',
        explanation: 'Nhận biết tiền tố và hậu tố trong từ vựng khoa học giúp đoán nghĩa từ mới nhanh mà không cần tra từ điển liên tục.',
        example: 'Environment, biodiversity, ecosystems.',
      },
    ];
    coreVocabulary = [
      { word: 'environment', ipa: '/ɪnˈvaɪ.rən.mənt/', meaning: 'Môi trường sống', contextUsage: 'Protecting the marine environment.' },
      { word: 'ecosystem', ipa: '/ˈiː.kəʊˌsɪs.təm/', meaning: 'Hệ sinh thái', contextUsage: 'The ocean is a fragile ecosystem.' },
      { word: 'discovery', ipa: '/dɪˈskʌv.ər.i/', meaning: 'Sự phát hiện, khám phá', contextUsage: 'Exciting scientific discoveries.' },
    ];
    pronunciationNotes = [
      'Từ "environment" có trọng âm chính ở âm tiết thứ hai /-vaɪ-/, chú ý không phát âm sai âm n câm.',
      'Từ "ocean" đọc là /ˈəʊ.ʃən/ với âm /ʃ/ chu môi nhẹ nhàng.',
      'Từ "ecosystem" nhấn trọng âm ở âm tiết đầu /ˈiː-/.',
    ];
    practiceSentences = [
      'Oceans play a crucial role in regulating global climate.',
      'Scientists make fascinating discoveries about marine life every day.',
      'Protecting our natural environment is our shared responsibility.',
    ];
    studentTip = 'Khi đọc bài khoa học, hãy ghi lại 3 từ vựng mới vào sổ tay kèm câu ví dụ thực tế để nhớ lâu hơn!';
  } else {
    // General subject summary
    const firstTitle = sources[0]?.title || 'Tài liệu bài học';
    summary = `Chủ đề "${subjectName}" tập trung củng cố kiến thức ngữ pháp cốt lõi, mở rộng vốn từ vựng theo ngữ cảnh thực tế và rèn luyện kỹ năng phát âm chuẩn xác cho học sinh.`;
    keyPoints = [
      {
        point: 'Củng cố kiến thức bài học bám sát chương trình',
        explanation: 'Học liệu cung cấp ngữ cảnh sinh động giúp học sinh hiểu sâu bản chất bài học thay vì chỉ ghi nhớ máy móc các định nghĩa bề mặt.',
        example: `Trọng tâm từ nguồn học liệu: "${firstTitle}".`,
      },
      {
        point: 'Gắn liền lý thuyết với ứng dụng giao tiếp',
        explanation: 'Mỗi câu văn trong tài liệu đều có thể chuyển hóa thành mẫu câu giao tiếp hoặc câu luyện phát âm thực tế trong phòng AI.',
        example: 'Áp dụng các mẫu câu vào hội thoại thường nhật để phản xạ trôi chảy.',
      },
      {
        point: 'Rèn luyện phản xạ ngữ âm và bật âm đuôi',
        explanation: 'Học sinh Việt Nam thường thiếu âm gió cuối từ. Việc đọc to các câu mẫu giúp rèn luyện cơ hàm và trí nhớ cơ miệng bền vững.',
        example: 'Luôn giữ luồng hơi và bật các âm /t/, /d/, /s/, /z/ ở đuôi từ.',
      },
    ];
    coreVocabulary = [
      { word: 'practice', ipa: '/ˈpræk.tɪs/', meaning: 'Luyện tập, thực hành', contextUsage: 'Daily practice brings confidence.' },
      { word: 'pronunciation', ipa: '/prəˌnʌn.siˈeɪ.ʃən/', meaning: 'Cách phát âm', contextUsage: 'Improve your pronunciation with AI.' },
      { word: 'confidence', ipa: '/ˈkɒn.fɪ.dəns/', meaning: 'Sự tự tin', contextUsage: 'Speak English with high confidence.' },
    ];
    pronunciationNotes = [
      'Chú ý từ "pronunciation" nhấn trọng âm ở vần thứ tư /-eɪ-/, khác với động từ "pronounce".',
      'Luôn nhớ bật âm đuôi /s/ trong "practice" và âm /s/ đuôi trong "confidence".',
      'Đọc câu với nhịp điệu dứt khoát, ngắt nghỉ đúng cụm từ có nghĩa (chunking).',
    ];
    practiceSentences = [
      'Consistent daily practice leads to natural English pronunciation.',
      'Pay close attention to ending sounds and sentence rhythm.',
      'Confidence grows every time you practice speaking out loud.',
    ];
    studentTip = 'Hãy đọc to từng câu văn 2-3 lần trước gương hoặc thu âm giọng mình để so sánh cùng AI Coach!';
  }

  return {
    id: `sum-${Date.now()}`,
    subjectId,
    subjectName,
    targetType,
    targetMaterialTitle: materialTitle,
    sourceCount: sources.length,
    summary,
    keyPoints,
    coreVocabulary,
    pronunciationNotes,
    practiceSentences,
    studentTip,
    createdAt: new Date().toISOString(),
  };
}

// Deterministic Re-generator for study packs (Fallback when Gemini API is unavailable)
function createDeterministicStudyPack(
  subjectId: string,
  subjectName: string,
  sources: any[],
  versionNumber: number = 2
) {
  const stamp = Date.now();
  const nowIso = new Date().toISOString();

  // 1. Re-generate Summary
  const summaryObj = createFallbackSummary(subjectId, subjectName, sources, 'subject');
  const summary = {
    ...summaryObj,
    id: `sum-regen-${stamp}`,
    createdAt: nowIso,
  };

  // 2. Re-generate 5 Flashcards across 5 required groups
  const firstSource = sources[0];
  const topicTitle = firstSource?.title || subjectName;
  const rawCards = createFallbackFlashcards(
    subjectId,
    subjectName,
    topicTitle,
    firstSource?.content || '',
    firstSource?.id
  );

  const flashcards = rawCards.map((c: any, idx: number) => ({
    id: `fc-regen-${stamp}-${idx}`,
    front: c.front,
    back: c.back,
    category: c.category || (['khai_niem', 'dinh_nghia', 'vi_du', 'phan_biet', 'quy_tac'][idx % 5]),
    subjectId,
    subjectName,
    notes: c.notes || 'Thẻ ôn tập từ nguồn học liệu gốc',
    exampleSentence: c.exampleSentence,
    mastered: false,
    reviewCount: 0,
    createdAt: nowIso,
  }));

  // 3. Re-generate Quiz (3-4 trắc nghiệm bám sát nguồn học liệu)
  const combinedText = sources.map((s) => `${s.title} ${s.content}`).join(' ').toLowerCase();
  const isMusic = /music|song|folk|orchestra/i.test(combinedText);
  const isTravel = /hotel|room|check in|route/i.test(combinedText);

  let questions: any[] = [];
  if (isMusic) {
    questions = [
      {
        id: `q-regen-${stamp}-1`,
        type: 'multiple_choice',
        question: 'Từ "orchestra" có trọng âm chính rơi vào âm tiết thứ mấy và âm "ch" phát âm như thế nào?',
        options: [
          'A. Trọng âm 1, âm "ch" phát âm là /k/',
          'B. Trọng âm 2, âm "ch" phát âm là /tʃ/',
          'C. Trọng âm 3, âm "ch" phát âm là /ʃ/',
          'D. Trọng âm 1, âm "ch" phát âm là /tʃ/',
        ],
        correctAnswer: 'A. Trọng âm 1, âm "ch" phát âm là /k/',
        explanation: '"orchestra" phiên âm chuẩn là /ˈɔː.kɪ.strə/, trọng âm 1 và ch phát âm là âm /k/.',
        reviewTip: 'Xem lại phần Pronunciation Notes trong bản tóm tắt.',
      },
      {
        id: `q-regen-${stamp}-2`,
        type: 'multiple_choice',
        question: 'Vai trò chính của các bài hát dân ca truyền thống (traditional folk songs) là gì?',
        options: [
          'A. Chỉ dùng cho biểu diễn thương mại quy mô lớn',
          'B. Lưu giữ câu chuyện văn hóa, tập quán và lịch sử của con người',
          'C. Thay thế hoàn toàn âm nhạc hiện đại trong trường học',
          'D. Phục vụ riêng cho các nghi lễ tôn giáo cổ xưa',
        ],
        correctAnswer: 'B. Lưu giữ câu chuyện văn hóa, tập quán và lịch sử của con người',
        explanation: 'Folk songs tell stories of daily life, customs and history.',
        reviewTip: 'Xem lại Key Point 1 trong tóm tắt.',
      },
      {
        id: `q-regen-${stamp}-3`,
        type: 'multiple_choice',
        question: 'Tại sao việc luyện nghe nhạc cổ điển/giao hưởng lại hỗ trợ học sinh học tập tốt hơn?',
        options: [
          'A. Giúp não bộ thư giãn, tăng khả năng tập trung và tiếp thu kiến thức',
          'B. Khiến học sinh buồn ngủ và không bị căng thẳng',
          'C. Giúp học sinh học thuộc bài mà không cần đọc sách',
          'D. Tăng tốc độ viết chữ của học sinh',
        ],
        correctAnswer: 'A. Giúp não bộ thư giãn, tăng khả năng tập trung và tiếp thu kiến thức',
        explanation: 'Khí nhạc hòa tấu giúp điều hòa nhịp tim, tạo trạng thái thư giãn tập trung (alpha state).',
        reviewTip: 'Ghi nhớ lợi ích của âm nhạc đối với học tập.',
      },
    ];
  } else if (isTravel) {
    questions = [
      {
        id: `q-regen-${stamp}-1`,
        type: 'multiple_choice',
        question: 'Để hỏi đường một cách lịch sự nhất trong tiếng Anh giao tiếp, cấu trúc nào sau đây được ưu tiên?',
        options: [
          'A. Could you please show me the quickest route to...?',
          'B. Tell me where the route is immediately!',
          'C. You must show the route to the museum.',
          'D. Where is it? Talk now.',
        ],
        correctAnswer: 'A. Could you please show me the quickest route to...?',
        explanation: '"Could you please + V...?" thể hiện sự lịch sự và tôn trọng tối đa đối với người nghe.',
        reviewTip: 'Xem lại mẫu câu giao tiếp lịch sự.',
      },
      {
        id: `q-regen-${stamp}-2`,
        type: 'multiple_choice',
        question: 'Khi làm thủ tục nhận phòng khách sạn, cụm từ nối âm nào sau đây thường gặp?',
        options: [
          'A. Check in nối âm thành /tʃe-kɪn/',
          'B. Check in đọc rời rạc từng từ',
          'C. Không phát âm âm /k/',
          'D. Thay thế bằng "Go room"',
        ],
        correctAnswer: 'A. Check in nối âm thành /tʃe-kɪn/',
        explanation: 'Phụ âm kết thúc /k/ nối với nguyên âm đầu /ɪ/ của từ "in".',
        reviewTip: 'Chú ý hiện tượng nối âm phụ âm sang nguyên âm.',
      },
      {
        id: `q-regen-${stamp}-3`,
        type: 'multiple_choice',
        question: 'Cách nói cảm ơn nào sau đây thể hiện sự trang trọng và lịch thiệp cao nhất?',
        options: [
          'A. Thank you so much for your assistance.',
          'B. Thanks a lot, bye.',
          'C. Okay fine.',
          'D. Cool thanks.',
        ],
        correctAnswer: 'A. Thank you so much for your assistance.',
        explanation: 'Từ "assistance" (sự hỗ trợ) trang trọng hơn từ "help" trong bối cảnh du lịch dịch vụ.',
        reviewTip: 'Học từ vựng nâng cao "assistance".',
      },
    ];
  } else {
    questions = [
      {
        id: `q-regen-${stamp}-1`,
        type: 'multiple_choice',
        question: `Nội dung trọng tâm của nguồn học liệu "${topicTitle}" đề cập đến vấn đề gì?`,
        options: [
          `A. Bản chất và ứng dụng cốt lõi của chủ đề ${subjectName}`,
          'B. Một chủ đề hoàn toàn không liên quan đến bài học',
          'C. Lý thuyết trừu tượng không có ví dụ thực tiễn',
          'D. Hướng dẫn sử dụng thiết bị điện tử',
        ],
        correctAnswer: `A. Bản chất và ứng dụng cốt lõi của chủ đề ${subjectName}`,
        explanation: 'Học liệu cung cấp kiến thức nền tảng và phương pháp ôn tập phù hợp.',
        reviewTip: 'Đọc kỹ văn bản nguồn đã lưu.',
      },
      {
        id: `q-regen-${stamp}-2`,
        type: 'multiple_choice',
        question: 'Khi ôn tập bằng thẻ ghi nhớ (Flashcard), nhóm nào sau đây giúp tránh các lỗi sai thường gặp?',
        options: [
          'A. Nhóm Quy tắc & Lưu ý (quy_tac) và Phân biệt (phan_biet)',
          'B. Chỉ cần học nhóm Khái niệm',
          'C. Không cần chú ý các trường hợp ngoại lệ',
          'D. Học vẹt mặt trước bỏ qua mặt sau',
        ],
        correctAnswer: 'A. Nhóm Quy tắc & Lưu ý (quy_tac) và Phân biệt (phan_biet)',
        explanation: 'Nhóm thẻ Phân biệt và Quy tắc giúp học sinh phân định ranh giới kiến thức rõ ràng.',
        reviewTip: 'Ôn kỹ 5 nhóm thẻ ghi nhớ.',
      },
      {
        id: `q-regen-${stamp}-3`,
        type: 'multiple_choice',
        question: 'Quy trình ôn tập hiệu quả nhất khi tiếp cận bài học mới là gì?',
        options: [
          'A. Đọc tóm tắt -> Nắm Key Points -> Ôn Flashcard -> Làm Quiz kiểm tra',
          'B. Làm ngay quiz mà không đọc tài liệu',
          'C. Chỉ học thuộc lòng câu hỏi kiểm tra',
          'D. Bỏ qua việc luyện phát âm và thực hành',
        ],
        correctAnswer: 'A. Đọc tóm tắt -> Nắm Key Points -> Ôn Flashcard -> Làm Quiz kiểm tra',
        explanation: 'Quy trình 4 bước giúp củng cố kiến thức từ tổng quan đến chi tiết và kiểm chứng.',
        reviewTip: 'Thực hiện tuần tự các bước trên giao diện.',
      },
    ];
  }

  const quizzes = [
    {
      id: `quiz-regen-${stamp}`,
      subjectId,
      subjectName,
      title: `Trắc nghiệm ôn tập: ${subjectName} (v${versionNumber})`,
      description: `Bộ câu hỏi trắc nghiệm kiểm tra kiến thức mới nhất tạo từ ${sources.length} nguồn học liệu`,
      questions,
      createdAt: nowIso,
    },
  ];

  // 4. Re-generate QA Seeds (4 câu gợi mở)
  const qaSeeds = [
    {
      id: `seed-regen-${stamp}-1`,
      subjectId,
      question: `Ý nghĩa quan trọng nhất của bài học "${topicTitle}" đối với học sinh là gì?`,
      shortAnswer: `Bài học giúp học sinh hiểu sâu bản chất kiến thức, vận dụng linh hoạt vào bài tập và tự tin giao tiếp phản xạ tự nhiên.`,
      category: 'van_dung' as const,
      categoryLabel: 'Ứng dụng thực tiễn',
      exampleNote: 'Liên hệ với các tình huống giao tiếp đời sống hàng ngày.',
      createdAt: nowIso,
    },
    {
      id: `seed-regen-${stamp}-2`,
      subjectId,
      question: `Những lỗi sai hoặc nhầm lẫn phổ biến nhất cần tránh khi học chủ đề này?`,
      shortAnswer: `Học sinh thường nuốt âm đuôi phụ âm, nhầm lẫn trọng âm hoặc áp dụng sai công thức trong các trường hợp đặc biệt.`,
      category: 'ngu_am' as const,
      categoryLabel: 'Lưu ý cần tránh',
      exampleNote: 'Kiểm tra kỹ các thẻ thuộc nhóm "quy_tac" và "phan_biet".',
      createdAt: nowIso,
    },
    {
      id: `seed-regen-${stamp}-3`,
      subjectId,
      question: `Cách ghi nhớ nhanh các từ vựng cốt lõi trong chủ đề ${subjectName}?`,
      shortAnswer: `Hãy đặt từ vào câu hoàn chỉnh, bật to âm thanh phát âm và liên tưởng đến hình ảnh thực tế thay vì học thuộc nghĩa rời rạc.`,
      category: 'meo_ghi_nho' as const,
      categoryLabel: 'Mẹo ghi nhớ vàng',
      exampleNote: 'Luyện nói câu mẫu 3 lần mỗi sáng.',
      createdAt: nowIso,
    },
    {
      id: `seed-regen-${stamp}-4`,
      subjectId,
      question: `Làm thế nào để ứng dụng kiến thức bài học này vào kỳ thi hoặc kiểm tra?`,
      shortAnswer: `Nắm chắc các key points, giải thích được lý do chọn đáp án trong quiz và ôn lại flashcards trước ngày thi 2 ngày.`,
      category: 'van_dung' as const,
      categoryLabel: 'Chiến thuật ôn thi',
      exampleNote: 'Thực hành làm quiz lại để đạt điểm tuyệt đối.',
      createdAt: nowIso,
    },
  ];

  return {
    versionName: `v${versionNumber}.0 (Re-generated)`,
    summary,
    flashcards,
    quizzes,
    qaSeeds,
  };
}

// Fallback generator if API call encounters network issue or missing key
function createFallbackEvaluation(targetText: string, targetIpa?: string, userTranscript?: string) {
  const match = userTranscript
    ? userTranscript.toLowerCase().trim() === targetText.toLowerCase().trim()
    : true;
  const score = match ? 88 : 72;

  return {
    targetText,
    overallScore: score,
    accuracyScore: match ? 90 : 70,
    stressScore: 82,
    fluencyScore: 80,
    clarityAssessment: match
      ? 'Phát âm rõ ràng, nhận diện từ chính xác. Cần trau chuốt thêm độ bật của âm đuôi và ngữ điệu tự nhiên.'
      : 'Đã nhận diện được nỗ lực phát âm. Cần chú ý nhấn đúng trọng âm và kết thúc âm đuôi dứt khoát hơn.',
    phonemeBreakdown: [
      {
        phoneme: targetIpa ? targetIpa.slice(0, 3) : '/.../',
        soundType: 'Âm đầu & Nguyên âm',
        accuracy: 85,
        status: 'good',
        feedback: 'Khẩu hình mở tương đối chuẩn, âm vang tốt.',
      },
      {
        phoneme: 'Ending Sound',
        soundType: 'Phụ âm đuôi',
        accuracy: match ? 85 : 65,
        status: match ? 'good' : 'needs_work',
        feedback: 'Người học tiếng Việt thường có xu hướng nuốt âm cuối. Hãy nhớ giữ luồng hơi và bật nhẹ âm kết thúc.',
      },
    ],
    detectedErrors: match
      ? ['Âm gió ở đuôi từ chưa thật sự dứt khoát']
      : ['Có dấu hiệu lướt qua âm đuôi hoặc thay đổi trọng âm'],
    mouthPositionAdvice: {
      tongue: 'Đặt đầu lưỡi thả lỏng, chỉ nâng lên chạm chân răng trên khi kết thúc phụ âm.',
      lips: 'Mở khẩu hình tự nhiên theo nguyên âm chính, không ghì chặt cơ cằm.',
      airflow: 'Thở đều từ cơ hoành, giữ luồng hơi liên tục cho đến khi bật âm cuối.',
    },
    personalizedDrill: {
      title: 'Luyện nhấn âm đuôi phản xạ',
      exerciseText: targetText,
      exerciseIpa: targetIpa || '',
      practiceReason: 'Lặp lại 3 lần với tốc độ chậm (0.7x) để cố định trí nhớ cơ miệng.',
    },
    coachNote: 'Bạn đang tiến bộ rất nhanh! Hãy luyện tập chậm rãi và lắng nghe mẫu phát âm bản xứ trước khi thu âm lại.',
    evaluatedAt: new Date().toISOString(),
  };
}

// Vite integration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EchoLingo AI Server running on port ${PORT}`);
  });
}

startServer();
