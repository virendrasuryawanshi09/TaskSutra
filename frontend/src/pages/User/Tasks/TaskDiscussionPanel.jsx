import React, { useRef, useEffect, useState } from "react";
import { HiOutlineXMark, HiPaperAirplane, HiOutlineChatBubbleOvalLeftEllipsis, HiOutlineClock } from "react-icons/hi2";
import AvatarGroup from "../../../components/AvatarGroup";
import moment from "moment";
import { motion, AnimatePresence } from "framer-motion";

const TaskDiscussionPanel = ({
  task,
  isOpen,
  onClose,
  messages = [],
  queryInput = "",
  onQueryInputChange,
  onSend,
  onEditMessage,
  onDeleteMessage,
  currentUser,
}) => {
  const messagesEndRef = useRef(null);
  const [contextMenu, setContextMenu] = useState(null); // { x: number, y: number, messageId: string, content: string, isMe: boolean }
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editInput, setEditInput] = useState("");
  const longPressTimeout = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handleContextMenu = (e, item, isMe) => {
    e.preventDefault();
    if (window.innerWidth < 1024) return;
    const canManage = isMe || (currentUser && currentUser.role === "admin");
    if (!canManage) return;

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      messageId: item.id,
      content: item.message,
      isMe
    });
  };

  const handleTouchStart = (e, item, isMe) => {
    if (window.innerWidth >= 1024) return;
    const canManage = isMe || (currentUser && currentUser.role === "admin");
    if (!canManage) return;

    longPressTimeout.current = setTimeout(() => {
      const touch = e.touches[0];
      setContextMenu({
        x: touch.clientX,
        y: touch.clientY,
        messageId: item.id,
        content: item.message,
        isMe
      });
      if (navigator.vibrate) {
        navigator.vibrate(40);
      }
    }, 600);
  };

  const handleTouchEnd = () => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
    }
  };

  const handleTouchMove = () => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[70] bg-[rgba(15,23,42,0.2)] backdrop-blur-sm"
          />

          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 z-[80] flex h-screen w-[75vw] sm:w-[420px] flex-col bg-[var(--surface)] shadow-2xl"
          >
        {/* Sticky Header */}
        <div className="flex-none border-b border-[var(--border)] px-4 sm:px-6 py-4 sm:py-5 bg-[var(--surface)]/95 backdrop-blur-md z-10 relative">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${task?.status === "Completed" ? "bg-green-500/10 text-green-600" :
                  task?.status === "In Progress" ? "bg-blue-500/10 text-blue-600" :
                    "bg-gray-500/10 text-gray-600"
                  }`}>
                  {task?.status || "Pending"}
                </span>
                {(task?.dueDateValue || task?.dueDate) && (
                  <div className="flex items-center gap-1 text-[11px] font-medium text-[var(--text-muted)]">
                    <HiOutlineClock className="w-3.5 h-3.5" />
                    <span>{moment(task.dueDateValue || task.dueDate).format("MMM DD, YYYY")}</span>
                  </div>
                )}
              </div>
              <h2 className="text-[15px] sm:text-[17px] font-bold text-[var(--text)] leading-snug line-clamp-2 pr-2">
                {task?.title || "Discussion"}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex shrink-0 items-center justify-center rounded-full p-2 text-[var(--text-muted)] transition-all hover:bg-[var(--bg-soft)] hover:text-[var(--text)]"
            >
              <HiOutlineXMark className="text-xl" />
            </button>
          </div>

          {(task?.assignedUsers || task?.assignedTo) && (task.assignedUsers?.length > 0 || task.assignedTo?.length > 0) && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs text-[var(--text-muted)]">Assigned:</span>
              <AvatarGroup avatars={task.assignedUsers || task.assignedTo} max={4} size="sm" />
            </div>
          )}
        </div>

        {/* Scrollable Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 bg-[var(--bg-soft)]/30 scroll-smooth">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center opacity-60">
              <div className="mb-4 rounded-full bg-[var(--bg-soft)] p-4">
                <HiOutlineChatBubbleOvalLeftEllipsis className="h-8 w-8 text-[var(--text-muted)]" />
              </div>
              <h3 className="text-sm font-semibold text-[var(--text)]">No comments yet</h3>
              <p className="mt-1 max-w-[200px] text-xs text-[var(--text-muted)]">
                Start the discussion or add notes for this task.
              </p>
            </div>
          ) : (
            <div className="space-y-7">
              {messages.map((item, index) => {
                const initial = item.user?.charAt(0).toUpperCase() || "U";
                const isMe = item.senderId === (currentUser?._id || currentUser?.id) || item.user === "You";
                const isEditing = editingId === item.id;

                return (
                  <div key={item.id || index} className={`flex items-start gap-3 ${isMe ? "flex-row-reverse" : ""}`}>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--bg-soft)] border border-[var(--border)] text-[11px] font-bold text-[var(--text)]">
                      {initial}
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <div className={`flex items-center gap-2 mb-1 ${isMe ? "flex-row-reverse" : ""}`}>
                        <span className="text-[13px] font-bold text-[var(--text)]">{item.user}</span>
                        <span className="text-[11px] font-medium text-[var(--text-muted)]">{item.timestamp}</span>
                      </div>
                      <div
                        onContextMenu={(e) => handleContextMenu(e, item, isMe)}
                        onTouchStart={(e) => handleTouchStart(e, item, isMe)}
                        onTouchEnd={handleTouchEnd}
                        onTouchMove={handleTouchMove}
                        style={{ cursor: (isMe || (currentUser && currentUser.role === "admin")) ? "context-menu" : "default" }}
                        className={`relative max-w-[95%] sm:max-w-[90%] rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 text-[13px] sm:text-[14px] leading-relaxed break-words ${isMe
                          ? "bg-[var(--accent)] text-white rounded-tr-sm ml-auto"
                          : "bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] shadow-sm rounded-tl-sm mr-auto"
                          }`}
                      >
                        {isEditing ? (
                          <div className="flex flex-col gap-2 w-full min-w-[200px] py-1 text-left">
                            <textarea
                              value={editInput}
                              onChange={(e) => setEditInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  if (editInput.trim() && onEditMessage) {
                                    onEditMessage(item.id, editInput.trim());
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
                                className={`px-2 py-1 rounded text-[10px] font-bold bg-transparent transition-all ${
                                  isMe ? "text-white/80 hover:text-white" : "text-[var(--text-muted)] hover:text-[var(--text)]"
                                }`}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (editInput.trim() && onEditMessage) {
                                    onEditMessage(item.id, editInput.trim());
                                  }
                                  setEditingId(null);
                                }}
                                disabled={!editInput.trim()}
                                className={`px-2 py-1 rounded text-[10px] font-bold transition-all shadow-sm ${
                                  isMe ? "bg-white text-[var(--accent)] hover:bg-white/95" : "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]"
                                } disabled:opacity-50`}
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-[13px] sm:text-[14px] leading-relaxed whitespace-pre-wrap flex flex-col text-left">
                            <span>{item.message}</span>
                            {item.isEdited && (
                              <span className={`text-[9px] mt-1 select-none text-right block font-medium tracking-tight ${
                                isMe ? "text-white/60" : "text-[var(--text-muted)]"
                              }`}>
                                edited
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Sticky Input Area */}
        <div className="flex-none border-t border-[var(--border)] bg-[var(--surface)] p-3 sm:p-5 relative z-10">
          <div className="relative flex flex-col rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm focus-within:border-[var(--accent)] focus-within:ring-1 focus-within:ring-[var(--accent)] transition-all">
            <textarea
              value={queryInput}
              onChange={onQueryInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Add a comment..."
              rows={2}
              className="w-full resize-none bg-transparent px-3 sm:px-4 py-2.5 sm:py-3 text-[13px] sm:text-[14px] text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none"
            />
            <div className="flex items-center justify-between px-2 sm:px-3 py-2 sm:py-2.5 bg-[var(--bg-soft)]/50 border-t border-[var(--border)] rounded-b-xl">
              <span className="text-[10px] text-[var(--text-muted)] ml-1 hidden sm:block">
                <b>Enter</b> to post, <b>Shift+Enter</b> for new line
              </span>
              <span className="text-[9px] sm:text-[10px] text-[var(--text-muted)] ml-1 sm:hidden">
                Post comment
              </span>
              <button
                type="button"
                onClick={onSend}
                disabled={!queryInput.trim()}
                className="rounded-lg bg-[var(--accent)] px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs font-semibold text-white transition-all hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Comment
              </button>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Context Menu Overlay */}
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
                  if (onDeleteMessage) onDeleteMessage(deleteConfirmId);
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
      </>
    )}
  </AnimatePresence>
);
};

export default TaskDiscussionPanel;
