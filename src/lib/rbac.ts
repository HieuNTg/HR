import { UserRole } from "@/generated/prisma";
import type { Session } from "next-auth";

export type Permission =
  | "manage:jobs"
  | "view:jobs"
  | "manage:candidates"
  | "view:candidates"
  | "manage:interviews"
  | "view:interviews"
  | "view:reports"
  | "manage:users"
  | "view:own-profile"
  | "participate:interview";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: [
    "manage:jobs",
    "view:jobs",
    "manage:candidates",
    "view:candidates",
    "manage:interviews",
    "view:interviews",
    "view:reports",
    "manage:users",
    "view:own-profile",
    "participate:interview",
  ],
  RECRUITER: [
    "manage:jobs",
    "view:jobs",
    "view:candidates",
    "manage:interviews",
    "view:interviews",
    "view:reports",
    "view:own-profile",
  ],
  CANDIDATE: [
    "view:own-profile",
    "participate:interview",
    "view:jobs",
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function requireRole(
  session: Session | null,
  ...roles: UserRole[]
): void {
  if (!session?.user) {
    throw new Error("Unauthorized: not authenticated");
  }
  const userRole = (session.user as { role?: UserRole }).role;
  if (!userRole || !roles.includes(userRole)) {
    throw new Error(
      `Forbidden: requires one of [${roles.join(", ")}], got ${userRole}`
    );
  }
}

export function requirePermission(
  session: Session | null,
  permission: Permission
): void {
  if (!session?.user) {
    throw new Error("Unauthorized: not authenticated");
  }
  const userRole = (session.user as { role?: UserRole }).role;
  if (!userRole || !hasPermission(userRole, permission)) {
    throw new Error(`Forbidden: missing permission ${permission}`);
  }
}
