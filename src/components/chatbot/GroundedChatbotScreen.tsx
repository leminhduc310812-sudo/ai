import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  BookOpen,
  Layers,
  HelpCircle,
  FileText,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Volume2,
  Trash2,
  Info,
} from 'lucide-react';
import {
  StudySubject,
  StudyMaterialSource,
  StudySummary,
  FlashcardItem,
  QaSeedItem,
  QuizItem,
  ChatMessage,
  GroundedContextPayload,
} from '../../types';

interface GroundedChatbotScreenProps {
  subjects: StudySubject[];
  currentSubjectId: string;
  onSelectSubject: (id: string) => void;
  materials: StudyMaterialSource[];
  summaries: StudySummary[];
  flashcards: FlashcardItem[];
  qaSeeds: QaSeedItem[];
  quizzes: QuizItem[];
  initialPrompt?: string;
  onNavigateToMaterials?: () => void;
  onNavigateToFlashcards?: () => void;
  onNavigateToQuiz?: () => void;
}

export const GroundedChatbotScreen: React.FC<GroundedChatbotScreenProps> = ({
  subjects,
  currentSubjectId,
  onSelectSubject,
  materials,
  summaries,
  flashcards,
  qaSeeds,
  quizzes,
  initialPrompt,
  onNavigateToMaterials,
  onNavigateToFlashcards,
  onNavigateToQuiz,
}) => {
  const currentSubject = subjects.find((s) => s.id === currentSubjectId) || subjects[0];

  // 1. Filter Sources for current subject
  const currentSources = useMemo(() => {
    return materials.filter((m) => m.subjectId === currentSubjectId);
  }, [materials, currentSubjectId]);

  // 2. Filter Analysis Preview for current subject
  const currentAnalysis = useMemo(() => {
    return summaries.find((s) => s.subjectId === currentSubjectId) || null;
  }, [summaries, currentSubjectId]);

  // 3. Filter Study Pack for current subject
  const currentFlashcards = useMemo(() => {
    return flashcards.filter((f) => f.subjectId === currentSubjectId);
  }, [flashcards, currentSubjectId]);

  const currentQaSeeds = useMemo(() => {
    return qaSeeds.filter((q) => q.subjectId === currentSubjectId);
  }, [qaSeeds, currentSubjectId]);

  const currentQuizQuestions = useMemo(() => {
    const matched = quizzes.filter((qz) => qz.subjectId === currentSubjectId);
    return matched.flatMap((qz) => qz.questions || []);
  }, [quizzes, currentSubjectId]);

  // Construct Grounded Context Payload
  const groundedContext: GroundedContextPayload = useMemo(() => {
    return {
      subjectId: currentSubject.id,
      subjectName: currentSubject.name,
      sources: currentSources.map((s) => ({
        id: s.id,
        title: s.title,
        content: s.content,
        notes: s.notes,
        tags: s.tags,
      })),
      analysisPreview: currentAnalysis
        ? {
            summary: currentAnalysis.summary,
            keyPoints: currentAnalysis.keyPoints || [],
            coreVocabulary: currentAnalysis.coreVocabulary || [],
            pronunciationNotes: currentAnalysis.pronunciationNotes || [],
            practiceSentences: currentAnalysis.practiceSentences || [],
            studentTip: currentAnalysis.studentTip,
          }
        : null,
      studyPack: {
        flashcards: currentFlashcards.map((f) => ({
          front: f.front,
          back: f.back,
          category: f.category,
          notes: f.notes,
          exampleSentence: f.exampleSentence,
        })),
        qaSeeds: currentQaSeeds.map((q) => ({
          question: q.question,
          shortAnswer: q.shortAnswer,
          categoryLabel: q.categoryLabel,
          exampleNote: q.exampleNote,
        })),
        quizQuestions: currentQuizQuestions.map((qz) => ({
          question: qz.question,
          correctAnswer: qz.correctAnswer,
          explanation: qz.explanation,
          reviewTip: qz.reviewTip,
        })),
      },
    };
  }, [
    currentSubject,
    currentSources,
    currentAnalysis,
    currentFlashcards,
    currentQaSeeds,
    currentQuizQuestions,
  ]);

  // Chat conversation state
  const storageKey = `echolingo_chat_history_${currentSubjectId}`;
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load chat history:', e);
    }

    // Default welcome message strictly grounded
    return [
      {
        id: 'msg-welcome',
        sender: 'assistant',
        text: `Chào em! Thầy là Trợ lý Gia sư Ôn bài cho chủ đề "${currentSubject.name}".\n\nThầy đã tiếp nhận đầy đủ tài liệu học tập của chủ đề này (gồm ${currentSources.length} học liệu nguồn, bản phân tích cốt lõi, cùng ${currentFlashcards.length} thẻ flashcard và ${currentQaSeeds.length} câu hỏi gợi mở).\n\nEm hãy đặt câu hỏi để ôn bài nhé! Nếu câu hỏi nằm ngoài tài liệu đã cung cấp, thầy sẽ thông báo rõ ràng để em tập trung đúng trọng tâm bài học.`,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        isGrounded: true,
        groundedSourceTags: ['Tài liệu chủ đề hiện tại'],
      },
    ];
  });

  const [inputText, setInputText] = useState(initialPrompt || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isContextDrawerOpen, setIsContextDrawerOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Sync chat history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch (e) {
      console.warn('Failed to save chat history:', e);
    }
  }, [messages, storageKey]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Handle Initial Prompt if passed
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      setInputText(initialPrompt.trim());
      inputRef.current?.focus();
    }
  }, [initialPrompt]);

  // Send question to grounded API
  const handleSendMessage = async (textToSend?: string) => {
    const question = (textToSend || inputText).trim();
    if (!question || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      text: question,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chatbot/grounded-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          history: messages.slice(-6).map((m) => ({ sender: m.sender, text: m.text })),
          context: groundedContext,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: `msg-bot-${Date.now()}`,
        sender: 'assistant',
        text: data.answer || 'Nội dung này nằm ngoài phạm vi tài liệu đã cung cấp.',
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        isGrounded: Boolean(data.isGrounded),
        isOutOfScope: Boolean(data.isOutOfScope),
        groundedSourceTags: data.groundedSourceTags || [],
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      // Fallback response strictly compliant with grounding instruction
      const assistantMessage: ChatMessage = {
        id: `msg-bot-${Date.now()}`,
        sender: 'assistant',
        text: 'Nội dung này nằm ngoài phạm vi tài liệu đã cung cấp. Em hãy đặt câu hỏi liên quan đến bài đọc hoặc các từ vựng cốt lõi của chủ đề hiện tại nhé!',
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        isGrounded: false,
        isOutOfScope: true,
        groundedSourceTags: [],
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Bạn có muốn xóa toàn bộ lịch sử hỏi đáp của chủ đề này?')) {
      const resetMsg: ChatMessage[] = [
        {
          id: `msg-reset-${Date.now()}`,
          sender: 'assistant',
          text: `Đã làm mới cuộc trò chuyện. Em hãy đặt câu hỏi để ôn tập bài học "${currentSubject.name}". Thầy chỉ trả lời trong phạm vi các tài liệu đã cung cấp nhé!`,
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          isGrounded: true,
          groundedSourceTags: ['Tài liệu chủ đề hiện tại'],
        },
      ];
      setMessages(resetMsg);
      localStorage.setItem(storageKey, JSON.stringify(resetMsg));
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Text-To-Speech for responses
  const handleSpeakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const isEnglish = /[a-zA-Z]{5,}/.test(text) && !/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(text);
    utterance.lang = isEnglish ? 'en-US' : 'vi-VN';
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  // Sample quick questions from Q&A seeds and Keypoints
  const suggestedQuestions = useMemo(() => {
    const list: string[] = [];
    if (currentQaSeeds.length > 0) {
      list.push(...currentQaSeeds.slice(0, 3).map((q) => q.question));
    }
    if (currentAnalysis?.keyPoints && currentAnalysis.keyPoints.length > 0) {
      list.push(`Điểm cốt lõi về "${currentAnalysis.keyPoints[0].point}" là gì?`);
    }
    if (currentFlashcards.length > 0) {
      list.push(currentFlashcards[0].front);
    }
    return list.slice(0, 4);
  }, [currentQaSeeds, currentAnalysis, currentFlashcards]);

  return (
    <div id="grounded-chatbot-screen" className="space-y-4 animate-fade-in max-w-4xl mx-auto">
      {/* 1. Header Banner: Giới thiệu & Cam kết Grounded chặt chẽ */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-indigo-800/40 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5" />
                Gia Sư Ôn Bài Grounded (Chủ đề hiện tại)
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Chống Lan Man • Bám Sát Bài Học
              </span>
            </div>

            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white tracking-tight font-['Space_Grotesk']">
              Hỏi Đáp Trực Tuyến: {currentSubject.name}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Trợ lý được nạp dữ liệu độc quyền từ <strong className="text-white">học liệu nguồn (sources)</strong>, <strong className="text-white">bản tóm tắt (analysisPreview)</strong> và <strong className="text-white">bộ ôn tập (studyPack)</strong>. Mọi câu hỏi không có trong bài sẽ được từ chối ngay để giúp em tập trung cao độ!
            </p>
          </div>

          {/* Quick Context Scope Toggle */}
          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            <button
              onClick={() => setIsContextDrawerOpen(!isContextDrawerOpen)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition-colors cursor-pointer"
              title="Xem danh sách tài liệu đang được chatbot sử dụng"
            >
              <Info className="w-3.5 h-3.5 text-sky-400" />
              <span>Xem phạm vi tài liệu</span>
              {isContextDrawerOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            <button
              onClick={handleClearHistory}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-700 text-xs transition-colors cursor-pointer"
              title="Xóa lịch sử cuộc trò chuyện này"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3 Scope Indicator Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-4 mt-4 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <FileText className="w-4 h-4 text-sky-400 shrink-0" />
            <div className="truncate">
              <span className="text-[10px] text-slate-400 block font-medium">1. Nguồn học liệu (sources)</span>
              <strong className="text-white text-xs">{currentSources.length} bài đọc / tài liệu</strong>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
            <div className="truncate">
              <span className="text-[10px] text-slate-400 block font-medium">2. Phân tích (analysisPreview)</span>
              <strong className="text-white text-xs">
                {currentAnalysis ? `${currentAnalysis.keyPoints.length} điểm cốt lõi` : 'Bản tóm tắt chủ đề'}
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <Layers className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="truncate">
              <span className="text-[10px] text-slate-400 block font-medium">3. Bộ ôn tập (studyPack)</span>
              <strong className="text-white text-xs">
                {currentFlashcards.length} thẻ & {currentQaSeeds.length} Q&A
              </strong>
            </div>
          </div>
        </div>

        {/* Expandable Context Scope Drawer */}
        {isContextDrawerOpen && (
          <div className="mt-4 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs space-y-3 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-white flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-sky-400" />
                Chi tiết phạm vi tài liệu hiện tại:
              </span>
              <span className="text-[11px] text-slate-400">
                Chỉ những nội dung này được phép sử dụng để trả lời
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Scope 1: Sources */}
              <div className="space-y-1">
                <span className="font-semibold text-sky-400 block">📚 Sources:</span>
                {currentSources.length === 0 ? (
                  <p className="text-slate-400 italic">Chưa có bài đọc nào.</p>
                ) : (
                  <ul className="space-y-1 max-h-32 overflow-y-auto pr-1">
                    {currentSources.map((s) => (
                      <li key={s.id} className="text-slate-300 bg-slate-900/80 p-1.5 rounded-lg border border-slate-800 truncate">
                        • {s.title}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Scope 2: Analysis Preview */}
              <div className="space-y-1">
                <span className="font-semibold text-indigo-400 block">📊 Analysis Preview:</span>
                {currentAnalysis ? (
                  <div className="text-slate-300 bg-slate-900/80 p-2 rounded-lg border border-slate-800 text-[11px] leading-relaxed max-h-32 overflow-y-auto">
                    <p className="line-clamp-3 mb-1">{currentAnalysis.summary}</p>
                    <span className="text-slate-400">
                      Từ vựng: {currentAnalysis.coreVocabulary.map((v) => v.word).join(', ')}
                    </span>
                  </div>
                ) : (
                  <p className="text-slate-400 italic">Chưa có tóm tắt.</p>
                )}
              </div>

              {/* Scope 3: Study Pack */}
              <div className="space-y-1">
                <span className="font-semibold text-emerald-400 block">🃏 Study Pack:</span>
                <div className="text-slate-300 bg-slate-900/80 p-2 rounded-lg border border-slate-800 text-[11px] leading-relaxed max-h-32 overflow-y-auto">
                  <p>• {currentFlashcards.length} thẻ flashcard</p>
                  <p>• {currentQaSeeds.length} câu hỏi gợi mở Q&A</p>
                  <p>• {currentQuizQuestions.length} câu hỏi trắc nghiệm</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Subject Filter Tabs (Chuyển đổi môn học nhanh) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none bg-slate-900/60 p-2 rounded-2xl border border-slate-800">
        <span className="text-xs text-slate-400 font-semibold pl-2 whitespace-nowrap">
          Đổi chủ đề:
        </span>
        {subjects.map((sub) => {
          const isSelected = sub.id === currentSubjectId;
          return (
            <button
              key={sub.id}
              onClick={() => onSelectSubject(sub.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 ring-1 ring-indigo-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {sub.name.split('(')[0].trim()}
            </button>
          );
        })}
      </div>

      {/* 3. Conversation History Area (Vùng hiển thị lịch sử hỏi đáp) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl flex flex-col min-h-[420px] max-h-[580px] overflow-hidden">
        {/* Messages scrollable area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 sm:pr-2 scrollbar-thin">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';

            return (
              <div
                key={msg.id}
                className={`flex gap-3 animate-fade-in ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-600/20 mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-[85%] sm:max-w-[78%] space-y-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
                  {/* Sender label & Timestamp */}
                  <div className={`flex items-center gap-2 text-[10px] text-slate-400 ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <span className="font-semibold text-slate-300">
                      {isUser ? 'Em' : 'Gia Sư Ôn Bài EchoLingo'}
                    </span>
                    <span>• {msg.timestamp}</span>

                    {/* Out of scope badge */}
                    {msg.isOutOfScope && (
                      <span className="px-1.5 py-0.2 rounded-md bg-rose-500/15 text-rose-300 border border-rose-500/30 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        Ngoài tài liệu
                      </span>
                    )}

                    {/* Grounded verified badge */}
                    {msg.isGrounded && !msg.isOutOfScope && !isUser && (
                      <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-medium flex items-center gap-1">
                        <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                        Đã xác thực tài liệu
                      </span>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-line ${
                      isUser
                        ? 'bg-sky-600 text-white rounded-tr-none shadow-md shadow-sky-600/15'
                        : msg.isOutOfScope
                        ? 'bg-rose-950/25 border border-rose-500/40 text-rose-100 rounded-tl-none shadow-md'
                        : 'bg-slate-800/90 border border-slate-700/80 text-slate-100 rounded-tl-none shadow-md'
                    }`}
                  >
                    {/* Out of scope prompt highlight */}
                    {msg.isOutOfScope && (
                      <div className="flex items-center gap-1.5 font-bold text-rose-400 mb-2 pb-1.5 border-b border-rose-500/30 text-xs">
                        <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>Phát hiện câu hỏi ngoài phạm vi tài liệu:</span>
                      </div>
                    )}

                    {msg.text}

                    {/* Source tags citations if grounded */}
                    {msg.groundedSourceTags && msg.groundedSourceTags.length > 0 && !msg.isOutOfScope && (
                      <div className="mt-3 pt-2 border-t border-slate-700/60 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-slate-400 font-medium">Căn cứ:</span>
                        {msg.groundedSourceTags.map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            className="px-2 py-0.5 rounded-md bg-slate-900/80 text-sky-300 border border-sky-500/20 text-[10px] font-semibold"
                          >
                            ✓ {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Assistant Message Actions (Copy & Read Aloud) */}
                  {!isUser && (
                    <div className="flex items-center gap-2 pt-0.5 pl-1">
                      <button
                        onClick={() => handleCopyText(msg.text, msg.id)}
                        className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer transition-colors"
                        title="Sao chép nội dung"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Đã chép</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Sao chép</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleSpeakText(msg.text)}
                        className="text-[10px] text-slate-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer transition-colors"
                        title="Đọc to câu trả lời"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>Nghe đọc</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Thinking / Loading Indicator */}
          {isLoading && (
            <div className="flex gap-3 justify-start animate-fade-in">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white shrink-0 shadow-md">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-slate-800/90 border border-slate-700/80 p-3.5 rounded-2xl rounded-tl-none text-xs text-slate-300 flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]" />
                </div>
                <span>Đang tra cứu học liệu nguồn, bản phân tích và bộ ôn tập...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 4. Quick Starter Questions Chips */}
        {suggestedQuestions.length > 0 && (
          <div className="pt-3 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1.5">
              <Lightbulb className="w-3 h-3 text-amber-400" />
              <span>Gợi ý câu hỏi ôn tập có trong bài (Bấm để hỏi ngay):</span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {suggestedQuestions.map((qText, qIdx) => (
                <button
                  key={qIdx}
                  onClick={() => handleSendMessage(qText)}
                  disabled={isLoading}
                  className="px-2.5 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 text-[11px] whitespace-nowrap transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                >
                  💬 {qText}
                </button>
              ))}

              {/* Sample test button to verify out-of-scope rejection */}
              <button
                onClick={() => handleSendMessage('Thủ đô của nước Pháp là thành phố nào?')}
                disabled={isLoading}
                className="px-2.5 py-1 rounded-xl bg-rose-950/30 hover:bg-rose-950/50 text-rose-300 border border-rose-500/30 text-[11px] whitespace-nowrap transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                title="Bấm để kiểm thử tính năng từ chối câu hỏi ngoài tài liệu"
              >
                🧪 Thử câu hỏi ngoài tài liệu
              </button>
            </div>
          </div>
        )}

        {/* 5. Question Input Area (Khung nhập câu hỏi) */}
        <div className="pt-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="relative flex items-end gap-2"
          >
            <div className="relative flex-1">
              <textarea
                ref={inputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập câu hỏi để ôn bài (ví dụ: Giải thích quy tắc đuôi -ed, từ vựng orchestra nghĩa là gì...)..."
                rows={2}
                disabled={isLoading}
                className="w-full px-4 py-2.5 bg-slate-800/90 border border-slate-700 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none transition-all disabled:opacity-50"
              />
              <span className="absolute right-3 bottom-2 text-[10px] text-slate-400 hidden sm:inline">
                Enter để gửi • Shift+Enter để xuống dòng
              </span>
            </div>

            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="p-3 bg-gradient-to-r from-indigo-600 to-sky-500 hover:from-indigo-500 hover:to-sky-400 active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-white rounded-2xl shadow-lg shadow-indigo-600/25 transition-all cursor-pointer shrink-0"
              title="Gửi câu hỏi"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
