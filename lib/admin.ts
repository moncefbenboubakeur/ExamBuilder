// Admin authorization helper
// Only monceftab@gmail.com has admin access

const ADMIN_EMAIL = 'monceftab@gmail.com';

export function isAdmin(userEmail: string | undefined | null): boolean {
  return userEmail === ADMIN_EMAIL;
}

export function requireAdmin(userEmail: string | undefined | null): void {
  if (!isAdmin(userEmail)) {
    throw new Error('Unauthorized: Admin access required');
  }
}
