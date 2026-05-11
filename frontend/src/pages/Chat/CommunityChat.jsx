import React, { useState, useEffect, useContext, useRef } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { UserContext } from '../../context/UserContextState';
import axiosInstance from '../../utils/axiosInstance';
import { LuHash, LuMessageSquare, LuSend } from 'react-icons/lu';
import { io } from 'socket.io-client';

const CommunityChat = () => {
  const { user } = useContext(UserContext);
  
  // --- Unified State Management Foundation ---
  const [chatMode, setChatMode] = useState('community');
  const [activeChatId, setActiveChatId] = useState('community-chat');
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState([]);
  
  // --- Sidebar Data State ---
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [directChats, setDirectChats] = useState([]);
  const [loadingSidebar, setLoadingSidebar] = useState(true);
  
  const [onlineUsers, setOnlineUsers] = useState([]);
  const socketRef = useRef(null);

  // Fetch Sidebar Data
  useEffect(() => {
    const fetchSidebarData = async () => {
      if (!user) return;
      try {
        setLoadingSidebar(true);
        // Fetch Users
        const usersRes = await axiosInstance.get('/api/users');
        setUsers(usersRes.data.filter(u => u._id !== (user?._id || user?.id)));
        
        // Fetch Tasks
        const tasksRes = await axiosInstance.get('/api/tasks');
        setTasks(tasksRes.data.tasks || tasksRes.data || []);

        // Fetch Direct Chats for badges and ordering
        const directChatsRes = await axiosInstance.get('/api/direct-chats');
        setDirectChats(directChatsRes.data || []);
      } catch (error) {
        console.error('Error fetching workspace sidebar data:', error);
      } finally {
        setLoadingSidebar(false);
      }
    };
    
    fetchSidebarData();
  }, [user]);

  // Setup Socket for online tracking
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    socketRef.current = io("http://localhost:5000", {
      auth: { token },
      withCredentials: true,
    });

    socketRef.current.on('userOnline', (data) => {
      setOnlineUsers(Object.values(data.onlineUsers || {}));
    });

    socketRef.current.on('userOffline', (data) => {
      setOnlineUsers(Object.values(data.onlineUsers || {}));
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  // Sort users by recent direct chat activity
  const sortedUsers = [...users].sort((a, b) => {
    const chatA = directChats.find(c => c.participants.some(p => (p._id || p) === a._id));
    const chatB = directChats.find(c => c.participants.some(p => (p._id || p) === b._id));
    const dateA = chatA ? new Date(chatA.updatedAt).getTime() : 0;
    const dateB = chatB ? new Date(chatB.updatedAt).getTime() : 0;
    return dateB - dateA;
  });

  // Fetch messages based on active context
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setMessages([]); // Clear while loading
        if (chatMode === 'community') {
           const res = await axiosInstance.get('/api/chat');
           setMessages(res.data.messages || res.data || []);
        } else if (chatMode === 'direct' && activeChatId !== 'community-chat') {
           const res = await axiosInstance.get(`/api/direct-chats/${activeChatId}`);
           setMessages(res.data.messages || []);
           // Optimistically clear unread counts locally
           setDirectChats(prev => prev.map(chat => {
              if (chat.participants.some(p => (p._id || p) === activeChatId)) {
                 return { ...chat, unreadCounts: { ...chat.unreadCounts, [user?._id || user?.id]: 0 } };
              }
              return chat;
           }));
        } else if (chatMode === 'task' && activeChatId !== 'community-chat') {
           const res = await axiosInstance.get(`/api/task-discussions/${activeChatId}`);
           setMessages(res.data.messages || []);
        }
      } catch (err) {
         console.error('Error fetching messages', err);
      }
    };
    fetchMessages();
  }, [chatMode, activeChatId]);

  // Clear input when switching chats
  useEffect(() => {
    setNewMessage('');
  }, [activeChatId]);

  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    if (!newMessage.trim()) return;
    
    // We will implement actual Socket/API sending in the next step.
    console.log("Preparing to send:", newMessage);
    setNewMessage('');
  };

  return (
    <DashboardLayout activeMenu="Workspace Chat">
      {/* Hyper-minimalist Elite Container */}
      <div className="flex h-[calc(100vh-6rem)] w-full max-w-[1500px] mx-auto bg-[var(--bg)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm mt-4">
        
        {/* Left Sidebar - Unified Navigation Foundation */}
        <div className="hidden md:flex w-[280px] flex-col bg-[var(--surface)] border-r border-[var(--border)] z-10 select-none">
          <div className="h-14 px-5 flex items-center border-b border-[var(--border)] shadow-sm shrink-0">
            <h1 className="text-[15px] font-bold tracking-tight text-[var(--text)]">TaskSutra Workspace</h1>
          </div>
          
          <div className="flex-1 overflow-y-auto py-4 scrollbar-thin">
            {/* Channels Section */}
            <div className="px-3 mb-6">
              <div className="text-[11px] font-semibold tracking-wider text-[var(--text-muted)] uppercase mb-2 px-2 flex justify-between items-center">
                <span>Channels</span>
              </div>
              <div 
                onClick={() => { setChatMode('community'); setActiveChatId('community-chat'); }}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${chatMode === 'community' ? 'bg-[var(--accent-soft)] text-[var(--accent)] font-semibold' : 'text-[var(--text-muted)] hover:bg-[var(--bg-soft)] hover:text-[var(--text)]'}`}
              >
                <LuHash className="text-[16px]" />
                <span className="text-[13px] truncate"># community-chat</span>
              </div>
            </div>

            {/* Direct Messages Section */}
            <div className="px-3 mb-6">
              <div className="text-[11px] font-semibold tracking-wider text-[var(--text-muted)] uppercase mb-2 px-2 flex justify-between items-center group cursor-pointer hover:text-[var(--text)] transition-colors">
                <span>Direct Messages</span>
              </div>
              <div className="space-y-0.5">
                {loadingSidebar ? (
                   <div className="px-2 text-[12px] text-[var(--text-muted)] italic">Loading...</div>
                ) : users.length === 0 ? (
                   <div className="px-2 text-[12px] text-[var(--text-muted)] italic">No colleagues found.</div>
                ) : (
                   sortedUsers.map(u => {
                     const isOnline = onlineUsers.includes(u._id.toString());
                     const chat = directChats.find(c => c.participants.some(p => (p._id || p) === u._id));
                     const unreadCount = chat?.unreadCounts?.[user?._id || user?.id] || 0;

                     return (
                       <div 
                          key={u._id}
                          onClick={() => { setChatMode('direct'); setActiveChatId(u._id); }}
                          className={`flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer group transition-colors ${chatMode === 'direct' && activeChatId === u._id ? 'bg-[var(--accent-soft)]' : 'hover:bg-[var(--bg-soft)]'}`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="relative flex items-center justify-center w-5 h-5 shrink-0 rounded bg-[var(--bg-soft)] border border-[var(--border)] text-[9px] font-bold text-[var(--text-muted)] group-hover:border-[var(--text-muted)] transition-colors">
                              {u.name.charAt(0).toUpperCase()}
                              <div className={`absolute -bottom-0.5 -right-0.5 w-[7px] h-[7px] border border-[var(--surface)] rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                            </div>
                            <span className={`text-[13px] truncate flex items-center gap-1.5 transition-colors ${chatMode === 'direct' && activeChatId === u._id ? 'text-[var(--accent)] font-bold' : unreadCount > 0 ? 'text-[var(--text)] font-bold' : 'text-[var(--text-muted)] font-medium group-hover:text-[var(--text)]'}`}>
                               {u.name}
                               {u.role && u.role.toLowerCase() === 'admin' && (
                                  <span className="px-1.5 py-[1px] rounded-[3px] bg-[#C28B2C]/10 text-[#C28B2C] text-[8px] font-extrabold tracking-widest uppercase border border-[#C28B2C]/30 shadow-[0_0_8px_rgba(194,139,44,0.15)]">Admin</span>
                               )}
                            </span>
                          </div>
                          {unreadCount > 0 && (
                            <div className="bg-[var(--accent)] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                               {unreadCount}
                            </div>
                          )}
                        </div>
                     );
                   })
                )}
              </div>
            </div>

            {/* Task Discussions Section */}
            <div className="px-3">
              <div className="text-[11px] font-semibold tracking-wider text-[var(--text-muted)] uppercase mb-2 px-2 flex justify-between items-center group cursor-pointer hover:text-[var(--text)] transition-colors">
                <span>Task Discussions</span>
              </div>
              <div className="space-y-0.5">
                {loadingSidebar ? (
                   <div className="px-2 text-[12px] text-[var(--text-muted)] italic">Loading...</div>
                ) : tasks.length === 0 ? (
                   <div className="px-2 text-[12px] text-[var(--text-muted)] italic">No active tasks.</div>
                ) : (
                   tasks.slice(0, 6).map(t => (
                     <div 
                        key={t._id}
                        onClick={() => { setChatMode('task'); setActiveChatId(t._id); }}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer group transition-colors ${chatMode === 'task' && activeChatId === t._id ? 'bg-[var(--accent-soft)]' : 'hover:bg-[var(--bg-soft)]'}`}
                      >
                        <div className={`flex items-center justify-center w-5 h-5 ${chatMode === 'task' && activeChatId === t._id ? 'text-[var(--accent)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text)]'}`}>
                           <LuHash className="text-[14px]" />
                        </div>
                        <span className={`text-[13px] font-medium truncate ${chatMode === 'task' && activeChatId === t._id ? 'text-[var(--accent)] font-semibold' : 'text-[var(--text-muted)] group-hover:text-[var(--text)]'}`}>
                           {t.title}
                        </span>
                      </div>
                   ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex flex-1 flex-col bg-[var(--bg)] min-w-0 relative">
          
          {/* Header */}
          <div className="h-14 px-6 flex justify-between items-center bg-[var(--surface)] border-b border-[var(--border)] shadow-sm shrink-0">
            {chatMode === 'community' && (
              <div className="flex items-center gap-2">
                <LuHash className="text-[var(--text-muted)] text-[18px]" />
                <h2 className="text-[15px] font-bold text-[var(--text)] tracking-tight">community-chat</h2>
              </div>
            )}
            
            {chatMode === 'direct' && (
              <div className="flex items-center gap-2">
                {(() => {
                  const activeU = users.find(u => u._id === activeChatId);
                  if (!activeU) return <h2 className="text-[15px] font-bold text-[var(--text)] tracking-tight">Direct Message</h2>;
                  const isOnline = onlineUsers.includes(activeU._id.toString());
                  return (
                    <>
                      <div className="relative flex items-center justify-center w-6 h-6 rounded bg-[var(--bg-soft)] border border-[var(--border)] text-[10px] font-bold text-[var(--text-muted)]">
                        {activeU.name.charAt(0).toUpperCase()}
                        <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border-2 border-[var(--surface)] rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      </div>
                      <h2 className="text-[15px] font-bold text-[var(--text)] tracking-tight">{activeU.name}</h2>
                    </>
                  )
                })()}
              </div>
            )}

            {chatMode === 'task' && (
              <div className="flex items-center gap-2">
                <LuMessageSquare className="text-[var(--text-muted)] text-[18px]" />
                {(() => {
                  const activeT = tasks.find(t => t._id === activeChatId);
                  if (!activeT) return <h2 className="text-[15px] font-bold text-[var(--text)] tracking-tight">Task Discussion</h2>;
                  return <h2 className="text-[15px] font-bold text-[var(--text)] tracking-tight">{activeT.title}</h2>;
                })()}
              </div>
            )}
          </div>

          {/* Messages Feed Placeholder -> Real Messages Feed */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-1 scrollbar-thin">
             <div className="pb-10 pt-4 max-w-3xl">
                <h1 className="text-2xl font-bold text-[var(--text)] mb-2 tracking-tight">
                  {chatMode === 'community' && 'Welcome to #community-chat!'}
                  {chatMode === 'direct' && 'Private Direct Message'}
                  {chatMode === 'task' && 'Task Discussion Room'}
                </h1>
                <p className="text-[14px] text-[var(--text-muted)]">
                  {chatMode === 'community' && 'This is the start of the community chat channel. Messages here are seen by all active members.'}
                  {chatMode === 'direct' && 'This is the beginning of your direct message history. Messages are securely encrypted.'}
                  {chatMode === 'task' && 'Discuss task details securely here. Only assigned members and admins can view this.'}
                </p>
             </div>
             
             <div className="h-px bg-[var(--border)] w-full my-6 flex items-center justify-center">
                <span className="bg-[var(--bg)] px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Beginning of History</span>
             </div>

             {messages.map((msg, index) => {
                const isMe = msg.sender?._id === (user?._id || user?.id);
                const senderName = isMe ? 'You' : (msg.sender?.name || 'Unknown');
                const isAdmin = msg.sender?.role && msg.sender.role.toLowerCase() === 'admin';
                const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                
                // Group consecutive messages
                const isConsecutive = index > 0 
                  && messages[index - 1].sender?._id === msg.sender?._id 
                  && (new Date(msg.createdAt) - new Date(messages[index - 1].createdAt)) < 5 * 60 * 1000;

                return (
                  <div key={msg._id || index} className={`group flex gap-4 px-2 py-1 -mx-2 hover:bg-[var(--bg-soft)] transition-colors rounded-lg ${isConsecutive ? 'mt-0' : 'mt-4'}`}>
                    {/* Avatar */}
                    <div className="w-10 flex-shrink-0 flex justify-center">
                      {!isConsecutive ? (
                        <div className="mt-0.5">
                            <div className={`w-10 h-10 rounded-md flex items-center justify-center text-[14px] font-bold text-white shadow-sm ${isMe ? 'bg-[#0f172a]' : isAdmin ? 'bg-[#C28B2C]' : 'bg-[var(--accent)]'}`}>
                              {senderName.charAt(0).toUpperCase()}
                            </div>
                        </div>
                      ) : (
                        <div className="opacity-0 group-hover:opacity-100 text-[10px] text-[var(--text-muted)] font-medium pt-1.5 select-none">
                          {time}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex flex-col flex-1 min-w-0 pb-0.5">
                      {!isConsecutive && (
                        <div className="flex items-center gap-2 leading-tight mb-1">
                          <span className="text-[15px] font-bold text-[var(--text)] tracking-tight">
                            {senderName}
                          </span>
                          {isAdmin && (
                            <span className="px-1.5 py-[1px] rounded-[3px] bg-[#C28B2C]/10 text-[#C28B2C] text-[8px] font-extrabold tracking-widest uppercase border border-[#C28B2C]/30 shadow-[0_0_8px_rgba(194,139,44,0.15)]">Admin</span>
                          )}
                          <span className="text-[11px] font-medium text-[var(--text-muted)]">
                            {time}
                          </span>
                        </div>
                      )}
                      <div className="text-[15px] text-[var(--text)] leading-[1.45] break-words whitespace-pre-wrap">
                        {msg.content}
                      </div>
                    </div>
                  </div>
                );
             })}
          </div>

          {/* Input Area */}
          <div className="p-5 pt-0 bg-[var(--bg)] shrink-0">
            <form onSubmit={handleSendMessage} className="relative">
              <div className="overflow-hidden border border-[var(--border)] bg-[var(--surface)] rounded-xl focus-within:border-[var(--accent)] focus-within:ring-1 focus-within:ring-[var(--accent)] transition-all shadow-sm">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                    placeholder={chatMode === 'community' ? "Message #community-chat" : chatMode === 'direct' ? "Send a direct message" : "Discuss this task"}
                    rows={1}
                    className="w-full max-h-32 min-h-[44px] bg-transparent text-[14px] text-[var(--text)] px-4 py-3 resize-none focus:outline-none placeholder:text-[var(--text-muted)]"
                    style={{ overflowY: 'auto' }}
                  />
                  
                  <div className="flex items-center justify-between px-2 py-2 bg-[var(--bg-soft)] border-t border-[var(--border)]">
                    <div className="flex items-center gap-1 text-[var(--text-muted)]">
                      <div className="p-1.5 hover:bg-[var(--surface)] hover:text-[var(--text)] rounded cursor-pointer transition-colors text-[16px]">
                        <span className="font-bold font-mono text-[12px]">B</span>
                      </div>
                      <div className="p-1.5 hover:bg-[var(--surface)] hover:text-[var(--text)] rounded cursor-pointer transition-colors text-[16px]">
                        <span className="italic font-serif text-[12px]">I</span>
                      </div>
                    </div>
                    
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-bold rounded-lg transition-all ${
                        newMessage.trim() 
                        ? 'bg-[var(--accent)] text-white hover:opacity-90 shadow-sm' 
                        : 'bg-[var(--border)] text-[var(--text-muted)] cursor-not-allowed'
                      }`}
                    >
                      <LuSend className="text-[14px]" />
                      Send
                    </button>
                  </div>
              </div>
            </form>
          </div>
        </div>
        
      </div>
    </DashboardLayout>
  );
};

export default CommunityChat;
