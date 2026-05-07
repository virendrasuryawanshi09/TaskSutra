import React, { useEffect, useState, useRef, useContext } from 'react';
import { io } from 'socket.io-client';
import DashboardLayout from '../../components/Layouts/DashboardLayout';
import { UserContext } from '../../context/UserContextState';
import axiosInstance from '../../utils/axiosInstance';
import moment from 'moment';
import { LuSend, LuUsers } from 'react-icons/lu';

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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]);

  // Fetch initial messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        // We might need to add this route to backend API paths, but we can hardcode here for now
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

    // Use environment variable or default localhost
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
      
      // Emit to others
      socketRef.current.emit('send_message', savedMessage);
      
      // Update local state is handled by receive_message but since we just sent it, we can wait for the socket broadcast or add locally.
      // Wait, in chatController it doesn't emit, so we rely on this socket emit. The receiver will get it via socket.
      // We also need to add it to our own state so we see it immediately without waiting for our own broadcast if we don't receive it.
      // Actually, io.emit broadcasts to ALL including sender. So we shouldn't add it twice.
      
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
      <div className="flex h-[calc(100vh-8rem)] w-full overflow-hidden bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-sm sm:mx-4 my-4 max-w-7xl lg:mx-auto">
        
        {/* Main Chat Area */}
        <div className="flex flex-1 flex-col relative bg-[var(--bg)]">
          {/* Header */}
          <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--surface)] flex justify-between items-center z-10 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text)] flex items-center gap-2">
                <span className="text-xl">🌍</span> Community Chat
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Real-time global discussion</p>
            </div>
            {/* Mobile Online Users Toggle could go here */}
            <div className="lg:hidden flex items-center gap-1 text-[var(--text-muted)] bg-[var(--bg-soft)] px-3 py-1.5 rounded-full text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              {onlineUsers.length} Online
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
            {messages.map((msg, index) => {
              const isMe = msg.sender?._id === (user?._id || user?.id);
              const senderName = msg.sender?.name || 'Unknown User';
              const senderImage = msg.sender?.profilePicture || msg.sender?.profileImageUrl;
              const time = moment(msg.createdAt).format('h:mm A');
              
              const showHeader = index === 0 || messages[index - 1].sender?._id !== msg.sender?._id || moment(msg.createdAt).diff(moment(messages[index - 1].createdAt), 'minutes') > 5;

              return (
                <div key={msg._id || index} className={`flex gap-4 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  {showHeader ? (
                    <div className="flex-shrink-0">
                      {senderImage ? (
                         <img src={senderImage} alt={senderName} className="w-10 h-10 rounded-full object-cover shadow-sm border border-[var(--border)]" />
                      ) : (
                         <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] text-white flex items-center justify-center font-bold shadow-sm">
                           {senderName.charAt(0).toUpperCase()}
                         </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-10 flex-shrink-0" />
                  )}

                  {/* Message Body */}
                  <div className={`max-w-[75%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    {showHeader && (
                      <div className="flex items-baseline gap-2 mb-1 px-1">
                        <span className="text-sm font-semibold text-[var(--text)]">{isMe ? 'You' : senderName}</span>
                        <span className="text-xs text-[var(--text-muted)]">{time}</span>
                      </div>
                    )}
                    <div className={`px-4 py-2.5 rounded-2xl text-[15px] leading-relaxed shadow-sm ${
                      isMe 
                      ? 'bg-[var(--accent)] text-white rounded-tr-sm' 
                      : 'bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] rounded-tl-sm'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Typing Indicator */}
            {typingArray.length > 0 && (
              <div className="flex items-center gap-3 text-sm text-[var(--text-muted)] animate-pulse pl-14">
                <div className="flex gap-1 bg-[var(--surface)] px-3 py-2 rounded-full border border-[var(--border)]">
                  <span className="w-1.5 h-1.5 bg-[var(--text-muted)] rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-[var(--text-muted)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-[var(--text-muted)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
                <span>{typingArray.join(', ')} {typingArray.length === 1 ? 'is' : 'are'} typing...</span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-[var(--surface)] border-t border-[var(--border)] z-10">
            <form onSubmit={handleSendMessage} className="relative flex items-center max-w-4xl mx-auto">
              <input
                type="text"
                value={newMessage}
                onChange={handleTyping}
                placeholder="Message the community..."
                className="w-full bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] rounded-full pl-6 pr-14 py-3.5 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all shadow-sm"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="absolute right-2 p-2 bg-[var(--accent)] text-white rounded-full hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
              >
                <LuSend className="w-5 h-5 ml-0.5" />
              </button>
            </form>
          </div>
        </div>

        {/* Right Sidebar - Online Users */}
        <div className="hidden lg:flex w-72 flex-col bg-[var(--surface)] border-l border-[var(--border)]">
          <div className="p-5 border-b border-[var(--border)]">
            <h3 className="font-semibold text-[var(--text)] flex items-center gap-2">
              <LuUsers className="text-[var(--text-muted)]" />
              Online Users
              <span className="ml-auto bg-[var(--bg-soft)] text-[var(--text-muted)] py-0.5 px-2 rounded-full text-xs font-medium border border-[var(--border)]">
                {onlineUsers.length}
              </span>
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {onlineUsers.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] text-center mt-4">No users online</p>
            ) : (
              onlineUsers.map((id, index) => (
                <div key={id || index} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--bg-soft)] transition-colors">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-[var(--bg-soft)] border border-[var(--border)] flex items-center justify-center text-xs font-bold text-[var(--text)]">
                       U
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[var(--surface)] rounded-full"></span>
                  </div>
                  <span className="text-sm font-medium text-[var(--text)] truncate">User {id.substring(0,4)}</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default CommunityChat;
