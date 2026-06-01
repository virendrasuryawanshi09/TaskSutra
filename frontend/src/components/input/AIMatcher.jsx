import React, { useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { LuLoader } from "react-icons/lu";
import Modal from "../Modal";
import toast from "react-hot-toast";

const AIMatcher = ({ taskTitle, taskDescription, selectedUsers, setSelectedUsers }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);

  const getUserInitial = (name = "") => name.trim().charAt(0).toUpperCase();

  const getRecommendations = async () => {
    if (!taskTitle || !taskTitle.trim()) {
      toast.error("Please enter a Task Title first!");
      return;
    }

    setLoading(true);
    setIsModalOpen(true);
    try {
      const response = await axiosInstance.post(API_PATHS.AI.RECOMMEND_ASSIGNEES, {
        title: taskTitle,
        description: taskDescription || ""
      });

      if (response.data && response.data.success) {
        setRecommendations(response.data.data);
      } else {
        toast.error("Failed to generate recommendations.");
      }
    } catch (error) {
      console.error("Error fetching AI recommendations:", error);
      toast.error("Error fetching recommendations.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (developerId) => {
    setSelectedUsers([developerId]);
    setIsModalOpen(false);
  };

  return (
    <div>
      <button
        type="button"
        onClick={getRecommendations}
        className="text-xs text-[var(--accent)] hover:underline font-semibold cursor-pointer"
      >
        Auto-Match (AI)
      </button>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="AI Assignee Matcher"
      >
        <div className="flex flex-col max-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-2">
              <LuLoader className="animate-spin text-lg text-[var(--accent)]" />
              <p className="text-xs text-[var(--text-muted)]">Analyzing team workload and skills...</p>
            </div>
          ) : recommendations.length === 0 ? (
            <div className="text-center py-6 text-xs text-[var(--text-muted)]">
              No matches found for this task context.
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto pr-1">
              {recommendations.map((rec, index) => {
                const isSelected = selectedUsers.includes(rec.developerId);
                const scoreColor = 
                  rec.score >= 80 ? "text-emerald-500 bg-emerald-500/5 border-emerald-500/10" :
                  rec.score >= 50 ? "text-amber-500 bg-amber-500/5 border-amber-500/10" :
                  "text-rose-500 bg-rose-500/5 border-rose-500/10";

                return (
                  <div
                    key={rec.developerId}
                    onClick={() => handleSelect(rec.developerId)}
                    className={`
                      flex flex-col p-3 rounded-lg cursor-pointer border text-left
                      transition-all duration-150
                      ${
                        isSelected
                          ? "bg-[var(--bg-soft)] border-[var(--accent)]"
                          : "bg-[var(--surface)] border-[var(--border)] hover:bg-[var(--bg-soft)]"
                      }
                    `}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="flex w-7 h-7 shrink-0 items-center justify-center rounded-full bg-[var(--bg-soft)] text-xs font-semibold text-[var(--text-muted)] border border-[var(--border)]">
                        {getUserInitial(rec.name)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-[var(--text)] truncate">
                            {rec.name}
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium ${scoreColor} shrink-0`}>
                            {rec.score}% Match {index === 0 && "(Recommended)"}
                          </span>
                        </div>
                        <p className="text-[10px] text-[var(--text-muted)] font-normal mt-0.5">
                          {rec.title} &bull; {rec.activeTasks} Active Tasks
                        </p>
                        <p className="text-[10px] text-[var(--text-muted)] mt-1 leading-relaxed">
                          {rec.reasoning}
                        </p>
                      </div>
                    </div>

                    {rec.matchingSkills && rec.matchingSkills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-[var(--border)]">
                        {rec.matchingSkills.map((skill) => (
                          <span
                            key={skill}
                            className="text-[9px] bg-[var(--bg-soft)] text-[var(--text)] border border-[var(--border)] px-1.5 py-0.5 rounded"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* FOOTER */}
          <div className="flex justify-end gap-2 pt-3 mt-3 border-t border-[var(--border)]">
            <button
              onClick={() => setIsModalOpen(false)}
              className="
                px-3 py-1.5 text-xs rounded-lg
                border border-[var(--border)]
                text-[var(--text-muted)]
                hover:bg-[var(--bg-soft)]
                transition
              "
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AIMatcher;
