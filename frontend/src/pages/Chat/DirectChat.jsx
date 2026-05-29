import React, { useEffect, useState, useRef, useContext } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useLocation } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { UserContext } from '../../context/UserContextState';
import axiosInstance from '../../utils/axiosInstance';
import moment from 'moment';
import { LuSend, LuMessageSquare, LuPaperclip } from 'react-icons/lu';
import toast from 'react-hot-toast';
import { useNotification } from '../../context/NotificationContext';

const parseMessageContent = (text, users = [], currentUser = null) => {
  if (!text) return "";
  
  const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  const allMentionables = [...users];
  if (currentUser && !allMentionables.find(u => u._id === currentUser._id)) {
    allMentionables.push(currentUser);
  }

  const sortedMentionables = allMentionables
    .filter(u => u && u.name)
    .sort((a, b) => b.name.length - a.name.length);

  let mentionRegexStr = '\\B@([a-zA-Z0-9_.-]+)';
  if (sortedMentionables.length > 0) {
    const escapedNames = sortedMentionables.map(u => escapeRegExp(u.name)).join('|');
    mentionRegexStr = `\\B@(${escapedNames}|[a-zA-Z0-9_.-]+)`;
  }
  const mentionRegex = new RegExp(mentionRegexStr, 'g');

  let tokens = [{ type: 'text', text }];

  // 1. Parse Links: [text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  tokens = tokens.flatMap(token => {
    if (token.type !== 'text') return token;
    const parts = [];
    let lastIndex = 0;
    let match;
    linkRegex.lastIndex = 0;
    while ((match = linkRegex.exec(token.text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', text: token.text.slice(lastIndex, match.index) });
      }
      parts.push({ type: 'link', text: match[1], url: match[2] });
      lastIndex = linkRegex.lastIndex;
    }
    if (lastIndex < token.text.length) {
      parts.push({ type: 'text', text: token.text.slice(lastIndex) });
    }
    return parts;
  });

  // 2. Parse Bold: **text**
  const boldRegex = /\*\*([^*]+)\*\*/g;
  tokens = tokens.flatMap(token => {
    if (token.type !== 'text') return token;
    const parts = [];
    let lastIndex = 0;
    let match;
    boldRegex.lastIndex = 0;
    while ((match = boldRegex.exec(token.text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', text: token.text.slice(lastIndex, match.index) });
      }
      parts.push({ type: 'bold', text: match[1] });
      lastIndex = boldRegex.lastIndex;
    }
    if (lastIndex < token.text.length) {
      parts.push({ type: 'text', text: token.text.slice(lastIndex) });
    }
    return parts;
  });

  // 3. Parse Italic: *text*
  const italicRegex = /\*([^*]+)\*/g;
  tokens = tokens.flatMap(token => {
    if (token.type !== 'text') return token;
    const parts = [];
    let lastIndex = 0;
    let match;
    italicRegex.lastIndex = 0;
    while ((match = italicRegex.exec(token.text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', text: token.text.slice(lastIndex, match.index) });
      }
      parts.push({ type: 'italic', text: match[1] });
      lastIndex = italicRegex.lastIndex;
    }
    if (lastIndex < token.text.length) {
      parts.push({ type: 'text', text: token.text.slice(lastIndex) });
    }
    return parts;
  });

  // 4. Parse Mentions: @Name
  tokens = tokens.flatMap(token => {
    if (token.type !== 'text') return token;
    const parts = [];
    let lastIndex = 0;
    let match;
    mentionRegex.lastIndex = 0;
    while ((match = mentionRegex.exec(token.text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', text: token.text.slice(lastIndex, match.index) });
      }
      const matchedName = match[1];
      const matchedUser = sortedMentionables.find(u => u.name.toLowerCase() === matchedName.toLowerCase());
      if (matchedUser) {
        parts.push({ type: 'mention', text: matchedName, userId: matchedUser._id });
      } else {
        parts.push({ type: 'text', text: match[0] });
      }
      lastIndex = mentionRegex.lastIndex;
    }
    if (lastIndex < token.text.length) {
      parts.push({ type: 'text', text: token.text.slice(lastIndex) });
    }
    return parts;
  });

  return tokens.map((token, index) => {
    switch (token.type) {
      case 'link':
        return (
          <a
            key={index}
            href={token.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--accent)] hover:underline font-semibold cursor-pointer inline-flex items-center gap-0.5"
          >
            {token.text}
          </a>
        );
      case 'bold':
        return <strong key={index} className="font-extrabold text-[var(--text)]">{token.text}</strong>;
      case 'italic':
        return <em key={index} className="italic text-[var(--text)]">{token.text}</em>;
      case 'mention':
        return (
          <span
            key={index}
            className="inline-flex items-center px-1.5 py-0.5 rounded bg-[var(--accent-soft)] text-[var(--accent)] font-bold text-[13px] select-none animate-fade-in"
          >
            @{token.text}
          </span>
        );
      default:
        return token.text;
    }
  });
};

const DirectChat = ({ defaultCommunity = false }) => {
  const { user } = useContext(UserContext);
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activeChat, setActiveChat] = useState(
    defaultCommunity 
      ? { type: 'community', data: { _id: 'community-chat', name: 'Community Chat' } } 
      : null
  );
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingStatus, setTypingStatus] = useState(null); // String: "User is typing..."
  
  const location = useLocation();
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [directChats, setDirectChats] = useState([]);
  const [contextMenu, setContextMenu] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editInput, setEditInput] = useState("");
  const longPressTimeout = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [mentionTriggerIndex, setMentionTriggerIndex] = useState(-1);
  const [activeMentionIndex, setActiveMentionIndex] = useState(0);

  // Auto scroll
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTo({
         top: messagesEndRef.current.scrollHeight,
         behavior: "smooth"
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingStatus]);

  // Fetch all users and direct chats to display in sidebar
  useEffect(() => {
    const fetchSidebarData = async () => {
      try {
        const usersRes = await axiosInstance.get('/api/users');
        let fetchedUsers = usersRes.data.filter(u => String(u._id) !== String(user?._id || user?.id));

        const directChatsRes = await axiosInstance.get('/api/direct-chats');
        const chats = directChatsRes.data || [];
        setDirectChats(chats);

        // Inject Admins from existing chats
        chats.forEach(chat => {
           chat.participants.forEach(p => {
              if (String(p._id) !== String(user?._id || user?.id) && !fetchedUsers.find(u => String(u._id) === String(p._id))) {
                 fetchedUsers.push(p);
              }
           });
        });

        // Fetch tasks
        const tasksRes = await axiosInstance.get('/api/tasks');
        const fetchedTasks = tasksRes.data.tasks || tasksRes.data || [];
        setTasks(fetchedTasks);

        setUsers(fetchedUsers);
        
        if (location.state?.activeTask) {
           const t = fetchedTasks.find(t => String(t._id) === String(location.state.activeTask._id));
           setActiveChat({ type: 'task', data: t || location.state.activeTask });
           window.history.replaceState({}, document.title);
        } else if (location.state?.activeUser) {
           const uObj = location.state.activeUser;
           const u = fetchedUsers.find(u => String(u._id) === String(uObj._id || uObj));
           setActiveChat({ type: 'user', data: u || uObj });
           window.history.replaceState({}, document.title);
        } else if (location.state?.activeCommunity) {
           setActiveChat({ type: 'community', data: { _id: 'community-chat', name: 'Community Chat' } });
           window.history.replaceState({}, document.title);
        }
      } catch (error) {
        console.error('Failed to fetch sidebar data:', error);
      }
    };
    if (user) fetchSidebarData();
  }, [user]);

  // Fetch messages when active chat changes
  const { notifications, fetchNotifications } = useNotification();

  useEffect(() => {
    const fetchMessages = async () => {
      if (!activeChat) return;
      try {
        if (activeChat.type === 'user') {
           const res = await axiosInstance.get(`/api/direct-chats/${activeChat.data._id}`);
           setMessages(res.data.messages || []);
           // Mark as read
           if (res.data.chat) {
              await axiosInstance.put(`/api/direct-chats/${res.data.chat._id}/read`);
              fetchNotifications();
              
              if (socketRef.current) {
                 socketRef.current.emit('mark_messages_seen', {
                    chatId: res.data.chat._id,
                    readerId: user?._id || user?.id,
                    senderId: activeChat.data._id
                 });
              }

              // Clear local unread count
              setDirectChats(prev => prev.map(c => {
                 if (String(c._id) === String(res.data.chat._id)) {
                    return { ...c, unreadCounts: { ...c.unreadCounts, [user?._id || user?.id]: 0 } };
                 }
                 return c;
              }));
           }
        } else if (activeChat.type === 'task') {
           const res = await axiosInstance.get(`/api/task-discussions/${activeChat.data._id}`);
           setMessages(res.data.messages || []);
           fetchNotifications();
        } else if (activeChat.type === 'community') {
           const res = await axiosInstance.get('/api/chat');
           setMessages(res.data.messages || res.data || []);
           
           // Clear community chat notifications
           await axiosInstance.put('/api/notifications/read-type/community_chat');
           fetchNotifications();
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      }
    };
    fetchMessages();
  }, [activeChat, user]);

  // Socket setup
  const socket = useSocket();

  useEffect(() => {
    if (!socket || !user) return;

    socketRef.current = socket;

    const handleReceiveDirectMessage = (message) => {
      const senderId = String(message.sender?._id || message.sender);
      
      // Only append if the message belongs to the current active chat
      setMessages((prev) => {
        if (activeChat?.type === 'user' && senderId === String(activeChat.data._id)) {
          // Prevent duplicates
          if (prev.find(m => String(m._id) === String(message._id))) return prev;
          
          // Mark as read in DB and update notifications context since user is actively viewing this chat
          const activeDirectChat = directChats.find(c => c.participants.some(p => String(p._id || p) === senderId));
          if (activeDirectChat) {
             axiosInstance.put(`/api/direct-chats/${activeDirectChat._id}/read`).then(() => {
                fetchNotifications();
             }).catch(err => console.error("Error marking active chat as read:", err));
          }
          
          return [...prev, message];
        }
        return prev;
      });

      // Update unread badges and sidebar ordering
      if (!activeChat || activeChat.type !== 'user' || senderId !== String(activeChat.data._id)) {
        setDirectChats(prev => {
          const existingChat = prev.find(c => c.participants.some(p => String(p._id || p) === senderId));
          if (existingChat) {
             return prev.map(c => {
                if (String(c._id) === String(existingChat._id)) {
                   const currentUnread = c.unreadCounts?.[user?._id || user?.id] || 0;
                   return { 
                      ...c, 
                      unreadCounts: { ...c.unreadCounts, [user?._id || user?.id]: currentUnread + 1 },
                      updatedAt: new Date().toISOString()
                   };
                }
                return c;
             });
          } else {
             // New chat entirely
             axiosInstance.get('/api/direct-chats').then(res => {
                setDirectChats(res.data || []);
                setUsers(prevUsers => {
                   if (!prevUsers.find(u => String(u._id) === senderId)) {
                      return [...prevUsers, message.sender];
                   }
                   return prevUsers;
                });
             });
             return prev;
          }
        });
      }
    };

    const handleReceiveTaskMessage = (message) => {
      setMessages((prev) => {
        if (activeChat?.type === 'task' && String(message.discussionId) === String(activeChat.data.discussionId || message.discussionId)) {
          if (prev.find(m => String(m._id) === String(message._id))) return prev;
          
          // Clear task message notifications in DB and update context
          axiosInstance.get(`/api/task-discussions/${activeChat.data._id}`).then(() => {
             fetchNotifications();
          }).catch(err => console.error("Error reading task discussion:", err));

          return [...prev, message];
        }
        return prev;
      });
    };

    const handleReceiveMessage = (message) => {
      setMessages((prev) => {
        if (activeChat?.type === 'community') {
          if (prev.find(m => String(m._id) === String(message._id))) return prev;
          return [...prev, message];
        }
        return prev;
      });
    };

    const handleUserOnline = (data) => {
      setOnlineUsers(Object.values(data.onlineUsers || {}));
    };

    const handleUserOffline = (data) => {
      setOnlineUsers(Object.values(data.onlineUsers || {}));
    };

    const handleDmTyping = (data) => {
      if (activeChat?.type === 'user' && data.senderId === activeChat.data._id) {
         setTypingStatus(`${data.name} is typing...`);
      }
    };

    const handleDmStopTyping = (data) => {
      if (activeChat?.type === 'user' && data.senderId === activeChat.data._id) {
         setTypingStatus(null);
      }
    };

    const handleTaskTyping = (data) => {
      if (activeChat?.type === 'task' && data.taskId === activeChat.data._id && data.userId !== (user?._id || user?.id)) {
         setTypingStatus(`${data.name} is typing...`);
      }
    };

    const handleTaskStopTyping = (data) => {
      if (activeChat?.type === 'task' && data.taskId === activeChat.data._id) {
         setTypingStatus(null);
      }
    };

    const handleTyping = (data) => {
      if (activeChat?.type === 'community' && data.userId !== (user?._id || user?.id)) {
         setTypingStatus(`${data.name} is typing...`);
      }
    };

    const handleStopTyping = (data) => {
      if (activeChat?.type === 'community') {
         setTypingStatus(null);
      }
    };

    const handleReceiveEditMessage = (msgData) => {
       if (activeChat?.type === 'community') {
          setMessages(prev => prev.map(m => m._id === msgData._id ? { ...m, content: msgData.content, isEdited: msgData.isEdited } : m));
       }
    };

    const handleReceiveDeleteMessage = (data) => {
       if (activeChat?.type === 'community') {
          setMessages(prev => prev.filter(m => m._id !== data.messageId));
       }
    };

    const handleReceiveEditDirectMessage = (msgData) => {
       if (activeChat?.type === 'user') {
          setMessages(prev => prev.map(m => m._id === msgData._id ? { ...m, content: msgData.content, isEdited: msgData.isEdited } : m));
       }
    };

    const handleReceiveDeleteDirectMessage = (data) => {
       if (activeChat?.type === 'user') {
          setMessages(prev => prev.filter(m => m._id !== data.messageId));
       }
    };

    const handleReceiveEditTaskMessage = (msgData) => {
       if (activeChat?.type === 'task') {
          setMessages(prev => prev.map(m => m._id === msgData._id ? { ...m, content: msgData.content, isEdited: msgData.isEdited } : m));
       }
    };

    const handleReceiveDeleteTaskMessage = (data) => {
       if (activeChat?.type === 'task') {
          setMessages(prev => prev.filter(m => m._id !== data.messageId));
       }
    };

    const handleMessagesSeen = (data) => {
      if (activeChat?.type === 'user' && data.readerId === activeChat.data._id) {
         setMessages(prev => prev.map(m => 
            m.sender?._id === (user?._id || user?.id) ? { ...m, isRead: true } : m
         ));
      }
    };

    socket.on('receive_direct_message', handleReceiveDirectMessage);
    socket.on('receive_task_message', handleReceiveTaskMessage);
    socket.on('receive_message', handleReceiveMessage);
    socket.on('userOnline', handleUserOnline);
    socket.on('userOffline', handleUserOffline);
    socket.on('dm_typing', handleDmTyping);
    socket.on('dm_stop_typing', handleDmStopTyping);
    socket.on('task_typing', handleTaskTyping);
    socket.on('task_stop_typing', handleTaskStopTyping);
    socket.on('typing', handleTyping);
    socket.on('stop_typing', handleStopTyping);
    socket.on('receive_edit_message', handleReceiveEditMessage);
    socket.on('receive_delete_message', handleReceiveDeleteMessage);
    socket.on('receive_edit_direct_message', handleReceiveEditDirectMessage);
    socket.on('receive_delete_direct_message', handleReceiveDeleteDirectMessage);
    socket.on('receive_edit_task_message', handleReceiveEditTaskMessage);
    socket.on('receive_delete_task_message', handleReceiveDeleteTaskMessage);
    socket.on('messages_seen', handleMessagesSeen);

    return () => {
      socket.off('receive_direct_message', handleReceiveDirectMessage);
      socket.off('receive_task_message', handleReceiveTaskMessage);
      socket.off('receive_message', handleReceiveMessage);
      socket.off('userOnline', handleUserOnline);
      socket.off('userOffline', handleUserOffline);
      socket.off('dm_typing', handleDmTyping);
      socket.off('dm_stop_typing', handleDmStopTyping);
      socket.off('task_typing', handleTaskTyping);
      socket.off('task_stop_typing', handleTaskStopTyping);
      socket.off('typing', handleTyping);
      socket.off('stop_typing', handleStopTyping);
      socket.off('receive_edit_message', handleReceiveEditMessage);
      socket.off('receive_delete_message', handleReceiveDeleteMessage);
      socket.off('receive_edit_direct_message', handleReceiveEditDirectMessage);
      socket.off('receive_delete_direct_message', handleReceiveDeleteDirectMessage);
      socket.off('receive_edit_task_message', handleReceiveEditTaskMessage);
      socket.off('receive_delete_task_message', handleReceiveDeleteTaskMessage);
      socket.off('messages_seen', handleMessagesSeen);
    };
  }, [socket, user, activeChat]);

  // Handle task room join/leave
  useEffect(() => {
     if (socket) {
         if (activeChat?.type === 'task') {
             socket.emit('joinTaskRoom', activeChat.data._id);
         }
     }
     return () => {
         if (socket && activeChat?.type === 'task') {
             socket.emit('leaveTaskRoom', activeChat.data._id);
         }
     };
  }, [socket, activeChat]);
  const handleContextMenu = (e, msg, isMe) => {
    e.preventDefault();
    if (window.innerWidth < 1024) return;
    const canManage = isMe || (user && user.role === 'admin');
    if (!canManage) return;

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      messageId: msg._id,
      content: msg.content,
      isMe
    });
  };

  const handleTouchStart = (e, msg, isMe) => {
    if (window.innerWidth >= 1024) return;
    const canManage = isMe || (user && user.role === 'admin');
    if (!canManage) return;

    longPressTimeout.current = setTimeout(() => {
      const touch = e.touches[0];
      setContextMenu({
        x: touch.clientX,
        y: touch.clientY,
        messageId: msg._id,
        content: msg.content,
        isMe
      });
      if (navigator.vibrate) {
        navigator.vibrate(40);
      }
    }, 600);
  };

  const handleTouchEnd = () => {
    if (longPressTimeout.current) clearTimeout(longPressTimeout.current);
  };

  const handleTouchMove = () => {
    if (longPressTimeout.current) clearTimeout(longPressTimeout.current);
  };

  const handleEditMessage = async (messageId, newContent) => {
    try {
      if (activeChat.type === 'community') {
        const res = await axiosInstance.put(`/api/chat/${messageId}`, { content: newContent });
        const updatedMessage = res.data;
        setMessages(prev => prev.map(m => m._id === messageId ? updatedMessage : m));
        if (socketRef.current) {
          socketRef.current.emit('edit_message', updatedMessage);
        }
      } else if (activeChat.type === 'user') {
        const res = await axiosInstance.put(`/api/direct-chats/message/${messageId}`, { content: newContent });
        const updatedMessage = res.data.message;
        setMessages(prev => prev.map(m => m._id === messageId ? updatedMessage : m));
        if (socketRef.current) {
          socketRef.current.emit('edit_direct_message', {
             receiverId: activeChat.data._id,
             messageData: updatedMessage
          });
        }
      } else if (activeChat.type === 'task') {
        const res = await axiosInstance.put(`/api/task-discussions/message/${messageId}`, { content: newContent });
        const updatedMessage = res.data.message;
        setMessages(prev => prev.map(m => m._id === messageId ? updatedMessage : m));
        if (socketRef.current) {
          socketRef.current.emit('edit_task_message', {
             taskId: activeChat.data._id,
             messageData: updatedMessage
          });
        }
      }
    } catch (error) {
      console.error('Failed to edit message:', error);
      toast.error('Failed to edit message');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      if (activeChat.type === 'community') {
        await axiosInstance.delete(`/api/chat/${messageId}`);
        setMessages(prev => prev.filter(m => m._id !== messageId));
        if (socketRef.current) {
          socketRef.current.emit('delete_message', { messageId });
        }
      } else if (activeChat.type === 'user') {
        await axiosInstance.delete(`/api/direct-chats/message/${messageId}`);
        setMessages(prev => prev.filter(m => m._id !== messageId));
        if (socketRef.current) {
          socketRef.current.emit('delete_direct_message', {
             receiverId: activeChat.data._id,
             messageId,
             chatId: activeChat.data.chatId
          });
        }
      } else if (activeChat.type === 'task') {
        await axiosInstance.delete(`/api/task-discussions/message/${messageId}`);
        setMessages(prev => prev.filter(m => m._id !== messageId));
        if (socketRef.current) {
          socketRef.current.emit('delete_task_message', {
             taskId: activeChat.data._id,
             messageId
          });
        }
      }
    } catch (error) {
      console.error('Failed to delete message:', error);
      toast.error('Failed to delete message');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    try {
      if (activeChat.type === 'user') {
          const response = await axiosInstance.post('/api/direct-chats', {
            receiverId: activeChat.data._id,
            content: newMessage
          });
          
          const savedMessage = response.data.message;
          setMessages(prev => [...prev, savedMessage]);

          setDirectChats(prev => prev.map(c => {
             if (c.participants.some(p => String(p._id || p) === String(activeChat.data._id))) {
                return { ...c, updatedAt: new Date().toISOString() };
             }
             return c;
          }));
          
          socketRef.current.emit('send_direct_message', {
            receiverId: activeChat.data._id,
            messageData: savedMessage
          });
      } else if (activeChat.type === 'task') {
          const response = await axiosInstance.post(`/api/task-discussions/${activeChat.data._id}`, {
            content: newMessage
          });
          
          const savedMessage = response.data.message;
          setMessages(prev => [...prev, savedMessage]);
          
          // Emit to room
          socketRef.current.emit('send_task_message', {
             taskId: activeChat.data._id,
             messageData: { ...savedMessage, discussionId: response.data.discussion._id }
          });
      } else if (activeChat.type === 'community') {
          const response = await axiosInstance.post('/api/chat', { content: newMessage });
          socketRef.current.emit('send_message', response.data);
          setMessages(prev => prev.find(m => m._id === response.data._id) ? prev : [...prev, response.data]);
      }
      
      setNewMessage('');
      handleStopTyping();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleFormatText = (type) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);

    let replacement = "";
    let cursorOffset = 0;

    if (type === "bold") {
      replacement = `**${selectedText}**`;
      cursorOffset = selectedText ? 0 : 2;
    } else if (type === "italic") {
      replacement = `*${selectedText}*`;
      cursorOffset = selectedText ? 0 : 1;
    }

    const newValue = text.substring(0, start) + replacement + text.substring(end);
    setNewMessage(newValue);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + replacement.length - cursorOffset;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleChatFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const toastId = toast.loading(`Uploading "${file.name}"...`);
    try {
      const formData = new FormData();
      formData.append("image", file); // Backend expects "image"

      const res = await axiosInstance.post('/api/auth/upload-image', formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data && res.data.imageUrl) {
        toast.success("File uploaded successfully!", { id: toastId });
        
        const textarea = textareaRef.current;
        const start = textarea ? textarea.selectionStart : newMessage.length;
        const end = textarea ? textarea.selectionEnd : newMessage.length;
        const fileLink = `[${file.name}](${res.data.imageUrl})`;
        
        const newValue = newMessage.substring(0, start) + fileLink + newMessage.substring(end);
        setNewMessage(newValue);
        
        setTimeout(() => {
          if (textarea) {
            textarea.focus();
            const newPos = start + fileLink.length;
            textarea.setSelectionRange(newPos, newPos);
          }
        }, 0);
      }
    } catch (err) {
      console.error("Upload error", err);
      toast.error(err.response?.data?.message || "Failed to upload file.", { id: toastId });
    }
    e.target.value = null; // reset input
  };

  const selectMention = (selectedUser) => {
    if (!selectedUser) return;
    const textarea = textareaRef.current;
    if (!textarea) return;

    const before = newMessage.substring(0, mentionTriggerIndex);
    const after = newMessage.substring(textarea.selectionStart);
    const completedMention = `@${selectedUser.name} `;

    const newValue = before + completedMention + after;
    setNewMessage(newValue);
    setShowMentions(false);

    setTimeout(() => {
      textarea.focus();
      const newPos = mentionTriggerIndex + completedMention.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const handleTyping = (e) => {
    const val = e.target.value;
    setNewMessage(val);

    const selectionEnd = e.target.selectionStart;
    const lastAt = val.lastIndexOf('@', selectionEnd - 1);
    
    if (lastAt !== -1) {
      const textAfterAt = val.slice(lastAt + 1, selectionEnd);
      const charBeforeAt = lastAt === 0 ? '' : val[lastAt - 1];
      const isWordAfterAt = /^[a-zA-Z0-9_.-]*$/.test(textAfterAt);
      const isPrecededBySpace = lastAt === 0 || /\s/.test(charBeforeAt);

      if (isWordAfterAt && isPrecededBySpace) {
        setShowMentions(true);
        setMentionSearch(textAfterAt);
        setMentionTriggerIndex(lastAt);
        setActiveMentionIndex(0);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }

    if (socketRef.current && user && activeChat) {
      const userId = user._id || user.id;
      
      if (activeChat.type === 'user') {
          socketRef.current.emit('dm_typing', { 
            receiverId: activeChat.data._id, 
            senderId: userId, 
            name: user.name 
          });
      } else if (activeChat.type === 'task') {
          socketRef.current.emit('task_typing', {
             taskId: activeChat.data._id,
             userId: userId,
             name: user.name
          });
      } else if (activeChat.type === 'community') {
          socketRef.current.emit('typing', {
             userId: userId,
             name: user.name
          });
      }

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      typingTimeoutRef.current = setTimeout(() => {
        handleStopTyping();
      }, 2000);
    }
  };

  const handleStopTyping = () => {
    if (socketRef.current && user && activeChat) {
      const userId = user._id || user.id;
      if (activeChat.type === 'user') {
          socketRef.current.emit('dm_stop_typing', { 
            receiverId: activeChat.data._id, 
            senderId: userId 
          });
      } else if (activeChat.type === 'task') {
          socketRef.current.emit('task_stop_typing', {
             taskId: activeChat.data._id,
             userId: userId
          });
      } else if (activeChat.type === 'community') {
          socketRef.current.emit('stop_typing', {
             userId: userId
          });
      }
    }
  };

  const mentionSuggestions = users.filter(u => 
    u && u.name && u.name.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  return (
    <DashboardLayout activeMenu="Direct Messages">
      {/* Hyper-minimalist Elite Container */}
      <div className="flex h-[calc(100dvh-6rem)] w-full max-w-[1500px] mx-auto bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm mt-4 relative">
        
        {/* Left Sidebar - Users List */}
        <div className={`w-full md:w-64 flex-col bg-[var(--surface)] border-r border-[var(--border)] z-10 ${activeChat ? 'hidden md:flex' : 'flex'}`}>
          <div className="h-14 px-5 flex items-center border-b border-[var(--border)] shadow-sm">
            <h1 className="text-[14px] font-bold tracking-tight text-[var(--text)]">Direct Messages</h1>
          </div>
          
          <div className="flex-1 overflow-y-auto py-4 scrollbar-thin">
            {/* Channels Section */}
            <div className="px-3 mb-6">
              <div className="text-[11px] font-semibold tracking-wider text-[var(--text-muted)] uppercase mb-2 px-2 flex justify-between items-center">
                <span>Channels</span>
              </div>
              <div 
                onClick={() => setActiveChat({ type: 'community', data: { _id: 'community-chat', name: 'Community Chat' } })}
                className={`flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer transition-colors ${activeChat?.type === 'community' ? 'bg-[var(--accent-soft)] text-[var(--accent)] font-semibold' : 'text-[var(--text-muted)] hover:bg-[var(--bg-soft)] hover:text-[var(--text)]'}`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <LuMessageSquare className="text-[16px]" />
                  <span className="text-[13px] truncate"># community-chat</span>
                </div>
                {(() => {
                  const unreadCommunity = notifications.filter(n => !n.isRead && n.type === 'community_chat').length;
                  return unreadCommunity > 0 && activeChat?.type !== 'community' ? (
                    <div className="bg-[var(--accent)] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                       {unreadCommunity}
                    </div>
                  ) : null;
                })()}
              </div>
            </div>

            <div className="px-3 mb-2">
              <div className="text-[11px] font-semibold tracking-wider text-[var(--text-muted)] uppercase mb-2 px-2">
                Colleagues
              </div>
              <div className="space-y-0.5 mt-2">
                {[...users].sort((a, b) => {
                  const chatA = directChats.find(c => c.participants.some(p => String(p._id || p) === String(a._id)));
                  const chatB = directChats.find(c => c.participants.some(p => String(p._id || p) === String(b._id)));
                  const dateA = chatA ? new Date(chatA.updatedAt).getTime() : 0;
                  const dateB = chatB ? new Date(chatB.updatedAt).getTime() : 0;
                  return dateB - dateA;
                }).map((u) => {
                  const isOnline = onlineUsers.includes(u._id.toString());
                  const isActive = activeChat?.type === 'user' && activeChat.data._id === u._id;
                  const chat = directChats.find(c => c.participants.some(p => String(p._id || p) === String(u._id)));
                  const unreadCount = chat?.unreadCounts?.[user?._id || user?.id] || 0;

                  return (
                    <div 
                      key={u._id} 
                      onClick={() => setActiveChat({ type: 'user', data: u })}
                      className={`flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer group transition-colors ${isActive ? 'bg-[var(--accent-soft)]' : 'hover:bg-[var(--bg-soft)]'}`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="relative flex items-center justify-center w-5 h-5 shrink-0 rounded bg-[var(--bg-soft)] border border-[var(--border)] text-[9px] font-bold text-[var(--text-muted)]">
                          {u.name.charAt(0).toUpperCase()}
                          <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 border-[1.5px] border-[var(--surface)] rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        </div>
                        <span className={`text-[13px] font-medium truncate flex items-center gap-1.5 ${isActive ? 'text-[var(--accent)] font-bold' : unreadCount > 0 ? 'text-[var(--text)] font-bold' : 'text-[var(--text-muted)] group-hover:text-[var(--text)]'}`}>
                          {u.name}
                          {u.role && u.role.toLowerCase() === 'admin' && (
                              <span className="text-[var(--accent)] text-[7px] font-bold tracking-wider uppercase ml-1 shrink-0">Admin</span>
                          )}
                        </span>
                      </div>
                      {unreadCount > 0 && !isActive && (
                        <div className="bg-[var(--accent)] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                           {unreadCount}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {tasks.length > 0 && (
                 <>
                   <div className="text-[11px] font-semibold tracking-wider text-[var(--text-muted)] uppercase mb-2 mt-6 px-2">
                     Task Discussions
                   </div>
                   <div className="space-y-0.5 mt-2">
                     {tasks.map(t => {
                        const isActive = activeChat?.type === 'task' && activeChat.data._id === t._id;
                        return (
                           <div 
                             key={t._id} 
                             onClick={() => setActiveChat({ type: 'task', data: t })}
                             className={`flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer group transition-colors ${isActive ? 'bg-[var(--accent-soft)]' : 'hover:bg-[var(--bg-soft)]'}`}
                           >
                             <div className="flex items-center gap-2 min-w-0">
                               <div className="relative flex items-center justify-center w-5 h-5 shrink-0 rounded bg-[var(--bg-soft)] border border-[var(--border)] text-[9px] font-bold text-[var(--text-muted)]">
                                 #
                               </div>
                               <span className={`text-[13px] font-medium truncate flex items-center gap-1.5 ${isActive ? 'text-[var(--accent)] font-bold' : 'text-[var(--text-muted)] group-hover:text-[var(--text)]'}`}>
                                 {t.title}
                               </span>
                             </div>
                           </div>
                        )
                     })}
                   </div>
                 </>
              )}
            </div>
          </div>
        </div>

        <div className={`flex-1 flex-col bg-[var(--bg)] min-w-0 ${activeChat ? 'flex' : 'hidden md:flex'}`}>
          
          {!activeChat ? (
             <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-muted)] p-8 text-center bg-gradient-to-b from-[var(--surface)] to-[var(--bg)]">
                 <div className="relative mb-6 hidden md:flex">
                    <div className="absolute inset-0 bg-[var(--accent)] blur-2xl opacity-10 rounded-full"></div>
                    <div className="w-20 h-20 bg-[var(--surface)] border border-[var(--border)] rounded-2xl flex items-center justify-center shadow-lg relative z-10">
                       <LuMessageSquare className="text-4xl text-[var(--accent)]" />
                    </div>
                 </div>
                 <h2 className="text-2xl font-black text-[var(--text)] tracking-tight mb-3 hidden md:block">Unified Workspace Messaging</h2>
                 <p className="text-[15px] max-w-md hidden md:block leading-relaxed">
                    Select a colleague or task from the sidebar to start collaborating. Direct messages and task discussions are real-time, encrypted, and seamlessly integrated into your workflow.
                 </p>
             </div>
          ) : (
             <>
              {/* Header */}
              <div className="h-16 px-4 md:px-6 flex justify-between items-center bg-[var(--surface)] border-b border-[var(--border)] shadow-[0_1px_2px_rgba(0,0,0,0.02)] shrink-0 z-10">
                <div className="flex items-center gap-3 md:gap-4">
                  <button 
                     onClick={() => setActiveChat(null)}
                     className="md:hidden mr-1 p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-soft)] active:bg-[var(--border)] transition-colors"
                  >
                     <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  </button>
                  <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-[var(--bg-soft)] border border-[var(--border)] text-[13px] font-bold text-[var(--text-muted)] shadow-sm">
                        {activeChat.type === 'user' ? activeChat.data.name.charAt(0).toUpperCase() : '#'}
                        {activeChat.type === 'user' && (
                           <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 border-[2.5px] border-[var(--surface)] rounded-full ${onlineUsers.includes(activeChat.data._id.toString()) ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        )}
                  </div>
                  <div className="flex flex-col justify-center">
                     <h2 className="text-[16px] font-black text-[var(--text)] tracking-tight leading-tight flex items-center gap-2">
                        {activeChat.type === 'user' ? activeChat.data.name : activeChat.type === 'community' ? activeChat.data.name : activeChat.data.title}
                     </h2>
                     <span className="text-[12px] font-medium text-[var(--text-muted)] flex items-center gap-1.5">
                        {activeChat.type === 'user' ? (
                           <>
                             <span className={`w-1.5 h-1.5 rounded-full ${onlineUsers.includes(activeChat.data._id.toString()) ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                             {onlineUsers.includes(activeChat.data._id.toString()) ? 'Active now' : 'Offline'}
                           </>
                        ) : activeChat.type === 'community' ? (
                           <span>Global Channel</span>
                        ) : (
                           <span>Task Discussion Room</span>
                        )}
                     </span>
                  </div>
                </div>
              </div>

              {/* Messages Feed */}
              <div ref={messagesEndRef} className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-6 space-y-1 scrollbar-thin">
                
                <div className="pb-8 pt-6 max-w-3xl">
                  <div className="w-16 h-16 bg-[var(--surface)] rounded-2xl flex items-center justify-center mb-5 border border-[var(--border)] shadow-sm text-[28px] font-black text-[var(--text)]">
                    {activeChat.type === 'user' ? activeChat.data.name.charAt(0).toUpperCase() : '#'}
                  </div>
                  <h1 className="text-[28px] font-black text-[var(--text)] mb-3 tracking-tight leading-none">
                     {activeChat.type === 'user' ? activeChat.data.name : activeChat.type === 'community' ? activeChat.data.name : activeChat.data.title}
                  </h1>
                  <p className="text-[15px] text-[var(--text-muted)] leading-relaxed">
                     {activeChat.type === 'user' ? (
                        <>This is the very beginning of your direct message history with <span className="font-bold text-[var(--text)]">@{activeChat.data.name}</span>. Only the two of you are in this conversation, and no one else can join it.</>
                     ) : activeChat.type === 'community' ? (
                        <>This is the start of the community chat channel. Messages here are seen by all active members.</>
                     ) : (
                        <>This is the beginning of the discussion for task <span className="font-bold text-[var(--text)]">#{activeChat.data.title}</span>. Anyone assigned to this task can collaborate here.</>
                     )}
                  </p>
                </div>

                <div className="relative w-full my-8 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                     <div className="w-full border-t border-[var(--border)]"></div>
                  </div>
                  <div className="relative bg-[var(--bg)] px-4">
                     <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest bg-[var(--surface)] px-3 py-1 rounded-full border border-[var(--border)]">
                        History Starts Here
                     </span>
                  </div>
                </div>

                {messages.map((msg, index) => {
                  const isMe = (msg.sender?._id || msg.sender) === (user?._id || user?.id);
                  const senderName = isMe ? 'You' : (msg.sender?.name || 'Unknown');
                  const time = moment(msg.createdAt).format('h:mm A');
                  const date = moment(msg.createdAt).format('MM/DD/YYYY');
                  
                  // Group consecutive messages
                  const isConsecutive = index > 0 
                    && (messages[index - 1].sender?._id || messages[index - 1].sender) === (msg.sender?._id || msg.sender) 
                    && moment(msg.createdAt).diff(moment(messages[index - 1].createdAt), 'minutes') < 5;

                  return (
                    <div 
                      key={msg._id || index} 
                      className={`group flex gap-3 md:gap-4 px-2 py-1 md:py-1.5 -mx-2 hover:bg-[var(--bg-soft)] transition-colors rounded-lg ${isConsecutive ? 'mt-0' : 'mt-4 md:mt-5'}`}
                      onContextMenu={(e) => handleContextMenu(e, msg, isMe)}
                      onTouchStart={(e) => handleTouchStart(e, msg, isMe)}
                      onTouchEnd={handleTouchEnd}
                      onTouchMove={handleTouchMove}
                      style={{ cursor: (isMe || (user && user.role === 'admin')) ? "context-menu" : "default" }}
                    >
                      
                      {/* Left Column (Avatar or Timestamp) */}
                      <div className="w-9 md:w-10 flex-shrink-0 flex justify-center">
                        {!isConsecutive ? (
                          <div className="mt-0.5">
                              <div className={`w-9 h-9 md:w-10 md:h-10 rounded-md flex items-center justify-center text-[13px] md:text-[14px] font-bold text-white shadow-sm transition-transform hover:scale-105 ${isMe ? 'bg-[#0f172a]' : 'bg-[var(--accent)]'}`}>
                                {senderName.charAt(0).toUpperCase()}
                              </div>
                          </div>
                        ) : (
                          <div className="opacity-0 group-hover:opacity-100 text-[10px] text-[var(--text-muted)] font-bold pt-1.5 select-none transition-opacity">
                            {time}
                          </div>
                        )}
                      </div>

                      {/* Right Column (Name/Time & Message Content) */}
                      <div className="flex flex-col flex-1 min-w-0 pb-0.5">
                        {!isConsecutive && (
                          <div className="flex items-baseline gap-2 leading-tight mb-1">
                            <span className="text-[15px] font-bold text-[var(--text)] tracking-tight hover:underline cursor-pointer">
                              {senderName}
                            </span>
                            <span className="text-[11px] font-medium text-[var(--text-muted)] flex items-center gap-1">
                              {time}
                            </span>
                          </div>
                        )}
                        {editingId === msg._id ? (
                          <div className="flex flex-col gap-2 w-full min-w-[200px] py-1 text-left">
                            <textarea
                              value={editInput}
                              onChange={(e) => setEditInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  if (editInput.trim()) {
                                    handleEditMessage(msg._id, editInput.trim());
                                  }
                                  setEditingId(null);
                                } else if (e.key === "Escape") {
                                  setEditingId(null);
                                }
                              }}
                              className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--bg-soft)] p-2 text-xs text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)]"
                              rows={2}
                              autoFocus
                            />
                            <div className="flex justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setEditingId(null)}
                                className="px-2.5 py-1 rounded text-[10px] font-bold bg-transparent text-[var(--text-muted)] hover:text-[var(--text)] transition-all"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (editInput.trim()) {
                                    handleEditMessage(msg._id, editInput.trim());
                                  }
                                  setEditingId(null);
                                }}
                                disabled={!editInput.trim()}
                                className="px-2.5 py-1 rounded text-[10px] font-bold bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-all disabled:opacity-50"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="text-[14px] md:text-[15px] text-[var(--text)] leading-[1.5] break-words whitespace-pre-wrap flex items-end gap-2 text-left">
                              <span>{parseMessageContent(msg.content, users, user)}</span>
                              {msg.isEdited && (
                                <span className="text-[9px] select-none text-[var(--text-muted)] font-semibold tracking-tight mt-1.5" title="Edited message">
                                  (edited)
                                </span>
                              )}
                            </div>
                            {isMe && activeChat.type === 'user' && msg.isRead && (
                              <div className="flex justify-start mt-0.5 select-none">
                                <span className="text-[9.5px] font-semibold text-[var(--text-muted)] tracking-tight leading-none" title="Seen by colleague">
                                  seen
                                </span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Elite Typing Indicator */}
                {typingStatus && (
                  <div className="flex gap-4 px-2 py-2 -mx-2 mt-2">
                    <div className="w-10 flex-shrink-0 flex justify-center">
                       <div className="w-8 h-8 rounded-md bg-[var(--bg-soft)] border border-[var(--border)] flex items-center justify-center animate-pulse">
                          <span className="text-[10px]">💬</span>
                       </div>
                    </div>
                    <div className="flex items-center">
                       <span className="text-[13px] text-[var(--text-muted)] font-medium italic animate-pulse">
                         {typingStatus}
                       </span>
                    </div>
                  </div>
                )}
              </div>
              {/* Input Area */}
              <div className="p-3 md:p-6 pt-1.5 md:pt-2 bg-[var(--bg)] shrink-0 z-10">
                <form onSubmit={handleSendMessage} className="relative max-w-5xl mx-auto">
                  
                  {/* Floating Mentions Dropdown */}
                  {showMentions && mentionSuggestions.length > 0 && (
                    <div className="absolute bottom-full left-4 mb-2 w-64 max-h-48 overflow-y-auto bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-lg z-50 py-1.5 scrollbar-thin">
                      <div className="px-3 py-1 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                        Team Members
                      </div>
                      {mentionSuggestions.map((u, idx) => (
                        <button
                          key={u._id}
                          type="button"
                          onClick={() => selectMention(u)}
                          className={`w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors ${
                            idx === activeMentionIndex 
                            ? 'bg-[var(--accent-soft)] text-[var(--accent)] font-semibold' 
                            : 'hover:bg-[var(--bg-soft)] text-[var(--text)]'
                          }`}
                        >
                          <div className="relative flex items-center justify-center w-5 h-5 shrink-0 rounded bg-[var(--bg-soft)] border border-[var(--border)] text-[9px] font-bold text-[var(--text-muted)]">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs truncate">{u.name}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Hidden File Input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleChatFileUpload}
                    className="hidden"
                  />

                  <div className="overflow-hidden border border-[var(--border)] bg-[var(--surface)] rounded-xl focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--accent)]/20 transition-all shadow-sm">
                    
                    <textarea
                      ref={textareaRef}
                      value={newMessage}
                      onChange={handleTyping}
                      onKeyDown={(e) => {
                        if (showMentions && mentionSuggestions.length > 0) {
                          if (e.key === "ArrowDown") {
                            e.preventDefault();
                            setActiveMentionIndex((prev) => (prev + 1) % mentionSuggestions.length);
                          } else if (e.key === "ArrowUp") {
                            e.preventDefault();
                            setActiveMentionIndex((prev) => (prev - 1 + mentionSuggestions.length) % mentionSuggestions.length);
                          } else if (e.key === "Enter") {
                            e.preventDefault();
                            selectMention(mentionSuggestions[activeMentionIndex]);
                          } else if (e.key === "Escape") {
                            e.preventDefault();
                            setShowMentions(false);
                          }
                        } else {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(e);
                          }
                        }
                      }}
                      placeholder={activeChat.type === 'user' ? `Message ${activeChat.data.name}` : activeChat.type === 'community' ? `Message #community-chat` : `Message in #${activeChat.data.title}`}
                      rows={1}
                      className="w-full max-h-[40vh] min-h-[44px] bg-transparent text-[14px] md:text-[15px] px-3.5 md:px-4 py-3 md:py-3.5 resize-none focus:outline-none placeholder:text-[var(--text-muted)]"
                      style={{ overflowY: 'auto' }}
                    />
                    
                    <div className="flex items-center justify-between px-3 py-2 bg-[var(--bg-soft)] border-t border-[var(--border)]">
                      <div className="flex items-center gap-1 text-[var(--text-muted)]">
                        <button 
                          type="button" 
                          onClick={() => handleFormatText('bold')}
                          className="p-1.5 hover:bg-[var(--surface)] hover:text-[var(--text)] rounded cursor-pointer transition-colors text-[16px]" 
                          title="Bold"
                        >
                          <span className="font-bold font-mono text-[13px]">B</span>
                        </button>
                        <button 
                          type="button" 
                          onClick={() => handleFormatText('italic')}
                          className="p-1.5 hover:bg-[var(--surface)] hover:text-[var(--text)] rounded cursor-pointer transition-colors text-[16px]" 
                          title="Italic"
                        >
                          <span className="italic font-serif text-[13px]">I</span>
                        </button>
                        <button 
                          type="button" 
                          onClick={() => fileInputRef.current?.click()}
                          className="p-1.5 hover:bg-[var(--surface)] hover:text-[var(--text)] rounded cursor-pointer transition-colors" 
                          title="Connect File"
                        >
                          <LuPaperclip className="w-4 h-4 text-[var(--text-muted)]" />
                        </button>
                        <div className="w-px h-4 bg-[var(--border)] mx-1"></div>
                        <div className="px-2 py-1 rounded text-[11px] font-medium hidden sm:flex items-center gap-1">
                          Press <kbd className="px-1.5 py-0.5 bg-[var(--border)] rounded text-[10px] font-bold text-[var(--text)] shadow-sm font-sans">Enter</kbd> to send
                        </div>
                      </div>
                      
                      <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 text-[13px] font-bold rounded-lg transition-all ${
                          newMessage.trim() 
                          ? 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] shadow-sm active:scale-95' 
                          : 'bg-[var(--border)] text-[var(--text-muted)] cursor-not-allowed'
                        }`}
                      >
                        <LuSend className="text-[15px]" />
                        <span className="hidden sm:inline">Send</span>
                      </button>
                    </div>
 
                  </div>
                </form>
              </div>
             </>
          )}
          
        </div>
      </div>

      {contextMenu && (
        <>
          <div 
            className="fixed inset-0 z-[100] bg-transparent" 
            onClick={() => setContextMenu(null)}
          />
          <div 
            className="fixed z-[101] w-40 rounded-lg bg-[var(--surface)] border border-[var(--border)] shadow-xl py-1 flex flex-col"
            style={{ 
              top: `${Math.min(contextMenu.y, window.innerHeight - 100)}px`, 
              left: `${Math.min(contextMenu.x, window.innerWidth - 170)}px` 
            }}
          >
            {contextMenu.isMe && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(contextMenu.messageId);
                  setEditInput(contextMenu.content);
                  setContextMenu(null);
                }}
                className="w-full text-left px-4 py-2.5 text-xs font-semibold text-[var(--text)] hover:bg-[var(--bg-soft)] transition-colors"
              >
                Edit Message
              </button>
            )}
             <button
              type="button"
              onClick={() => {
                setDeleteConfirmId(contextMenu.messageId);
                setContextMenu(null);
              }}
              className="w-full text-left px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-500/10 transition-colors"
            >
              Delete Message
            </button>
          </div>
        </>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity"
            onClick={() => setDeleteConfirmId(null)}
          />
          <div className="relative w-full max-w-sm rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-left">
            <h3 className="text-sm font-bold text-[var(--text)]">Delete Message</h3>
            <p className="mt-2 text-xs text-[var(--text-muted)] leading-[1.6]">
              Are you sure you want to delete this message? This action is permanent and cannot be undone.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--bg-soft)] border border-[var(--border)] transition-all duration-200 active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDeleteMessage(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-red-500 hover:bg-red-600 shadow-sm shadow-red-500/20 transition-all duration-200 active:scale-[0.98]"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default DirectChat;
