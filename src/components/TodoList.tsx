import React from 'react';
import { Todo, FilterType } from '../types';
import { TodoItem } from './TodoItem';
import { CheckCircle2, ListChecks } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

interface TodoListProps {
  todos: Todo[];
  currentFilter: FilterType;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

/**
 * TodoList 컴포넌트 (Apple Minimal UI)
 * - AnimatePresence를 통해 할 일 항목 추가/삭제/필터 전환 시 유려한 물리 기반 애니메이션을 적용합니다.
 */
export const TodoList: React.FC<TodoListProps> = ({
  todos,
  currentFilter,
  onToggle,
  onDelete,
}) => {
  if (todos.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        id="todo-empty-state"
        className="flex flex-col items-center justify-center py-14 px-4 text-center rounded-2xl bg-neutral-50/70 border border-neutral-100"
      >
        <div className="w-10 h-10 rounded-full bg-white shadow-xs border border-neutral-200/60 flex items-center justify-center text-neutral-400 mb-3">
          {currentFilter === 'completed' ? (
            <CheckCircle2 className="w-5 h-5 text-neutral-500" />
          ) : (
            <ListChecks className="w-5 h-5 text-neutral-400" />
          )}
        </div>
        <p className="text-sm font-medium text-neutral-700 mb-1">
          {currentFilter === 'all' && '할 일이 없습니다'}
          {currentFilter === 'active' && '진행 중인 할 일이 없습니다'}
          {currentFilter === 'completed' && '완료된 할 일이 없습니다'}
        </p>
        <p className="text-xs text-neutral-400 max-w-xs">
          {currentFilter === 'all' && '새로운 할 일을 추가하고 하루를 계획해 보세요.'}
          {currentFilter === 'active' && '모든 할 일을 마쳤습니다.'}
          {currentFilter === 'completed' && '완료한 항목이 여기에 표시됩니다.'}
        </p>
      </motion.div>
    );
  }

  return (
    <ul className="space-y-2" id="todo-list">
      <AnimatePresence mode="popLayout" initial={false}>
        {todos.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onToggle={onToggle}
            onDelete={onDelete}
          />
        ))}
      </AnimatePresence>
    </ul>
  );
};
