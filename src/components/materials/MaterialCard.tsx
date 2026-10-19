import React from 'react';
import { FileText, Image as ImageIcon, Globe, Mic, Trash2, Eye, ExternalLink, Calendar, BookOpen, Sparkles, BookmarkCheck, Layers } from 'lucide-react';
import { StudyMaterialSource } from '../../types';

interface MaterialCardProps {
  material: StudyMaterialSource;
  onPracticeFromMaterial: (text: string, title: string) => void;
  onViewDetails: (material: StudyMaterialSource) => void;
  onDelete: (id: string) => void;
  onSummarizeMaterial?: (material: StudyMaterialSource) => void;
  hasSummary?: boolean;
  onOpenFlashcards?: (material: StudyMaterialSource) => void;
}

export const MaterialCard: React.FC<MaterialCardProps> = ({
  material,
  onPracticeFromMaterial,
  onViewDetails,
  onDelete,
  onSummarizeMaterial,
  hasSummary,
  onOpenFlashcards,
}) => {
  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    } catch {
      return 'Gần đây';
    }
  };

  const getFirstSentence = (text: string) => {
    const matched = text.match(/[^.!?]+[.!?]+/);
    return matched ? matched[0].trim() : text.slice(0, 80);
  };

  return (
    <div
      id={`material-card-${material.id}`}
      className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 shadow-md transition-all flex flex-col justify-between group"
    >
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            {material.type === 'text' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-400 border border-sky-500/30 text-[11px] font-semibold">
                <FileText className="w-3 h-3" />
                Văn bản
              </span>
            )}
            {material.type === 'image' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-400 border border-purple-500/30 text-[11px] font-semibold">
                <ImageIcon className="w-3 h-3" />
                Ảnh chụp sách
              </span>
            )}
            {material.type === 'url' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[11px] font-semibold">
                <Globe className="w-3 h-3" />
                Trang web
              </span>
            )}

            <span className="text-[10px] text-slate-400 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700/60 truncate max-w-[140px]">
              {material.subjectName}
            </span>

            {hasSummary && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[10px] font-medium border border-emerald-500/25">
                <BookmarkCheck className="w-2.5 h-2.5" />
                <span>Có tóm tắt</span>
              </span>
            )}
          </div>

          <span className="text-[10px] text-slate-500 flex items-center gap-1 shrink-0">
            <Calendar className="w-3 h-3" />
            {formatDate(material.createdAt)}
          </span>
        </div>

        {/* Title */}
        <h4 className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors line-clamp-1 mb-1.5">
          {material.title}
        </h4>

        {/* Content Preview */}
        {material.type === 'text' && (
          <p className="text-xs text-slate-300 leading-relaxed line-clamp-3 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60 font-sans mb-2">
            "{material.content}"
          </p>
        )}

        {material.type === 'image' && (
          <div className="mb-2 relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950/40">
            {material.imageUrl ? (
              <img
                src={material.imageUrl}
                alt={material.title}
                className="w-full h-28 object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="h-24 flex items-center justify-center text-slate-500 text-xs">
                Ảnh tài liệu bài học
              </div>
            )}
          </div>
        )}

        {material.type === 'url' && (
          <div className="mb-2 p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60 text-xs">
            <a
              href={material.content}
              target="_blank"
              rel="noreferrer"
              className="text-sky-400 hover:text-sky-300 flex items-center gap-1.5 truncate"
            >
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{material.content}</span>
            </a>
          </div>
        )}

        {/* Student Notes */}
        {material.notes && (
          <p className="text-[11px] text-slate-400 italic mb-2 line-clamp-1">
            Ghi chú: {material.notes}
          </p>
        )}
      </div>

      {/* Footer Actions */}
      <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2 mt-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {material.type === 'text' && (
            <button
              onClick={() => onPracticeFromMaterial(getFirstSentence(material.content), material.title)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 hover:text-white border border-sky-500/30 text-xs font-semibold transition-all cursor-pointer"
              title="Lấy câu từ bài đọc này sang phòng luyện phát âm AI"
            >
              <Mic className="w-3.5 h-3.5 text-sky-400" />
              <span>Luyện phát âm</span>
            </button>
          )}

          {onSummarizeMaterial && (
            <button
              type="button"
              onClick={() => onSummarizeMaterial(material)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                hasSummary
                  ? 'bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30'
                  : 'bg-slate-800 hover:bg-indigo-950/40 text-slate-300 hover:text-indigo-300 border border-slate-700/60'
              }`}
              title="Xem hoặc tạo tóm tắt & key points cho học liệu này"
            >
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>{hasSummary ? 'Tóm tắt' : 'Tóm tắt AI'}</span>
            </button>
          )}

          {onOpenFlashcards && (
            <button
              type="button"
              onClick={() => onOpenFlashcards(material)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-indigo-950/50 text-slate-300 hover:text-indigo-300 border border-slate-700/60 text-xs font-semibold transition-all cursor-pointer"
              title="Xem hoặc tạo thẻ Flashcard cho bài học này"
            >
              <Layers className="w-3 h-3 text-indigo-400" />
              <span>Flashcard</span>
            </button>
          )}

          <button
            onClick={() => onViewDetails(material)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-xs transition-colors cursor-pointer"
            title="Xem chi tiết học liệu"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Xem</span>
          </button>
        </div>

        <button
          onClick={() => onDelete(material.id)}
          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
          title="Xóa học liệu"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
