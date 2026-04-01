import React, { createContext, useContext, useEffect, useState } from "react";

export interface AuthUser {
  id: number;
  username: string;
  displayName: string;
  email: string | null;
  age: number | null;
  role: string;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isInitializing: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API = "/api";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const fetchMe = async (): Promise<AuthUser | null> => {
    try {
      const res = await fetch(`${API}/auth/me`, { credentials: "include" });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  };

  useEffect(() => {
    fetchMe().then((u) => {
      setUser(u);
      setIsInitializing(false);
    });
  }, []);

  const login = (u: AuthUser) => setUser(u);

  const logout = async () => {
    await fetch(`${API}/auth/logout`, { method: "POST", credentials: "include" });
    setUser(null);
  };

  const refreshUser = async () => {
    const u = await fetchMe();
    setUser(u);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshUser, isInitializing }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
