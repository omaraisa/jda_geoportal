import { useEffect } from "react";
import useStateStore from "@/stateStore";
import {initializeArcGIS, isArcgisTokenValid ,authenticateArcGIS, fetchArcGISUserInfo } from '@/lib/authenticateArcGIS'
import { redirect } from 'next/navigation';


const useAuthCheck = (interval = 1200000) => {debugger
  const { sendMessage, setUserInfo } = useStateStore((state) => state);

  useEffect(() => {
    initializeArcGIS();

    const checkAuth = async () => {
      const isValid = await isArcgisTokenValid();

      if (!isValid) {
        sendMessage({
          title: "Session Expired",
          body: "You will be redirected to the login page",
          type: "warning",
          duration: 20,
        });

        setTimeout(() => {
          redirect(process.env.NEXT_PUBLIC_LOGIN_URL || '/');
        }, 21000);
        return;
      }

      const isAuthenticated = authenticateArcGIS();
      if (isAuthenticated) {
        const userInfo = await fetchArcGISUserInfo();
        if (userInfo) {
          setUserInfo(userInfo); 
          console.log("User info fetched successfully:", userInfo);
        }
      }
    };

    checkAuth();
    const timer = setInterval(checkAuth, interval);

    return () => clearInterval(timer);
  }, [interval]);
};

export default useAuthCheck;
