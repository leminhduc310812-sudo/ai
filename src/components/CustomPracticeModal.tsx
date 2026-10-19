import React, { useState } from 'react';
import { X, Sparkles, Send, BookOpen } from 'lucide-react';

interface CustomPracticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (text: string, ipa?: string, translation?: string) => void;
}

const QUICK_SUGGESTIONS = [
  { text: 'Three thin thieves thought a thousand thoughts', ipa: '/θriː θɪn θiːvz θɔːt ə ˈθaʊzənd θɔːts/', translation: 'Câu luyện âm /θ/ kinh điển' },
  { text: 'Specifically designed for international business', ipa: '/spəˈsɪf.ɪ.kli dɪˈzaɪnd fər ˌɪn.təˈnæʃ.ən.əl ˈbɪz.nɪs/', translation: 'Luyện trọng âm & âm đuôi công sở' },
  { text: 'Could you give me a hand with this project?', ipa: '/kʊdʒuː ɡɪv miː ə hænd wɪð ðɪs ˈprɒdʒ.ekt/', translation: 'Luyện nối âm tự nhiên' },
  { text: 'World-class architecture and extraordinary results', ipa: '/ˌwɜːld ˈklɑːs ˈɑː.kɪ.tek.tʃər ænd ɪkˈstrɔː.dɪn.ri rɪˈzʌlts/', translation: 'Luyện âm cuộn lưỡi /r/ và /ks/' },
];

export const CustomPracticeModal: React.FC<CustomPracticeModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [inputText, setInputText] = useState('');
  const [inputIpa, setInputIpa] = useState('');
  const [inputTranslation, setInputTranslation] = useState('');

  // Đóng modal khi nhấn Escape
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSubmit(inputText.trim(), inputIpa.trim(), inputTranslation.trim());
    setInputText('');
    setInputIpa('');
    setInputTranslation('');
    onClose();
  };

  const handleSelectSuggestion = (s: { text: string; ipa: string; translation: string }) => {
    onSubmit(s.text, s.ipa, s.translation);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-sky-400" />
          <h3 className="text-lg font-bold text-white">Luyện Từ Hoặc Câu Tự Chọn</h3>
        </div>
        <p className="text-xs text-slate-400 mb-5">
          Nhập bất kỳ từ vựng hoặc câu tiếng Anh nào bạn muốn kiểm tra phát âm và nhận xét bằng AI.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Câu hoặc từ tiếng Anh (Bắt buộc):
            </label>
            <input
              id="custom-text-input"
              type="text"
              required
              autoFocus
              placeholder="Ví dụ: Particularly challenging pronunciation..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Phiên âm IPA (Tùy chọn):
              </label>
              <input
                id="custom-ipa-input"
                type="text"
                placeholder="Ví dụ: /pəˈtɪk.jə.lə.li/"
                value={inputIpa}
                onChange={(e) => setInputIpa(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Nghĩa tiếng Việt (Tùy chọn):
              </label>
              <input
                id="custom-trans-input"
                type="text"
                placeholder="Nghĩa tóm tắt..."
                value={inputTranslation}
                onChange={(e) => setInputTranslation(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <button
            id="btn-submit-custom"
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 active:scale-95 text-white font-bold text-sm shadow-md shadow-sky-500/25 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Bắt đầu luyện tập ngay</span>
          </button>
        </form>

        {/* Quick Suggestion Chips */}
        <div className="mt-5 pt-4 border-t border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 block mb-2">
            Gợi ý câu luyện thử nhanh:
          </span>
          <div className="space-y-1.5">
            {QUICK_SUGGESTIONS.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectSuggestion(s)}
                className="w-full text-left p-2 rounded-lg bg-slate-800/40 hover:bg-slate-800 border border-slate-800/80 transition-all flex items-center justify-between gap-2 text-xs group cursor-pointer"
              >
                <div className="min-w-0 flex-1">
                  <span className="text-slate-200 font-medium group-hover:text-sky-300 truncate block">
                    {s.text}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {s.translation}
                  </span>
                </div>
                <BookOpen className="w-3.5 h-3.5 text-slate-500 group-hover:text-sky-400" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
