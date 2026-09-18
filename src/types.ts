/**
 * Todo 항목의 데이터 구조 정의
 */
export interface Todo {
  /** 각 할 일을 고유하게 식별하기 위한 고유 ID */
  id: string;
  /** 사용자가 입력한 할 일 내용 */
  text: string;
  /** 완료 여부 (true: 완료, false: 미완료/진행 중) */
  completed: boolean;
  /** 할 일이 생성된 시각 (예: "오전 09:30" 형식의 문자열) */
  createdAt: string;
  /** 작성자 UID (Firestore 연동 시 사용자 식별용) */
  userId?: string;
  /** 정렬 및 타임스탬프 (밀리초) */
  timestamp: number;
}

/**
 * 할 일 목록 필터 옵션 타입
 * - 'all': 전체 보기
 * - 'active': 진행 중인 항목만 보기
 * - 'completed': 완료된 항목만 보기
 */
export type FilterType = 'all' | 'active' | 'completed';
