import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserOut } from "@/types/api";

interface AuthState {
  user: UserOut | null;
  token: string | null;
  login: (user: UserOut, token: string) => void;
  logout: () => void;
  updateUser: (patch: Partial<UserOut>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      login: (user, token) => {
        localStorage.setItem("token", token);
        document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7}`;
        set({ user, token });
      },
      logout: () => {
        localStorage.removeItem("token");
        document.cookie = "token=; path=/; max-age=0";
        set({ user: null, token: null });
      },
      updateUser: (patch) => set((state) => (state.user ? { user: { ...state.user, ...patch } } : state)),
    }),
    {
      name: "numsa-auth",
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);
