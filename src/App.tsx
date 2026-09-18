/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Todo, FilterType } from './types';
import { TodoHeader } from './components/TodoHeader';
import { TodoInput } from './components/TodoInput';
import { TodoFilter } from './components/TodoFilter';
import { TodoList } from './components/TodoList';
import { AuthErrorModal } from './components/AuthErrorModal';
import {
  auth,
  db,
  loginWithGoogle,
  checkRedirectResult,
  logoutFirebase,
  handleFirestoreError,
  OperationType,
} from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';

/**
 * App 컴포넌트
 * - Firebase Firestore 실시간 데이터베이스 연동 Todo List
 * - 기존 UI와 컴포넌트(TodoHeader, TodoInput, TodoFilter, TodoList) 구조를 100% 유지
 * - 로컬 useState 배열 대신 Firestore 'todos' 컬렉션과 완전 동기화
 */
export default function App() {
  // 1. 사용자 인증 상태 (Google 계정 프로필 연동)
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState<boolean>(true);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [authError, setAuthError] = useState<{ code: string; message: string } | null>(null);

  // 2. 할 일 목록 상태 (Firestore에서 실시간 수신)
  const [todos, setTodos] = useState<Todo[]>([]);

  // 3. 필터 상태 ('all' | 'active' | 'completed')
  const [filter, setFilter] = useState<FilterType>('all');

  // 4. Firestore 비동기 통신 및 동기화 상태
  const [syncing, setSyncing] = useState<boolean>(true);

  // 첫 구동 시 초기 샘플 할 일 생성 중복 방지 플래그
  const hasInitializedSeed = useRef<boolean>(false);

  /**
   * 1) 리디렉션 로그인 결과 확인 (페이지 이동 방식 로그인 복귀 시)
   */
  useEffect(() => {
    checkRedirectResult()
      .then((result) => {
        if (result?.user) {
          setUser(result.user);
        }
      })
      .catch((err) => {
        console.error('리디렉션 로그인 결과 확인:', err);
      });
  }, []);

  /**
   * 2) Firebase 인증 상태 감지 (onAuthStateChanged)
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  /**
   * 3) 앱 실행 시 Firestore에서 Todo 목록 실시간 불러오기 (onSnapshot)
   * - Firestore 'todos' 컬렉션의 데이터를 타임스탬프 역순으로 정렬하여 실시간 동기화
   * - 새로고침 및 다른 창에서의 변경 사항도 즉각 반영
   */
  useEffect(() => {
    setSyncing(true);
    const todosCollection = collection(db, 'todos');
    const todosQuery = query(todosCollection, orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(
      todosQuery,
      async (snapshot) => {
        // 데이터베이스가 비어있는 경우 최초 1회 기본 환영 할 일 생성
        if (snapshot.empty && !hasInitializedSeed.current) {
          hasInitializedSeed.current = true;
          const initialDocRef = doc(todosCollection);
          const initialTodo: Todo = {
            id: initialDocRef.id,
            text: 'Firebase Firestore 데이터베이스 연동 완료! 🎉',
            completed: false,
            createdAt: new Date().toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            timestamp: Date.now(),
          };

          try {
            await setDoc(initialDocRef, initialTodo);
          } catch (e) {
            handleFirestoreError(e, OperationType.CREATE, `todos/${initialDocRef.id}`);
          }
          return;
        }

        const loaded: Todo[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            text: data.text || '',
            completed: Boolean(data.completed),
            createdAt: data.createdAt || '',
            userId: data.userId,
            timestamp: data.timestamp || 0,
          };
        });

        setTodos(loaded);
        setSyncing(false);
      },
      (error) => {
        console.error('Firestore snapshot error:', error);
        handleFirestoreError(error, OperationType.LIST, 'todos');
        setSyncing(false);
      }
    );

    return () => unsubscribe();
  }, []);

  /**
   * 4) 할 일 추가: Firestore 'todos' 컬렉션에 새 문서 추가
   */
  const handleAddTodo = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const now = new Date();
    const timeString = now.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    setSyncing(true);
    try {
      const todosCollection = collection(db, 'todos');
      const newDocRef = doc(todosCollection);

      const newTodoData: Todo = {
        id: newDocRef.id,
        text: trimmed,
        completed: false,
        createdAt: timeString,
        timestamp: Date.now(),
        ...(user?.uid ? { userId: user.uid } : {}),
      };

      await setDoc(newDocRef, newTodoData);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'todos');
    } finally {
      setSyncing(false);
    }
  };

  /**
   * 5) 완료 체크 토글: Firestore의 completed 필드 업데이트
   */
  const handleToggleTodo = async (id: string) => {
    const target = todos.find((t) => t.id === id);
    if (!target) return;

    setSyncing(true);
    try {
      const todoDocRef = doc(db, 'todos', id);
      await updateDoc(todoDocRef, {
        completed: !target.completed,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `todos/${id}`);
    } finally {
      setSyncing(false);
    }
  };

  /**
   * 6) 할 일 삭제: Firestore에서 해당 문서 삭제
   */
  const handleDeleteTodo = async (id: string) => {
    setSyncing(true);
    try {
      const todoDocRef = doc(db, 'todos', id);
      await deleteDoc(todoDocRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `todos/${id}`);
    } finally {
      setSyncing(false);
    }
  };

  /**
   * Google 로그인 핸들러
   */
  const handleLogin = async () => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      await loginWithGoogle();
    } catch (error: any) {
      console.error('로그인 에러:', error);
      setAuthError({
        code: error?.code || 'auth/popup-closed-by-user',
        message: error?.message || '로그인 중 오류가 발생했습니다.',
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  /**
   * 로그아웃 핸들러
   */
  const handleLogout = async () => {
    try {
      await logoutFirebase();
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  /**
   * 필터링된 할 일 목록 ('전체' | '진행 중' | '완료')
   */
  const filteredTodos = todos.filter((todo) => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  const totalCount = todos.length;
  const completedCount = todos.filter((t) => t.completed).length;
  const activeCount = totalCount - completedCount;

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] py-10 sm:py-16 px-4 sm:px-6 font-sans antialiased flex flex-col justify-between selection:bg-neutral-900 selection:text-white">
      {/* Apple 스타일 메인 카드 (기존 UI 디자인 100% 보존) */}
      <main className="w-full max-w-lg mx-auto bg-white/95 backdrop-blur-xl rounded-[28px] border border-black/[0.04] shadow-[0_12px_44px_-8px_rgba(0,0,0,0.05)] p-6 sm:p-9 transition-all">
        {/* 헤더: 제목, 날짜, Firestore 실시간 연동 상태 바, 진행 상태 바 */}
        <TodoHeader
          totalCount={totalCount}
          completedCount={completedCount}
          user={user}
          loadingAuth={loadingAuth}
          isLoggingIn={isLoggingIn}
          onLogin={handleLogin}
          onLogout={handleLogout}
          syncing={syncing}
        />

        {/* 할 일 입력 폼 */}
        <TodoInput onAddTodo={handleAddTodo} />

        {/* iOS 세그먼트 컨트롤 스타일 필터 */}
        <TodoFilter
          currentFilter={filter}
          onFilterChange={setFilter}
          counts={{
            all: totalCount,
            active: activeCount,
            completed: completedCount,
          }}
        />

        {/* 유려한 트랜지션이 적용된 할 일 목록 */}
        <TodoList
          todos={filteredTodos}
          currentFilter={filter}
          onToggle={handleToggleTodo}
          onDelete={handleDeleteTodo}
        />
      </main>

      {/* 푸터 영역 */}
      <footer className="mt-10 text-center text-xs text-neutral-400 max-w-md mx-auto leading-relaxed">
        <p className="font-medium text-neutral-600">
          Cloud Firestore 실시간 데이터베이스 연동
        </p>
        <p className="mt-0.5 text-neutral-400">
          새로고침을 하거나 다른 브라우저 창에서도 할 일 목록이 실시간으로 동기화되고 보존됩니다.
        </p>
      </footer>

      {/* 로그인 에러 및 안내 모달 */}
      <AuthErrorModal
        error={authError}
        onClose={() => setAuthError(null)}
        onRetry={handleLogin}
      />
    </div>
  );
}
