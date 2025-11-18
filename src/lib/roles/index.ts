import { RoleDefinition } from "./types";

import Imp from "./definition/imp";
import Villager from "./definition/villager";

export enum Role {
    Imp,
    Villager,
}

// Note: this enum defines the role order in the game!
export const ROLES: Record<Role, RoleDefinition> = {
    [Role.Imp]: Imp,
    [Role.Villager]: Villager,
};
