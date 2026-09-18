import React, { useState } from 'react';
import {
  AlertCircle,
  ExternalLink,
  RefreshCw,
  X,
  Copy,
  Check,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  getAuthErrorMessage,
  FIREBASE_PROJECT_ID,
  loginWithGoogleRedirect,
} from '../firebase';

interface AuthErrorModalProps {
  error: { code: string; message: string } | null;
  onClose: () => void;
  onRetry: () => void;
}

/**
 * AuthErrorModal 컴포넌트
 * - Firebase Google 로그인 팝업이 즉시 꺼지는 문제(승인되지 않은 도메인 등)를 정확하게 진단하고,
 *   사용자가 10초 만에 도메인을 추가하거나 페이지 이동(리디렉션)으로 로그인할 수 있도록 돕습니다.
 */
export const AuthErrorModal: React.FC<AuthErrorModalProps> = ({
  error,
  onClose,
  onRetry,
}) => {
  const [copied, setCopied] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  if (!error) return null;

  const errorDetail = getAuthErrorMessage(error.code);
  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const consoleAuthSettingsUrl = `https://console.firebase.google.com/project/${FIREBASE_PROJECT_ID}/authentication/settings`;

  const handleCopy = () => {
    if (navigator?.clipboard && currentHostname) {
      navigator.clipboard.writeText(currentHostname);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleRedirectLogin = async () => {
    try {
      setIsRedirecting(true);
      await loginWithGoogleRedirect();
    } catch (e: any) {
      console.error('리디렉션 로그인 실패:', e);
      setIsRedirecting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-neutral-200/90 p-6 sm:p-8 overflow-hidden"
          id="auth-error-modal"
        >
          {/* 닫기 버튼 */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>

          {/* 아이콘 및 헤더 */}
          <div className="flex items-start gap-3.5 mb-3.5">
            <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0 mt-0.5">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-neutral-900 tracking-tight">
                {errorDetail.title}
              </h2>
              <span className="text-xs font-mono text-neutral-400">
                원인: Firebase 승인 도메인 제한 (코드: {error.code})
              </span>
            </div>
          </div>

          {/* 설명 문구 */}
          <p className="text-sm text-neutral-600 leading-relaxed mb-4">
            팝업이 떴다가 순식간에 사라지는 것은 <strong>현재 도메인이 Firebase 승인 목록에 등록되어 있지 않아</strong> Firebase 인증 서버가 보안상 팝업을 즉시 종료하기 때문입니다.
          </p>

          {/* 해결 방법 1: Firebase 콘솔에 현재 도메인 추가 (10초 소요) */}
          <div className="p-4 mb-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs leading-relaxed">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-neutral-900">
                1단계: 현재 도메인 복사
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 py-1 px-2.5 rounded-lg bg-white border border-neutral-300 hover:bg-neutral-100 text-neutral-800 font-medium cursor-pointer transition-colors shadow-2xs text-[11px]"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-700 font-semibold">복사됨!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>도메인 복사</span>
                  </>
                )}
              </button>
            </div>

            <code className="block p-2 bg-white rounded-xl border border-neutral-200 font-mono text-[11px] text-neutral-800 break-all select-all font-medium">
              {currentHostname}
            </code>

            <div className="mt-3 pt-3 border-t border-neutral-200/80 text-neutral-600">
              <span className="font-semibold text-neutral-900 block mb-1">
                2단계: Firebase 콘솔에 붙여넣기
              </span>
              <p className="mb-2.5">
                아래 버튼을 눌러 Firebase 콘솔로 이동한 뒤, <strong>[승인된 도메인(Authorized domains)]</strong> &gt; <strong>[도메인 추가]</strong>에 위 주소를 붙여넣으시면 즉시 정상 로그인됩니다.
              </p>
              <a
                href={consoleAuthSettingsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 py-2 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-medium transition-colors shadow-2xs"
              >
                <span>Firebase 콘솔 승인 도메인 설정 바로가기</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* 해결 방법 2: 리디렉션 방식 로그인 (팝업 창 없이 전체 페이지 이동) */}
          <div className="mb-5 p-3 rounded-2xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900 leading-relaxed">
            <p className="font-semibold flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
              <span>팝업 창 대신 페이지 이동으로 로그인하기</span>
            </p>
            <p className="mt-1 text-amber-800">
              팝업 창이 브라우저에서 차단되거나 꺼지는 경우, 전체 페이지를 Google 로그인 화면으로 이동시켜 로그인할 수 있습니다.
            </p>
          </div>

          {/* 액션 버튼 */}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              disabled={isRedirecting}
              onClick={handleRedirectLogin}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98] cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              <span>{isRedirecting ? 'Google 로그인으로 이동 중...' : '페이지 전체 이동(리디렉션)으로 로그인'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onRetry();
              }}
              className="w-full py-2.5 px-4 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>도메인 등록 후 팝업 다시 시도</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 px-4 rounded-xl text-neutral-400 hover:text-neutral-700 text-xs transition-colors cursor-pointer"
            >
              지금은 로컬 저장소 모드로 계속하기
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
