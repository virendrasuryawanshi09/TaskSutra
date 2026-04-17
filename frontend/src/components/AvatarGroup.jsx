import React from "react";

const AvatarGroup = ({ avatars = [] }) => {

  const getInitials = (name = "") => {
    const words = name.trim().split(" ");
    if (words.length === 1) return words[0][0]?.toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  };

  return (
    <div className="flex -space-x-2">

      {avatars.slice(0, 3).map((user, i) => (
        <div
          key={i}
          className="
            w-7 h-7 rounded-full
            border-2 border-[var(--surface)]
            bg-[var(--bg-soft)]
            flex items-center justify-center
            text-[10px] font-medium text-[var(--text)]
            overflow-hidden
          "
        >

          {user?.image ? (
            <img
              src={user.image}
              alt={user.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          ) : (
            <span>{getInitials(user?.name || "U")}</span>
          )}

        </div>
      ))}

      {/* +X extra users */}
      {avatars.length > 3 && (
        <div className="
          w-7 h-7 rounded-full
          bg-[var(--bg-soft)]
          border-2 border-[var(--surface)]
          flex items-center justify-center
          text-[10px] text-[var(--text-muted)]
        ">
          +{avatars.length - 3}
        </div>
      )}

    </div>
  );
};

export default AvatarGroup;