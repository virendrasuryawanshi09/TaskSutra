import React, { useRef, useState, useEffect } from "react";
import { LuUser, LuUpload, LuTrash } from "react-icons/lu";

const ProfilePhotoSelector = ({ image, setImage }) => {
  const inputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const displayImage =
    previewUrl || (typeof image === "string" && image.trim() ? image : null);

  // HANDLE IMAGE CHANGE
  const handleImageChange = (event) => {
    const file = event.target.files[0];

    if (file) {
      setImage(file);

      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);

      event.target.value = "";
    }
  };

  // CLEANUP MEMORY
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // REMOVE IMAGE
  const handleRemoveImage = () => {
    setImage(null);
    setPreviewUrl(null);
  };

  // OPEN FILE PICKER
  const onChooseFile = () => {
    inputRef.current?.click();
  };

  // DRAG & DROP
  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];

    if (file) {
      setImage(file);
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">

      {/* HIDDEN INPUT */}
      <input
        type="file"
        accept="image/*"
        ref={inputRef}
        onChange={handleImageChange}
        className="hidden"
      />

      {/* AVATAR CONTAINER (NO overflow-hidden here) */}
      <div
        onClick={onChooseFile}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="
    relative w-24 h-24 rounded-full border border-gray-300 bg-gray-100 
    flex items-center justify-center cursor-pointer group
    transition-all duration-300 ease-out
    hover:shadow-md hover:scale-[1.03]
  "
      >
        {/* INNER IMAGE WRAPPER (clip here instead) */}
        <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
          {displayImage ? (
            <img
              src={displayImage}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <LuUser className="text-3xl text-gray-500" />
          )}
        </div>

        {/* HOVER OVERLAY */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-200 rounded-full">
          <LuUpload className="text-white text-xl" />
        </div>

        {/* REMOVE BUTTON (now works perfectly) */}
        {displayImage && (
          <button
            type="button"

            onClick={(e) => {
              e.stopPropagation();
              handleRemoveImage();
            }}
            className="cursor-pointer absolute bottom-0 right-0 translate-x-1/10 translate-y-1/10 z-20 bg-white border border-gray-300 rounded-full p-1.5 shadow-lg hover:bg-red-50 hover:scale-110 transition-all duration-200"
          >
            <LuTrash size={14} className="text-red-500" />
          </button>
        )}
      </div>

      {/* TEXT ACTION */}
      <button
        type="button"
        onClick={onChooseFile}
        className="flex items-center gap-2 text-sm font-medium text-teal-700 hover:text-teal-800 transition"
      >
        <LuUpload size={16} />
        {displayImage ? "Change Photo" : "Upload Photo"}
      </button>

    </div>
  );
};

export default ProfilePhotoSelector;
