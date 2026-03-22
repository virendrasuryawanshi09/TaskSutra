import React, { useState } from "react";
import toast from "react-hot-toast";
import AuthLayout from "../../components/layouts/AuthLayout";
import Input from "../../components/input/input.jsx";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance.js";
import { API_PATHS } from "../../utils/apiPaths.js";
import {
  getDashboardRoute,
  getErrorMessage,
  normalizeEmail,
  persistAuthSession,
  validateEmail,
} from "../../utils/helper.js";

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (loading) return;

    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password.trim()) {
      const message = "Email and password are required.";
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
    const toastId = toast.loading("Signing you in...");

    try {
      const { data } = await axiosInstance.post(API_PATHS.AUTH.LOGIN, {
        email: normalizedEmail,
        password,
      });

      const { token, role, ...user } = data;

      if (!token) {
        throw new Error("Invalid server response");
      }

      persistAuthSession({ token, user });

      toast.success("Login successful.", { id: toastId });
      navigate(getDashboardRoute(role));
    } catch (error) {
      const message = getErrorMessage(
        error,
        "Login failed. Please try again."
      );
      setError(message);
      toast.error(message, { id: toastId });
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
          type="email"
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
          {loading ? "Signing in..." : "Sign In"}
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
