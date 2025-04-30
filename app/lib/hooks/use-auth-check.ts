import { useEffect } from "react";
import useStateStore from "@/stateStore";
import { initializeArcGIS, isArcgisTokenValid, authenticateArcGIS, fetchArcGISUserInfo } from '@/lib/authenticateArcGIS';
import { redirect } from 'next/navigation';

const useAuthCheck = (interval = 1200000) => {
  const { sendMessage, setUserInfo } = useStateStore((state) => state);

  useEffect(() => {
    console.log("Initializing ArcGIS...");
    initializeArcGIS();

    const checkAuth = async () => {
      console.log("Checking if ArcGIS token is valid...");
      const isValid = await isArcgisTokenValid();
      console.log("ArcGIS token valid:", isValid);

      if (!isValid) {
        console.log("Token invalid. Sending session expired message...");
        sendMessage({
          title: "Session Expired",
          body: "You will be redirected to the login page",
          type: "warning",
          duration: 20,
        });

        console.log("Redirecting to login page in 21 seconds...");
        setTimeout(() => {
          console.log("Redirecting now.");
          redirect(process.env.NEXT_PUBLIC_LOGIN_URL || '/');
        }, 21000);
        return;
      }

      console.log("Authenticating ArcGIS...");
      const isAuthenticated = authenticateArcGIS();
      console.log("ArcGIS authenticated:", isAuthenticated);

      if (isAuthenticated) {
        console.log("Fetching ArcGIS user info...");
        const userInfo = await fetchArcGISUserInfo();
        console.log("User info fetched:", userInfo);

        if (userInfo) {
          setUserInfo(userInfo);
          console.log("User info set in state.");
        }
      }
    };

    checkAuth();
    const timer = setInterval(checkAuth, interval);

    return () => {
      console.log("Clearing auth check interval.");
      clearInterval(timer);
    };
  }, [interval]);
};

export default useAuthCheck;
