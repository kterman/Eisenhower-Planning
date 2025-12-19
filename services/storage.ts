
import { User, Task } from '../types';

const STORAGE_KEY = 'eisenhower_app_users';

export const storage = {
  getUsers: (): Record<string, User> => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  },

  saveUser: (user: User) => {
    const users = storage.getUsers();
    users[user.username] = user;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  },

  getUser: (username: string): User | null => {
    const users = storage.getUsers();
    return users[username] || null;
  },

  updateTasks: (username: string, tasks: Task[]) => {
    const user = storage.getUser(username);
    if (user) {
      user.tasks = tasks;
      storage.saveUser(user);
    }
  }
};
