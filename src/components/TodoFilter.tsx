import React from 'react';
import { FilterType } from '../types';
import { motion } from 'motion/react';

interface TodoFilterProps {
  currentFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  counts: {
    all: number;
    active: number;
    completed: number;
  };
}

/**
 * TodoFilter 컴포넌트 (Apple iOS Segmented Control 스타일)
 * - macOS 및 iOS의 시그니처 세그먼트 컨트롤 디자인을 구현했습니다.
 * - motion의 layoutId를 활용하여 탭 변경 시 흰색 캡슐 인디케이터가 부드럽게 슬라이드됩니다.
 */
export const TodoFilter: React.FC<TodoFilterProps> = ({
  currentFilter,
  onFilterChange,
  counts,
}) => {
  const filterOptions: { id: FilterType; label: string; count: number }[] = [
    { id: 'all', label: '전체', count: counts.all },
    { id: 'active', label: '진행 중', count: counts.active },
    { id: 'completed', label: '완료', count: counts.completed },
  ];

  return (
    <div
      className="flex items-center p-1 bg-neutral-100/90 rounded-2xl mb-6 border border-neutral-200/50"
      id="todo-filter-group"
    >
      {filterOptions.map((option) => {
        const isActive = currentFilter === option.id;
        return (
          <button
            key={option.id}
            id={`filter-button-${option.id}`}
            type="button"
            onClick={() => onFilterChange(option.id)}
            className={`relative flex-1 py-2 px-3 text-xs sm:text-sm font-medium rounded-xl transition-colors duration-200 flex items-center justify-center gap-1.5 z-10 select-none ${
              isActive ? 'text-neutral-900 font-semibold' : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            {/* 활성화 탭 뒤에서 부드럽게 이동하는 iOS 스타일 흰색 캡슐 배경 */}
            {isActive && (
              <motion.div
                layoutId="activeFilterPill"
                className="absolute inset-0 bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] -z-10 border border-black/[0.04]"
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
              />
            )}

            <span>{option.label}</span>
            <span
              className={`text-[11px] px-1.5 py-0.2 rounded-full transition-colors ${
                isActive
                  ? 'bg-neutral-100 text-neutral-800 font-medium'
                  : 'text-neutral-400'
              }`}
            >
              {option.count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
