import React, { useState } from "react";
import AuthLayout from "../../components/layouts/AuthLayout";
import Input from "../../components/input/input.jsx";
import { validateEmail } from "../../utils/helper";
import { Link } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance.js"
const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);


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

    try {
      const response = await axiosInstance.post(API_PATHS_AUTH.LOGIN, {
        email,
        password
      });

      const { token, role } = response.data;

      if (role == "admin") {
        Navigate("/admin/dashboard");
      } else {
        navigate("/user/dashboard");
      }

    } catch (error) {
      if(error.response && error.response.data.message) {
        setError(error.response.data.message);
      }else {
        setError("Something went erong. Please try again.")
      }
    }
  };

  return (
    <AuthLayout title="Sign in">


      <form onSubmit={handleLogin}>

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

        {/* ERROR */}
        {error && (
          <p className="text-sm text-red-500 mb-4">{error}</p>
        )}

        {/* BUTTON */}
        <button
          type="submit"
          className="w-full py-[14px] rounded-[10px] bg-[#1F6F78] text-white text-[15px] font-medium transition-all hover:bg-[#195A62] hover:-translate-y-[1px] active:scale-[0.98]"
        >
          Login
        </button>

        {/* FOOTER */}
        <div className="mt-5 text-[13px] text-[#6F6E69]">
          Don’t have an account?{" "}
          <Link
            to="/signup"
            className="font-medium text-[#1F6F78] hover:underline"
          >
            Sign up
          </Link>
        </div>

      </form>

    </AuthLayout>
  );
};

export default Login;