import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api, dropSocket, User } from "./api";

type AuthCtx = {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, email?: string) => Promise<void>;
  guest: () => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>(null!);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const { user } = await api<{ user: User | null }>("/api/me");
      setUser(user);
    } catch {
      setUser(null);
    }
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  async function login(username: string, password: string) {
    const { user } = await api<{ user: User }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    setUser(user);
  }
  async function register(username: string, password: string, email?: string) {
    const { user } = await api<{ user: User }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, password, email }),
    });
    setUser(user);
  }
  async function guest() {
    const { user } = await api<{ user: User }>("/api/auth/guest", {
      method: "POST",
    });
    setUser(user);
  }
  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    dropSocket();
    setUser(null);
  }

  return (
    <Ctx.Provider value={{ user, loading, login, register, guest, logout, refresh }}>
      {children}
    </Ctx.Provider>
  );
}
