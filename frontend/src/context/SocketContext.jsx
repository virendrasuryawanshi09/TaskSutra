import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import useUserAuth from "../hooks/useUserAuth";
import { BASE_URL } from "../utils/apiPaths";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { isAuthenticated, token } = useUserAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const socketUrl = BASE_URL;
    const newSocket = io(socketUrl, {
      auth: { token },
      withCredentials: true,
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (socket && token) {
      socket.auth = { ...socket.auth, token };
    }
  }, [token, socket]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
