import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../../components/layouts/AuthLayout";
import Input from "../../components/input/input.jsx";
import { validateEmail } from "../../utils/helper";
import ProfilePhotoSelector from "../../components/input/ProfilePhotoSelector";
import { Link } from "react-router-dom";

const SignUp = () => {
  const navigate = useNavigate();

  const [profilePic, setProfilePic] = useState(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminInviteToken, setAdminInviteToken] = useState("");
  const [error, setError] = useState("");

  const handleSignUp = async (e) => {
    e.preventDefault();

    if (!fullName) {
      setError("Please enter your full name.");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setError("");

    console.log({
      fullName,
      email,
      password,
      profilePic,
      adminInviteToken,
    });

    // 👉 Later: API call here
  };

  return (
    <AuthLayout>

      <div>
        <h3 className="text-[20px] font-semibold mb-2">
          Create an account
        </h3>

        <p className="text-sm text-[#6F6E69] mb-6">
          Join us today by entering your details below.
        </p>

        <form onSubmit={handleSignUp}>

          {/* PROFILE PHOTO */}
          <div className="mb-6">
            <ProfilePhotoSelector
              image={profilePic}
              setImage={setProfilePic}
            />
          </div>

          {/* FULL NAME */}
          <Input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            type="text"
            label="Full Name"
          />

          {/* EMAIL */}
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="text"
            label="Email"
          />

          {/* PASSWORD */}
          <Input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            label="Password"
          />

          {/* ADMIN TOKEN (OPTIONAL) */}
          <Input
            value={adminInviteToken}
            onChange={(e) => setAdminInviteToken(e.target.value)}
            type="text"
            label="Admin Invite Token (Optional)"
          />

          {/* ERROR */}
          {error && (
            <p className="text-sm text-red-500 mt-2 mb-2">
              {error}
            </p>
          )}

          {/* BUTTON */}
          <button
            type="submit"
            className="w-full py-[14px] mt-4 rounded-[10px] bg-[#1F6F78] text-white text-[15px] font-medium transition-all hover:bg-[#195A62] hover:-translate-y-[1px] active:scale-[0.98]"
          >
            Create Account
          </button>

          {/* FOOTER */}
        <div className="mt-5 text-[13px] text-[#6F6E69]">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-[#1F6F78] hover:underline"
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