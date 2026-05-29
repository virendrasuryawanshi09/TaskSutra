import React, { createContext, useContext, useEffect, useState } from "react";
import { useSocket } from "./SocketContext";
import useUserAuth from "../hooks/useUserAuth.jsx";
import axiosInstance from "../utils/axiosInstance";
import toast from "react-hot-toast";

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated } = useUserAuth();
  const socket = useSocket();
  const [notifications, setNotifications] = useState([]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  
  // Calculate unread chat messages (direct message and community chat)
  const unreadMessagesCount = notifications.filter(
    (n) => !n.isRead && (n.type === "direct_message" || n.type === "community_chat")
  ).length;

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await axiosInstance.get("/api/notifications");
      if (res.data && res.data.notifications) {
        setNotifications(res.data.notifications);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    } else {
      setNotifications([]);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!socket || !isAuthenticated) return;

    const handleNewNotification = (newNotif) => {
      setNotifications((prev) => [newNotif, ...prev]);
    };

    socket.on("new_notification", handleNewNotification);

    return () => {
      socket.off("new_notification", handleNewNotification);
    };
  }, [socket, isAuthenticated]);

  const markAsRead = async (id) => {
    try {
      const res = await axiosInstance.put(`/api/notifications/${id}/read`);
      if (res.data && res.data.success) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast.error("Failed to mark notification as read.");
    }
  };

  const markAllAsRead = async () => {
    const unreadList = notifications.filter((n) => !n.isRead);
    if (unreadList.length === 0) return;
    try {
      const res = await axiosInstance.put("/api/notifications/read-all");
      if (res.data && res.data.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast.error("Failed to mark all as read.");
    }
  };

  const markTypeAsRead = async (type) => {
    const unreadOfType = notifications.filter((n) => !n.isRead && n.type === type);
    if (unreadOfType.length === 0) return;
    try {
      const res = await axiosInstance.put(`/api/notifications/read-type/${type}`);
      if (res.data && res.data.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.type === type ? { ...n, isRead: true } : n))
        );
      }
    } catch (error) {
      console.error(`Error marking notifications of type ${type} as read:`, error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      const res = await axiosInstance.delete(`/api/notifications/${id}`);
      if (res.data && res.data.success) {
        setNotifications((prev) => prev.filter((n) => n._id !== id));
        toast.success("Notification deleted");
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Failed to delete notification.");
    }
  };

  const clearAll = async () => {
    if (notifications.length === 0) return;

    try {
      const res = await axiosInstance.delete("/api/notifications/clear-all");
      if (res.data && res.data.success) {
        setNotifications([]);
      }
    } catch (error) {
      console.error("Error clearing notifications:", error);
      toast.error("Failed to clear notifications.");
    }
  };

  const value = {
    notifications,
    unreadCount,
    unreadMessagesCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    markTypeAsRead,
    deleteNotification,
    clearAll,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
