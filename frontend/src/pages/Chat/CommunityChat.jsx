import React, { useState } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { LuHash, LuMessageSquare, LuCheckSquare } from 'react-icons/lu';

const CommunityChat = () => {
  // --- Unified State Management Foundation ---
  // chatMode can be: 'community', 'direct', 'task'
  const [chatMode, setChatMode] = useState('community');
  const [activeChatId, setActiveChatId] = useState('community-chat'); // user _id, task _id, or 'community-chat'

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

            {/* Direct Messages Section Foundation */}
            <div className="px-3 mb-6">
              <div className="text-[11px] font-semibold tracking-wider text-[var(--text-muted)] uppercase mb-2 px-2 flex justify-between items-center">
                <span>Direct Messages</span>
              </div>
              <div className="px-2 text-[12px] text-[var(--text-muted)] italic">
                Loading team members...
              </div>
            </div>

            {/* Task Discussions Section Foundation */}
            <div className="px-3">
              <div className="text-[11px] font-semibold tracking-wider text-[var(--text-muted)] uppercase mb-2 px-2 flex justify-between items-center">
                <span>Task Discussions</span>
              </div>
              <div className="px-2 text-[12px] text-[var(--text-muted)] italic">
                Loading assigned tasks...
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
