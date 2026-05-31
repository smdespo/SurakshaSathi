import { createContext, useContext, useState, useCallback } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(() => {
    const email = localStorage.getItem("ss_admin_email");
    const key   = localStorage.getItem("ss_admin_key");
    const name  = localStorage.getItem("ss_admin_name");
    if (email && key) return { email, key, name };
    return null;
  });

  const login = useCallback((adminData) => {
    localStorage.setItem("ss_admin_email", adminData.email);
    localStorage.setItem("ss_admin_key",   adminData.admin_key);
    localStorage.setItem("ss_admin_name",  adminData.name || "");
    setAdmin({
      email: adminData.email,
      key:   adminData.admin_key,
      name:  adminData.name,
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("ss_admin_email");
    localStorage.removeItem("ss_admin_key");
    localStorage.removeItem("ss_admin_name");
    setAdmin(null);
  }, []);

  return (
    <AuthContext.Provider value={{ admin, login, logout, isAdmin: !!admin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}