import { RoleDefinition, RoleId } from "./types";
import Imp from "./definition/Imp";
import Villager from "./definition/Villager";
// Trouble Brewing
import Washerwoman from "./definition/trouble-brewing/Washerwoman";
import Librarian from "./definition/trouble-brewing/Librarian";
import Investigator from "./definition/trouble-brewing/Investigator";
import Chef from "./definition/trouble-brewing/Chef";
import Empath from "./definition/trouble-brewing/Empath";
import Monk from "./definition/trouble-brewing/Monk";
import Soldier from "./definition/trouble-brewing/Soldier";
import FortuneTeller from "./definition/trouble-brewing/FortuneTeller";
import Undertaker from "./definition/trouble-brewing/Undertaker";
import Ravenkeeper from "./definition/trouble-brewing/Ravenkeeper";
import Virgin from "./definition/trouble-brewing/Virgin";

export const ROLES: Record<RoleId, RoleDefinition> = {
    imp: Imp,
    villager: Villager,
    washerwoman: Washerwoman,
    librarian: Librarian,
    investigator: Investigator,
    chef: Chef,
    empath: Empath,
    fortune_teller: FortuneTeller,
    undertaker: Undertaker,
    monk: Monk,
    ravenkeeper: Ravenkeeper,
    soldier: Soldier,
    virgin: Virgin,
};

// Scripts define which roles are in each edition
export type ScriptId = "trouble-brewing";

export const SCRIPTS: Record<ScriptId, { name: string; roles: RoleId[] }> = {
    "trouble-brewing": {
        name: "Trouble Brewing",
        roles: [
            "washerwoman",
            "librarian",
            "investigator",
            "chef",
            "empath",
            "fortune_teller",
            "undertaker",
            "monk",
            "ravenkeeper",
            "soldier",
            "virgin",
            "villager",
            "imp",
        ],
    },
};

// Get all roles sorted by night order (roles that wake at night)
export function getNightOrderRoles(): RoleDefinition[] {
    return Object.values(ROLES)
        .filter((role) => role.nightOrder !== null)
        .sort((a, b) => (a.nightOrder ?? 0) - (b.nightOrder ?? 0));
}

export function getRole(roleId: string): RoleDefinition | undefined {
    return ROLES[roleId as RoleId];
}

export function getAllRoles(): RoleDefinition[] {
    return Object.values(ROLES);
}

export * from "./types";
