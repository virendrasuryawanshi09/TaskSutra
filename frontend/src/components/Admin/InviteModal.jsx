import React, { useState } from "react";
import toast from "react-hot-toast";
import axiosInstance from "../../utils/axiosInstance";

const InviteModal = ({ isOpen, onClose, companyDetails, currentUser, onMemberAdded }) => {
  const [memberModalTab, setMemberModalTab] = useState("invite"); // 'invite' or 'direct'
  const [inviteEmail, setInviteEmail] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [invitePreviewUrl, setInvitePreviewUrl] = useState("");
  const [isNodemailerMissing, setIsNodemailerMissing] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

  const [directMemberData, setDirectMemberData] = useState({
    name: "",
    email: "",
    password: "",
    role: "member",
    title: "",
    skills: "",
  });
  const [isAddingDirectly, setIsAddingDirectly] = useState(false);

  if (!isOpen) return null;

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setIsInviting(true);
    const toastId = toast.loading("Generating invitation link...");
    try {
      const res = await axiosInstance.post("/api/workspace/invitations", {
        email: inviteEmail.trim(),
      });
      if (res.data && res.data.inviteLink) {
        setGeneratedLink(res.data.inviteLink);
        setInvitePreviewUrl(res.data.previewUrl || "");
        setIsNodemailerMissing(!!res.data.nodemailerMissing);
        toast.success(res.data.message || "Invitation generated!", { id: toastId });
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to generate invitation.",
        { id: toastId }
      );
    } finally {
      setIsInviting(false);
    }
  };

  const handleDirectAdd = async (e) => {
    e.preventDefault();
    const { name, email, password, role, title, skills } = directMemberData;
    if (!name.trim() || !email.trim() || !password.trim()) {
      toast.error("Name, email, and password are required.");
      return;
    }

    setIsAddingDirectly(true);
    const toastId = toast.loading(`Adding ${name} to workspace...`);
    try {
      const skillsArray = skills
        ? skills.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

      const res = await axiosInstance.post("/api/workspace/members", {
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
        role,
        title: title.trim(),
        skills: skillsArray,
        company: companyDetails?.name || "",
      });

      if (res.data && res.data.success) {
        toast.success("Member added successfully!", { id: toastId });
        if (onMemberAdded) {
          onMemberAdded(res.data.member);
        }
        handleClose();
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to add workspace member.",
        { id: toastId }
      );
    } finally {
      setIsAddingDirectly(false);
    }
  };

  const handleClose = () => {
    setInviteEmail("");
    setGeneratedLink("");
    setInvitePreviewUrl("");
    setIsNodemailerMissing(false);
    setDirectMemberData({
      name: "",
      email: "",
      password: "",
      role: "member",
      title: "",
      skills: "",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[4px] p-4">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
        <h2 className="text-lg font-semibold text-[var(--text)] mb-3 text-left">
          Manage Workspace Members
        </h2>

        {/* Tabs */}
        <div className="flex border-b border-[var(--border)] mb-5 gap-4">
          <button
            type="button"
            onClick={() => {
              setMemberModalTab("invite");
              setGeneratedLink("");
            }}
            className={`pb-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${memberModalTab === "invite"
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
          >
            Invite with Link
          </button>
          <button
            type="button"
            onClick={() => setMemberModalTab("direct")}
            className={`pb-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${memberModalTab === "direct"
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
          >
            Add Directly
          </button>
        </div>

        {memberModalTab === "invite" ? (
          /* --- INVITATION FLOW --- */
          !generatedLink ? (
            <form onSubmit={handleSendInvite} className="flex flex-col gap-4 text-left">
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Generate a secure link to allow the user to sign up themselves. Link will expire in 10 minutes.
              </p>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-[var(--text)] font-semibold">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="
                    w-full px-3.5 py-2.5 text-sm 
                    bg-[var(--bg-soft)] border border-[var(--border)] 
                    rounded-xl text-[var(--text)] placeholder-[var(--text-muted)] 
                    focus:outline-none focus:border-[var(--accent)]
                    transition duration-150
                  "
                />
              </div>

              <div className="flex justify-end gap-2.5 mt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="
                    px-4 py-2 text-sm font-medium 
                    border border-[var(--border)] rounded-xl 
                    text-[var(--text)] hover:bg-[var(--bg-soft)] 
                    transition duration-150 cursor-pointer
                  "
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isInviting || !inviteEmail.trim()}
                  className="
                    px-4 py-2 text-sm font-medium 
                    bg-[var(--accent)] text-white rounded-xl 
                    hover:bg-[var(--accent-hover)] 
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition duration-150 cursor-pointer
                  "
                >
                  {isInviting ? "Generating..." : "Generate Invite"}
                </button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col gap-4 text-left font-sans">
              {invitePreviewUrl ? (
                <div className="p-4 bg-cyan-950/10 border border-cyan-800/20 rounded-xl flex flex-col gap-2">
                  <p className="text-xs font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
                    Direct Email Dispatched!
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                    Since this is a local development environment, the invitation email was sent to a virtual sandbox inbox. You can open and review the sent template below:
                  </p>
                  <a
                    href={invitePreviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 w-full py-2 px-3 text-xs font-bold text-center text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 active:scale-[0.98] transition-all inline-block"
                  >
                    View Sent Email
                  </a>
                </div>
              ) : isNodemailerMissing ? (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex flex-col gap-1.5">
                  <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
                    Automatic Email Skipped
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
                    The package <code className="font-mono bg-[var(--bg-soft)] px-1 rounded">nodemailer</code> is not installed in the backend. The invitation link was generated, but could not be sent to <span className="font-semibold text-[var(--text)]">{inviteEmail}</span>.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-center">
                  <p className="text-[11px] text-green-500 font-semibold mb-1">
                    Invitation Generated!
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    The invitation details have been registered on the server.
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-[var(--text)] font-semibold">
                  Fallback Signup URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={generatedLink}
                    className="
                      w-full px-3 py-2 text-xs 
                      bg-[var(--bg-soft)] border border-[var(--border)] 
                      rounded-xl text-[var(--text)] focus:outline-none
                    "
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedLink);
                      toast.success("Link copied to clipboard!");
                    }}
                    className="
                      px-3.5 py-2 text-xs font-semibold 
                      bg-[var(--accent)] text-white rounded-xl 
                      hover:bg-[var(--accent-hover)] transition shrink-0 cursor-pointer
                    "
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="
                    px-4 py-2 text-sm font-medium 
                    bg-[var(--accent)] text-white rounded-xl 
                    hover:bg-[var(--accent-hover)] transition cursor-pointer
                  "
                >
                  Done
                </button>
              </div>
            </div>
          )
        ) : (
          /* --- DIRECT ADD FLOW --- */
          <form onSubmit={handleDirectAdd} className="flex flex-col gap-3.5 text-left max-h-[70vh] overflow-y-auto pr-1">
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Directly create a new user profile. They can sign in instantly with their email and password.
            </p>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-[var(--text)] font-semibold">
                Full Name
              </label>
              <input
                type="text"
                required
                value={directMemberData.name}
                onChange={(e) => setDirectMemberData({ ...directMemberData, name: e.target.value })}
                placeholder="John Doe"
                className="w-full px-3 py-2 text-xs bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-[var(--text)] font-semibold">
                Email Address
              </label>
              <input
                type="email"
                required
                value={directMemberData.email}
                onChange={(e) => setDirectMemberData({ ...directMemberData, email: e.target.value })}
                placeholder="john.doe@company.com"
                className="w-full px-3 py-2 text-xs bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-[var(--text)] font-semibold">
                Temporary Password
              </label>
              <input
                type="password"
                required
                value={directMemberData.password}
                onChange={(e) => setDirectMemberData({ ...directMemberData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full px-3 py-2 text-xs bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-[var(--text)] font-semibold">
                  Job Title
                </label>
                <input
                  type="text"
                  value={directMemberData.title}
                  onChange={(e) => setDirectMemberData({ ...directMemberData, title: e.target.value })}
                  placeholder="e.g. Lead Designer"
                  className="w-full px-3 py-2 text-xs bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-[var(--text)] font-semibold">
                  Role
                </label>
                <select
                  value={directMemberData.role}
                  onChange={(e) => setDirectMemberData({ ...directMemberData, role: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-[var(--text)] font-semibold">
                Skills (comma-separated)
              </label>
              <input
                type="text"
                value={directMemberData.skills}
                onChange={(e) => setDirectMemberData({ ...directMemberData, skills: e.target.value })}
                placeholder="e.g. React, Node.js, Mongoose"
                className="w-full px-3 py-2 text-xs bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>

            <div className="flex justify-end gap-2.5 mt-2.5">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium border border-[var(--border)] rounded-xl text-[var(--text)] hover:bg-[var(--bg-soft)] transition duration-150 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isAddingDirectly}
                className="px-4 py-2 text-sm font-medium bg-[var(--accent)] text-white rounded-xl hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 cursor-pointer"
              >
                {isAddingDirectly ? "Adding..." : "Add Member"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default InviteModal;
