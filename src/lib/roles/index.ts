import { RoleDefinition } from "./types";
import Imp from "./definition/imp";
import Villager from "./definition/villager";

export const ROLES: Record<string, RoleDefinition> = {
    imp: Imp,
    villager: Villager,
};

// Get all roles sorted by night order (roles that wake at night)
export function getNightOrderRoles(): RoleDefinition[] {
    return Object.values(ROLES)
        .filter((role) => role.nightOrder !== null)
        .sort((a, b) => (a.nightOrder ?? 0) - (b.nightOrder ?? 0));
}

export function getRole(roleId: string): RoleDefinition | undefined {
    return ROLES[roleId];
}

export function getAllRoles(): RoleDefinition[] {
    return Object.values(ROLES);
}

export * from "./types";
