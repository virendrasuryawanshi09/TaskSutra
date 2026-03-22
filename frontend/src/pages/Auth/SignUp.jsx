import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AuthLayout from "../../components/layouts/AuthLayout";
import Input from "../../components/input/input.jsx";
import ProfilePhotoSelector from "../../components/input/ProfilePhotoSelector";
import toast from "react-hot-toast"; 
import axiosInstance from "../../utils/axiosInstance.js";
import { API_PATHS } from "../../utils/apiPaths.js";
import {
  getDashboardRoute,
  getErrorMessage,
  normalizeEmail,
  persistAuthSession,
  validateEmail,
} from "../../utils/helper.js";


const SignUp = () => {
  const navigate = useNavigate();

  const [profilePic, setProfilePic] = useState(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminInviteToken, setAdminInviteToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); 
  

  const handleSignUp = async (e) => {
    e.preventDefault();

    if (loading) return;

    const trimmedName = fullName.trim();
    const normalizedEmail = normalizeEmail(email);
    const trimmedInviteToken = adminInviteToken.trim();

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
        const formData = new FormData();
        formData.append("image", profilePic);

        const uploadResponse = await axiosInstance.post(
          API_PATHS.IMAGE.UPLOAD_IMAGE,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        profileImageUrl = uploadResponse.data?.imageUrl;
      }

      const { data } = await axiosInstance.post(API_PATHS.AUTH.REGISTER, {
        name: trimmedName,
        email: normalizedEmail,
        password,
        profileImageUrl,
        adminInviteToken: trimmedInviteToken || undefined,
      });

      const { token, role, ...user } = data;

      if (!token) {
        throw new Error("Invalid server response");
      }

      persistAuthSession({ token, user });

      toast.success(`Welcome ${user.name || "User"}!`, {
        id: toastId,
      });

      navigate(getDashboardRoute(role));
    } catch (err) {
      console.error("Signup Error:", err);

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
    <AuthLayout>

      <div>
        <h3 className="text-[20px] font-semibold mb-4">
          Create an account
        </h3>

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
          />

          <Input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            label="Password"
          />

          <Input
            value={adminInviteToken}
            onChange={(e) => setAdminInviteToken(e.target.value)}
            type="text"
            label="Admin Invite Token (Optional)"
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
  );
};

export default SignUp;
