export const UserRole = {
  USER: 'user',
  CREATOR: 'creator',
  ADMIN: 'admin',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const UserStatus = {
  ACTIVE: 'active',
  WARNING: 'warning',
  SUSPENDED: 'suspended',
  BANNED: 'banned',
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];
