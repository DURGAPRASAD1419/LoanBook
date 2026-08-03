import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("loanbook_user");
    return stored ? JSON.parse(stored) : null;
  });

  function login(username, password) {
    const expectedUsername = import.meta.env.VITE_APP_USERNAME?.trim();
    const expectedPassword = import.meta.env.VITE_APP_PASSWORD?.trim();

    if (!username.trim() || !password.trim()) {
      return { ok: false, message: "Enter both username and password." };
    }

    if (username.trim() !== expectedUsername || password !== expectedPassword) {
      return { ok: false, message: "Invalid username or password." };
    }

    const authenticatedUser = { username: username.trim() };
    localStorage.setItem("loanbook_user", JSON.stringify(authenticatedUser));
    setUser(authenticatedUser);
    return { ok: true };
  }

  function logout() {
    localStorage.removeItem("loanbook_user");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
