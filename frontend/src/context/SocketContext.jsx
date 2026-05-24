import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import useUserAuth from "../hooks/useUserAuth";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { isAuthenticated, token } = useUserAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const socketUrl = "http://localhost:5000";
    const newSocket = io(socketUrl, {
      auth: { token },
      withCredentials: true,
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated, token]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
