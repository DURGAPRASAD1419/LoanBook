import { createContext, useContext, useState } from "react";
import { registerUser, loginUser } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("loanbook_user");
    return stored ? JSON.parse(stored) : null;
  });

  async function register(username, password) {
    if (!username?.trim() || !password) {
      return { ok: false, message: "Enter username and password." };
    }
    try {
      await registerUser(username.trim(), password);
      return { ok: true };
    } catch (e) {
      return { ok: false, message: e.message };
    }
  }

  async function login(username, password) {
    if (!username?.trim() || !password) {
      return { ok: false, message: "Enter both username and password." };
    }
    try {
      const result = await loginUser(username.trim(), password);
      // result: { token, username }
      localStorage.setItem("loanbook_token", result.token);
      const authenticatedUser = { username: result.username };
      localStorage.setItem("loanbook_user", JSON.stringify(authenticatedUser));
      setUser(authenticatedUser);
      return { ok: true };
    } catch (e) {
      return { ok: false, message: e.message };
    }
  }

  function logout() {
    localStorage.removeItem("loanbook_user");
    localStorage.removeItem("loanbook_token");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
