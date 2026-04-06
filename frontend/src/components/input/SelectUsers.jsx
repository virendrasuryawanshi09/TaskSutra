import React, { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { LuUsers } from "react-icons/lu";
import Modal from "../Modal";

const SelectUsers = ({ selectedUsers, setSelectedUsers }) => {
  const [allUsers, setAllUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempSelectedUsers, setTempSelectedUsers] = useState([]);

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
            {allUsers.map((user) => {
              const isSelected = tempSelectedUsers.includes(user._id);

              return (
                <div
                  key={user._id}
                  onClick={() => toggleUserSelection(user._id)}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer
                    transition-all duration-200

                    ${
                      isSelected
                        ? "bg-[var(--bg-soft)] border border-[var(--accent)]"
                        : "hover:bg-[var(--bg-soft)]"
                    }
                  `}
                >
                  {user.profileImageUrl ? (
                    <img
                      src={user.profileImageUrl}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="flex w-8 h-8 items-center justify-center rounded-full bg-[var(--bg-soft)] text-xs text-[var(--text-muted)]">
                      {getUserInitial(user.name)}
                    </div>
                  )}

                  <div className="flex-1">
                    <p className="text-sm text-[var(--text)]">
                      {user.name}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {user.email}
                    </p>
                  </div>

                  {isSelected && (
                    <div className="w-2 h-2 rounded-full bg-[var(--accent)]" />
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
    </div>
  );
};

export default SelectUsers;