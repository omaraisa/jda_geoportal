import { useEffect } from "react";
import useStateStore from "@/stateStore";
import { initializeArcGIS, isArcgisTokenValid, authenticateArcGIS, fetchArcGISUserInfo } from '@/lib/authenticateArcGIS'
import setAuthorizationLevel from "@/lib/authorizeArcGIS";

const useAuthentication = (interval = 120000) => {
  const { setUserInfo, setSessionModalOpen } = useStateStore((state) => state);

  useEffect(() => {
    initializeArcGIS();

    const checkAuth = async () => {
      const isValid = await isArcgisTokenValid();

      if (!isValid) {
        // Show session modal instead of redirecting immediately
        setSessionModalOpen(true);
        return;
      }

      const isAuthenticated = await authenticateArcGIS();
      if (isAuthenticated) {
        const userInfo = await fetchArcGISUserInfo();
        if (userInfo) {
          const role = await setAuthorizationLevel(userInfo);

          if (userInfo && role) {
            userInfo.role = role;
            setUserInfo(userInfo);

          }
        }
      }
    };

    checkAuth();
    const timer = setInterval(checkAuth, interval);

    return () => clearInterval(timer);
  }, [interval]);
};

export default useAuthentication;
