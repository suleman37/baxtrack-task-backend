export const USER_ROLES = ['super_admin', 'admin', 'user'] as const;

export const CREATABLE_USER_ROLES = ['admin', 'user'] as const;

export type UserRole = (typeof USER_ROLES)[number];
export type CreatableUserRole = (typeof CREATABLE_USER_ROLES)[number];

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && USER_ROLES.includes(value as UserRole);
}

export function isCreatableUserRole(
  value: unknown,
): value is CreatableUserRole {
  return (
    typeof value === 'string' &&
    CREATABLE_USER_ROLES.includes(value as CreatableUserRole)
  );
}
