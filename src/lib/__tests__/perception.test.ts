import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  perceive,
  canRegisterAsTeam,
  canRegisterAsAlignment,
  getAmbiguousPlayers,
  applyPerceptionOverrides,
} from '../pipeline/perception'
import {
  makePlayer,
  makeState,
  addEffectTo,
  resetPlayerCounter,
} from './helpers'
import { PerceptionModifier, Perception } from '../pipeline/types'
import { EffectDefinition, EffectId } from '../effects/types'

// We need to mock getEffect to inject test perception modifiers
// since we can't register arbitrary effects in the real registry.
vi.mock('../effects', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>
  return {
    ...actual,
    getEffect: (effectId: string) => {
      // Check test registry first
      if (testEffectRegistry[effectId]) {
        return testEffectRegistry[effectId]
      }
      // Fall back to real registry
      return (actual.getEffect as (id: string) => EffectDefinition | undefined)(
        effectId,
      )
    },
  }
})

// Test effect registry for injecting mock effects
const testEffectRegistry: Record<string, EffectDefinition> = {}

function registerTestEffect(def: EffectDefinition) {
  testEffectRegistry[def.id] = def
}

function clearTestEffects() {
  for (const key of Object.keys(testEffectRegistry)) {
    delete testEffectRegistry[key]
  }
}

beforeEach(() => {
  resetPlayerCounter()
  clearTestEffects()
})

// ============================================================================
// BASE PERCEPTION (no modifiers)
// ============================================================================

describe('base perception', () => {
  it('perceives townsfolk as good', () => {
    const target = makePlayer({ id: 'p1', roleId: 'washerwoman' })
    const observer = makePlayer({ id: 'p2', roleId: 'chef' })
    const state = makeState({ players: [target, observer] })

    const result = perceive(target, observer, 'alignment', state)
    expect(result.alignment).toBe('good')
    expect(result.team).toBe('townsfolk')
    expect(result.roleId).toBe('washerwoman')
  })

  it('perceives demon as evil', () => {
    const target = makePlayer({ id: 'p1', roleId: 'imp' })
    const observer = makePlayer({ id: 'p2', roleId: 'chef' })
    const state = makeState({ players: [target, observer] })

    const result = perceive(target, observer, 'alignment', state)
    expect(result.alignment).toBe('evil')
    expect(result.team).toBe('demon')
    expect(result.roleId).toBe('imp')
  })

  it('perceives outsider as good', () => {
    const target = makePlayer({ id: 'p1', roleId: 'saint' })
    const observer = makePlayer({ id: 'p2', roleId: 'chef' })
    const state = makeState({ players: [target, observer] })

    const result = perceive(target, observer, 'alignment', state)
    expect(result.alignment).toBe('good')
    expect(result.team).toBe('outsider')
  })

  it('returns base perception for player with no effects', () => {
    const target = makePlayer({ id: 'p1', roleId: 'villager' })
    const observer = makePlayer({ id: 'p2', roleId: 'empath' })
    const state = makeState({ players: [target, observer] })

    const result = perceive(target, observer, 'team', state)
    expect(result.team).toBe('townsfolk')
    expect(result.alignment).toBe('good')
    expect(result.roleId).toBe('villager')
  })

  it('returns base perception for player with effects that have no modifiers', () => {
    const target = addEffectTo(
      makePlayer({ id: 'p1', roleId: 'soldier' }),
      'safe',
    )
    const observer = makePlayer({ id: 'p2', roleId: 'empath' })
    const state = makeState({ players: [target, observer] })

    const result = perceive(target, observer, 'alignment', state)
    expect(result.alignment).toBe('good')
    expect(result.team).toBe('townsfolk')
  })
})

// ============================================================================
// PERCEPTION MODIFIERS
// ============================================================================

describe('perception modifiers', () => {
  it('applies modifier that changes alignment to evil', () => {
    const evilModifier: PerceptionModifier = {
      context: 'alignment',
      modify: (perception) => ({
        ...perception,
        alignment: 'evil',
      }),
    }

    registerTestEffect({
      id: 'misregister' as EffectId,
      icon: 'user',
      perceptionModifiers: [evilModifier],
    })

    const target = addEffectTo(
      makePlayer({ id: 'p1', roleId: 'saint' }),
      'misregister',
    )
    const observer = makePlayer({ id: 'p2', roleId: 'chef' })
    const state = makeState({ players: [target, observer] })

    const result = perceive(target, observer, 'alignment', state)
    expect(result.alignment).toBe('evil')
    // Team and role should be unchanged
    expect(result.team).toBe('outsider')
    expect(result.roleId).toBe('saint')
  })

  it("modifier with context 'alignment' does NOT fire for 'team' queries", () => {
    const alignmentModifier: PerceptionModifier = {
      context: 'alignment',
      modify: (perception) => ({
        ...perception,
        alignment: 'evil',
        team: 'demon', // This should NOT apply for team queries
      }),
    }

    registerTestEffect({
      id: 'misregister' as EffectId,
      icon: 'user',
      perceptionModifiers: [alignmentModifier],
    })

    const target = addEffectTo(
      makePlayer({ id: 'p1', roleId: 'saint' }),
      'misregister',
    )
    const observer = makePlayer({ id: 'p2', roleId: 'washerwoman' })
    const state = makeState({ players: [target, observer] })

    const result = perceive(target, observer, 'team', state)
    // Should still be outsider because modifier only applies to "alignment" context
    expect(result.team).toBe('outsider')
    expect(result.alignment).toBe('good')
  })

  it('modifier with context array fires for all listed contexts', () => {
    const broadModifier: PerceptionModifier = {
      context: ['alignment', 'team'],
      modify: (perception) => ({
        ...perception,
        alignment: 'evil',
        team: 'minion',
      }),
    }

    registerTestEffect({
      id: 'misregister' as EffectId,
      icon: 'user',
      perceptionModifiers: [broadModifier],
    })

    const target = addEffectTo(
      makePlayer({ id: 'p1', roleId: 'saint' }),
      'misregister',
    )
    const observer = makePlayer({ id: 'p2', roleId: 'chef' })
    const state = makeState({ players: [target, observer] })

    // Should fire for alignment
    const alignResult = perceive(target, observer, 'alignment', state)
    expect(alignResult.alignment).toBe('evil')

    // Should fire for team
    const teamResult = perceive(target, observer, 'team', state)
    expect(teamResult.team).toBe('minion')

    // Should NOT fire for role
    const roleResult = perceive(target, observer, 'role', state)
    expect(roleResult.team).toBe('outsider') // Unchanged
  })

  it('modifier with observerRoles only fires for matching observer', () => {
    const chefOnlyModifier: PerceptionModifier = {
      context: 'alignment',
      observerRoles: ['chef'],
      modify: (perception) => ({
        ...perception,
        alignment: 'evil',
      }),
    }

    registerTestEffect({
      id: 'misregister' as EffectId,
      icon: 'user',
      perceptionModifiers: [chefOnlyModifier],
    })

    const target = addEffectTo(
      makePlayer({ id: 'p1', roleId: 'saint' }),
      'misregister',
    )
    const chef = makePlayer({ id: 'p2', roleId: 'chef' })
    const empath = makePlayer({ id: 'p3', roleId: 'empath' })
    const state = makeState({ players: [target, chef, empath] })

    // Should fire for Chef
    const chefResult = perceive(target, chef, 'alignment', state)
    expect(chefResult.alignment).toBe('evil')

    // Should NOT fire for Empath
    const empathResult = perceive(target, empath, 'alignment', state)
    expect(empathResult.alignment).toBe('good')
  })

  it('multiple modifiers stack (second receives already-modified perception)', () => {
    const firstModifier: PerceptionModifier = {
      context: 'role',
      modify: (perception) => ({
        ...perception,
        team: 'minion',
      }),
    }

    const secondModifier: PerceptionModifier = {
      context: 'role',
      modify: (perception) => ({
        ...perception,
        // This should see team as "minion" from the first modifier
        alignment: perception.team === 'minion' ? 'evil' : perception.alignment,
      }),
    }

    registerTestEffect({
      id: 'misregister' as EffectId,
      icon: 'user',
      perceptionModifiers: [firstModifier, secondModifier],
    })

    const target = addEffectTo(
      makePlayer({ id: 'p1', roleId: 'saint' }),
      'misregister',
    )
    const observer = makePlayer({ id: 'p2', roleId: 'undertaker' })
    const state = makeState({ players: [target, observer] })

    const result = perceive(target, observer, 'role', state)
    expect(result.team).toBe('minion')
    expect(result.alignment).toBe('evil') // Second modifier saw team="minion"
  })

  it('modifier receives effectData from the effect instance', () => {
    const dataModifier: PerceptionModifier = {
      context: ['alignment', 'team', 'role'],
      modify: (perception, _target, _observer, _state, effectData) => {
        const overrides = effectData?.perceiveAs as
          | Partial<Perception>
          | undefined
        if (!overrides) return perception
        return { ...perception, ...overrides }
      },
    }

    registerTestEffect({
      id: 'misregister' as EffectId,
      icon: 'user',
      perceptionModifiers: [dataModifier],
    })

    const target = addEffectTo(
      makePlayer({ id: 'p1', roleId: 'saint' }),
      'misregister',
      {
        perceiveAs: { team: 'demon', alignment: 'evil', roleId: 'imp' },
      },
    )
    const observer = makePlayer({ id: 'p2', roleId: 'investigator' })
    const state = makeState({ players: [target, observer] })

    const result = perceive(target, observer, 'role', state)
    expect(result.team).toBe('demon')
    expect(result.alignment).toBe('evil')
    expect(result.roleId).toBe('imp')
  })
})

// ============================================================================
// CAN REGISTER AS TEAM
// ============================================================================

describe('canRegisterAsTeam', () => {
  it('returns false for a player with no effects', () => {
    const player = makePlayer({ id: 'p1', roleId: 'villager' })
    expect(canRegisterAsTeam(player, 'minion')).toBe(false)
  })

  it("returns false for a player with effects that don't declare canRegisterAs", () => {
    const player = addEffectTo(
      makePlayer({ id: 'p1', roleId: 'soldier' }),
      'safe',
    )
    expect(canRegisterAsTeam(player, 'minion')).toBe(false)
  })

  it('returns true for a player with misregister for minion team (via instance data)', () => {
    const player = addEffectTo(
      makePlayer({ id: 'p1', roleId: 'recluse' }),
      'misregister',
      { canRegisterAs: { teams: ['minion', 'demon'], alignments: ['evil'] } },
    )
    expect(canRegisterAsTeam(player, 'minion')).toBe(true)
  })

  it('returns true for a player with misregister for demon team (via instance data)', () => {
    const player = addEffectTo(
      makePlayer({ id: 'p1', roleId: 'recluse' }),
      'misregister',
      { canRegisterAs: { teams: ['minion', 'demon'], alignments: ['evil'] } },
    )
    expect(canRegisterAsTeam(player, 'demon')).toBe(true)
  })

  it('returns false for a team not declared in canRegisterAs', () => {
    const player = addEffectTo(
      makePlayer({ id: 'p1', roleId: 'recluse' }),
      'misregister',
      { canRegisterAs: { teams: ['minion', 'demon'], alignments: ['evil'] } },
    )
    expect(canRegisterAsTeam(player, 'townsfolk')).toBe(false)
  })

  it('returns true for custom effects with canRegisterAs', () => {
    registerTestEffect({
      id: 'custom_misregister' as EffectId,
      icon: 'user',
      canRegisterAs: { teams: ['townsfolk'] },
    })

    const player = addEffectTo(
      makePlayer({ id: 'p1', roleId: 'imp' }),
      'custom_misregister',
    )
    expect(canRegisterAsTeam(player, 'townsfolk')).toBe(true)
    expect(canRegisterAsTeam(player, 'minion')).toBe(false)
  })
})

// ============================================================================
// CAN REGISTER AS ALIGNMENT
// ============================================================================

describe('canRegisterAsAlignment', () => {
  it('returns false for a player with no effects', () => {
    const player = makePlayer({ id: 'p1', roleId: 'villager' })
    expect(canRegisterAsAlignment(player, 'evil')).toBe(false)
  })

  it("returns false for a player with effects that don't declare canRegisterAs", () => {
    const player = addEffectTo(
      makePlayer({ id: 'p1', roleId: 'soldier' }),
      'safe',
    )
    expect(canRegisterAsAlignment(player, 'evil')).toBe(false)
  })

  it('returns true for a player with misregister for evil alignment (via instance data)', () => {
    const player = addEffectTo(
      makePlayer({ id: 'p1', roleId: 'recluse' }),
      'misregister',
      { canRegisterAs: { teams: ['minion', 'demon'], alignments: ['evil'] } },
    )
    expect(canRegisterAsAlignment(player, 'evil')).toBe(true)
  })

  it('returns false for an alignment not declared in canRegisterAs', () => {
    const player = addEffectTo(
      makePlayer({ id: 'p1', roleId: 'recluse' }),
      'misregister',
      { canRegisterAs: { teams: ['minion', 'demon'], alignments: ['evil'] } },
    )
    expect(canRegisterAsAlignment(player, 'good')).toBe(false)
  })

  it('returns true for custom effects with canRegisterAs alignments', () => {
    registerTestEffect({
      id: 'custom_misregister' as EffectId,
      icon: 'user',
      canRegisterAs: { alignments: ['good'] },
    })

    const player = addEffectTo(
      makePlayer({ id: 'p1', roleId: 'imp' }),
      'custom_misregister',
    )
    expect(canRegisterAsAlignment(player, 'good')).toBe(true)
    expect(canRegisterAsAlignment(player, 'evil')).toBe(false)
  })
})

// ============================================================================
// GET AMBIGUOUS PLAYERS
// ============================================================================

describe('getAmbiguousPlayers', () => {
  it('returns empty array when no players have canRegisterAs', () => {
    const players = [
      makePlayer({ id: 'p1', roleId: 'villager' }),
      makePlayer({ id: 'p2', roleId: 'imp' }),
    ]
    expect(getAmbiguousPlayers(players, 'alignment')).toEqual([])
  })

  it('returns players with alignment misregistration for alignment context', () => {
    const recluse = addEffectTo(
      makePlayer({ id: 'p1', roleId: 'recluse' }),
      'misregister',
      { canRegisterAs: { teams: ['minion', 'demon'], alignments: ['evil'] } },
    )
    const villager = makePlayer({ id: 'p2', roleId: 'villager' })

    const result = getAmbiguousPlayers([recluse, villager], 'alignment')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('p1')
  })

  it('returns players with team misregistration for team context', () => {
    const recluse = addEffectTo(
      makePlayer({ id: 'p1', roleId: 'recluse' }),
      'misregister',
      { canRegisterAs: { teams: ['minion', 'demon'], alignments: ['evil'] } },
    )
    const villager = makePlayer({ id: 'p2', roleId: 'villager' })

    const result = getAmbiguousPlayers([recluse, villager], 'team')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('p1')
  })

  it('returns players with either team or alignment misregistration for role context', () => {
    registerTestEffect({
      id: 'team_only_misregister' as EffectId,
      icon: 'user',
      canRegisterAs: { teams: ['townsfolk'] },
    })

    const player1 = addEffectTo(
      makePlayer({ id: 'p1', roleId: 'recluse' }),
      'misregister',
      { canRegisterAs: { teams: ['minion', 'demon'], alignments: ['evil'] } },
    )
    const player2 = addEffectTo(
      makePlayer({ id: 'p2', roleId: 'imp' }),
      'team_only_misregister',
    )
    const player3 = makePlayer({ id: 'p3', roleId: 'villager' })

    const result = getAmbiguousPlayers([player1, player2, player3], 'role')
    expect(result).toHaveLength(2)
    expect(result.map((p) => p.id)).toEqual(['p1', 'p2'])
  })

  it('does not return players for alignment context when they only have team misregistration', () => {
    registerTestEffect({
      id: 'team_only_misregister' as EffectId,
      icon: 'user',
      canRegisterAs: { teams: ['townsfolk'] },
    })

    const player = addEffectTo(
      makePlayer({ id: 'p1', roleId: 'imp' }),
      'team_only_misregister',
    )

    const result = getAmbiguousPlayers([player], 'alignment')
    expect(result).toHaveLength(0)
  })
})

// ============================================================================
// APPLY PERCEPTION OVERRIDES
// ============================================================================

describe('applyPerceptionOverrides', () => {
  it('returns the same state when overrides is empty', () => {
    const state = makeState({
      players: [makePlayer({ id: 'p1', roleId: 'villager' })],
    })
    const result = applyPerceptionOverrides(state, {})
    expect(result).toBe(state) // Same reference
  })

  it('injects perceiveAs data into canRegisterAs effects', () => {
    const recluse = addEffectTo(
      makePlayer({ id: 'p1', roleId: 'recluse' }),
      'misregister',
      { canRegisterAs: { teams: ['minion', 'demon'], alignments: ['evil'] } },
    )
    const state = makeState({ players: [recluse] })

    const overridden = applyPerceptionOverrides(state, {
      p1: { alignment: 'evil' },
    })

    // The misregister effect should now have perceiveAs data
    const overriddenPlayer = overridden.players.find((p) => p.id === 'p1')!
    const misregisterEffect = overriddenPlayer.effects.find(
      (e) => e.type === 'misregister',
    )!
    expect(misregisterEffect.data?.perceiveAs).toEqual({
      alignment: 'evil',
    })
  })

  it('does not modify effects without canRegisterAs', () => {
    const player = addEffectTo(
      addEffectTo(
        makePlayer({ id: 'p1', roleId: 'recluse' }),
        'misregister',
        {
          canRegisterAs: {
            teams: ['minion', 'demon'],
            alignments: ['evil'],
          },
        },
      ),
      'safe',
    )
    const state = makeState({ players: [player] })

    const overridden = applyPerceptionOverrides(state, {
      p1: { alignment: 'evil' },
    })

    const overriddenPlayer = overridden.players.find((p) => p.id === 'p1')!
    const safeEffect = overriddenPlayer.effects.find((e) => e.type === 'safe')!
    expect(safeEffect.data).toBeUndefined()
  })

  it('does not modify players without overrides', () => {
    const recluse = addEffectTo(
      makePlayer({ id: 'p1', roleId: 'recluse' }),
      'misregister',
      { canRegisterAs: { teams: ['minion', 'demon'], alignments: ['evil'] } },
    )
    const villager = makePlayer({ id: 'p2', roleId: 'villager' })
    const state = makeState({ players: [recluse, villager] })

    const overridden = applyPerceptionOverrides(state, {
      p1: { alignment: 'evil' },
    })

    // Villager should be same reference
    expect(overridden.players.find((p) => p.id === 'p2')).toBe(villager)
  })

  it('integrates with perceive() to change perception results', () => {
    const recluse = addEffectTo(
      makePlayer({ id: 'p1', roleId: 'recluse' }),
      'misregister',
      { canRegisterAs: { teams: ['minion', 'demon'], alignments: ['evil'] } },
    )
    const observer = makePlayer({ id: 'p2', roleId: 'chef' })
    const state = makeState({ players: [recluse, observer] })

    // Without overrides: recluse appears as good (no perceiveAs set)
    const beforeResult = perceive(recluse, observer, 'alignment', state)
    expect(beforeResult.alignment).toBe('good')

    // With overrides: recluse appears as evil
    const overridden = applyPerceptionOverrides(state, {
      p1: { alignment: 'evil' },
    })
    const overriddenRecluse = overridden.players.find((p) => p.id === 'p1')!
    const afterResult = perceive(
      overriddenRecluse,
      observer,
      'alignment',
      overridden,
    )
    expect(afterResult.alignment).toBe('evil')
  })
})
