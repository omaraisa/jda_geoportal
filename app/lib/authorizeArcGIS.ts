import { portal_usertype_groups } from "@/lib/globalConstants";
import { ArcGISUserInfo } from "@/interface";

export async function setAuthorizationLevel(userInfo: ArcGISUserInfo) {
  let matchedTypes: string[] = [];
  if (userInfo?.groups && Array.isArray(userInfo.groups)) {
    for (const group of userInfo.groups) {
      if (group?.title && portal_usertype_groups[group.title]) {
        matchedTypes.push(portal_usertype_groups[group.title]);
      }
    }
  }
  let userType: string = "viewer";
  if (matchedTypes.length > 0) {
    // Define privilege order explicitly from lowest to highest privilege
    const privilegeOrder = Object.values(portal_usertype_groups).filter(
      (value, index, self) => self.indexOf(value) === index
    );
    userType = matchedTypes.sort(
      (a, b) => privilegeOrder.indexOf(b) - privilegeOrder.indexOf(a)
    )[0];
  }

  return userType;
}

export default setAuthorizationLevel;
