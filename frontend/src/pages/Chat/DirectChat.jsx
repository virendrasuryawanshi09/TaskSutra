import React, { useEffect, useState, useRef, useContext } from 'react';
import { io } from 'socket.io-client';
import DashboardLayout from '../../components/Layouts/DashboardLayout';
import { UserContext } from '../../context/UserContextState';
import axiosInstance from '../../utils/axiosInstance';
import moment from 'moment';
import { LuSend, LuMessageSquare } from 'react-icons/lu';

const DirectChat = () => {
  const { user } = useContext(UserContext);
  const [users, setUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingStatus, setTypingStatus] = useState(null); // String: "User is typing..."
  
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [directChats, setDirectChats] = useState([]);

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

        setUsers(fetchedUsers);
      } catch (error) {
        console.error('Failed to fetch sidebar data:', error);
      }
    };
    if (user) fetchSidebarData();
  }, [user]);

  // Fetch messages when active user changes
  useEffect(() => {
    const fetchDirectMessages = async () => {
      if (!activeUser) return;
      try {
        const res = await axiosInstance.get(`/api/direct-chats/${activeUser._id}`);
        setMessages(res.data.messages || []);
        // Mark as read
        if (res.data.chat) {
          await axiosInstance.put(`/api/direct-chats/${res.data.chat._id}/read`);
          
          if (socketRef.current) {
             socketRef.current.emit('mark_messages_seen', {
                chatId: res.data.chat._id,
                readerId: user?._id || user?.id,
                senderId: activeUser._id
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
      } catch (error) {
        console.error('Failed to fetch DMs:', error);
      }
    };
    fetchDirectMessages();
  }, [activeUser, user]);

  // Socket setup
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !user) return;

    const socketUrl = "http://localhost:5000";
    socketRef.current = io(socketUrl, {
      auth: { token },
      withCredentials: true,
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to Direct Messaging socket');
    });

    socketRef.current.on('receive_direct_message', (message) => {
      const senderId = String(message.sender?._id || message.sender);
      
      // Only append if the message belongs to the current active chat
      setMessages((prev) => {
        if (activeUser && senderId === String(activeUser._id)) {
          // Prevent duplicates
          if (prev.find(m => String(m._id) === String(message._id))) return prev;
          return [...prev, message];
        }
        return prev;
      });

      // Update unread badges and sidebar ordering
      if (!activeUser || senderId !== String(activeUser._id)) {
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
    });

    socketRef.current.on('userOnline', (data) => {
      setOnlineUsers(Object.values(data.onlineUsers || {}));
    });

    socketRef.current.on('userOffline', (data) => {
      setOnlineUsers(Object.values(data.onlineUsers || {}));
    });

    socketRef.current.on('dm_typing', (data) => {
      if (activeUser && data.senderId === activeUser._id) {
         setTypingStatus(`${data.name} is typing...`);
      }
    });

    socketRef.current.on('dm_stop_typing', (data) => {
      if (activeUser && data.senderId === activeUser._id) {
         setTypingStatus(null);
      }
    });

    socketRef.current.on('messages_seen', (data) => {
      if (activeUser && data.readerId === activeUser._id) {
         setMessages(prev => prev.map(m => 
            m.sender?._id === (user?._id || user?.id) ? { ...m, isRead: true } : m
         ));
      }
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [user, activeUser]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeUser) return;

    try {
      const response = await axiosInstance.post('/api/direct-chats', {
        receiverId: activeUser._id,
        content: newMessage
      });
      
      const savedMessage = response.data.message;
      
      // Append locally
      setMessages(prev => [...prev, savedMessage]);

      // Update local directChats to bump to top
      setDirectChats(prev => prev.map(c => {
         if (c.participants.some(p => String(p._id || p) === String(activeUser._id))) {
            return { ...c, updatedAt: new Date().toISOString() };
         }
         return c;
      }));
      
      // Emit to server to route to receiver
      socketRef.current.emit('send_direct_message', {
        receiverId: activeUser._id,
        messageData: savedMessage
      });
      
      setNewMessage('');
      handleStopTyping();
    } catch (error) {
      console.error('Failed to send DM:', error);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (socketRef.current && user && activeUser) {
      const userId = user._id || user.id;
      socketRef.current.emit('dm_typing', { 
        receiverId: activeUser._id, 
        senderId: userId, 
        name: user.name 
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      typingTimeoutRef.current = setTimeout(() => {
        handleStopTyping();
      }, 2000);
    }
  };

  const handleStopTyping = () => {
    if (socketRef.current && user && activeUser) {
      const userId = user._id || user.id;
      socketRef.current.emit('dm_stop_typing', { 
        receiverId: activeUser._id, 
        senderId: userId 
      });
    }
  };

  return (
    <DashboardLayout activeMenu="Direct Messages">
      {/* Hyper-minimalist Elite Container */}
      <div className="flex h-[calc(100vh-6rem)] w-full max-w-[1500px] mx-auto bg-[var(--bg)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm mt-4">
        
        {/* Left Sidebar - Users List */}
        <div className="hidden md:flex w-64 flex-col bg-[var(--surface)] border-r border-[var(--border)] z-10">
          <div className="h-14 px-5 flex items-center border-b border-[var(--border)] shadow-sm">
            <h1 className="text-[14px] font-bold tracking-tight text-[var(--text)]">Direct Messages</h1>
          </div>
          
          <div className="flex-1 overflow-y-auto py-4 scrollbar-thin">
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
                  const isActive = activeUser?._id === u._id;
                  const chat = directChats.find(c => c.participants.some(p => String(p._id || p) === String(u._id)));
                  const unreadCount = chat?.unreadCounts?.[user?._id || user?.id] || 0;

                  return (
                    <div 
                      key={u._id} 
                      onClick={() => setActiveUser(u)}
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
                             <span className="px-1.5 py-[1px] rounded-[3px] bg-[#C28B2C]/10 text-[#C28B2C] text-[8px] font-extrabold tracking-widest uppercase border border-[#C28B2C]/30 shadow-[0_0_8px_rgba(194,139,44,0.15)] hidden md:inline-block">Admin</span>
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
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex flex-1 flex-col bg-[var(--bg)] min-w-0">
          
          {!activeUser ? (
             <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-muted)] p-8 text-center bg-gradient-to-b from-[var(--surface)] to-[var(--bg)]">
                 <div className="relative mb-6 hidden md:flex">
                    <div className="absolute inset-0 bg-[var(--accent)] blur-2xl opacity-10 rounded-full"></div>
                    <div className="w-20 h-20 bg-[var(--surface)] border border-[var(--border)] rounded-2xl flex items-center justify-center shadow-lg relative z-10">
                       <LuMessageSquare className="text-4xl text-[var(--accent)]" />
                    </div>
                 </div>
                 <h2 className="text-2xl font-black text-[var(--text)] tracking-tight mb-3 hidden md:block">Unified Workspace Messaging</h2>
                 <p className="text-[15px] max-w-md hidden md:block leading-relaxed">
                    Select a colleague from the sidebar to start a private conversation. Direct messages are real-time, encrypted, and seamlessly integrated into your workflow.
                 </p>
                 
                 {/* Mobile User List */}
                 <div className="md:hidden w-full flex flex-col items-start text-left space-y-3 mt-4">
                    <h2 className="text-xl font-black text-[var(--text)] mb-2">Direct Messages</h2>
                    {users.map((u) => {
                      const isOnline = onlineUsers.includes(u._id.toString());
                      return (
                        <div 
                          key={u._id} 
                          onClick={() => setActiveUser(u)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm active:scale-[0.98] transition-transform"
                        >
                           <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--bg-soft)] border border-[var(--border)] font-bold text-[var(--text-muted)]">
                            {u.name.charAt(0).toUpperCase()}
                            <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 border-[2.5px] border-[var(--surface)] rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                           </div>
                           <div className="flex flex-col">
                              <span className="font-bold text-[var(--text)] text-[15px]">{u.name}</span>
                              <span className="text-[12px] text-[var(--text-muted)]">{isOnline ? 'Active now' : 'Offline'}</span>
                           </div>
                        </div>
                      );
                    })}
                 </div>
             </div>
          ) : (
             <>
              {/* Header */}
              <div className="h-16 px-4 md:px-6 flex justify-between items-center bg-[var(--surface)] border-b border-[var(--border)] shadow-[0_1px_2px_rgba(0,0,0,0.02)] shrink-0 z-10">
                <div className="flex items-center gap-3 md:gap-4">
                  <button 
                     onClick={() => setActiveUser(null)}
                     className="md:hidden mr-1 p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-soft)] active:bg-[var(--border)] transition-colors"
                  >
                     <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  </button>
                  <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-[var(--bg-soft)] border border-[var(--border)] text-[13px] font-bold text-[var(--text-muted)] shadow-sm">
                        {activeUser.name.charAt(0).toUpperCase()}
                        <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 border-[2.5px] border-[var(--surface)] rounded-full ${onlineUsers.includes(activeUser._id.toString()) ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  </div>
                  <div className="flex flex-col justify-center">
                     <h2 className="text-[16px] font-black text-[var(--text)] tracking-tight leading-tight flex items-center gap-2">
                        {activeUser.name}
                     </h2>
                     <span className="text-[12px] font-medium text-[var(--text-muted)] flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${onlineUsers.includes(activeUser._id.toString()) ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                        {onlineUsers.includes(activeUser._id.toString()) ? 'Active now' : 'Offline'}
                     </span>
                  </div>
                </div>
              </div>

              {/* Messages Feed */}
              <div ref={messagesEndRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-1 scrollbar-thin">
                
                <div className="pb-8 pt-6 max-w-3xl">
                  <div className="w-16 h-16 bg-[var(--surface)] rounded-2xl flex items-center justify-center mb-5 border border-[var(--border)] shadow-sm text-[28px] font-black text-[var(--text)]">
                    {activeUser.name.charAt(0).toUpperCase()}
                  </div>
                  <h1 className="text-[28px] font-black text-[var(--text)] mb-3 tracking-tight leading-none">{activeUser.name}</h1>
                  <p className="text-[15px] text-[var(--text-muted)] leading-relaxed">
                     This is the very beginning of your direct message history with <span className="font-bold text-[var(--text)]">@{activeUser.name}</span>. 
                     Only the two of you are in this conversation, and no one else can join it.
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
                  const isMe = msg.sender?._id === (user?._id || user?.id);
                  const senderName = isMe ? 'You' : activeUser.name;
                  const time = moment(msg.createdAt).format('h:mm A');
                  const date = moment(msg.createdAt).format('MM/DD/YYYY');
                  
                  // Group consecutive messages
                  const isConsecutive = index > 0 
                    && messages[index - 1].sender?._id === msg.sender?._id 
                    && moment(msg.createdAt).diff(moment(messages[index - 1].createdAt), 'minutes') < 5;

                  return (
                    <div key={msg._id || index} className={`group flex gap-4 px-2 py-1.5 -mx-2 hover:bg-[var(--bg-soft)] transition-colors rounded-lg ${isConsecutive ? 'mt-0' : 'mt-5'}`}>
                      
                      {/* Left Column (Avatar or Timestamp) */}
                      <div className="w-10 flex-shrink-0 flex justify-center">
                        {!isConsecutive ? (
                          <div className="mt-0.5">
                              <div className={`w-10 h-10 rounded-md flex items-center justify-center text-[14px] font-bold text-white shadow-sm transition-transform hover:scale-105 ${isMe ? 'bg-[#0f172a]' : 'bg-[var(--accent)]'}`}>
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
                        <div className="text-[15px] text-[var(--text)] leading-[1.5] break-words whitespace-pre-wrap flex items-end gap-2">
                          <span>{msg.content}</span>
                          {isMe && (
                             <span className="text-[14px] leading-none mb-0.5 ml-1 inline-block" title={msg.isRead ? "Seen" : "Sent"}>
                                {msg.isRead ? (
                                   <span className="text-blue-500 font-bold">✓✓</span>
                                ) : (
                                   <span className="text-[var(--text-muted)]">✓</span>
                                )}
                             </span>
                          )}
                        </div>
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
              <div className="p-4 md:p-6 pt-2 bg-[var(--bg)] shrink-0 z-10">
                <form onSubmit={handleSendMessage} className="relative max-w-5xl mx-auto">
                  <div className="overflow-hidden border border-[var(--border)] bg-[var(--surface)] rounded-xl focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--accent)]/20 transition-all shadow-sm">
                    
                    <textarea
                      value={newMessage}
                      onChange={handleTyping}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                      placeholder={`Message ${activeUser.name}`}
                      rows={1}
                      className="w-full max-h-[40vh] min-h-[48px] bg-transparent text-[15px] text-[var(--text)] px-4 py-3.5 resize-none focus:outline-none placeholder:text-[var(--text-muted)]"
                      style={{ overflowY: 'auto' }}
                    />
                    
                    <div className="flex items-center justify-between px-3 py-2 bg-[var(--bg-soft)] border-t border-[var(--border)]">
                      <div className="flex items-center gap-1 text-[var(--text-muted)]">
                        <button type="button" className="p-1.5 hover:bg-[var(--surface)] hover:text-[var(--text)] rounded cursor-pointer transition-colors text-[16px]" title="Bold">
                          <span className="font-bold font-mono text-[13px]">B</span>
                        </button>
                        <button type="button" className="p-1.5 hover:bg-[var(--surface)] hover:text-[var(--text)] rounded cursor-pointer transition-colors text-[16px]" title="Italic">
                          <span className="italic font-serif text-[13px]">I</span>
                        </button>
                        <button type="button" className="p-1.5 hover:bg-[var(--surface)] hover:text-[var(--text)] rounded cursor-pointer transition-colors" title="Link">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
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
    </DashboardLayout>
  );
};

export default DirectChat;
