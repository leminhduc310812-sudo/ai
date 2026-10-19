import React from 'react';
import { CategoryKey } from '../types';
import { PRACTICE_CATEGORIES } from '../data/practiceLibrary';
import { Sparkles, Layers, Activity, Mic2, Briefcase } from 'lucide-react';

interface CategorySelectorProps {
  activeCategory: CategoryKey;
  onSelectCategory: (category: CategoryKey) => void;
}

const ICONS: Record<string, React.ReactNode> = {
  Sparkles: <Sparkles className="w-4 h-4" />,
  Layers: <Layers className="w-4 h-4" />,
  Activity: <Activity className="w-4 h-4" />,
  Mic2: <Mic2 className="w-4 h-4" />,
  Briefcase: <Briefcase className="w-4 h-4" />,
};

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  activeCategory,
  onSelectCategory,
}) => {
  return (
    <div id="category-selector" className="w-full overflow-x-auto pb-2 scrollbar-none">
      <div className="flex items-center gap-2 min-w-max">
        {PRACTICE_CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              id={`cat-btn-${cat.id}`}
              onClick={() => onSelectCategory(cat.id as CategoryKey)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <span className={isActive ? 'text-white' : 'text-sky-400'}>
                {ICONS[cat.icon]}
              </span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
