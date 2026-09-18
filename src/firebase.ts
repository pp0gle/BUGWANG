import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Firebase 프로젝트 ID export
export const FIREBASE_PROJECT_ID = firebaseConfig.projectId;

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// CRITICAL: firebaseConfig.firestoreDatabaseId 필수 지정
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Google 로그인 프로바이더 설정
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// iframe 실행 환경 감지 헬퍼
export const isRunningInIframe = (): boolean => {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
};

// Firebase Auth 에러 코드 안내 헬퍼
export function getAuthErrorMessage(errorCode: string): {
  title: string;
  description: string;
  isDomainIssue?: boolean;
  actionType?: 'newTab' | 'console' | 'redirect';
} {
  switch (errorCode) {
    case 'auth/popup-closed-by-user':
      return {
        title: '로그인 팝업이 즉시 닫혔습니다',
        description:
          '팝업 창이 열리자마자 바로 사라진 경우, 현재 웹 주소가 Firebase 콘솔의 [승인된 도메인(Authorized Domains)]에 등록되어 있지 않거나 브라우저 서드파티 쿠키 차단으로 인해 Firebase 인증 서버가 팝업을 강제 종료한 것입니다.',
        isDomainIssue: true,
        actionType: 'console',
      };
    case 'auth/unauthorized-domain':
      return {
        title: '승인되지 않은 도메인입니다',
        description:
          '현재 앱 도메인이 Firebase 콘솔의 [승인된 도메인] 목록에 등록되어 있지 않아 Google 로그인이 차단되었습니다.',
        isDomainIssue: true,
        actionType: 'console',
      };
    case 'auth/popup-blocked':
      return {
        title: '로그인 팝업창이 차단되었습니다',
        description:
          '브라우저 또는 미리보기 환경에서 팝업이 차단되었습니다. 팝업을 허용하거나 페이지 전체 이동(리디렉션) 방식으로 로그인해 주세요.',
        actionType: 'redirect',
      };
    case 'auth/operation-not-allowed':
      return {
        title: 'Google 로그인이 비활성화되어 있습니다',
        description:
          'Firebase 프로젝트 콘솔의 [Authentication] > [Sign-in method]에서 Google 제공업체를 활성화해야 합니다.',
        actionType: 'console',
      };
    case 'auth/cancelled-popup-request':
      return {
        title: '로그인 요청이 재설정되었습니다',
        description:
          '동시에 여러 번 클릭되었거나 이전 로그인 팝업이 취소되었습니다. 잠시 후 다시 시도해 주세요.',
      };
    case 'auth/network-request-failed':
      return {
        title: '네트워크 연결 오류',
        description:
          '네트워크 상태를 확인하시거나 광고 차단 확장 프로그램(AdBlock 등)이 Firebase 연결을 차단하고 있는지 확인해 주세요.',
      };
    default:
      return {
        title: '로그인을 진행할 수 없습니다',
        description:
          '도메인 미승인 또는 브라우저 보안 제약으로 인해 로그인이 중단되었습니다. 도메인 등록을 확인하시거나 페이지 이동 방식으로 시도해 보세요.',
        isDomainIssue: true,
        actionType: 'console',
      };
  }
}

// Firestore 연결 상태 사전 테스트 (클라이언트 오프라인 감지)
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

// 보안 규정 필수 에러 핸들러 규격
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// 팝업 로그인 실행
export async function loginWithGoogle() {
  return await signInWithPopup(auth, googleProvider);
}

// 페이지 전체 리디렉션 로그인 실행 (팝업 차단/즉시 닫힘 우회)
export async function loginWithGoogleRedirect() {
  return await signInWithRedirect(auth, googleProvider);
}

// 리디렉션 복귀 결과 확인
export async function checkRedirectResult() {
  return await getRedirectResult(auth);
}

// 로그아웃 실행
export async function logoutFirebase() {
  return await signOut(auth);
}
