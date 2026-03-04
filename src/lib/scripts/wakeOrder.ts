import { RoleId, RoleDefinition } from '../roles/types'
import { ScriptWakeEntry, ScriptWakeOrder } from './types'

type WakePhase = 'firstNight' | 'otherNights'

type WakeBucket =
  | 'disruption'
  | 'setup_info'
  | 'protection'
  | 'manipulation'
  | 'reactive'
  | 'kill_resolution'
  | 'death_reaction'
  | 'ongoing_info'
  | 'aftermath_info'
  | 'utility'
  | 'grimoire'

type WakeHierarchyEntry = {
  bucket: WakeBucket
  priority: number
}

type RoleWakeHierarchy = Partial<Record<WakePhase, WakeHierarchyEntry>>

const PHASE_BUCKET_ORDER: Record<WakePhase, Partial<Record<WakeBucket, number>>> = {
  firstNight: {
    disruption: 10,
    setup_info: 20,
    ongoing_info: 30,
    utility: 40,
    grimoire: 50,
  },
  otherNights: {
    disruption: 10,
    protection: 20,
    manipulation: 30,
    reactive: 40,
    // Clocktower resolves poison, then protection, then the kill,
    // and only then ongoing information roles.
    kill_resolution: 50,
    death_reaction: 60,
    ongoing_info: 70,
    aftermath_info: 80,
    utility: 90,
    grimoire: 100,
  },
}

function createWakePosition(
  phase: WakePhase,
  entry?: WakeHierarchyEntry,
): number | null {
  if (!entry) return null

  const bucketBase = PHASE_BUCKET_ORDER[phase][entry.bucket]
  if (bucketBase == null) return null

  return bucketBase * 100 + entry.priority
}

const ROLE_WAKE_HIERARCHY: Record<RoleId, RoleWakeHierarchy> = {
  villager: {},
  imp: {
    otherNights: { bucket: 'kill_resolution', priority: 1 },
  },
  washerwoman: {
    firstNight: { bucket: 'setup_info', priority: 1 },
  },
  librarian: {
    firstNight: { bucket: 'setup_info', priority: 2 },
  },
  investigator: {
    firstNight: { bucket: 'setup_info', priority: 3 },
  },
  chef: {
    firstNight: { bucket: 'setup_info', priority: 4 },
  },
  empath: {
    firstNight: { bucket: 'ongoing_info', priority: 1 },
    otherNights: { bucket: 'ongoing_info', priority: 1 },
  },
  fortune_teller: {
    firstNight: { bucket: 'ongoing_info', priority: 2 },
    otherNights: { bucket: 'ongoing_info', priority: 2 },
  },
  undertaker: {
    otherNights: { bucket: 'aftermath_info', priority: 1 },
  },
  monk: {
    otherNights: { bucket: 'protection', priority: 1 },
  },
  ravenkeeper: {
    otherNights: { bucket: 'death_reaction', priority: 1 },
  },
  soldier: {},
  virgin: {},
  slayer: {},
  mayor: {},
  saint: {},
  scarlet_woman: {},
  recluse: {},
  poisoner: {
    firstNight: { bucket: 'disruption', priority: 1 },
    otherNights: { bucket: 'disruption', priority: 1 },
  },
  drunk: {},
  butler: {
    firstNight: { bucket: 'utility', priority: 1 },
    otherNights: { bucket: 'utility', priority: 1 },
  },
  baron: {},
  spy: {
    firstNight: { bucket: 'grimoire', priority: 1 },
    otherNights: { bucket: 'grimoire', priority: 1 },
  },
  sweetheart: {},
  sage: {},
  klutz: {},
  mutant: {},
  barber: {},
  clockmaker: {
    firstNight: { bucket: 'setup_info', priority: 5 },
  },
  oracle: {
    otherNights: { bucket: 'ongoing_info', priority: 3 },
  },
  seamstress: {
    firstNight: { bucket: 'ongoing_info', priority: 3 },
    otherNights: { bucket: 'ongoing_info', priority: 4 },
  },
  flowergirl: {
    otherNights: { bucket: 'ongoing_info', priority: 5 },
  },
  town_crier: {
    otherNights: { bucket: 'ongoing_info', priority: 6 },
  },
  mathematician: {
    firstNight: { bucket: 'ongoing_info', priority: 4 },
    otherNights: { bucket: 'ongoing_info', priority: 3 },
  },
  dreamer: {
    firstNight: { bucket: 'ongoing_info', priority: 5 },
    otherNights: { bucket: 'ongoing_info', priority: 4 },
  },
  snake_charmer: {
    firstNight: { bucket: 'manipulation', priority: 1 },
    otherNights: { bucket: 'manipulation', priority: 1 },
  },
  savant: {},
  philosopher: {
    firstNight: { bucket: 'manipulation', priority: 2 },
    otherNights: { bucket: 'manipulation', priority: 2 },
  },
  artist: {},
  evil_twin: {},
  witch: {
    firstNight: { bucket: 'manipulation', priority: 3 },
    otherNights: { bucket: 'manipulation', priority: 3 },
  },
  cerenovus: {
    firstNight: { bucket: 'manipulation', priority: 4 },
    otherNights: { bucket: 'manipulation', priority: 4 },
  },
  pit_hag: {
    firstNight: { bucket: 'manipulation', priority: 5 },
    otherNights: { bucket: 'manipulation', priority: 5 },
  },
  fang_gu: {
    otherNights: { bucket: 'kill_resolution', priority: 1 },
  },
  vigormortis: {
    otherNights: { bucket: 'kill_resolution', priority: 2 },
  },
  no_dashii: {
    otherNights: { bucket: 'kill_resolution', priority: 3 },
  },
  vortox: {
    otherNights: { bucket: 'kill_resolution', priority: 4 },
  },
}

export const ROLE_CANONICAL_WAKE_ORDER: Record<
  RoleId,
  { firstNight: number | null; otherNights: number | null }
> = Object.fromEntries(
  (Object.keys(ROLE_WAKE_HIERARCHY) as RoleId[]).map((roleId) => [
    roleId,
    {
      firstNight: createWakePosition(
        'firstNight',
        ROLE_WAKE_HIERARCHY[roleId].firstNight,
      ),
      otherNights: createWakePosition(
        'otherNights',
        ROLE_WAKE_HIERARCHY[roleId].otherNights,
      ),
    },
  ]),
) as Record<RoleId, { firstNight: number | null; otherNights: number | null }>

const ROLE_REACTIVE_WAKE_ORDER: Partial<
  Record<
    RoleId,
    Partial<
      Record<
        'firstNight' | 'otherNights',
        { order: number; note: string }
      >
    >
  >
> = {
  scarlet_woman: {
    otherNights: {
      order: createWakePosition('otherNights', {
        bucket: 'reactive',
        priority: 1,
      })!,
      note: 'Conditional: only if the Demon dies and 5+ players are alive.',
    },
  },
}

const HIDDEN_RUNTIME_WAKE_ORDER: Partial<
  Record<
    RoleId,
    Partial<
      Record<
        'firstNight' | 'otherNights',
        { order: number; note?: string }
      >
    >
  >
> = {}

export function applyCanonicalWakeOrder(
  role: RoleDefinition,
): RoleDefinition {
  return {
    ...role,
    canonicalWakeOrder: ROLE_CANONICAL_WAKE_ORDER[role.id],
  }
}

export function deriveWakeOrderFromRoles(
  roles: Pick<RoleDefinition, 'id' | 'canonicalWakeOrder'>[],
): ScriptWakeOrder {
  const uniqueRoles = Array.from(
    new Map(roles.map((role) => [role.id, role])).values(),
  )

  const sortForPhase = (phase: 'firstNight' | 'otherNights'): ScriptWakeEntry[] => {
    const activeEntries = uniqueRoles
      .filter((role) => role.canonicalWakeOrder?.[phase] != null)
      .map((role) => ({
        roleId: role.id,
        order: role.canonicalWakeOrder?.[phase] ?? Number.MAX_SAFE_INTEGER,
        mode: 'active' as const,
      }))

    const reactiveEntries = uniqueRoles
      .filter((role) => ROLE_REACTIVE_WAKE_ORDER[role.id]?.[phase] != null)
      .map((role) => ({
        roleId: role.id,
        order: ROLE_REACTIVE_WAKE_ORDER[role.id]![phase]!.order,
        mode: 'reactive' as const,
        note: ROLE_REACTIVE_WAKE_ORDER[role.id]![phase]!.note,
      }))

    const hiddenEntries = uniqueRoles
      .filter((role) => HIDDEN_RUNTIME_WAKE_ORDER[role.id]?.[phase] != null)
      .map((role) => ({
        roleId: role.id,
        order: HIDDEN_RUNTIME_WAKE_ORDER[role.id]![phase]!.order,
        mode: 'active' as const,
        note: HIDDEN_RUNTIME_WAKE_ORDER[role.id]![phase]!.note,
        hidden: true as const,
      }))

    return [...hiddenEntries, ...activeEntries, ...reactiveEntries]
      .sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order
        return a.roleId.localeCompare(b.roleId)
      })
      .map((entry) => ({
        roleId: entry.roleId,
        mode: entry.mode,
        note: 'note' in entry ? entry.note : undefined,
        hidden: 'hidden' in entry && entry.hidden === true ? true : undefined,
      }))
  }

  return {
    firstNight: sortForPhase('firstNight'),
    otherNights: sortForPhase('otherNights'),
  }
}

export function deriveWakeOrderFromRoleIds(roleIds: RoleId[]): ScriptWakeOrder {
  const uniqueRoleIds = Array.from(new Set(roleIds))

  const sortForPhase = (phase: 'firstNight' | 'otherNights'): ScriptWakeEntry[] => {
    const activeEntries = uniqueRoleIds
      .filter((roleId) => ROLE_CANONICAL_WAKE_ORDER[roleId][phase] != null)
      .map((roleId) => ({
        roleId,
        order:
          ROLE_CANONICAL_WAKE_ORDER[roleId][phase] ?? Number.MAX_SAFE_INTEGER,
        mode: 'active' as const,
      }))

    const reactiveEntries = uniqueRoleIds
      .filter((roleId) => ROLE_REACTIVE_WAKE_ORDER[roleId]?.[phase] != null)
      .map((roleId) => ({
        roleId,
        order: ROLE_REACTIVE_WAKE_ORDER[roleId]![phase]!.order,
        mode: 'reactive' as const,
        note: ROLE_REACTIVE_WAKE_ORDER[roleId]![phase]!.note,
      }))

    const hiddenEntries = uniqueRoleIds
      .filter((roleId) => HIDDEN_RUNTIME_WAKE_ORDER[roleId]?.[phase] != null)
      .map((roleId) => ({
        roleId,
        order: HIDDEN_RUNTIME_WAKE_ORDER[roleId]![phase]!.order,
        mode: 'active' as const,
        note: HIDDEN_RUNTIME_WAKE_ORDER[roleId]![phase]!.note,
        hidden: true as const,
      }))

    return [...hiddenEntries, ...activeEntries, ...reactiveEntries]
      .sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order
        return a.roleId.localeCompare(b.roleId)
      })
      .map((entry) => ({
        roleId: entry.roleId,
        mode: entry.mode,
        note: 'note' in entry ? entry.note : undefined,
        hidden: 'hidden' in entry && entry.hidden === true ? true : undefined,
      }))
  }

  return {
    firstNight: sortForPhase('firstNight'),
    otherNights: sortForPhase('otherNights'),
  }
}

export function getRuntimeWakeRoleIds(entries: ScriptWakeEntry[]): RoleId[] {
  return entries
    .filter((entry) => (entry.mode ?? 'active') === 'active')
    .map((entry) => entry.roleId)
}

export function getVisibleWakeEntries(entries: ScriptWakeEntry[]): ScriptWakeEntry[] {
  return entries.filter((entry) => !entry.hidden)
}
