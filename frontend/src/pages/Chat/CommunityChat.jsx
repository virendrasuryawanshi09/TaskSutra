import React, { useEffect, useState, useRef, useContext } from 'react';
import { io } from 'socket.io-client';
import DashboardLayout from '../../components/Layouts/DashboardLayout';
import { UserContext } from '../../context/UserContextState';
import axiosInstance from '../../utils/axiosInstance';
import moment from 'moment';
import { LuSend, LuUsers, LuHash } from 'react-icons/lu';

const CommunityChat = () => {
  const { user } = useContext(UserContext);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto scroll
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]);

  // Fetch initial messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await axiosInstance.get('/api/chat');
        setMessages(response.data);
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      }
    };
    fetchMessages();
  }, []);

  // Socket setup
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const socketUrl = "http://localhost:5000";
    socketRef.current = io(socketUrl, {
      auth: { token },
      withCredentials: true,
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to global chat socket');
    });

    socketRef.current.on('receive_message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socketRef.current.on('userOnline', (data) => {
      setOnlineUsers(Object.values(data.onlineUsers || {}));
    });

    socketRef.current.on('userOffline', (data) => {
      setOnlineUsers(Object.values(data.onlineUsers || {}));
    });

    socketRef.current.on('typing', (data) => {
      setTypingUsers((prev) => ({ ...prev, [data.userId]: data.name }));
    });

    socketRef.current.on('stop_typing', (data) => {
      setTypingUsers((prev) => {
        const newState = { ...prev };
        delete newState[data.userId];
        return newState;
      });
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const response = await axiosInstance.post('/api/chat', { content: newMessage });
      const savedMessage = response.data;
      
      socketRef.current.emit('send_message', savedMessage);
      
      setNewMessage('');
      handleStopTyping();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (socketRef.current && user) {
      socketRef.current.emit('typing', { userId: user._id || user.id, name: user.name });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        handleStopTyping();
      }, 2000);
    }
  };

  const handleStopTyping = () => {
    if (socketRef.current && user) {
      socketRef.current.emit('stop_typing', { userId: user._id || user.id });
    }
  };

  const typingArray = Object.values(typingUsers).filter(name => name !== user?.name);

  return (
    <DashboardLayout activeMenu="Community Chat">
      {/* Hyper-minimalist Elite Container */}
      <div className="flex h-[calc(100vh-6rem)] w-full max-w-[1500px] mx-auto bg-[var(--bg)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm mt-4">
        
        {/* Left Sidebar - Channels & Workspace */}
        <div className="hidden md:flex w-64 flex-col bg-[var(--surface)] border-r border-[var(--border)] z-10">
          <div className="h-14 px-5 flex items-center border-b border-[var(--border)] shadow-sm">
            <h1 className="text-[14px] font-bold tracking-tight text-[var(--text)]">TaskSutra HQ</h1>
          </div>
          
          <div className="flex-1 overflow-y-auto py-4">
            <div className="px-3 mb-4">
              <div className="text-[11px] font-semibold tracking-wider text-[var(--text-muted)] uppercase mb-2 px-2">
                Channels
              </div>
              <div className="flex items-center gap-2 px-2 py-1.5 bg-[var(--accent-soft)] text-[var(--accent)] rounded-md cursor-pointer font-medium text-[13px]">
                <LuHash className="text-[15px]" />
                community-chat
              </div>
            </div>

            <div className="px-3">
              <div className="flex items-center justify-between px-2 mb-2">
                <div className="text-[11px] font-semibold tracking-wider text-[var(--text-muted)] uppercase">
                  Active Members
                </div>
                <div className="text-[10px] font-bold bg-green-500/10 text-green-600 px-1.5 py-0.5 rounded">
                  {onlineUsers.length}
                </div>
              </div>
              
              <div className="space-y-0.5 mt-2">
                {onlineUsers.map((id, index) => (
                  <div key={id || index} className="flex items-center gap-2 px-2 py-1.5 hover:bg-[var(--bg-soft)] rounded-md cursor-pointer group transition-colors">
                    <div className="relative flex items-center justify-center w-5 h-5 rounded bg-[var(--bg-soft)] border border-[var(--border)] text-[9px] font-bold text-[var(--text-muted)]">
                      U
                      <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 border-[1.5px] border-[var(--surface)] rounded-full"></div>
                    </div>
                    <span className="text-[13px] text-[var(--text)] font-medium truncate">User {id.substring(0, 4)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex flex-1 flex-col bg-[var(--bg)] min-w-0">
          
          {/* Header */}
          <div className="h-14 px-6 flex justify-between items-center bg-[var(--surface)] border-b border-[var(--border)] shadow-sm shrink-0">
            <div className="flex items-center gap-2">
              <LuHash className="text-[var(--text-muted)] text-[18px]" />
              <h2 className="text-[15px] font-bold text-[var(--text)] tracking-tight">community-chat</h2>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                {onlineUsers.slice(0, 3).map((u, i) => (
                  <div key={i} className="w-6 h-6 rounded-full bg-[var(--bg-soft)] border-2 border-[var(--surface)] flex items-center justify-center text-[9px] font-bold z-10">U</div>
                ))}
              </div>
            </div>
          </div>

          {/* Messages Feed */}
          <div ref={messagesEndRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-1 scrollbar-thin">
            
            <div className="pb-10 pt-4 max-w-3xl">
              <div className="w-12 h-12 bg-[var(--bg-soft)] rounded-xl flex items-center justify-center mb-4 border border-[var(--border)]">
                <LuHash className="text-2xl text-[var(--text)]" />
              </div>
              <h1 className="text-2xl font-bold text-[var(--text)] mb-2 tracking-tight">Welcome to #community-chat!</h1>
              <p className="text-[14px] text-[var(--text-muted)]">This is the start of the community chat channel. Messages here are seen by all active members in the workspace.</p>
            </div>

            <div className="h-px bg-[var(--border)] w-full my-6 flex items-center justify-center">
              <span className="bg-[var(--bg)] px-4 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Beginning of History</span>
            </div>

            {messages.map((msg, index) => {
              const isMe = msg.sender?._id === (user?._id || user?.id);
              const senderName = msg.sender?.name || 'Unknown User';
              const senderImage = msg.sender?.profilePicture || msg.sender?.profileImageUrl;
              const time = moment(msg.createdAt).format('h:mm A');
              const date = moment(msg.createdAt).format('MM/DD/YYYY');
              
              // Group consecutive messages from the same user within 5 minutes
              const isConsecutive = index > 0 
                && messages[index - 1].sender?._id === msg.sender?._id 
                && moment(msg.createdAt).diff(moment(messages[index - 1].createdAt), 'minutes') < 5;

              return (
                <div key={msg._id || index} className={`group flex gap-4 px-2 py-1 -mx-2 hover:bg-[var(--bg-soft)] transition-colors rounded-lg ${isConsecutive ? 'mt-0' : 'mt-4'}`}>
                  
                  {/* Left Column (Avatar or Timestamp) */}
                  <div className="w-10 flex-shrink-0 flex justify-center">
                    {!isConsecutive ? (
                      <div className="mt-0.5">
                        {senderImage ? (
                          <img src={senderImage} alt={senderName} className="w-10 h-10 rounded-md object-cover border border-[var(--border)]" />
                        ) : (
                          <div className={`w-10 h-10 rounded-md flex items-center justify-center text-[14px] font-bold text-white shadow-sm ${isMe ? 'bg-[#0f172a]' : 'bg-[var(--accent)]'}`}>
                            {senderName.charAt(0).toUpperCase()}
                          </div>
                        )}
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
                          {isMe ? 'You' : senderName}
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
            {typingArray.length > 0 && (
              <div className="flex items-center gap-2 text-[13px] text-[var(--text-muted)] font-medium mt-2 px-2 animate-pulse">
                <span className="font-bold text-[var(--text)]">{typingArray.join(', ')}</span> is typing...
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
                  placeholder="Message #community-chat"
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
          
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CommunityChat;
