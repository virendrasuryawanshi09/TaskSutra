import React, { useState, useEffect, useContext, useRef } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { UserContext } from '../../context/UserContextState';
import axiosInstance from '../../utils/axiosInstance';
import { LuHash, LuMessageSquare } from 'react-icons/lu';
import { io } from 'socket.io-client';

const CommunityChat = () => {
  const { user } = useContext(UserContext);
  
  // --- Unified State Management Foundation ---
  const [chatMode, setChatMode] = useState('community');
  const [activeChatId, setActiveChatId] = useState('community-chat');
  
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
                            <span className={`text-[13px] truncate transition-colors ${chatMode === 'direct' && activeChatId === u._id ? 'text-[var(--accent)] font-bold' : unreadCount > 0 ? 'text-[var(--text)] font-bold' : 'text-[var(--text-muted)] font-medium group-hover:text-[var(--text)]'}`}>
                               {u.name}
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

        {/* Main Chat Area Foundation */}
        <div className="flex flex-1 flex-col bg-[var(--bg)] min-w-0">
           <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-muted)] p-8 text-center">
                 <div className="w-16 h-16 bg-[var(--surface)] border border-[var(--border)] rounded-2xl flex items-center justify-center mb-4 shadow-sm hidden md:flex">
                    <LuMessageSquare className="text-3xl text-[var(--accent)]" />
                 </div>
                 <h2 className="text-xl font-bold text-[var(--text)] tracking-tight mb-2 hidden md:block">
                   {chatMode === 'community' ? 'Community Chat' : chatMode === 'direct' ? 'Direct Messages' : 'Task Discussions'}
                 </h2>
                 <p className="text-[14px] max-w-sm hidden md:block">
                   Workspace UI structural foundation initialized. Mode routing is active.
                 </p>
             </div>
        </div>
        
      </div>
    </DashboardLayout>
  );
};

export default CommunityChat;
