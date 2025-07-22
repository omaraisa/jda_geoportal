import { restrictedPermissions } from "./permissions";

export function hasPermission(userRole: string, permission: string): boolean {
  const restricted = restrictedPermissions[permission];
  if (!restricted) return true;
  return restricted.includes(userRole);
}
