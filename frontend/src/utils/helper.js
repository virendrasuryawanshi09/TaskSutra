export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(String(email).toLowerCase());
};

export const normalizeEmail = (email = "") => email.trim().toLowerCase();

export const getErrorMessage = (
  error,
  fallback = "Something went wrong. Please try again."
) => error?.response?.data?.message || error?.message || fallback;

export const getDashboardRoute = (role) => {
  return role === "admin" ? "/admin/dashboard" : "/user/dashboard";
};

export const persistAuthSession = ({ token, user }) => {
  if (token) {
    localStorage.setItem("token", token);
  }

  if (user) {
    localStorage.setItem("user", JSON.stringify(user));
  }
};
