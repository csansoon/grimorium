import { RoleId } from '../roles/types'
import {
  InteractionTag,
  ROLE_TEST_CONTRACTS,
  RoleTestContract,
} from './roleContracts'

export type PairwiseCase = {
  id: string
  roles: [RoleId, RoleId]
  tags: [InteractionTag, InteractionTag]
}

export type CuratedTriadCase = {
  id: string
  roles: [RoleId, RoleId, RoleId]
  note: string
}

const INTERACTION_RULES: Array<[InteractionTag, InteractionTag]> = [
  ['poison_source', 'info_reader'],
  ['protection_source', 'kill_source'],
  ['misregister', 'info_reader'],
  ['transformation_source', 'poison_source'],
  ['death_trigger', 'kill_source'],
  ['nomination_curse', 'day_public_trigger'],
  ['alignment_swap', 'kill_source'],
  ['drunk_source', 'info_reader'],
]

function hasTag(contract: RoleTestContract, tag: InteractionTag): boolean {
  return contract.interactionTags.includes(tag)
}

function pairId(
  left: RoleId,
  right: RoleId,
  tags: [InteractionTag, InteractionTag],
): string {
  return `${left}__${right}__${tags[0]}-${tags[1]}`
}

export function generatePairwiseRoleCases(mode: 'smoke' | 'full'): PairwiseCase[] {
  const contracts = Object.values(ROLE_TEST_CONTRACTS)
  const cases: PairwiseCase[] = []
  const seen = new Set<string>()

  for (const [leftTag, rightTag] of INTERACTION_RULES) {
    const leftRoles = contracts.filter((contract) => hasTag(contract, leftTag))
    const rightRoles = contracts.filter((contract) => hasTag(contract, rightTag))

    for (const leftRole of leftRoles) {
      for (const rightRole of rightRoles) {
        if (leftRole.roleId === rightRole.roleId) continue

        const sortedRoles = [leftRole.roleId, rightRole.roleId].sort() as [
          RoleId,
          RoleId,
        ]
        const id = pairId(sortedRoles[0], sortedRoles[1], [leftTag, rightTag])
        if (seen.has(id)) continue
        seen.add(id)
        cases.push({
          id,
          roles: sortedRoles,
          tags: [leftTag, rightTag],
        })
      }
    }
  }

  cases.sort((a, b) => a.id.localeCompare(b.id))
  if (mode === 'full') return cases
  return cases.slice(0, Math.min(18, cases.length))
}

export const CURATED_TRIAD_CASES: CuratedTriadCase[] = [
  {
    id: 'snake-charmer-demon-swap-chain',
    roles: ['snake_charmer', 'imp', 'scarlet_woman'],
    note: 'Role/alignment swap should keep kill sequence stable.',
  },
  {
    id: 'pit-hag-demon-creation-night-order',
    roles: ['pit_hag', 'vortox', 'imp'],
    note: 'New demon creation should preserve queue integrity.',
  },
  {
    id: 'fang-gu-outsider-jump-once',
    roles: ['fang_gu', 'sweetheart', 'klutz'],
    note: 'Outsider interaction and jump-once behavior.',
  },
  {
    id: 'sweetheart-immediate-drunk-before-info',
    roles: ['sweetheart', 'dreamer', 'imp'],
    note: 'Death-trigger drunk should affect later info.',
  },
  {
    id: 'scarlet-woman-successor-prevents-premature-win',
    roles: ['imp', 'scarlet_woman', 'slayer'],
    note: 'Demon death with successor should not end game immediately.',
  },
]

