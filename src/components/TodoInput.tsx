import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { motion } from 'motion/react';

interface TodoInputProps {
  onAddTodo: (text: string) => void;
}

/**
 * TodoInput 컴포넌트 (Apple Minimal UI)
 * - 애플 특유의 깔끔한 라운드 필드와 절제된 원형 추가 버튼 디자인을 제공합니다.
 * - 부드러운 포커스 전환 및 마이크로 인터랙션을 지원합니다.
 */
export const TodoInput: React.FC<TodoInputProps> = ({ onAddTodo }) => {
  const [inputText, setInputText] = useState<string>('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;

    onAddTodo(trimmed);
    setInputText('');
  };

  const hasText = inputText.trim().length > 0;

  return (
    <form onSubmit={handleSubmit} className="mb-6 sm:mb-8" id="todo-input-form">
      <div className="relative flex items-center group">
        <input
          id="todo-input-field"
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="새로운 할 일을 입력하세요"
          className="w-full pl-5 pr-14 py-4 bg-neutral-100/80 hover:bg-neutral-100 focus:bg-white border border-transparent focus:border-neutral-300 rounded-2xl text-neutral-900 placeholder:text-neutral-400 focus:outline-none transition-all duration-200 text-sm sm:text-base focus:shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
        />
        <div className="absolute right-2.5">
          <motion.button
            id="todo-add-button"
            type="submit"
            disabled={!hasText}
            whileTap={hasText ? { scale: 0.92 } : undefined}
            whileHover={hasText ? { scale: 1.05 } : undefined}
            aria-label="할 일 추가"
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors duration-200 ${
              hasText
                ? 'bg-neutral-900 text-white shadow-sm cursor-pointer'
                : 'bg-neutral-200 text-neutral-400 cursor-not-allowed opacity-50'
            }`}
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </motion.button>
        </div>
      </div>
    </form>
  );
};
