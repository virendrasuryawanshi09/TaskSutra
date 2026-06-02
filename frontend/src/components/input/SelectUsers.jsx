import React, { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { LuUsers, LuLoader } from "react-icons/lu";
import Modal from "../Modal";
import toast from "react-hot-toast";
import AIMatcher from "./AIMatcher";

const SelectUsers = ({ selectedUsers, setSelectedUsers, taskTitle, taskDescription }) => {
  const [allUsers, setAllUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempSelectedUsers, setTempSelectedUsers] = useState([]);
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [loadingAI, setLoadingAI] = useState(false);

  // AI Analyzer modal state
  const [selectedDevId, setSelectedDevId] = useState(null);
  const [selectedDevName, setSelectedDevName] = useState("");
  const [isAnalyzerOpen, setIsAnalyzerOpen] = useState(false);

  const getUserInitial = (name = "") => name.trim().charAt(0).toUpperCase();

  const getAllUsers = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.USERS.GET_ALL_USERS);
      setAllUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const toggleUserSelection = (userId) => {
    setTempSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleAssign = () => {
    setSelectedUsers(tempSelectedUsers);
    setIsModalOpen(false);
  };

  const selectedUserAvatars = allUsers.filter((user) =>
    selectedUsers.includes(user._id)
  );

  useEffect(() => {
    getAllUsers();
  }, []);

  useEffect(() => {
    setTempSelectedUsers(Array.isArray(selectedUsers) ? selectedUsers : []);
  }, [selectedUsers]);

  useEffect(() => {
    if (isModalOpen && taskTitle && taskTitle.trim()) {
      const fetchAIRecommendations = async () => {
        setLoadingAI(true);
        try {
          const response = await axiosInstance.post(API_PATHS.AI.RECOMMEND_ASSIGNEES, {
            title: taskTitle,
            description: taskDescription || ""
          }, {
            timeout: 60000 // 60s — AI inference takes longer than standard API calls
          });
          if (response.data && response.data.success) {
            setAiRecommendations(response.data.data);
          }
        } catch (error) {
          console.error("Error fetching AI recommendations:", error);
          toast.error(error.response?.data?.message || "Error fetching AI recommendations.");
        } finally {
          setLoadingAI(false);
        }
      };
      fetchAIRecommendations();
    } else if (!isModalOpen) {
      setAiRecommendations([]);
    }
  }, [isModalOpen, taskTitle, taskDescription]);

  const getSortedUsers = () => {
    if (aiRecommendations.length === 0) return allUsers;

    const recMap = new Map(aiRecommendations.map((r) => [r.developerId.toString(), r]));
    const matchedUsers = [];
    const unmatchedUsers = [];

    allUsers.forEach((user) => {
      if (recMap.has(user._id.toString())) {
        matchedUsers.push({
          ...user,
          recDetails: recMap.get(user._id.toString())
        });
      } else {
        unmatchedUsers.push(user);
      }
    });

    matchedUsers.sort((a, b) => b.recDetails.score - a.recDetails.score);
    return [...matchedUsers, ...unmatchedUsers];
  };

  return (
    <div>

      {/* INPUT STYLE BUTTON */}
      <div
        onClick={() => setIsModalOpen(true)}
        className="
          flex items-center justify-between
          w-full
          bg-[var(--bg-soft)]
          border border-[var(--border)]
          rounded-lg
          px-3 py-2
          cursor-pointer
          transition-all duration-200
          hover:border-[var(--text-muted)]
        "
      >
        <div className="flex items-center gap-2">

          {selectedUserAvatars.length === 0 ? (
            <>
              <LuUsers className="text-[var(--text-muted)]" />
              <span className="text-sm text-[var(--text-muted)]">
                Add members
              </span>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {selectedUserAvatars.slice(0, 3).map((user) =>
                  user.profileImageUrl ? (
                    <img
                      key={user._id}
                      src={user.profileImageUrl}
                      className="w-6 h-6 rounded-full border border-[var(--surface)]"
                    />
                  ) : (
                    <div
                      key={user._id}
                      className="flex w-6 h-6 items-center justify-center rounded-full bg-[var(--bg-soft)] text-[10px] text-[var(--text-muted)] border border-[var(--surface)]"
                    >
                      {getUserInitial(user.name)}
                    </div>
                  )
                )}
              </div>

              <span className="text-sm text-[var(--text)]">
                {selectedUserAvatars.length} selected
              </span>
            </div>
          )}

        </div>

        <span className="text-xs text-[var(--text-muted)]">
          Team
        </span>
      </div>

      {/* MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Select Users"
      >
        <div className="flex flex-col max-h-[420px]">

          {/* LIST */}
          <div className="space-y-1 overflow-y-auto pr-1">
            {loadingAI && (
              <div className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--text-muted)] bg-[var(--bg-soft)] rounded-lg mb-2">
                <LuLoader className="animate-spin text-xs text-[var(--accent)]" />
                <span>Analyzing team workload and skills...</span>
              </div>
            )}

            {getSortedUsers().map((user) => {
              const isSelected = tempSelectedUsers.includes(user._id);
              const recDetails = user.recDetails;
              const scoreColor = recDetails
                ? recDetails.score >= 80 ? "text-emerald-500 bg-emerald-500/5 border-emerald-500/10" :
                  recDetails.score >= 50 ? "text-amber-500 bg-amber-500/5 border-amber-500/10" :
                  "text-rose-500 bg-rose-500/5 border-rose-500/10"
                : "";

              const cogProfile = recDetails?.cognitiveProfile || user.cognitiveProfile;
              const prob = cogProfile?.deliveryProbability;
              const probColor = prob !== undefined
                ? prob >= 80 ? "text-emerald-500 bg-emerald-500/5 border-emerald-500/10" :
                  prob >= 50 ? "text-amber-500 bg-amber-500/5 border-amber-500/10" :
                  "text-rose-500 bg-rose-500/5 border-rose-500/10"
                : "";

              return (
                <div
                  key={user._id}
                  onClick={() => toggleUserSelection(user._id)}
                  className={`
                    flex items-start gap-3 px-3 py-2.5 rounded-lg cursor-pointer border text-left
                    transition-all duration-200

                    ${
                      isSelected
                        ? "bg-[var(--bg-soft)] border-[var(--accent)]"
                        : "bg-transparent border-transparent hover:bg-[var(--bg-soft)]"
                    }
                  `}
                >
                  {user.profileImageUrl ? (
                    <img
                      src={user.profileImageUrl}
                      className="w-8 h-8 rounded-full shrink-0"
                    />
                  ) : (
                    <div className="flex w-8 h-8 shrink-0 items-center justify-center rounded-full bg-[var(--bg-soft)] text-xs text-[var(--text-muted)] border border-[var(--border)]">
                      {getUserInitial(user.name)}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-[var(--text)] truncate">
                        {user.name}
                      </p>
                      <div className="flex items-center gap-1 shrink-0">
                        {prob !== undefined && (
                          <span className={`text-[8px] px-1.5 py-0.5 rounded border font-medium ${probColor}`}>
                            {prob}% Delivery
                          </span>
                        )}
                        {recDetails && (
                          <span className={`text-[8px] px-1.5 py-0.5 rounded border font-medium ${scoreColor}`}>
                            {recDetails.score}% Match
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {recDetails ? (
                      <div className="mt-0.5">
                        <div className="flex justify-between items-center">
                          <p className="text-[10px] text-[var(--text-muted)] font-normal">
                            {recDetails.title} &bull; {recDetails.activeTasks} Active Tasks
                          </p>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDevId(user._id);
                              setSelectedDevName(user.name);
                              setIsAnalyzerOpen(true);
                            }}
                            className="text-[9px] text-[var(--accent)] hover:text-[var(--accent-hover)] bg-[var(--accent)]/5 hover:bg-[var(--accent)]/10 border border-[var(--accent)]/10 px-2 py-0.5 rounded font-semibold transition cursor-pointer"
                          >
                            Analyze Load
                          </button>
                        </div>
                        <p className="text-[10px] text-[var(--text-muted)] mt-1 leading-relaxed">
                          {recDetails.reasoning}
                        </p>
                        {recDetails.matchingSkills && recDetails.matchingSkills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {recDetails.matchingSkills.map((skill) => (
                              <span
                                key={skill}
                                className="text-[8px] bg-[var(--bg-soft)] text-[var(--text)] border border-[var(--border)] px-1.5 py-0.2 rounded"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-0.5">
                        <div className="flex justify-between items-center">
                          <p className="text-[10px] text-[var(--text-muted)] font-normal truncate max-w-[150px]">
                            {user.title || "Team Member"} &bull; {user.email}
                          </p>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDevId(user._id);
                              setSelectedDevName(user.name);
                              setIsAnalyzerOpen(true);
                            }}
                            className="text-[9px] text-[var(--accent)] hover:text-[var(--accent-hover)] bg-[var(--accent)]/5 hover:bg-[var(--accent)]/10 border border-[var(--accent)]/10 px-2 py-0.5 rounded font-semibold transition cursor-pointer"
                          >
                            Analyze Load
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {isSelected && (
                    <div className="w-2 h-2 rounded-full bg-[var(--accent)] mt-1.5 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>

          {/* FOOTER */}
          <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-[var(--border)]">

            <button
              onClick={() => setIsModalOpen(false)}
              className="
                px-4 py-2 text-sm rounded-lg
                border border-[var(--border)]
                text-[var(--text-muted)]
                hover:bg-[var(--bg-soft)]
                transition
              "
            >
              Cancel
            </button>

            <button
              onClick={handleAssign}
              className="
                px-4 py-2 text-sm rounded-lg
                bg-[var(--accent)]
                text-white
                hover:bg-[var(--accent-hover)]
                transition
              "
            >
              Assign
            </button>

          </div>
        </div>
      </Modal>

      <AIMatcher
        isOpen={isAnalyzerOpen}
        onClose={() => setIsAnalyzerOpen(false)}
        userId={selectedDevId}
        userName={selectedDevName}
      />
    </div>
  );
};

export default SelectUsers;
