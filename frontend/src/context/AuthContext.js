"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const AuthContext = createContext({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  getAuthHeaders: () => ({}),
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on client mount
  useEffect(() => {
    const storedToken = localStorage.getItem("smart_freight_token");
    const storedUser = localStorage.getItem("smart_freight_user");

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse stored user", e);
      }
    }
    setLoading(false);
  }, []);

  const login = async (emailArg, passwordArg) => {
    let email, password;
    if (emailArg && typeof emailArg === "object") {
      email = emailArg.email ?? "";
      password = emailArg.password ?? "";
    } else {
      email = emailArg;
      password = passwordArg;
    }

    const safeEmail = String(email ?? "").trim();
    const safePassword = String(password ?? "");

    if (!safeEmail || !safePassword) {
      throw new Error("Email and password are required");
    }

    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: safeEmail, password: safePassword }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Login failed" }));
      throw new Error(err.detail || "Invalid email or password");
    }

    const data = await res.json();
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem("smart_freight_token", data.token);
    localStorage.setItem("smart_freight_user", JSON.stringify(data.user));
    return {
      ...data.user,
      success: true,
      user: data.user,
      token: data.token,
    };
  };

  const register = async (nameOrData, emailArg, passwordArg, roleArg = "consumer", driverMetaArg = {}) => {
    let name, email, password, role, driverMeta;
    if (nameOrData && typeof nameOrData === "object") {
      name = nameOrData.name ?? nameOrData.fullName ?? "";
      email = nameOrData.email ?? "";
      password = nameOrData.password ?? "";
      role = nameOrData.role ?? "consumer";
      const { name: _n, fullName: _fn, email: _e, password: _p, role: _r, ...rest } = nameOrData;
      driverMeta = rest;
    } else {
      name = nameOrData;
      email = emailArg;
      password = passwordArg;
      role = roleArg;
      driverMeta = driverMetaArg || {};
    }

    const safeName = String(name ?? "").trim();
    const safeEmail = String(email ?? "").trim();
    const safePassword = String(password ?? "");
    const safeRole = String(role ?? "consumer").trim() || "consumer";

    if (!safeName) {
      throw new Error("Full name is required");
    }
    if (!safeEmail) {
      throw new Error("Email address is required");
    }
    if (!safePassword) {
      throw new Error("Password is required");
    }

    const payload = {
      name: safeName,
      email: safeEmail,
      password: safePassword,
      role: safeRole,
      ...driverMeta,
    };

    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Registration failed" }));
      throw new Error(err.detail || "Registration failed");
    }

    const data = await res.json();
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem("smart_freight_token", data.token);
    localStorage.setItem("smart_freight_user", JSON.stringify(data.user));
    return {
      ...data.user,
      success: true,
      user: data.user,
      token: data.token,
    };
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("smart_freight_token");
    localStorage.removeItem("smart_freight_user");
  };

  const getAuthHeaders = () => {
    const headers = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        getAuthHeaders,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
