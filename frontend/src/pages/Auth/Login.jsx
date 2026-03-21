import React, { useState } from "react";
import toast from "react-hot-toast";
import AuthLayout from "../../components/layouts/AuthLayout";
import Input from "../../components/input/input.jsx";
import { validateEmail } from "../../utils/helper";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance.js";
import { API_PATHS } from "../../utils/apiPaths";

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await axiosInstance.post(API_PATHS.AUTH.LOGIN, {
        email,
        password,
      });

      const { token, role } = response.data;

      localStorage.setItem("token", token);

      toast.success("Login successful");

      if (role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/user/dashboard");
      }

    } catch (error) {
      const message =
        error.response?.data?.message || "Login failed. Please try again.";

      setError(message);

      toast.error(message);

    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Sign in">
      <form onSubmit={handleLogin}>

        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="text"
          label="Email"
        />

        <Input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          label="Password"
        />

        {error && (
          <p className="text-sm text-red-500 mb-4">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="
            w-full py-[15px] rounded-[12px] 
            bg-[var(--accent)] text-white text-[15px] font-medium
            transition-all duration-200
            hover:bg-[var(--accent-hover)] hover:-translate-y-[1px]
            active:scale-[0.97]
            disabled:opacity-70 disabled:cursor-not-allowed
          "
        >
          {loading ? "Signing in..." : "Login"}
        </button>

        <div className="mt-5 text-[13px] text-[var(--text-muted)]">
          Don’t have an account?{" "}
          <Link
            to="/signup"
            className="font-medium text-[var(--accent)] hover:underline"
          >
            Sign up
          </Link>
        </div>
    </form>
    </AuthLayout >
  );
};

export default Login;