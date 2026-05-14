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
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
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
      // Only append if the message belongs to the current active chat
      setMessages((prev) => {
        // Checking if we are currently chatting with the sender
        if (activeUser && message.sender._id === activeUser._id) {
          return [...prev, message];
        }
        return prev; // If from someone else, we ideally show an unread badge (handled in DB/refresh)
      });
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
                {users.map((u) => {
                  const isOnline = onlineUsers.includes(u._id.toString());
                  const isActive = activeUser?._id === u._id;
                  return (
                    <div 
                      key={u._id} 
                      onClick={() => setActiveUser(u)}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer group transition-colors ${isActive ? 'bg-[var(--accent-soft)]' : 'hover:bg-[var(--bg-soft)]'}`}
                    >
                      <div className="relative flex items-center justify-center w-5 h-5 rounded bg-[var(--bg-soft)] border border-[var(--border)] text-[9px] font-bold text-[var(--text-muted)]">
                        {u.name.charAt(0).toUpperCase()}
                        <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 border-[1.5px] border-[var(--surface)] rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      </div>
                      <span className={`text-[13px] font-medium truncate ${isActive ? 'text-[var(--accent)]' : 'text-[var(--text)]'}`}>{u.name}</span>
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
             <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-muted)] p-8 text-center overflow-y-auto">
                 <div className="w-16 h-16 bg-[var(--surface)] border border-[var(--border)] rounded-2xl flex items-center justify-center mb-4 shadow-sm hidden md:flex">
                    <LuMessageSquare className="text-3xl text-[var(--accent)]" />
                 </div>
                 <h2 className="text-xl font-bold text-[var(--text)] tracking-tight mb-2 hidden md:block">Your Direct Messages</h2>
                 <p className="text-[14px] max-w-sm hidden md:block">Select a colleague from the sidebar to start a private conversation. Direct messages are encrypted and secure.</p>
                 
                 {/* Mobile User List */}
                 <div className="md:hidden w-full flex flex-col items-start text-left space-y-2 mt-4">
                    <h2 className="text-lg font-bold text-[var(--text)] mb-2">Select a Colleague</h2>
                    {users.map((u) => {
                      const isOnline = onlineUsers.includes(u._id.toString());
                      return (
                        <div 
                          key={u._id} 
                          onClick={() => setActiveUser(u)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm active:scale-[0.98] transition-transform"
                        >
                           <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--bg-soft)] border border-[var(--border)] font-bold text-[var(--text-muted)]">
                            {u.name.charAt(0).toUpperCase()}
                            <div className={`absolute -bottom-1 -right-1 w-3 h-3 border-[2px] border-[var(--surface)] rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                           </div>
                           <span className="font-semibold text-[var(--text)]">{u.name}</span>
                        </div>
                      );
                    })}
                 </div>
             </div>
          ) : (
             <>
              {/* Header */}
              <div className="h-14 px-4 md:px-6 flex justify-between items-center bg-[var(--surface)] border-b border-[var(--border)] shadow-sm shrink-0">
                <div className="flex items-center gap-2 md:gap-3">
                  <button 
                     onClick={() => setActiveUser(null)}
                     className="md:hidden mr-1 p-1.5 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-soft)] active:bg-[var(--border)]"
                  >
                     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  </button>
                  <div className="relative flex items-center justify-center w-7 h-7 rounded bg-[var(--bg-soft)] border border-[var(--border)] text-[11px] font-bold text-[var(--text-muted)]">
                        {activeUser.name.charAt(0).toUpperCase()}
                        <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border-2 border-[var(--surface)] rounded-full ${onlineUsers.includes(activeUser._id.toString()) ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  </div>
                  <h2 className="text-[15px] font-bold text-[var(--text)] tracking-tight">{activeUser.name}</h2>
                  <span className="text-[12px] text-[var(--text-muted)] ml-2">{activeUser.email}</span>
                </div>
              </div>

              {/* Messages Feed */}
              <div ref={messagesEndRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-1 scrollbar-thin">
                
                <div className="pb-10 pt-4 max-w-3xl">
                  <div className="w-12 h-12 bg-[var(--bg-soft)] rounded-xl flex items-center justify-center mb-4 border border-[var(--border)] text-[20px] font-bold text-[var(--text)]">
                    {activeUser.name.charAt(0).toUpperCase()}
                  </div>
                  <h1 className="text-2xl font-bold text-[var(--text)] mb-2 tracking-tight">{activeUser.name}</h1>
                  <p className="text-[14px] text-[var(--text-muted)]">This is the very beginning of your direct message history with {activeUser.name}.</p>
                </div>

                <div className="h-px bg-[var(--border)] w-full my-6 flex items-center justify-center">
                  <span className="bg-[var(--bg)] px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Beginning of History</span>
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
                    <div key={msg._id || index} className={`group flex gap-4 px-2 py-1 -mx-2 hover:bg-[var(--bg-soft)] transition-colors rounded-lg ${isConsecutive ? 'mt-0' : 'mt-4'}`}>
                      
                      {/* Left Column (Avatar or Timestamp) */}
                      <div className="w-10 flex-shrink-0 flex justify-center">
                        {!isConsecutive ? (
                          <div className="mt-0.5">
                              <div className={`w-10 h-10 rounded-md flex items-center justify-center text-[14px] font-bold text-white shadow-sm ${isMe ? 'bg-[#0f172a]' : 'bg-[var(--accent)]'}`}>
                                {senderName.charAt(0).toUpperCase()}
                              </div>
                          </div>
                        ) : (
                          <div className="opacity-0 group-hover:opacity-100 text-[10px] text-[var(--text-muted)] font-medium pt-1.5 select-none">
                            {time}
                          </div>
                        )}
                      </div>

                      {/* Right Column (Name/Time & Message Content) */}
                      <div className="flex flex-col flex-1 min-w-0 pb-0.5">
                        {!isConsecutive && (
                          <div className="flex items-baseline gap-2 leading-tight mb-1">
                            <span className="text-[15px] font-bold text-[var(--text)] tracking-tight">
                              {senderName}
                            </span>
                            <span className="text-[11px] font-medium text-[var(--text-muted)] hover:underline cursor-pointer">
                              {date} {time}
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

                {/* Elite Typing Indicator */}
                {typingStatus && (
                  <div className="flex items-center gap-2 text-[13px] text-[var(--text-muted)] font-medium mt-2 px-2 animate-pulse">
                    {typingStatus}
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="p-5 pt-0 bg-[var(--bg)] shrink-0">
                <form onSubmit={handleSendMessage} className="relative">
                  <div className="overflow-hidden border border-[var(--border)] bg-[var(--surface)] rounded-xl focus-within:border-[var(--accent)] focus-within:ring-1 focus-within:ring-[var(--accent)] transition-all shadow-sm">
                    
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
                        <div className="w-px h-4 bg-[var(--border)] mx-1"></div>
                        <div className="px-2 py-1 hover:bg-[var(--surface)] hover:text-[var(--text)] rounded cursor-pointer transition-colors text-[11px] font-medium flex items-center gap-1">
                          Press <span className="px-1 py-0.5 bg-[var(--border)] rounded text-[9px] font-bold text-[var(--text)] shadow-sm">Enter</span> to send
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
             </>
          )}
          
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DirectChat;
