export enum SharePermission {
  READ = 'read',
  WRITE = 'write',
  EXECUTE = 'execute',
  MANAGE = 'manage',
}

export enum ShareStatus {
  ACTIVE = 'active',
  REVOKED = 'revoked',
  EXPIRED = 'expired',
  PENDING = 'pending',
}

export const SHARE_PERMISSION_DESCRIPTIONS = {
  [SharePermission.READ]: 'View credential details (without sensitive data)',
  [SharePermission.WRITE]: 'Modify credential properties and settings',
  [SharePermission.EXECUTE]: 'Use credential in workflow executions',
  [SharePermission.MANAGE]: 'Full control including sharing and deletion',
};

export const SHARE_STATUS_DESCRIPTIONS = {
  [ShareStatus.ACTIVE]: 'Share is currently active and valid',
  [ShareStatus.REVOKED]: 'Share has been manually revoked',
  [ShareStatus.EXPIRED]: 'Share has expired based on expiration date',
  [ShareStatus.PENDING]: 'Share is pending acceptance by recipient',
};

export const PERMISSION_HIERARCHY = {
  [SharePermission.READ]: 1,
  [SharePermission.EXECUTE]: 2,
  [SharePermission.WRITE]: 3,
  [SharePermission.MANAGE]: 4,
};

// Helper functions
export function getPermissionLevel(permission: SharePermission): number {
  return PERMISSION_HIERARCHY[permission] || 0;
}

export function hasRequiredPermission(
  userPermissions: SharePermission[],
  requiredPermission: SharePermission,
): boolean {
  const requiredLevel = getPermissionLevel(requiredPermission);
  return userPermissions.some(
    permission => getPermissionLevel(permission) >= requiredLevel
  );
}

export function getHighestPermission(permissions: SharePermission[]): SharePermission | null {
  if (!permissions.length) return null;
  
  let highest = permissions[0];
  let highestLevel = getPermissionLevel(highest);
  
  for (const permission of permissions) {
    const level = getPermissionLevel(permission);
    if (level > highestLevel) {
      highest = permission;
      highestLevel = level;
    }
  }
  
  return highest;
}

export function getAllowedPermissions(currentPermissions: SharePermission[]): SharePermission[] {
  const highestLevel = getHighestPermission(currentPermissions);
  if (!highestLevel) return [];
  
  const maxLevel = getPermissionLevel(highestLevel);
  
  return Object.values(SharePermission).filter(
    permission => getPermissionLevel(permission) <= maxLevel
  );
}
