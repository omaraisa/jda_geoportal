import { useEffect } from "react";
import { checkIsAuthenticated } from "@/lib/auth";
import useStateStore from "@/stateStore";

const useAuthCheck = (interval = 5000) => {
  const { sendMessage } = useStateStore((state) => state);

  useEffect(() => {
    const checkAuth = async () => {
      const isAuthenticated = await checkIsAuthenticated();
      console.log("useAuthCheck", isAuthenticated);
      if (!isAuthenticated) {
        sendMessage({
          title: "Session Expired",
          body: `You will be redirected to the login page`,
          type: "warning",
          duration: 20,
        })
      }
    };

    checkAuth();
    const timer = setInterval(checkAuth, interval);

    return () => clearInterval(timer);
  }, [interval]);
};

export default useAuthCheck;
