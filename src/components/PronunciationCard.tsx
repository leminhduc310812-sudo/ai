import React, { useState, useRef, useEffect } from 'react';
import { Volume2, Mic, MicOff, RotateCcw, Sparkles, HelpCircle, CheckCircle2, ChevronRight, Play } from 'lucide-react';
import { PracticeItem, AiEvaluationResult } from '../types';
import { speakText, blobToBase64, createSpeechRecognizer } from '../utils/audioUtils';
import { AudioWaveform } from './AudioWaveform';

interface PronunciationCardProps {
  item: PracticeItem;
  onEvaluate: (payload: {
    targetText: string;
    targetIpa: string;
    userTranscript: string;
    audioBase64?: string;
    difficultyLevel: string;
    focusArea: string;
  }) => Promise<void>;
  isEvaluating: boolean;
  onNextItem: () => void;
  hasEvaluation: boolean;
}

export const PronunciationCard: React.FC<PronunciationCardProps> = ({
  item,
  onEvaluate,
  isEvaluating,
  onNextItem,
  hasEvaluation,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [userTranscript, setUserTranscript] = useState<string>('');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const recognizerRef = useRef<any>(null);

  // Reset state when item changes
  useEffect(() => {
    setIsRecording(false);
    setRecordedAudioUrl(null);
    setAudioBase64(null);
    setUserTranscript('');
    setRecordingSeconds(0);
    setMicError(null);
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, [item.id]);

  const handleListen = async (speed: number) => {
    setIsPlayingAudio(true);
    setPlaybackSpeed(speed);
    await speakText(item.text, speed);
    setIsPlayingAudio(false);
  };

  const startRecording = async () => {
    setMicError(null);
    setUserTranscript('');
    setRecordedAudioUrl(null);
    setAudioBase64(null);
    audioChunksRef.current = [];

    // Initialize Web Speech Recognition if available
    const recognizer = createSpeechRecognizer(
      (transcript, isFinal) => {
        setUserTranscript(transcript);
      },
      (err) => {
        console.warn('Speech recognition warning:', err);
      }
    );

    if (recognizer) {
      recognizerRef.current = recognizer;
      try {
        recognizer.start();
      } catch (e) {
        console.warn('Speech recognition start error:', e);
      }
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(url);

        try {
          const b64 = await blobToBase64(audioBlob);
          setAudioBase64(b64);
        } catch (e) {
          console.warn('Could not encode base64 audio:', e);
        }

        // Stop all tracks in stream
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 12) {
            stopRecording();
            return 12;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      console.warn('Mic access error, falling back to simulated input:', err);
      setMicError('Không thể mở micro trong chế độ xem này. Bạn có thể tự nhập văn bản bạn vừa nói hoặc nhấn "Mẫu phát âm thử" bên dưới.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);

    if (recognizerRef.current) {
      try {
        recognizerRef.current.stop();
      } catch (e) {
        // ignore
      }
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleRequestAiEvaluation = () => {
    onEvaluate({
      targetText: item.text,
      targetIpa: item.ipa,
      userTranscript: userTranscript || item.text, // fallback if recognition wasn't captured
      audioBase64: audioBase64 || undefined,
      difficultyLevel: item.level,
      focusArea: item.focusSound,
    });
  };

  return (
    <div id="pronunciation-card" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
            {item.focusSound}
          </span>
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-800 text-slate-400 capitalize">
            {item.level}
          </span>
        </div>

        <button
          id="btn-next-practice"
          onClick={onNextItem}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <span>Bài tiếp</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Target Word / Phrase Display */}
      <div className="text-center py-6 border-y border-slate-800/80 my-2">
        <h2 id="target-text-display" className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-2 font-['Space_Grotesk']">
          {item.text}
        </h2>

        <div className="flex items-center justify-center gap-3 text-sky-400 font-mono text-lg sm:text-xl">
          <span>{item.ipa}</span>
        </div>

        <p className="text-sm text-slate-400 mt-2 italic">
          "{item.translation}"
        </p>

        {item.exampleSentence && (
          <div className="mt-4 inline-block max-w-md px-4 py-2 rounded-xl bg-slate-800/60 border border-slate-700/40 text-xs text-slate-300">
            <span className="text-slate-500 font-medium">Ngữ cảnh: </span>
            <span>{item.exampleSentence}</span>
          </div>
        )}
      </div>

      {/* Native Listen & Tips Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
        {/* Listen Native Buttons */}
        <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3 flex flex-col justify-center gap-2">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-sky-400" />
            Nghe phát âm bản xứ:
          </span>
          <div className="flex items-center gap-2">
            <button
              id="btn-listen-normal"
              onClick={() => handleListen(1.0)}
              disabled={isPlayingAudio}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isPlayingAudio && playbackSpeed === 1.0
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Chuẩn (1.0x)</span>
            </button>

            <button
              id="btn-listen-slow"
              onClick={() => handleListen(0.7)}
              disabled={isPlayingAudio}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isPlayingAudio && playbackSpeed === 0.7
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Chậm (0.7x)</span>
            </button>
          </div>
        </div>

        {/* Pronunciation Tip */}
        <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3 flex flex-col justify-center">
          <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5 mb-1">
            <HelpCircle className="w-3.5 h-3.5" />
            Mẹo đặt khẩu hình:
          </span>
          <p className="text-xs text-slate-300 leading-relaxed">
            {item.tip}
          </p>
        </div>
      </div>

      {/* Audio Waveform status */}
      <AudioWaveform isRecording={isRecording} isEvaluating={isEvaluating} />

      {/* Recording & Speech Analysis Workspace */}
      <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-col items-center">
        {micError && (
          <div className="w-full mb-3 p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs">
            <p className="font-semibold mb-1">Lưu ý về Micro:</p>
            <p>{micError}</p>
          </div>
        )}

        {/* Live speech transcription badge if recognized */}
        {userTranscript && (
          <div className="w-full mb-3 p-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-center">
            <span className="text-[11px] text-slate-400 block mb-0.5">Văn bản nhận diện giọng nói:</span>
            <span className="text-sm font-semibold text-sky-300">"{userTranscript}"</span>
          </div>
        )}

        {/* Recording Audio Preview if captured */}
        {recordedAudioUrl && !isRecording && (
          <div className="flex items-center gap-3 mb-4 w-full max-w-sm">
            <audio src={recordedAudioUrl} controls className="w-full h-8" />
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-center gap-3 w-full">
          {!isRecording ? (
            <button
              id="btn-start-record"
              onClick={startRecording}
              disabled={isEvaluating}
              className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 active:scale-95 text-white font-bold text-sm shadow-lg shadow-rose-600/25 transition-all cursor-pointer disabled:opacity-50"
            >
              <Mic className="w-4 h-4 text-white" />
              <span>Bấm để Thu âm phát âm</span>
            </button>
          ) : (
            <button
              id="btn-stop-record"
              onClick={stopRecording}
              className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-rose-600 animate-pulse text-white font-bold text-sm shadow-lg shadow-rose-600/40 transition-all cursor-pointer"
            >
              <MicOff className="w-4 h-4 text-white" />
              <span>Dừng thu âm ({recordingSeconds}s)</span>
            </button>
          )}

          {/* AI Assessment Button */}
          <button
            id="btn-evaluate-ai"
            onClick={handleRequestAiEvaluation}
            disabled={isEvaluating || isRecording}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              recordedAudioUrl || userTranscript
                ? 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-lg shadow-sky-500/20'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            } disabled:opacity-50`}
          >
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span>
              {isEvaluating ? 'AI đang phân tích...' : 'Xem xét tập bằng AI'}
            </span>
          </button>
        </div>

        {/* Quick speech input toggle if user wants to test custom attempt */}
        <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
          <span>Hoặc gõ/chỉnh sửa cách bạn vừa nói:</span>
          <input
            id="input-user-transcript"
            type="text"
            placeholder={item.text}
            value={userTranscript}
            onChange={(e) => setUserTranscript(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-md px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>
    </div>
  );
};
