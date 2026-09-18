// Firebase 초기 설정 및 Firestore / Auth 인스턴스 (firebase.js)
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// 1. Firebase 앱 초기화
export const app = initializeApp(firebaseConfig);

// 2. Cloud Firestore 데이터베이스 인스턴스 (지정된 firestoreDatabaseId 사용)
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// 3. Firebase Authentication 인증 인스턴스
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Firebase 프로젝트 ID
export const FIREBASE_PROJECT_ID = firebaseConfig.projectId;

// iframe 환경 여부 감지
export const isRunningInIframe = () => {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
};

// 인증 에러 메시지 헬퍼
export function getAuthErrorMessage(errorCode) {
  switch (errorCode) {
    case 'auth/popup-closed-by-user':
      return {
        title: '로그인 팝업이 즉시 닫혔습니다',
        description:
          '현재 웹 주소가 Firebase 승인된 도메인에 등록되지 않았거나 브라우저 서드파티 쿠키 차단으로 팝업이 닫혔습니다.',
        isDomainIssue: true,
        actionType: 'console',
      };
    case 'auth/unauthorized-domain':
      return {
        title: '승인되지 않은 도메인입니다',
        description:
          '현재 앱 도메인이 Firebase 콘솔의 [승인된 도메인] 목록에 등록되어 있지 않아 차단되었습니다.',
        isDomainIssue: true,
        actionType: 'console',
      };
    case 'auth/popup-blocked':
      return {
        title: '로그인 팝업창이 차단되었습니다',
        description: '브라우저에서 팝업이 차단되었습니다.',
        actionType: 'redirect',
      };
    default:
      return {
        title: '로그인 안내',
        description: '로그인을 진행할 수 없습니다. 도메인 설정을 확인해 주세요.',
        isDomainIssue: true,
        actionType: 'console',
      };
  }
}

// Firestore 작업 타입
export const OperationType = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LIST: 'list',
  GET: 'get',
  WRITE: 'write',
};

// Firestore 에러 로깅 헬퍼
export function handleFirestoreError(error, operationType, path) {
  console.error(`Firestore Error [${operationType}] on ${path}:`, error);
}

// Google 팝업 로그인
export async function loginWithGoogle() {
  return await signInWithPopup(auth, googleProvider);
}

// Google 리디렉션 로그인
export async function loginWithGoogleRedirect() {
  return await signInWithRedirect(auth, googleProvider);
}

// 리디렉션 복귀 결과 확인
export async function checkRedirectResult() {
  return await getRedirectResult(auth);
}

// 로그아웃
export async function logoutFirebase() {
  return await signOut(auth);
}
