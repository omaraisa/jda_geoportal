import { useEffect, useState } from "react";
import useStateStore from "@/stateStore";
import { initializeArcGIS, isArcgisTokenValid, authenticateArcGIS, refreshArcGISTokenIfNeeded } from '@/lib/authenticate-arcgis';
import { getCookie } from '@/lib/token';
import { getCurrentConfig } from '@/lib/auth-config';

const useAuthentication = (customInterval?: number) => {
  const config = getCurrentConfig();
  const interval = customInterval || config.CHECK_INTERVAL;
  
  const { setUserInfo, setSessionModalOpen, clearAuth } = useStateStore((state) => state);
  const [isInitializing, setIsInitializing] = useState(true);
  
  useEffect(() => {
    // Track if the component is still mounted
    let isMounted = true;
    
    const checkToken = async () => {
      // Check if we have an access token cookie
      const accessToken = getCookie('access_token');
      const isAuthenticated = getCookie('is_authenticated') === 'true';
      
      if (!accessToken || !isAuthenticated) {
        if (isMounted) {
          clearAuth();
          setSessionModalOpen(true);
        }
        return false;
      }
      
      try {
        // Parse the JWT token to get user info and check expiration
        const tokenParts = accessToken.split('.');
        if (tokenParts.length === 3) {
          // Base64 decode the payload
          const payload = JSON.parse(atob(tokenParts[1]));
          
          // Check if token is about to expire based on configured buffer
          const currentTime = Math.floor(Date.now() / 1000);
          const tokenExpiry = payload.exp;
          const timeUntilExpiry = tokenExpiry - currentTime;
          
          // If token expires within the configured buffer time, show session modal
          if (timeUntilExpiry < config.SESSION_MODAL_BUFFER) {
            console.log(`Token expires in ${timeUntilExpiry} seconds, showing session modal (buffer: ${config.SESSION_MODAL_BUFFER}s)`);
            if (isMounted) {
              clearAuth();
              setSessionModalOpen(true);
            }
            return false;
          }
          
          // Extract user data from token
          if (payload) {
            const userInfo = {
              fullName: payload.firstName && payload.lastName ? 
                `${payload.firstName} ${payload.lastName}` : payload.username,
              username: payload.username,
              role: payload.role || null,
              firstName: payload.firstName,
              lastName: payload.lastName,
              userId: payload.userId,
              groups: payload.groups || [],
            };
            
            if (isMounted) {
              setUserInfo(userInfo);
            }
          }
        }
      } catch (error) {
        console.error("Failed to parse token:", error);
        if (isMounted) {
          clearAuth();
          setSessionModalOpen(true);
        }
        return false;
      }
      
      return true;
    };
    
    const checkAuth = async () => {
      try {
        // Check access token validity first
        const hasValidTokens = await checkToken();
        if (!hasValidTokens) return;
        
        // Initialize ArcGIS only if we have a valid access token
        await initializeArcGIS().catch(err => {
          console.error("Failed to initialize ArcGIS:", err);
        });
        
        const isArcGISValid = isArcgisTokenValid();
        
        // Authenticate with ArcGIS if needed
        if (!isArcGISValid) {
          const arcgisAuthenticated = await authenticateArcGIS();
          
          if (!arcgisAuthenticated) {
            console.error("Failed to authenticate with ArcGIS");
            return;
          }
        } else {
          await refreshArcGISTokenIfNeeded();
        }
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    };

    const initAuth = async () => {
      await checkAuth();
      
      // Set up periodic check with the specified interval
      const timer = setInterval(checkAuth, interval);
      return () => {
        clearInterval(timer);
        isMounted = false;
      };
    };
    
    // Initialize authentication
    initAuth();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [interval, setUserInfo, setSessionModalOpen, clearAuth]);
  
  return { isInitializing };
};

export default useAuthentication;
