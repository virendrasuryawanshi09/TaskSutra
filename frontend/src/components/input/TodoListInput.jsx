import React, { useState } from "react";
import { HiMiniPlus, HiOutlineTrash } from "react-icons/hi2";

const TodoListInput = ({ todoList = [], setTodoList, isEditMode = false }) => {
    const [option, setOption] = useState("");

    const handleAddOption = () => {
        if (option.trim()) {
            setTodoList([
                ...todoList,
                { text: option.trim(), completed: false },
            ]);
            setOption("");
        }
    };

    const handleDeleteOption = (index) => {
        setTodoList(todoList.filter((_, i) => i !== index));
    };

    const toggleComplete = (index) => {
        if (!isEditMode) return;

        const updated = [...todoList];
        updated[index].completed = !updated[index].completed;
        setTodoList(updated);
    };

    const completedCount = todoList.filter(item => item.completed).length;

    return (
        <div className="space-y-4">

            {isEditMode && todoList.length > 0 && (
                <div className="flex items-center justify-between">
                    <p className="text-xs text-[var(--text-muted)]">
                        {completedCount} of {todoList.length} completed
                    </p>

                    <div className="w-24 h-1.5 bg-[var(--bg-soft)] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[var(--accent)] transition-all duration-300"
                            style={{
                                width: `${(completedCount / todoList.length) * 100}%`,
                            }}
                        />
                    </div>
                </div>
            )}

            {/* LIST */}
            {todoList.length > 0 && (
                <div className="space-y-2">
                    {todoList.map((item, index) => (
                        <div
                            key={index}
                            className="
                flex items-center justify-between
                bg-[var(--bg-soft)]
                border border-[var(--border)]
                rounded-lg px-3 py-2

                hover:border-[var(--text-muted)]
                transition-all duration-200
              "
                        >
                            <div className="flex items-center gap-3">

                                <div className="flex items-center gap-3">

                                    {/* 🔥 NUMBER (CREATE MODE) */}
                                    {!isEditMode && (
                                        <span className="text-xs text-[var(--text-muted)] w-5">
                                            {index < 9 ? `0${index + 1}` : index + 1}
                                        </span>
                                    )}

                                    {/* ✅ CHECKBOX (EDIT MODE ONLY) */}
                                    {isEditMode && (
                                        <button
                                            onClick={() => toggleComplete(index)}
                                            className={`
        w-4 h-4 rounded border flex items-center justify-center
        transition-all duration-200

        ${item.completed
                                                    ? "bg-[var(--accent)] border-[var(--accent)]"
                                                    : "border-[var(--border)]"
                                                }
      `}
                                        >
                                            {item.completed && (
                                                <div className="w-2 h-2 bg-white rounded-sm" />
                                            )}
                                        </button>
                                    )}

                                    {/* TEXT */}
                                    <span
                                        className={`
                                            text-sm transition-all duration-200
                                            ${item.completed && isEditMode
                                                ? "line-through text-[var(--text-muted)]"
                                                : "text-[var(--text)]"
                                            }
    `}
                                    >
                                        {item.text}
                                    </span>

                                </div>
                            </div>

                            {/* DELETE */}
                            <button
                                onClick={() => handleDeleteOption(index)}
                                className="
                  p-1.5 rounded-md
                  text-[var(--text-muted)]

                  hover:text-red-500
                  hover:bg-[var(--surface)]

                  transition-all duration-200
                "
                            >
                                <HiOutlineTrash />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* INPUT */}
            <div className="flex items-center gap-2">

                <input
                    type="text"
                    value={option}
                    onChange={(e) => setOption(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddOption()}
                    placeholder="Add checklist item..."
                    className="
            flex-1
            bg-[var(--bg-soft)]
            border border-[var(--border)]
            rounded-lg px-3 py-2
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
                    onClick={handleAddOption}
                    className="
            flex items-center gap-1
            px-3 py-2
            text-sm font-medium
            rounded-lg

            bg-[var(--accent)]
            text-white

            hover:bg-[var(--accent-hover)]
            hover:scale-[1.02]
            active:scale-[0.98]

            transition-all duration-200
          "
                >
                    <HiMiniPlus />
                    Add
                </button>

            </div>
        </div>
    );
};

export default TodoListInput;