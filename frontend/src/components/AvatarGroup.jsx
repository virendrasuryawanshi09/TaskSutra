import React from "react";

const getAvatarSrc = (avatar, index) => {
  const fallback = `https://ui-avatars.com/api/?name=User${index}`;

  if (typeof avatar === "string") {
    const trimmedAvatar = avatar.trim();
    return trimmedAvatar || fallback;
  }

  if (avatar && typeof avatar === "object") {
    const candidate = avatar.profileImageUrl || avatar.profileImage || avatar.src || "";
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  return fallback;
};

const AvatarGroup = ({ avatars = [] }) => {
  return (
    <div className="flex -space-x-2">
      {avatars.slice(0, 3).map((avatar, i) => (
        <img
          key={i}
          src={getAvatarSrc(avatar, i)}
          onError={(e) => {
            e.currentTarget.src = `https://ui-avatars.com/api/?name=User${i}`;
          }}
          className="
            w-7 h-7 rounded-full
            border-2 border-[var(--surface)]
            object-cover
            bg-[var(--bg-soft)]
          "
        />
      ))}
    </div>
  );
};

export default AvatarGroup;
