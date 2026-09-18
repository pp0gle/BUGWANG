import React from 'react';
import { Calendar, Cloud, LogIn, LogOut, Loader2, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import { User } from 'firebase/auth';
import { isRunningInIframe } from '../firebase';

interface TodoHeaderProps {
  totalCount: number;
  completedCount: number;
  user: User | null;
  loadingAuth: boolean;
  isLoggingIn: boolean;
  onLogin: () => void;
  onLogout: () => void;
  syncing: boolean;
}

/**
 * TodoHeader 컴포넌트 (Apple Minimal UI + Firebase Cloud Sync)
 * - 넓은 여백과 절제된 타이포그래피, 매끄러운 진행률 게이지를 갖춘 Apple 스타일 헤더입니다.
 * - Firestore 실시간 클라우드 데이터베이스 동기화 상태 및 Google 로그인 제어를 포함합니다.
 */
export const TodoHeader: React.FC<TodoHeaderProps> = ({
  totalCount,
  completedCount,
  user,
  loadingAuth,
  isLoggingIn,
  onLogin,
  onLogout,
  syncing,
}) => {
  const inIframe = isRunningInIframe();
  const currentAppUrl = typeof window !== 'undefined' ? window.location.href : '';

  // 오늘 날짜 포맷 (Apple 스타일: "9월 17일 목요일")
  const today = new Date();
  const formattedDate = today.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  // 진행률 계산
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <header className="mb-8 sm:mb-10" id="todo-header">
      {/* 클라우드 데이터베이스 동기화 상태 바 */}
      <div className="flex items-center justify-between gap-2 p-2.5 px-3.5 mb-6 rounded-2xl bg-neutral-100/70 border border-neutral-200/50 text-xs">
        <div className="flex items-center gap-2 text-neutral-600 truncate">
          {syncing ? (
            <div className="flex items-center gap-1.5 text-blue-600">
              <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
              <span className="font-medium text-xs">Firestore 동기화 중...</span>
            </div>
          ) : user ? (
            <div className="flex items-center gap-2 truncate">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || '프로필'}
                  className="w-5 h-5 rounded-full object-cover border border-neutral-200"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
              <Cloud className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span className="font-medium text-neutral-800 truncate">
                {user.displayName || user.email}
              </span>
              <span className="text-neutral-400 hidden sm:inline">• Firestore 연결됨</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Cloud className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span className="font-medium text-neutral-700">Firestore 실시간 연동 중</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* iframe 환경인 경우 상단에 새 탭 바로가기 제공 */}
          {inIframe && !user && (
            <a
              href={currentAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="새 탭에서 열어 편리하게 로그인"
              className="hidden sm:flex items-center gap-1 text-[11px] text-neutral-500 hover:text-neutral-800 py-1 px-2 rounded-lg hover:bg-white transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              <span>새 탭 열기</span>
            </a>
          )}

          {loadingAuth ? (
            <span className="text-neutral-400 text-xs">확인 중...</span>
          ) : user ? (
            <button
              id="auth-logout-button"
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer py-1 px-2 rounded-lg hover:bg-white"
            >
              <LogOut className="w-3 h-3" />
              <span>로그아웃</span>
            </button>
          ) : (
            <button
              id="auth-login-button"
              type="button"
              onClick={onLogin}
              disabled={isLoggingIn}
              className="flex items-center gap-1.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-600 py-1.5 px-3 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95 disabled:cursor-not-allowed"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>로그인 중...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-3 h-3" />
                  <span>Google 로그인</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* 날짜 라벨 */}
      <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-neutral-400 mb-1.5 tracking-tight">
        <Calendar className="w-3.5 h-3.5" />
        <span>{formattedDate}</span>
      </div>

      {/* 헤더 상단: 제목 & 완료 통계 */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-900">
            할 일 목록
          </h1>
        </div>

        {/* 심플한 카운터 배지 */}
        <div className="flex items-center gap-1.5 text-xs sm:text-sm text-neutral-500 font-medium">
          <span className="text-neutral-900 font-semibold">{completedCount}</span>
          <span className="text-neutral-300">/</span>
          <span>{totalCount} 완료</span>
          {syncing && (
            <Loader2 className="w-3 h-3 animate-spin text-neutral-400 ml-1" />
          )}
        </div>
      </div>

      {/* Apple 스타일 슬림 진행 상태 바 (부드러운 스프링 애니메이션) */}
      <div className="mt-4 w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-neutral-900 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>
    </header>
  );
};
