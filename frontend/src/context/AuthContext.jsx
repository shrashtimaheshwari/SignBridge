import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("signbridge_token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("http://127.0.0.1:3000/auth/me", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        } else {
          localStorage.removeItem("signbridge_token");
          setUser(null);
        }
      } catch (err) {
        localStorage.removeItem("signbridge_token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await fetch("http://127.0.0.1:3000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (res.ok) {
        localStorage.setItem("signbridge_token", data.access_token);
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, message: data.detail || "Login failed" };
      }
    } catch (err) {
      return { success: false, message: "Network error" };
    }
  };

  const register = async (name, email, password) => {
    try {
      const res = await fetch("http://127.0.0.1:3000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      
      if (res.ok) {
        localStorage.setItem("signbridge_token", data.access_token);
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, message: data.detail || "Registration failed" };
      }
    } catch (err) {
      return { success: false, message: "Network error" };
    }
  };

  const googleLogin = async (credential) => {
    try {
      const res = await fetch("http://127.0.0.1:3000/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("signbridge_token", data.access_token);
        setUser(data.user);
        navigate("/app");
        return { success: true };
      } else {
        return { success: false, message: data.detail || "Google login failed" };
      }
    } catch (err) {
      return { success: false, message: "Network error occurred." };
    }
  };

  const logout = async () => {
    const token = localStorage.getItem("signbridge_token");
    if (token) {
      try {
        await fetch("http://127.0.0.1:3000/auth/logout", {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` }
        });
      } catch (err) {
        console.error("Logout DB sync failed", err);
      }
    }
    localStorage.removeItem("signbridge_token");
    setUser(null);
    navigate("/");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, googleLogin }}>
      {children}
    </AuthContext.Provider>
  );
};
