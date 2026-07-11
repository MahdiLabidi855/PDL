import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

function parseJwt(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (token) {
      if (savedUser && savedUser !== "undefined") {
        setUser(JSON.parse(savedUser));
      } else {
        const decoded = parseJwt(token);
        const fallbackUser = decoded || { loggedIn: true };
        localStorage.setItem("user", JSON.stringify(fallbackUser));
        setUser(fallbackUser);
      }
    }

    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    const token = res.data.token;

    if (!token) {
      throw new Error("Invalid login response shape");
    }

    localStorage.setItem("token", token);

    const decoded = parseJwt(token);
    const builtUser = decoded
      ? {
          id: decoded.id || decoded._id || decoded.userId || null,
          email: decoded.email || email,
          role: decoded.role || "user",
          loggedIn: true,
        }
      : {
          email,
          role: "user",
          loggedIn: true,
        };

    localStorage.setItem("user", JSON.stringify(builtUser));
    setUser(builtUser);

    return res.data;
  };

  const register = async (name, email, password, role = "admin") => {
    const res = await api.post("/auth/register", {
      name,
      email,
      password,
      role,
    });
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}