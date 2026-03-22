import { useContext } from "react";
import { UserContext } from "../context/UserContextState.js";

const useUserAuth = () => {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error("useUserAuth must be used within a UserProvider.");
  }

  return context;
};

export default useUserAuth;
