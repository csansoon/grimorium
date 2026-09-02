import type { RoleId } from '../roles/types'

export type InteractionTag =
  | 'info_reader'
  | 'misregister'
  | 'poison_source'
  | 'protection_source'
  | 'kill_source'
  | 'transformation_source'
  | 'death_trigger'
  | 'nomination_curse'
  | 'day_public_trigger'
  | 'alignment_swap'
  | 'drunk_source'
  | 'reactive_demon_successor'

export type RoleTestContract = {
  roleId: RoleId
  oncePerGame?: boolean
  allowsSelfTarget?: boolean
  requiresAliveToAct?: boolean
  interactionTags: InteractionTag[]
}

const CONTRACTS: Record<RoleId, Omit<RoleTestContract, 'roleId'>> = {
  villager: { interactionTags: [] },
  imp: {
    requiresAliveToAct: true,
    interactionTags: ['kill_source'],
  },
  washerwoman: {
    requiresAliveToAct: true,
    interactionTags: ['info_reader'],
  },
  librarian: {
    requiresAliveToAct: true,
    interactionTags: ['info_reader'],
  },
  investigator: {
    requiresAliveToAct: true,
    interactionTags: ['info_reader'],
  },
  chef: {
    requiresAliveToAct: true,
    interactionTags: ['info_reader'],
  },
  empath: {
    requiresAliveToAct: true,
    interactionTags: ['info_reader'],
  },
  fortune_teller: {
    requiresAliveToAct: true,
    interactionTags: ['info_reader'],
  },
  undertaker: {
    requiresAliveToAct: true,
    interactionTags: ['info_reader'],
  },
  monk: {
    requiresAliveToAct: true,
    interactionTags: ['protection_source'],
  },
  ravenkeeper: {
    requiresAliveToAct: false,
    interactionTags: ['info_reader', 'death_trigger'],
  },
  soldier: { interactionTags: ['protection_source'] },
  virgin: { interactionTags: ['day_public_trigger'] },
  slayer: {
    oncePerGame: true,
    requiresAliveToAct: true,
    interactionTags: ['kill_source', 'day_public_trigger'],
  },
  mayor: { interactionTags: ['day_public_trigger'] },
  saint: { interactionTags: ['day_public_trigger'] },
  scarlet_woman: { interactionTags: ['reactive_demon_successor'] },
  recluse: { interactionTags: ['misregister'] },
  poisoner: {
    requiresAliveToAct: true,
    interactionTags: ['poison_source'],
  },
  drunk: { interactionTags: ['misregister'] },
  butler: {
    requiresAliveToAct: true,
    interactionTags: ['day_public_trigger'],
  },
  baron: { interactionTags: [] },
  spy: {
    requiresAliveToAct: true,
    interactionTags: ['misregister'],
  },
  sweetheart: { interactionTags: ['death_trigger', 'drunk_source'] },
  sage: { interactionTags: ['death_trigger', 'info_reader'] },
  klutz: { interactionTags: ['death_trigger', 'day_public_trigger'] },
  mutant: { interactionTags: ['day_public_trigger'] },
  barber: { interactionTags: ['death_trigger', 'transformation_source'] },
  clockmaker: {
    requiresAliveToAct: true,
    interactionTags: ['info_reader'],
  },
  oracle: {
    requiresAliveToAct: true,
    interactionTags: ['info_reader'],
  },
  seamstress: {
    oncePerGame: true,
    allowsSelfTarget: false,
    requiresAliveToAct: true,
    interactionTags: ['info_reader'],
  },
  flowergirl: {
    requiresAliveToAct: true,
    interactionTags: ['info_reader'],
  },
  town_crier: {
    requiresAliveToAct: true,
    interactionTags: ['info_reader'],
  },
  mathematician: {
    requiresAliveToAct: true,
    interactionTags: ['info_reader'],
  },
  dreamer: {
    allowsSelfTarget: false,
    requiresAliveToAct: true,
    interactionTags: ['info_reader'],
  },
  snake_charmer: {
    allowsSelfTarget: false,
    requiresAliveToAct: true,
    interactionTags: ['alignment_swap', 'transformation_source'],
  },
  savant: {
    requiresAliveToAct: true,
    interactionTags: ['info_reader'],
  },
  philosopher: {
    oncePerGame: true,
    requiresAliveToAct: true,
    interactionTags: ['transformation_source', 'drunk_source'],
  },
  artist: {
    oncePerGame: true,
    requiresAliveToAct: true,
    interactionTags: ['day_public_trigger'],
  },
  evil_twin: { interactionTags: ['day_public_trigger'] },
  witch: {
    requiresAliveToAct: true,
    interactionTags: ['nomination_curse'],
  },
  cerenovus: {
    requiresAliveToAct: true,
    interactionTags: ['day_public_trigger'],
  },
  pit_hag: {
    requiresAliveToAct: true,
    interactionTags: ['transformation_source'],
  },
  fang_gu: {
    requiresAliveToAct: true,
    interactionTags: ['kill_source', 'transformation_source'],
  },
  vigormortis: {
    requiresAliveToAct: true,
    interactionTags: ['kill_source', 'poison_source'],
  },
  no_dashii: {
    requiresAliveToAct: true,
    interactionTags: ['kill_source', 'poison_source'],
  },
  vortox: {
    requiresAliveToAct: true,
    interactionTags: ['kill_source', 'misregister', 'day_public_trigger'],
  },
}

export const ROLE_TEST_CONTRACTS: Record<RoleId, RoleTestContract> = (() =>
  Object.fromEntries(
    (Object.keys(CONTRACTS) as RoleId[]).map((roleId) => [
      roleId,
      { roleId, ...CONTRACTS[roleId] },
    ]),
  ) as Record<RoleId, RoleTestContract>)()

export function getRoleTestContract(roleId: RoleId): RoleTestContract {
  return ROLE_TEST_CONTRACTS[roleId]
}
