import React from 'react';
import { Check, Trash2, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { Todo } from '../types';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

/**
 * TodoItem 컴포넌트 (Apple Reminders 스타일)
 * - 원형 체크박스, 절제된 모노크롬 색상, 부드러운 호버 및 제거 모션을 제공합니다.
 * - motion을 활용하여 항목 생성 및 삭제 시 자연스러운 트랜지션을 연출합니다.
 */
export const TodoItem: React.FC<TodoItemProps> = ({ todo, onToggle, onDelete }) => {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      id={`todo-item-${todo.id}`}
      className={`group relative flex items-center justify-between px-4 py-3.5 sm:px-5 sm:py-4 rounded-2xl border transition-all duration-200 ${
        todo.completed
          ? 'bg-neutral-50/60 border-neutral-100'
          : 'bg-white border-neutral-200/70 hover:border-neutral-300 hover:shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
      }`}
    >
      {/* 체크박스 및 텍스트 영역 */}
      <div className="flex items-start gap-3.5 flex-1 min-w-0 pr-3">
        {/* Apple Reminders 스타일 원형 체크 버튼 */}
        <motion.button
          id={`todo-toggle-${todo.id}`}
          type="button"
          onClick={() => onToggle(todo.id)}
          whileTap={{ scale: 0.88 }}
          aria-label={todo.completed ? '미완료로 표시' : '완료로 표시'}
          className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-200 cursor-pointer ${
            todo.completed
              ? 'bg-neutral-900 border-neutral-900 text-white'
              : 'border-neutral-300 hover:border-neutral-500 bg-white'
          }`}
        >
          {todo.completed && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            >
              <Check className="w-3 h-3 stroke-[3]" />
            </motion.div>
          )}
        </motion.button>

        {/* 할 일 텍스트 & 생성 시각 */}
        <div className="flex flex-col min-w-0 flex-1">
          <span
            onClick={() => onToggle(todo.id)}
            className={`text-sm sm:text-[15px] leading-relaxed cursor-pointer break-words transition-all select-none ${
              todo.completed
                ? 'line-through text-neutral-400 font-normal'
                : 'text-neutral-800 font-normal hover:text-neutral-950'
            }`}
          >
            {todo.text}
          </span>
          <span className="flex items-center gap-1 mt-0.5 text-[11px] text-neutral-400">
            <Clock className="w-3 h-3" />
            <span>{todo.createdAt}</span>
          </span>
        </div>
      </div>

      {/* 삭제 버튼 (Apple 스타일: 평소에는 은은하고 호버/포커스 시 자연스럽게 강조) */}
      <motion.button
        id={`todo-delete-${todo.id}`}
        type="button"
        onClick={() => onDelete(todo.id)}
        whileTap={{ scale: 0.9 }}
        aria-label="할 일 삭제"
        className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xl text-neutral-300 hover:text-neutral-700 hover:bg-neutral-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition-all duration-200"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </motion.button>
    </motion.li>
  );
};
