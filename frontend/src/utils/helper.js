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

export const persistAuthSession = ({ token, user, role }) => {
  const normalizedUser = user
    ? {
        ...user,
        role: role || user.role || "member",
      }
    : null;

  if (token) {
    localStorage.setItem("token", token);
  }

  if (normalizedUser) {
    localStorage.setItem("user", JSON.stringify(normalizedUser));
  }
};

// const Dashboard = {} => {
//   useUserAuth();

//   const{user} = useContext(UserContext);

//   const navigate = useNavigate();

//   const [dashboardData, setDashboardData] = useState(null);
//   const [pieChartData, setPieChartData] = useState([]);
//   const [barChartData, setBarChartData] = useState([]);

//   const getDashboardData = async () => {
//     try {
//       const response = await axiosInstance.get(
//         API_PATHS.TASKS.GET_DASHBOARD_DATA
//       );
//       if (response.data) {
//         setDashboardData(response.data);
//       }
//     } catch (error) {
//       console.error("Error fetching dashboard data:", error);
//     }
//   };

//   useEffect(() => {
//     getDashboardData();
//   }, []);
// }

export const addThousandSeparator = (num) => {
  if (num === null || num === undefined) return "";
  const [integerPart, fractionalPart] = num.toString().split(".");
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  
  return fractionalPart ? `${formattedInteger}.${fractionalPart}` : formattedInteger;
}