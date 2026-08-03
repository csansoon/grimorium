import { getRoleEvilInfoModifier } from './roles/evilInfoMetadata'
import { GameState } from './types'
import type { EvilInfoModifier, RoleId } from './roles/types'
import { getCurrentRoleId, getCurrentTeam } from './identity'

export type ResolvedEvilInfoPlan = {
  demonLearnsMinions: boolean
  minionsLearnDemon: boolean
  minionsLearnOtherMinions: boolean
  demonLearnsBluffs: boolean
  reasonTags: string[]
}

const MIN_PLAYERS_FOR_STANDARD_EVIL_INFO = 7

function applyModifier(
  plan: ResolvedEvilInfoPlan,
  modifier: EvilInfoModifier,
  roleId: string,
): void {
  if (modifier.suppressDemonLearnsMinions) {
    plan.demonLearnsMinions = false
    plan.reasonTags.push(`role:${roleId}:suppress_demon_learns_minions`)
  }
  if (modifier.suppressMinionsLearnDemon) {
    plan.minionsLearnDemon = false
    plan.reasonTags.push(`role:${roleId}:suppress_minions_learn_demon`)
  }
  if (modifier.suppressMinionsLearnOtherMinions) {
    plan.minionsLearnOtherMinions = false
    plan.reasonTags.push(`role:${roleId}:suppress_minions_learn_other_minions`)
  }
  if (modifier.suppressDemonBluffs) {
    plan.demonLearnsBluffs = false
    plan.reasonTags.push(`role:${roleId}:suppress_demon_bluffs`)
  }
}

export function resolveEvilInfoPlan(
  state: Pick<GameState, 'players'>,
): ResolvedEvilInfoPlan {
  const plan: ResolvedEvilInfoPlan = {
    demonLearnsMinions: state.players.length >= MIN_PLAYERS_FOR_STANDARD_EVIL_INFO,
    minionsLearnDemon: state.players.length >= MIN_PLAYERS_FOR_STANDARD_EVIL_INFO,
    minionsLearnOtherMinions: true,
    demonLearnsBluffs: true,
    reasonTags: [],
  }

  if (state.players.length < MIN_PLAYERS_FOR_STANDARD_EVIL_INFO) {
    plan.reasonTags.push('global:under_seven_players')
  }

  const seenRoleIds = new Set<string>()
  for (const player of state.players) {
    const roleId = getCurrentRoleId(player) as RoleId
    const modifier = getRoleEvilInfoModifier(roleId)
    if (!modifier || seenRoleIds.has(roleId)) continue
    seenRoleIds.add(roleId)
    applyModifier(plan, modifier, roleId)
  }

  return plan
}

function countEvilTeams(state: Pick<GameState, 'players'>): {
  minionCount: number
  demonCount: number
} {
  let minionCount = 0
  let demonCount = 0

  for (const player of state.players) {
    const team = getCurrentTeam(player)
    if (team === 'demon') {
      demonCount += 1
      continue
    }
    if (team === 'minion') {
      minionCount += 1
    }
  }

  return { minionCount, demonCount }
}

export function shouldShowMinionEvilTeamStep(
  state: Pick<GameState, 'players'>,
  plan: ResolvedEvilInfoPlan,
): boolean {
  const { minionCount, demonCount } = countEvilTeams(state)
  return (
    (plan.minionsLearnOtherMinions && minionCount > 1) ||
    (plan.minionsLearnDemon && demonCount > 0)
  )
}

export function shouldShowDemonMinionStep(
  state: Pick<GameState, 'players'>,
  plan: ResolvedEvilInfoPlan,
): boolean {
  const { minionCount } = countEvilTeams(state)
  return plan.demonLearnsMinions && minionCount > 0
}

export function shouldShowDemonFirstNightInfo(
  state: Pick<GameState, 'players'>,
  plan: ResolvedEvilInfoPlan,
): boolean {
  return shouldShowDemonMinionStep(state, plan) || plan.demonLearnsBluffs
}
