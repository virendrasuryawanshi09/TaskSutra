import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import AuthLayout from "../../components/layouts/AuthLayout";
import Input from "../../components/input/input.jsx";
import ProfilePhotoSelector from "../../components/input/ProfilePhotoSelector";
import toast from "react-hot-toast"; 
import axiosInstance from "../../utils/axiosInstance.js";
import { API_PATHS } from "../../utils/apiPaths.js";
import useUserAuth from "../../hooks/useUserAuth.jsx";
import uploadImage from "../../utils/uploadImage.js";
import { Helmet } from "react-helmet-async";
import {
  getDashboardRoute,
  getErrorMessage,
  normalizeEmail,
  validateEmail,
} from "../../utils/helper.js";

const SignUp = () => {
  const navigate = useNavigate();
  const { updateUserContext } = useUserAuth();

  const [profilePic, setProfilePic] = useState(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); 

  // Invitation fields
  const [inviteToken, setInviteToken] = useState("");
  const [isEmailLocked, setIsEmailLocked] = useState(false);
  const [invitationCompany, setInvitationCompany] = useState("");

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const token = queryParams.get("token");
    if (token) {
      const validateInvite = async () => {
        const toastId = toast.loading("Validating invitation link...");
        try {
          const res = await axiosInstance.get(`/api/workspace/invitations/validate/${token}`);
          if (res.data && res.data.email) {
            setEmail(res.data.email);
            setIsEmailLocked(true);
            setInviteToken(token);
            setInvitationCompany(res.data.company);
            toast.success(`Joining workspace: ${res.data.company}`, { id: toastId });
          }
        } catch (err) {
          toast.error(err.response?.data?.message || "Invitation link is invalid or expired.", { id: toastId });
        }
      };
      validateInvite();
    }
  }, []);

  const handleSignUp = async (e) => {
    e.preventDefault();

    if (loading) return;

    const trimmedName = fullName.trim();
    const normalizedEmail = normalizeEmail(email);

    if (!trimmedName || !normalizedEmail || !password.trim()) {
      const message = "Name, email, and password are required.";
      setError(message);
      return toast.error(message);
    }

    if (!validateEmail(normalizedEmail)) {
      const message = "Please enter a valid email address.";
      setError(message);
      return toast.error(message);
    }

    setError("");
    setLoading(true);

    const toastId = toast.loading("Creating your account...");

    try {
      let profileImageUrl;

      if (profilePic) {
        const uploadResponse = await uploadImage(profilePic);
        profileImageUrl = uploadResponse?.imageUrl|| "";
      }

      const { data } = await axiosInstance.post(API_PATHS.AUTH.REGISTER, {
        name: trimmedName,
        email: normalizedEmail,
        password,
        profileImageUrl,
        inviteToken: inviteToken || undefined,
      });

      const { token, role, ...user } = data;

      if (!token) {
        throw new Error("Invalid server response");
      }

      updateUserContext({
        token,
        user: {
          ...user,
          role,
        },
      });

      toast.success(`Welcome ${user.name || "User"}!`, {
        id: toastId,
      });

      if (role === "member" && !user.companyId) {
        navigate("/user/dashboard");
      } else {
        navigate(getDashboardRoute(role));
      }
    } catch (err) {
      console.error("SignUp Error:", err);

      const message = getErrorMessage(
        err,
        "Unable to create account. Please try again."
      );

      setError(message);

      toast.error(message, {
        id: toastId,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Sign Up | TaskSutra</title>
        <meta name="description" content="Create your TaskSutra account to start organizing your team, mapping tasks, and streamlining collaborative workflows." />
        <link rel="canonical" href="https://tasksutra.app/signup" />
      </Helmet>
      <AuthLayout>
        <div>
          <h1 className="text-[20px] font-semibold mb-4">
            Create an account
          </h1>

          {invitationCompany && (
            <div className="mb-6 p-4 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-center">
              <p className="text-[13px] font-medium text-[var(--text)]">
                You've been invited to join <span className="font-semibold text-[var(--accent)]">{invitationCompany}</span> on TaskSutra.
              </p>
            </div>
          )}

          <form onSubmit={handleSignUp}>
            <div className="mb-6 flex justify-center">
              <ProfilePhotoSelector
                image={profilePic}
                setImage={setProfilePic}
              />
            </div>

            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              type="text"
              label="Full Name"
            />

            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              label="Email"
              disabled={isEmailLocked}
            />

            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              label="Password"
            />

            {error && (
              <p className="text-sm text-red-500 mt-2 mb-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="
                w-full py-[15px] mt-3 rounded-[12px]
                bg-[var(--accent)] text-white text-[15px] font-medium
                transition-all duration-200
                hover:bg-[var(--accent-hover)] hover:-translate-y-[1px]
                active:scale-[0.97]
                disabled:opacity-70 disabled:cursor-not-allowed
              "
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>

            <div className="mt-5 text-[13px] text-[var(--text-muted)] text-center">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-medium text-[var(--accent)] hover:underline"
              >
                Sign in
              </Link>
            </div>
          </form>
        </div>
      </AuthLayout>
    </>
  );
};

export default SignUp;
