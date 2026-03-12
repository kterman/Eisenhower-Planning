
import { User, Task } from '../types';

const STORAGE_KEY = 'eisenhower_app_users';

export const storage = {
  getUsers: (): Record<string, User> => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error("Failed to parse storage data", e);
      return {};
    }
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
    const users = storage.getUsers();
    // Directly update or create the user entry
    users[username] = { username, tasks };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  },

  importUserData: (username: string, tasks: Task[]) => {
    const users = storage.getUsers();
    users[username] = { username, tasks };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }
};
