import React, { useEffect, useState } from "react";
import { UserContext } from "./UserContextState.js";
import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";

const getStoredUser = () => {
  const storedUser = localStorage.getItem("user");

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch (error) {
    console.error("Failed to parse stored user:", error);
    localStorage.removeItem("user");
    return null;
  }
};

const getStoredToken = () => localStorage.getItem("token");

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser);
  const [token, setToken] = useState(getStoredToken);

  useEffect(() => {
    const fetchLatestProfile = async () => {
      if (!token) return;
      try {
        const response = await axiosInstance.get(API_PATHS.AUTH.GET_PROFILE);
        if (response.data) {
          updateUser(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch latest user profile:", error);
      }
    };

    fetchLatestProfile();
  }, [token]);

  useEffect(() => {
    const syncAuthState = () => {
      setUser(getStoredUser());
      setToken(getStoredToken());
    };

    window.addEventListener("storage", syncAuthState);

    return () => {
      window.removeEventListener("storage", syncAuthState);
    };
  }, []);

  const updateUser = (userData) => {
    setUser(userData || null);

    if (userData) {
      localStorage.setItem("user", JSON.stringify(userData));
      return;
    }

    localStorage.removeItem("user");
  };

  const updateToken = (authToken) => {
    setToken(authToken || null);

    if (authToken) {
      localStorage.setItem("token", authToken);
      return;
    }

    localStorage.removeItem("token");
  };

  const updateUserContext = ({ user: userData, token: authToken }) => {
    updateUser(userData || null);
    updateToken(authToken || null);
  };

  const clearUser = () => {
    updateUser(null);
    updateToken(null);
  };

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token),
    role: user?.role || null,
    updateUser,
    updateToken,
    updateUserContext,
    clearUser,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
