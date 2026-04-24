import React from "react";
import { HiOutlineXMark } from "react-icons/hi2";

const TaskDiscussionPanel = ({
  isOpen,
  onClose,
  messages = [],
  queryInput = "",
  onQueryInputChange,
  onSend,
}) => {
  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[70] bg-[rgba(31,31,29,0.18)] transition-opacity duration-200 ${
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        className={`fixed right-0 top-0 z-[80] flex h-screen w-full max-w-[350px] flex-col border-l border-[var(--border)] bg-[var(--surface)] transition-transform duration-200 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-4">
          <h2 className="text-base font-semibold text-[var(--text)]">Discussion</h2>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-lg p-2 text-[var(--text-muted)] transition-colors duration-200 hover:bg-[var(--bg-soft)] hover:text-[var(--text)]"
          >
            <HiOutlineXMark className="text-lg" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-3">
            {messages.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-[var(--text)]">{item.user}</p>
                  <span className="text-xs text-[var(--text-muted)]">
                    {item.timestamp}
                  </span>
                </div>

                <p className="mt-2 text-sm leading-6 text-[var(--text)]">
                  {item.message}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-[var(--border)] px-4 py-4">
          <div className="flex flex-col gap-3">
            <input
              type="text"
              value={queryInput}
              onChange={onQueryInputChange}
              placeholder="Ask something about this task..."
              className="
                w-full
                bg-[var(--bg-soft)]
                border border-[var(--border)]
                rounded-lg
                px-3 py-2.5
                text-sm text-[var(--text)]
                placeholder:text-[var(--text-muted)]
                outline-none
                transition-all duration-200
                focus:border-[var(--accent)]
                focus:shadow-[0_0_0_1px_var(--accent)]
                focus:bg-transparent
              "
            />

            <button
              type="button"
              onClick={onSend}
              className="
                w-full
                rounded-lg
                bg-[var(--accent)]
                px-4 py-2.5
                text-sm font-medium text-white
                transition-colors duration-200
                hover:bg-[var(--accent-hover)]
              "
            >
              Send
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default TaskDiscussionPanel;
