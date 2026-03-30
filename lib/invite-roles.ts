import { Role } from "@prisma/client";

const ROLE_RANK: Record<Role, number> = {
  INTERN: 0, USER: 1, MODERATOR: 2, ADMIN: 3, SUPERADMIN: 4,
};

/** Roles an ADMIN or SUPERADMIN may assign when sending an invitation. */
export function getInviteAssignableRoles(actorRole: Role): Role[] {
  const all: Role[] = [
    Role.INTERN,
    Role.USER,
    Role.MODERATOR,
    Role.ADMIN,
    Role.SUPERADMIN,
  ];
  if (actorRole === Role.SUPERADMIN) return all;
  if (actorRole === Role.ADMIN) {
    return all.filter((r) => ROLE_RANK[r] < ROLE_RANK[Role.ADMIN]);
  }
  return [];
}
