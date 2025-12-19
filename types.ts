
export type QuadrantType = 'DO' | 'DECIDE' | 'DELEGATE' | 'DELETE';

export interface Task {
  id: string;
  subject: string;
  quadrant: QuadrantType;
  createdAt: number;
}

export interface User {
  username: string;
  tasks: Task[];
}

export interface AuthState {
  currentUser: string | null;
}
