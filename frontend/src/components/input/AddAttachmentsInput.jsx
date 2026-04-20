import React from "react";
import { HiOutlineTrash, HiOutlinePaperClip } from "react-icons/hi2";

const AddAttachmentsInput = ({ attachments = [], setAttachments }) => {
  const attachmentList = Array.isArray(attachments) ? attachments : [];
  const getAttachmentName = (file) =>
    typeof file === "string" ? file.split("/").pop() || "Attachment" : file.name;

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setAttachments((prev) => [...prev, ...files]);
    e.target.value = null;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    setAttachments((prev) => [...prev, ...files]);
  };

  const handleDelete = (index) => {
    const updated = attachmentList.filter((_, i) => i !== index);
    setAttachments(updated);
  };

  const formatFileSize = (size) => {
    if (typeof size !== "number") return "Uploaded";
    if (size < 1024) return size + " B";
    if (size < 1024 * 1024) return (size / 1024).toFixed(1) + " KB";
    return (size / (1024 * 1024)).toFixed(1) + " MB";
  };

  const isImage = (file) =>
    typeof file === "string"
      ? /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(file)
      : file.type?.startsWith("image/");

  return (
    <div className="space-y-4">

      {/* 🔥 DROP ZONE */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="
          relative
          flex flex-col items-center justify-center
          border border-dashed border-[var(--border)]
          rounded-xl
          py-8 px-4 text-center

          bg-[var(--bg-soft)]
          text-[var(--text-muted)]

          hover:border-[var(--accent)]
          hover:bg-transparent

          transition-all duration-200
          cursor-pointer
        "
      >
        <HiOutlinePaperClip className="text-xl mb-2" />
        <p className="text-sm font-medium">Upload files</p>
        <p className="text-xs mt-1">Drag & drop or click to browse</p>

        <input
          type="file"
          multiple
          onChange={handleFileChange}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </div>

      {/* 🔥 FILE GRID */}
      {attachmentList.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">

          {attachmentList.map((file, index) => (
            <div
              key={`${typeof file === "string" ? file : file.name}-${index}`}
              className="
                group relative
                bg-[var(--bg-soft)]
                border border-[var(--border)]
                rounded-xl p-3

                hover:border-[var(--text-muted)]
                transition-all duration-200
              "
            >

              {/* IMAGE PREVIEW */}
              {isImage(file) ? (
                <img
                  src={typeof file === "string" ? file : URL.createObjectURL(file)}
                  alt=""
                  className="w-full h-24 object-cover rounded-md mb-2"
                />
              ) : (
                <div className="
                  flex items-center justify-center
                  h-24 rounded-md mb-2
                  bg-[var(--surface)]
                ">
                  <HiOutlinePaperClip className="text-lg text-[var(--text-muted)]" />
                </div>
              )}

              {/* FILE INFO */}
              <p className="text-xs text-[var(--text)] truncate">
                {getAttachmentName(file)}
              </p>

              <p className="text-[10px] text-[var(--text-muted)] mt-1">
                {formatFileSize(typeof file === "string" ? undefined : file.size)}
              </p>

              {/* DELETE BUTTON */}
              <button
                onClick={() => handleDelete(index)}
                className="
                  absolute top-2 right-2
                  p-1 rounded-md

                  bg-[var(--surface)]
                  text-[var(--text-muted)]

                  opacity-0 group-hover:opacity-100

                  hover:text-red-500

                  transition-all duration-200
                "
              >
                <HiOutlineTrash className="text-sm" />
              </button>

            </div>
          ))}

        </div>
      )}

    </div>
  );
};

export default AddAttachmentsInput;
