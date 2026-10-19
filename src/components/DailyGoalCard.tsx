import React, { useState } from 'react';
import { Target, CheckCircle2, Trophy, Flame, Settings2, Sparkles, ChevronRight, Zap } from 'lucide-react';
import { PracticeGoal, UserPracticeHistoryItem } from '../types';

interface DailyGoalCardProps {
  goal: PracticeGoal;
  onUpdateGoal: (newGoal: PracticeGoal) => void;
  todayHistory: UserPracticeHistoryItem[];
  streakDays: number;
}

export const DailyGoalCard: React.FC<DailyGoalCardProps> = ({
  goal,
  onUpdateGoal,
  todayHistory,
  streakDays,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempTarget, setTempTarget] = useState(goal.dailyTarget);
  const [tempScore, setTempScore] = useState(goal.minTargetScore);
  const [tempFocus, setTempFocus] = useState(goal.focusPhoneme);

  const completedToday = todayHistory.length;
  const progressPercent = Math.min(100, Math.round((completedToday / goal.dailyTarget) * 100));
  const isGoalAchieved = completedToday >= goal.dailyTarget;

  const qualifiedCount = todayHistory.filter((h) => h.overallScore >= goal.minTargetScore).length;

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateGoal({
      ...goal,
      dailyTarget: tempTarget,
      minTargetScore: tempScore,
      focusPhoneme: tempFocus,
    });
    setIsEditing(false);
  };

  return (
    <div id="daily-goal-card" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
      {/* Decorative gradient highlight */}
      <div className={`absolute -top-16 -right-16 w-36 h-36 rounded-full blur-2xl pointer-events-none ${
        isGoalAchieved ? 'bg-emerald-500/15' : 'bg-sky-500/10'
      }`} />

      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${isGoalAchieved ? 'bg-emerald-500/20 text-emerald-400' : 'bg-sky-500/20 text-sky-400'}`}>
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Mục Tiêu Luyện Tập
            </h3>
            <span className="text-[11px] text-slate-400">
              Tiến độ cá nhân trong ngày
            </span>
          </div>
        </div>

        <button
          id="btn-edit-goal"
          onClick={() => {
            setTempTarget(goal.dailyTarget);
            setTempScore(goal.minTargetScore);
            setTempFocus(goal.focusPhoneme);
            setIsEditing(!isEditing);
          }}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2 py-1 rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
          title="Tùy chỉnh mục tiêu"
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span className="text-[11px]">{isEditing ? 'Đóng' : 'Cài đặt'}</span>
        </button>
      </div>

      {/* Edit Form Drawer */}
      {isEditing ? (
        <form onSubmit={handleSaveGoal} className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 my-2 space-y-3 animate-fade-in text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Số câu mục tiêu mỗi ngày:
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[3, 5, 10, 15].map((num) => (
                <button
                  type="button"
                  key={num}
                  onClick={() => setTempTarget(num)}
                  className={`py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    tempTarget === num
                      ? 'bg-sky-500 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
                  }`}
                >
                  {num} câu
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Điểm số chuẩn tối thiểu ({tempScore}%):
            </label>
            <input
              type="range"
              min={60}
              max={95}
              step={5}
              value={tempScore}
              onChange={(e) => setTempScore(Number(e.target.value))}
              className="w-full accent-sky-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>60% (Cơ bản)</span>
              <span>80% (Chuẩn)</span>
              <span>95% (Bản xứ)</span>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Âm mục tiêu trọng tâm cần sửa:
            </label>
            <select
              value={tempFocus}
              onChange={(e) => setTempFocus(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-sky-500"
            >
              <option value="Âm đuôi /t/, /d/, /s/">Âm đuôi /t/, /d/, /s/</option>
              <option value="Âm vô thanh /θ/ (Think, Thought)">Âm vô thanh /θ/ (Think, Thought)</option>
              <option value="Cặp âm /iː/ vs /ɪ/ (Sheep vs Ship)">Cặp âm /iː/ vs /ɪ/ (Sheep vs Ship)</option>
              <option value="Trọng âm từ & Nhấn câu">Trọng âm từ & Nhấn câu</option>
              <option value="Nối âm tự nhiên (Connected Speech)">Nối âm tự nhiên (Connected Speech)</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-sky-500 hover:bg-sky-400 font-bold text-white rounded-lg shadow-sm transition-all cursor-pointer"
          >
            Lưu mục tiêu mới
          </button>
        </form>
      ) : (
        /* Progress View */
        <div className="space-y-3">
          {/* Progress Bar & Counter */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium">
                Đã luyện hôm nay: <span className="font-bold text-white">{completedToday}</span> / {goal.dailyTarget} câu
              </span>
              <span className={`font-bold font-['Space_Grotesk'] ${
                isGoalAchieved ? 'text-emerald-400' : 'text-sky-400'
              }`}>
                {progressPercent}%
              </span>
            </div>

            {/* Visual Bar */}
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out ${
                  isGoalAchieved
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm shadow-emerald-500/50'
                    : 'bg-gradient-to-r from-sky-500 to-indigo-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Goal status banner */}
          {isGoalAchieved ? (
            <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 flex items-center gap-2.5 text-xs text-emerald-300">
              <Trophy className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <span className="font-bold block">Đạt mục tiêu ngày! 🎉</span>
                <span className="text-[11px] text-emerald-400/80">
                  Bạn đã hoàn thành {completedToday} bài phát âm hôm nay.
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>Còn lại: <strong className="text-white">{Math.max(0, goal.dailyTarget - completedToday)} câu</strong></span>
              <span className="text-[11px] text-sky-400">Tiếp tục phát huy!</span>
            </div>
          )}

          {/* Mini Badges for Criteria */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="p-2 rounded-xl bg-slate-800/40 border border-slate-800 text-[11px]">
              <span className="text-slate-500 block mb-0.5">Chuẩn điểm (≥{goal.minTargetScore}%):</span>
              <span className="font-bold text-slate-200">
                {qualifiedCount} / {completedToday} câu đạt
              </span>
            </div>

            <div className="p-2 rounded-xl bg-slate-800/40 border border-slate-800 text-[11px]">
              <span className="text-slate-500 block mb-0.5">Trọng tâm tuần:</span>
              <span className="font-bold text-sky-300 truncate block" title={goal.focusPhoneme}>
                {goal.focusPhoneme}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
