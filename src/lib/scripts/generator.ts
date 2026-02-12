import { RoleId } from '../roles/types'
import { TeamId } from '../teams/types'
import { getRole } from '../roles'
import {
  ScriptDefinition,
  RoleDistribution,
  GeneratedPool,
  GeneratorPreset,
} from './types'
import { getRecommendedDistribution, applyDistributionModifiers } from './index'

// ============================================================================
// POOL GENERATION
// ============================================================================

/**
 * Generates multiple valid role pools for a given script and player count.
 * Each pool satisfies the team distribution requirements (accounting for
 * distribution modifiers like Baron's +2 outsiders).
 */
export function generateRolePools(
  script: ScriptDefinition,
  playerCount: number,
  count: number = 30,
): GeneratedPool[] {
  const baseDistribution = getRecommendedDistribution(playerCount)
  if (!baseDistribution) return []

  const pools: GeneratedPool[] = []
  const seen = new Set<string>()
  const maxAttempts = count * 50

  for (let attempt = 0; attempt < maxAttempts && pools.length < count; attempt++) {
    const pool = tryGenerateValidPool(script, baseDistribution, playerCount)
    if (pool) {
      // Deduplicate by sorted role set
      const key = [...pool.roles].sort().join(',')
      if (!seen.has(key)) {
        seen.add(key)
        pools.push(pool)
      }
    }
  }

  return pools
}

/**
 * Given a set of generated pools, select 3 representative pools for
 * Simple, Interesting, and Chaotic presets.
 */
export function selectPresetPools(
  pools: GeneratedPool[],
): Record<GeneratorPreset, GeneratedPool> | null {
  if (pools.length < 3) return null

  const sorted = [...pools].sort((a, b) => a.totalChaos - b.totalChaos)

  return {
    simple: sorted[0],
    interesting: sorted[Math.floor(sorted.length / 2)],
    chaotic: sorted[sorted.length - 1],
  }
}

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

function tryGenerateValidPool(
  script: ScriptDefinition,
  baseDistribution: RoleDistribution,
  playerCount: number,
): GeneratedPool | null {
  // Group available roles by team
  const rolesByTeam: Record<TeamId, RoleId[]> = {
    townsfolk: [],
    outsider: [],
    minion: [],
    demon: [],
  }

  for (const roleId of script.roles) {
    const role = getRole(roleId)
    if (role) {
      rolesByTeam[role.team].push(roleId)
    }
  }

  // Step 1: Pick demon(s) first — always need exactly 1 demon
  const demons = pickRandom(rolesByTeam.demon, baseDistribution.demon)
  if (!demons) return null

  // Step 2: Pick minions
  const minions = pickRandom(rolesByTeam.minion, baseDistribution.minion)
  if (!minions) return null

  // Step 3: Apply distribution modifiers from selected demons + minions
  const selectedSoFar: RoleId[] = [...demons, ...minions]
  const modifiers = selectedSoFar.map(
    (roleId) => getRole(roleId)?.distributionModifier,
  )
  const adjustedDistribution = applyDistributionModifiers(
    baseDistribution,
    modifiers,
  )

  // Step 4: Pick outsiders with adjusted count
  const outsiders = pickRandom(rolesByTeam.outsider, adjustedDistribution.outsider)
  if (!outsiders) return null

  // Step 5: Fill townsfolk to reach player count
  const townsfolkNeeded =
    playerCount - demons.length - minions.length - outsiders.length
  if (townsfolkNeeded < 0) return null

  const townsfolk = pickRandom(rolesByTeam.townsfolk, townsfolkNeeded)
  if (!townsfolk) return null

  const roles: RoleId[] = [...townsfolk, ...outsiders, ...minions, ...demons]

  // Sanity check
  if (roles.length !== playerCount) return null

  // Compute chaos
  const totalChaos = roles.reduce((sum, roleId) => {
    const role = getRole(roleId)
    return sum + (role?.chaos ?? 0)
  }, 0)

  return {
    roles,
    totalChaos,
    distribution: {
      townsfolk: townsfolk.length,
      outsider: outsiders.length,
      minion: minions.length,
      demon: demons.length,
    },
  }
}

/**
 * Pick `count` unique random items from `available`.
 * Returns null if not enough items available.
 */
function pickRandom(available: RoleId[], count: number): RoleId[] | null {
  if (count === 0) return []
  if (available.length < count) return null

  const shuffled = [...available].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}
