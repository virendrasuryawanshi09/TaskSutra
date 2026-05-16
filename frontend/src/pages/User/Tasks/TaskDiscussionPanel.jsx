import React, { useRef, useEffect } from "react";
import { HiOutlineXMark, HiPaperAirplane, HiOutlineChatBubbleOvalLeftEllipsis, HiOutlineClock } from "react-icons/hi2";
import AvatarGroup from "../../../components/AvatarGroup";
import moment from "moment";

const TaskDiscussionPanel = ({
  task,
  isOpen,
  onClose,
  messages = [],
  queryInput = "",
  onQueryInputChange,
  onSend,
}) => {
  const messagesEndRef = useRef(null);

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

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[70] bg-[rgba(15,23,42,0.2)] backdrop-blur-sm transition-opacity duration-300 ${isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
          }`}
      />

      <aside
        className={`fixed right-0 top-0 z-[80] flex h-screen w-[60vw] sm:w-full sm:max-w-[420px] flex-col bg-[var(--surface)] shadow-2xl transition-transform duration-300 cubic-bezier(0.16, 1, 0.3, 1) ${isOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        {/* Sticky Header */}
        <div className="flex-none border-b border-[var(--border)] px-6 py-5 bg-[var(--surface)]/95 backdrop-blur-md z-10 relative">
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
              <h2 className="text-[17px] font-bold text-[var(--text)] leading-snug line-clamp-2">
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
        <div className="flex-1 overflow-y-auto px-6 py-8 bg-[var(--surface)] scroll-smooth">
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
                return (
                  <div key={item.id || index} className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--bg-soft)] border border-[var(--border)] text-[11px] font-bold text-[var(--text)]">
                      {initial}
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[13px] font-bold text-[var(--text)]">{item.user}</span>
                        <span className="text-[11px] font-medium text-[var(--text-muted)]">{item.timestamp}</span>
                      </div>
                      <div className="text-[14px] leading-relaxed text-[var(--text)] whitespace-pre-wrap">
                        {item.message}
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
        <div className="flex-none border-t border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5 relative z-10">
          <div className="relative flex flex-col rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm focus-within:border-[var(--accent)] focus-within:ring-1 focus-within:ring-[var(--accent)] transition-all">
            <textarea
              value={queryInput}
              onChange={onQueryInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Add a comment or update..."
              rows={2}
              className="w-full resize-none bg-transparent px-4 py-3 text-[14px] text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none"
            />
            <div className="flex items-center justify-between px-3 py-2.5 bg-[var(--bg-soft)]/50 border-t border-[var(--border)] rounded-b-xl">
              <span className="text-[10px] text-[var(--text-muted)] ml-1 hidden sm:block">
                <b>Enter</b> to post, <b>Shift+Enter</b> for new line
              </span>
              <span className="text-[10px] text-[var(--text-muted)] ml-1 sm:hidden">
                Post an update
              </span>
              <button
                type="button"
                onClick={onSend}
                disabled={!queryInput.trim()}
                className="rounded-lg bg-[var(--accent)] px-4 py-1.5 text-xs font-semibold text-white transition-all hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Comment
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default TaskDiscussionPanel;
