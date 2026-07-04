import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@shop/shared';

interface AuthState {
  token: string | null;
  user: User | null;
  permissions: string[];
  setToken: (token: string) => void;
  setUser: (user: User) => void;
  setPermissions: (perms: string[]) => void;
  login: (token: string, user: User, permissions?: string[]) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      permissions: [],
      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),
      setPermissions: (permissions) => set({ permissions }),
      login: (token, user, permissions) => set({ token, user, permissions: permissions || [] }),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: 'shop-auth-storage',
    },
  ),
);
