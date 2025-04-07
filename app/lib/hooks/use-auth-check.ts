import { useEffect } from "react";
import useStateStore from "@/stateStore";
import {isArcgisTokenValid ,authenticateArcGIS} from '@/lib/authenticateArcGIS'
import { redirect } from 'next/navigation';


const useAuthCheck = (interval = 1800000) => {
  const { sendMessage } = useStateStore((state) => state);

  useEffect(() => {
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
          redirect(process.env.NEXT_PUBLIC_LOGIN_URL || '/')
        }, 21000);
        return;
      }
      else {
        authenticateArcGIS()
      }
    };

    checkAuth();
    const timer = setInterval(checkAuth, interval);

    return () => clearInterval(timer);
  }, [interval, sendMessage]);

};

export default useAuthCheck;
