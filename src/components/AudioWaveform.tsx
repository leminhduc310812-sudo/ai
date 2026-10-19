import React from 'react';

interface AudioWaveformProps {
  isRecording: boolean;
  isEvaluating: boolean;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({ isRecording, isEvaluating }) => {
  if (!isRecording && !isEvaluating) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-1 py-3 px-4 rounded-xl bg-slate-900/80 border border-slate-800">
      <div className="flex items-center gap-1 h-6">
        {[24, 40, 18, 48, 28, 56, 32, 44, 20, 50, 36, 22].map((height, idx) => (
          <span
            key={idx}
            className={`w-1 rounded-full transition-all duration-150 ${
              isRecording
                ? 'bg-rose-500 animate-pulse'
                : 'bg-sky-400 animate-bounce'
            }`}
            style={{
              height: isRecording ? `${height * 0.45}px` : `${(idx % 4 + 2) * 5}px`,
              animationDelay: `${idx * 0.08}s`,
            }}
          />
        ))}
      </div>
      <span className="text-xs font-medium text-slate-300 ml-2">
        {isRecording ? 'Đang lắng nghe phát âm của bạn...' : 'AI đang phân tích khẩu hình & ngữ âm...'}
      </span>
    </div>
  );
};
