'use client';

import React from 'react';

interface AgeOption {
  id: string;
  label: string;
  icon: string;
}

interface ExploreAgeFilterProps {
  selectedAge: string;
  setSelectedAge: (age: string) => void;
  ageOptions: AgeOption[];
}

export const ExploreAgeFilter: React.FC<ExploreAgeFilterProps> = ({
  selectedAge,
  setSelectedAge,
  ageOptions,
}) => {
  return (
    <section className="relative w-full bg-surface-container-lowest/80 backdrop-blur-md rounded-2xl border border-outline-variant/40 p-4 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="flex items-center gap-2 text-sm font-extrabold text-on-surface shrink-0">
        <span className="w-8 h-8 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center text-lg">
          👶
        </span>
        <span>Chọn lứa tuổi của bé:</span>
      </div>

      <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
        {ageOptions.map((opt) => {
          const isSelected = selectedAge === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => setSelectedAge(opt.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                isSelected
                  ? 'bg-primary-container text-on-primary-container shadow-md scale-102 ring-2 ring-primary-container/30'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high border border-outline-variant/30'
              }`}
            >
              {opt.icon && <span>{opt.icon}</span>}
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
