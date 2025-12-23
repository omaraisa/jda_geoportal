import { useEffect, useState } from "react";
import useStateStore from "@/stateStore";
import { initializeArcGIS, isArcgisTokenValid, authenticateArcGIS, refreshArcGISTokenIfNeeded } from '@/lib/utils/authenticate-arcgis';
import { getCookie } from '@/lib/utils/token';
import { getCurrentConfig } from '@/lib/utils/auth-config';

const useAuthentication = (customInterval?: number) => {
  const config = getCurrentConfig();
  const interval = customInterval || config.CHECK_INTERVAL;
  
  const { setUserInfo, setSessionModalOpen } = useStateStore((state) => state);
  const [isInitializing, setIsInitializing] = useState(true);
  
  useEffect(() => {
    let isMounted = true;
    
    const checkToken = async () => {
      const accessToken = getCookie('access_token');
      const isAuthenticated = getCookie('is_authenticated') === 'true';
      
      if (!accessToken || !isAuthenticated) {
        if (isMounted) {
          const { clearAuth } = useStateStore.getState();
          clearAuth();
          setSessionModalOpen(true);
        }
        return false;
      }
      
      try {
        const tokenParts = accessToken.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          const currentTime = Math.floor(Date.now() / 1000);
          const tokenExpiry = payload.exp;
          const timeUntilExpiry = tokenExpiry - currentTime;
          
        if (timeUntilExpiry < config.SESSION_MODAL_BUFFER) {
          if (isMounted) {
            const { clearAuth } = useStateStore.getState();
            clearAuth();
            setSessionModalOpen(true);
          }
          return false;
        }          if (payload) {
            const userInfo = {
              fullName: payload.firstName && payload.lastName ? 
                `${payload.firstName} ${payload.lastName}` : payload.username,
              username: payload.username,
              role: payload.role || null,
              firstName: payload.firstName,
              lastName: payload.lastName,
              userId: payload.userId,
              groups: Array.isArray(payload.groups) ? payload.groups : [],
              ...(payload.groupTitles && { groupTitles: payload.groupTitles }),
            };
            
            if (isMounted) {
              setUserInfo(userInfo);
              
              // Fetch group translations from auth_gate after setting user info
              // This is done asynchronously to not block authentication
              const { fetchGroupTranslations } = useStateStore.getState();
              fetchGroupTranslations().catch(error => {
                console.warn('Group translation fetch failed during authentication:', error);
              });
            }
          }
        }
      } catch (error) {
        console.error("Failed to parse token:", error);
        if (isMounted) {
          const { clearAuth } = useStateStore.getState();
          clearAuth();
          setSessionModalOpen(true);
        }
        return false;
      }
      
      return true;
    };
    
    const checkAuth = async () => {
      try {
        const hasValidTokens = await checkToken();
        if (!hasValidTokens) return;
        
        await initializeArcGIS().catch(err => {
          console.error("Failed to initialize ArcGIS:", err);
        });
        
        const isArcGISValid = isArcgisTokenValid();
        
        if (!isArcGISValid) {
          try {
            const arcgisAuthenticated = await authenticateArcGIS();
            
            if (!arcgisAuthenticated) {
              console.warn("Failed to authenticate with ArcGIS - portal session may have expired. Token will be refreshed on next map interaction.");
            }
          } catch (arcgisError) {
            console.warn("ArcGIS authentication failed:", arcgisError, "- continuing without ArcGIS token. Token will be refreshed on next map interaction.");
          }
        } else {
          try {
            await refreshArcGISTokenIfNeeded();
          } catch (refreshError) {
            console.warn("Failed to refresh ArcGIS token:", refreshError, "- token will be refreshed on next map interaction.");
          }
        }
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    };

    const initAuth = async () => {
      await checkAuth();
      const timer = setInterval(checkAuth, interval);
      return () => {
        clearInterval(timer);
        isMounted = false;
      };
    };
    
    initAuth();
    
    return () => {
      isMounted = false;
    };
  }, [interval, setUserInfo, setSessionModalOpen]);
  
  return { isInitializing };
};

export default useAuthentication;
