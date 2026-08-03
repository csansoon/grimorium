import { describe, it, expect, beforeEach } from 'vitest'
import {
  createGame,
  addHistoryEntry,
  startNight,
  startDay,
  getNextStep,
  applyNightAction,
  skipNightAction,
  nominate,
  cancelNomination,
  resolveVote,
  addEffectToPlayer,
  removeEffectFromPlayer,
  checkWinCondition,
  getNominatorsToday,
  getNomineesToday,
} from '../game'
import { applyPipelineChanges, resolveIntent } from '../pipeline'
import type { ScriptDefinition } from '../scripts'
import { getCurrentState, hasEffect, PlayerState } from '../types'
import {
  makePlayer,
  makeGame,
  makeState,
  makeGameWithHistory,
  makeStandardPlayers,
  addEffectTo,
  resetPlayerCounter,
} from './helpers'

beforeEach(() => {
  resetPlayerCounter()
})

// ============================================================================
// GAME CREATION
// ============================================================================

describe('createGame', () => {
  it('produces a game with correct initial state', () => {
    const game = createGame('Test', 'custom', [
      { name: 'Alice', roleId: 'villager' },
      { name: 'Bob', roleId: 'imp' },
    ])

    expect(game.name).toBe('Test')
    expect(game.history).toHaveLength(1)
    expect(game.history[0].type).toBe('game_created')

    const state = getCurrentState(game)
    expect(state.phase).toBe('setup')
    expect(state.round).toBe(0)
    expect(state.players).toHaveLength(2)
    expect(state.winner).toBeNull()
  })

  it('assigns player IDs and names correctly', () => {
    const game = createGame('Test', 'custom', [
      { name: 'Alice', roleId: 'villager' },
      { name: 'Bob', roleId: 'imp' },
    ])

    const state = getCurrentState(game)
    expect(state.players[0].name).toBe('Alice')
    expect(state.players[0].roleId).toBe('villager')
    expect(state.players[1].name).toBe('Bob')
    expect(state.players[1].roleId).toBe('imp')
  })

  it('applies initialEffects from role definitions', () => {
    const game = createGame('Test', 'custom', [
      { name: 'Alice', roleId: 'soldier' }, // has initialEffect: safe
      { name: 'Bob', roleId: 'virgin' }, // has initialEffect: pure
      { name: 'Carol', roleId: 'villager' }, // no initial effects
    ])

    const state = getCurrentState(game)
    expect(state.players[0].effects.some((e) => e.type === 'safe')).toBe(true)
    expect(state.players[1].effects.some((e) => e.type === 'pure')).toBe(true)
    expect(state.players[2].effects).toHaveLength(0)
  })

  it('does not award town the win when a Slayer shot kills the demon but Scarlet Woman succeeds', () => {
    const slayer = addEffectTo(
      makePlayer({ id: 'slayer', roleId: 'slayer' }),
      'slayer_bullet',
    )
    const demon = makePlayer({ id: 'imp', roleId: 'imp' })
    const scarletWoman = addEffectTo(
      makePlayer({ id: 'sw', roleId: 'scarlet_woman' }),
      'demon_successor',
    )
    const players = [
      slayer,
      demon,
      scarletWoman,
      makePlayer({ id: 'p1', roleId: 'washerwoman' }),
      makePlayer({ id: 'p2', roleId: 'chef' }),
      makePlayer({ id: 'p3', roleId: 'empath' }),
    ]
    const state = makeState({ phase: 'day', round: 1, players })
    const game = makeGame(state)

    const slayerGame = applyPipelineChanges(game, {
      entries: [
        {
          type: 'slayer_shot',
          message: [{ type: 'text', content: 'Slayer shot hit the demon' }],
          data: {
            slayerId: 'slayer',
            targetId: 'imp',
            hit: true,
          },
        },
      ],
      removeEffects: { slayer: ['slayer_bullet'] },
    })

    const pipelineResult = resolveIntent(
      {
        type: 'kill',
        sourceId: 'slayer',
        targetId: 'imp',
        cause: 'slayer_shot',
      },
      getCurrentState(slayerGame),
      slayerGame,
    )

    expect(pipelineResult.type).toBe('resolved')
    if (pipelineResult.type !== 'resolved') return

    const resolvedGame = applyPipelineChanges(slayerGame, pipelineResult.stateChanges)
    const resolvedState = getCurrentState(resolvedGame)

    expect(resolvedState.players.find((player) => player.id === 'imp')?.effects.some((effect) => effect.type === 'dead')).toBe(true)
    expect(resolvedState.players.find((player) => player.id === 'sw')?.roleId).toBe('imp')
    expect(checkWinCondition(resolvedState, resolvedGame)).toBeNull()
  })
})

// ============================================================================
// HISTORY MANAGEMENT
// ============================================================================

describe('addHistoryEntry', () => {
  it('appends an entry with correct stateAfter snapshot', () => {
    const players = makeStandardPlayers()
    const game = makeGame(makeState({ phase: 'night', round: 1, players }))

    const updated = addHistoryEntry(game, {
      type: 'night_action',
      message: [{ type: 'text', content: 'test' }],
      data: { roleId: 'imp', playerId: 'p5', action: 'kill', targetId: 'p1' },
    })

    expect(updated.history).toHaveLength(2)
    const newState = getCurrentState(updated)
    // State unchanged since we didn't pass stateUpdates
    expect(newState.phase).toBe('night')
    expect(newState.round).toBe(1)
  })

  it('applies stateUpdates to the snapshot', () => {
    const players = makeStandardPlayers()
    const game = makeGame(makeState({ phase: 'night', round: 1, players }))

    const updated = addHistoryEntry(
      game,
      {
        type: 'day_started',
        message: [{ type: 'text', content: 'day' }],
        data: {},
      },
      { phase: 'day' },
    )

    const state = getCurrentState(updated)
    expect(state.phase).toBe('day')
  })

  it('applies addEffects to players', () => {
    const players = makeStandardPlayers()
    const game = makeGame(makeState({ phase: 'night', round: 1, players }))

    const updated = addHistoryEntry(
      game,
      {
        type: 'night_action',
        message: [{ type: 'text', content: 'test' }],
        data: {},
      },
      undefined,
      { p1: [{ type: 'safe', expiresAt: 'end_of_night' }] },
    )

    const state = getCurrentState(updated)
    const p1 = state.players.find((p) => p.id === 'p1')!
    expect(hasEffect(p1, 'safe')).toBe(true)
  })

  it('applies removeEffects from players', () => {
    const players = makeStandardPlayers()
    players[0] = addEffectTo(players[0], 'safe')
    const game = makeGame(makeState({ phase: 'night', round: 1, players }))

    const updated = addHistoryEntry(
      game,
      {
        type: 'night_action',
        message: [{ type: 'text', content: 'test' }],
        data: {},
      },
      undefined,
      undefined,
      { p1: ['safe'] },
    )

    const state = getCurrentState(updated)
    const p1 = state.players.find((p) => p.id === 'p1')!
    expect(hasEffect(p1, 'safe')).toBe(false)
  })
})

// ============================================================================
// PHASE TRANSITIONS
// ============================================================================

describe('startNight', () => {
  it('transitions from setup to night round 1', () => {
    const players = makeStandardPlayers()
    const game = makeGame(makeState({ phase: 'setup', round: 0, players }))

    const updated = startNight(game)
    const state = getCurrentState(updated)
    expect(state.phase).toBe('night')
    expect(state.round).toBe(1)
  })

  it('increments round when transitioning from day to night', () => {
    const players = makeStandardPlayers()
    const game = makeGame(makeState({ phase: 'day', round: 1, players }))

    const updated = startNight(game)
    const state = getCurrentState(updated)
    expect(state.phase).toBe('night')
    expect(state.round).toBe(2)
  })
})

describe('startDay', () => {
  it('transitions to day phase', () => {
    const players = makeStandardPlayers()
    const game = makeGame(makeState({ phase: 'night', round: 1, players }))
    // Need a night_started entry for startDay to find
    const withNight = addHistoryEntry(game, {
      type: 'night_started',
      message: [{ type: 'text', content: 'night' }],
      data: { round: 1 },
    })

    const updated = startDay(withNight)
    const state = getCurrentState(updated)
    expect(state.phase).toBe('day')
  })

  it('expires end_of_night effects', () => {
    const players = makeStandardPlayers()
    // p1 has a safe effect that expires at end of night (like Monk protection)
    players[0] = addEffectTo(players[0], 'safe', undefined, 'end_of_night')
    const game = makeGame(makeState({ phase: 'night', round: 1, players }))
    const withNight = addHistoryEntry(game, {
      type: 'night_started',
      message: [{ type: 'text', content: 'night' }],
      data: { round: 1 },
    })

    const updated = startDay(withNight)
    const state = getCurrentState(updated)
    const p1 = state.players.find((p) => p.id === 'p1')!
    expect(hasEffect(p1, 'safe')).toBe(false)
  })

  it('preserves permanent effects', () => {
    const players = makeStandardPlayers()
    // p1 has a permanent safe effect (like Soldier)
    players[0] = addEffectTo(players[0], 'safe', undefined, 'never')
    const game = makeGame(makeState({ phase: 'night', round: 1, players }))
    const withNight = addHistoryEntry(game, {
      type: 'night_started',
      message: [{ type: 'text', content: 'night' }],
      data: { round: 1 },
    })

    const updated = startDay(withNight)
    const state = getCurrentState(updated)
    const p1 = state.players.find((p) => p.id === 'p1')!
    expect(hasEffect(p1, 'safe')).toBe(true)
  })

  it('announces players who died at night even if the action label is not plain kill', () => {
    const alivePlayers = [
      makePlayer({ id: 'p1', name: 'Target', roleId: 'chef' }),
      makePlayer({ id: 'p2', name: 'Demon', roleId: 'fang_gu' }),
      makePlayer({ id: 'p3', name: 'Other', roleId: 'washerwoman' }),
    ]
    const deadPlayers = [
      addEffectTo(alivePlayers[0], 'dead'),
      alivePlayers[1],
      alivePlayers[2],
    ]

    let game = makeGame(makeState({ phase: 'night', round: 2, players: alivePlayers }))
    game = addHistoryEntry(game, {
      type: 'night_started',
      message: [{ type: 'text', content: 'night' }],
      data: { round: 2 },
    })
    game = addHistoryEntry(
      game,
      {
        type: 'night_action',
        message: [{ type: 'text', content: 'fang gu attacked' }],
        data: {
          roleId: 'fang_gu',
          playerId: 'p2',
          action: 'fang_gu_kill',
          targetId: 'p1',
        },
      },
      { players: deadPlayers },
    )

    const updated = startDay(game)
    const nightDeathEntries = updated.history.filter(
      (entry) =>
        entry.type === 'effect_added' &&
        entry.data.effectType === 'dead' &&
        entry.data.playerId === 'p1',
    )

    expect(nightDeathEntries).toHaveLength(1)
  })
})

// ============================================================================
// GAME STEP RESOLUTION
// ============================================================================

describe('getNextStep', () => {
  it('returns role_reveal for unrevealed players in setup', () => {
    const players = makeStandardPlayers()
    const game = makeGame(makeState({ phase: 'setup', round: 0, players }))

    const step = getNextStep(game)
    expect(step.type).toBe('role_reveal')
    if (step.type === 'role_reveal') {
      expect(step.playerId).toBe('p1')
    }
  })

  it('returns night_waiting after all roles revealed in setup', () => {
    // Need 3+ players with a demon so win conditions don't trigger
    const players = [
      makePlayer({ id: 'p1', roleId: 'villager' }),
      makePlayer({ id: 'p2', roleId: 'villager' }),
      makePlayer({ id: 'p3', roleId: 'imp' }),
    ]
    let game = makeGame(makeState({ phase: 'setup', round: 0, players }))
    // Mark all players as revealed
    for (const p of players) {
      game = addHistoryEntry(game, {
        type: 'role_revealed',
        message: [{ type: 'text', content: 'revealed' }],
        data: { playerId: p.id, roleId: p.roleId },
      })
    }

    const step = getNextStep(game)
    expect(step.type).toBe('night_waiting')
  })

  it('returns day step during day phase', () => {
    const players = makeStandardPlayers()
    const game = makeGame(makeState({ phase: 'day', round: 1, players }))

    const step = getNextStep(game)
    expect(step.type).toBe('day')
  })

  it('uses the script wake order on later nights', () => {
    const players = [
      makePlayer({ id: 'p1', name: 'Alice', roleId: 'empath' }),
      makePlayer({ id: 'p2', name: 'Bob', roleId: 'imp' }),
      makePlayer({ id: 'p3', name: 'Cara', roleId: 'villager' }),
      makePlayer({ id: 'p4', name: 'Dane', roleId: 'villager' }),
      makePlayer({ id: 'p5', name: 'Elle', roleId: 'villager' }),
    ]
    const game = {
      ...makeGame(makeState({ phase: 'night', round: 2, players })),
      scriptId: 'trouble-brewing' as const,
    }

    const step = getNextStep(game)
    expect(step.type).toBe('night_action')
    if (step.type === 'night_action') {
      expect(step.playerId).toBe('p2')
      expect(step.roleId).toBe('imp')
    }
  })

  it('keeps demon-role wakes based on role order, regardless of alignment', () => {
    const players = [
      makePlayer({
        id: 'p1',
        name: 'Good Vortox',
        roleId: 'vortox',
        currentAlignment: 'good',
      }),
      makePlayer({ id: 'p2', name: 'Empath', roleId: 'empath' }),
      makePlayer({ id: 'p3', name: 'Villager', roleId: 'villager' }),
      makePlayer({ id: 'p4', name: 'Villager 2', roleId: 'villager' }),
      makePlayer({ id: 'p5', name: 'Villager 3', roleId: 'villager' }),
    ]
    const scriptSnapshot: ScriptDefinition = {
      id: 'test-custom',
      source: 'custom',
      name: 'Test Custom',
      icon: 'moon',
      roles: ['vortox', 'empath'],
      enforceDistribution: false,
      wakeOrder: {
        firstNight: [],
        otherNights: [{ roleId: 'vortox' }, { roleId: 'empath' }],
      },
      isOfficial: false,
    }
    const game = {
      ...makeGameWithHistory(
        [
          {
            type: 'game_created',
            stateOverrides: { phase: 'night', round: 2 },
          },
          { type: 'night_started' },
        ],
        makeState({
          phase: 'night',
          round: 2,
          players,
        }),
      ),
      scriptId: 'custom',
      scriptSnapshot,
    }

    const step = getNextStep(game)
    expect(step).toEqual({
      type: 'night_action',
      playerId: 'p1',
      roleId: 'vortox',
    })
  })

  it('allows a player who changed into a later-night role to still act that night', () => {
    const players = [
      makePlayer({ id: 'p1', name: 'New Demon', roleId: 'imp' }),
      makePlayer({ id: 'p2', name: 'Old Demon', roleId: 'snake_charmer' }),
      makePlayer({ id: 'p3', name: 'Townsfolk', roleId: 'chef' }),
    ]
    const scriptSnapshot: ScriptDefinition = {
      id: 'test-custom',
      source: 'custom',
      name: 'Test Custom',
      icon: 'moon',
      roles: ['snake_charmer', 'imp', 'chef'],
      enforceDistribution: false,
      wakeOrder: {
        firstNight: [],
        otherNights: [{ roleId: 'snake_charmer' }, { roleId: 'imp' }],
      },
      isOfficial: false,
    }
    const game = {
      ...makeGameWithHistory(
        [
          {
            type: 'game_created',
            stateOverrides: { phase: 'night', round: 2 },
          },
          { type: 'night_started' },
          {
            type: 'night_action',
            data: { roleId: 'snake_charmer', playerId: 'p1' },
          },
          {
            type: 'night_skipped',
            data: { roleId: 'snake_charmer', playerId: 'p2' },
          },
        ],
        makeState({
          phase: 'night',
          round: 2,
          players,
        }),
      ),
      scriptId: 'custom',
      scriptSnapshot,
    }

    const step = getNextStep(game)
    expect(step.type).toBe('night_action')
    if (step.type === 'night_action') {
      expect(step.playerId).toBe('p1')
      expect(step.roleId).toBe('imp')
    }
  })

  it('prioritizes immediate queue directives before normal wake order', () => {
    const players = [
      makePlayer({ id: 'p1', name: 'Empath', roleId: 'empath' }),
      makePlayer({ id: 'p2', name: 'Imp', roleId: 'imp' }),
      makePlayer({ id: 'p3', name: 'Chef', roleId: 'chef' }),
      makePlayer({ id: 'p4', name: 'Monk', roleId: 'monk' }),
      makePlayer({ id: 'p5', name: 'Butler', roleId: 'butler' }),
    ]
    const scriptSnapshot: ScriptDefinition = {
      id: 'test-custom',
      source: 'custom',
      name: 'Test Custom',
      icon: 'moon',
      roles: ['empath', 'imp', 'chef', 'monk', 'butler'],
      enforceDistribution: false,
      wakeOrder: {
        firstNight: [],
        otherNights: [{ roleId: 'empath' }, { roleId: 'imp' }],
      },
      isOfficial: false,
    }
    const game = {
      ...makeGameWithHistory(
        [
          {
            type: 'game_created',
            stateOverrides: { phase: 'night', round: 2 },
          },
          { type: 'night_started' },
          {
            type: 'night_queue_directive',
            data: {
              playerId: 'p2',
              roleId: 'imp',
              directive: 'immediate',
            },
          },
        ],
        makeState({
          phase: 'night',
          round: 2,
          players,
        }),
      ),
      scriptId: 'custom',
      scriptSnapshot,
    }

    const step = getNextStep(game)
    expect(step.type).toBe('night_action')
    if (step.type === 'night_action') {
      expect(step.playerId).toBe('p2')
      expect(step.roleId).toBe('imp')
    }
  })

  it('allows immediate_force queue directives to bypass shouldWake gating once', () => {
    const players = [
      makePlayer({ id: 'p1', name: 'Clockmaker', roleId: 'clockmaker' }),
      makePlayer({ id: 'p2', name: 'Imp', roleId: 'imp' }),
      makePlayer({ id: 'p3', name: 'Villager', roleId: 'villager' }),
      makePlayer({ id: 'p4', name: 'Villager 2', roleId: 'villager' }),
      makePlayer({ id: 'p5', name: 'Villager 3', roleId: 'villager' }),
    ]
    const scriptSnapshot: ScriptDefinition = {
      id: 'test-custom',
      source: 'custom',
      name: 'Test Custom',
      icon: 'moon',
      roles: ['clockmaker', 'imp'],
      enforceDistribution: false,
      wakeOrder: {
        firstNight: [],
        otherNights: [{ roleId: 'imp' }, { roleId: 'clockmaker' }],
      },
      isOfficial: false,
    }
    const game = {
      ...makeGameWithHistory(
        [
          {
            type: 'game_created',
            stateOverrides: { phase: 'night', round: 2 },
          },
          { type: 'night_started' },
          {
            type: 'night_queue_directive',
            data: {
              playerId: 'p1',
              roleId: 'clockmaker',
              directive: 'immediate_force',
            },
          },
        ],
        makeState({
          phase: 'night',
          round: 2,
          players,
        }),
      ),
      scriptId: 'custom',
      scriptSnapshot,
    }

    const step = getNextStep(game)
    expect(step.type).toBe('night_action')
    if (step.type === 'night_action') {
      expect(step.playerId).toBe('p1')
      expect(step.roleId).toBe('clockmaker')
    }
  })

  it('queues a storyteller death-selection step when Pit-Hag creates a demon', () => {
    const players = [
      makePlayer({ id: 'pit', name: 'Pit Hag', roleId: 'pit_hag' }),
      makePlayer({ id: 'target', name: 'Target', roleId: 'vortox' }),
      makePlayer({ id: 'town', name: 'Town', roleId: 'clockmaker' }),
      makePlayer({ id: 'town2', name: 'Town 2', roleId: 'oracle' }),
      makePlayer({ id: 'town3', name: 'Town 3', roleId: 'seamstress' }),
    ]
    const game = makeGameWithHistory(
      [
        {
          type: 'game_created',
          stateOverrides: { phase: 'night', round: 2, players },
        },
        { type: 'night_started', data: { round: 2 } },
        {
          type: 'night_action',
          data: { roleId: 'pit_hag', playerId: 'pit', action: 'pit_hag_change' },
        },
        {
          type: 'role_changed',
          data: {
            playerId: 'target',
            fromRole: 'savant',
            toRole: 'vortox',
            sourceCause: 'pit_hag_change',
            sourcePlayerId: 'pit',
            sourceRoleId: 'pit_hag',
          },
          stateOverrides: { players },
        },
      ],
      makeState({
        phase: 'night',
        round: 2,
        players,
      }),
    )

    const step = getNextStep(game)
    expect(step).toEqual({
      type: 'night_action',
      playerId: 'pit',
      roleId: 'pit_hag',
      systemStepId: 'demon_creation_deaths',
    })
  })

  it('auto-skips dead players whose role would otherwise still be pending', () => {
    const players = [
      addEffectTo(makePlayer({ id: 'p1', roleId: 'butler', name: 'Dead Butler' }), 'dead'),
      makePlayer({ id: 'p2', roleId: 'imp', name: 'Imp' }),
      makePlayer({ id: 'p3', roleId: 'villager', name: 'Villager' }),
      makePlayer({ id: 'p4', roleId: 'villager', name: 'Villager 2' }),
      makePlayer({ id: 'p5', roleId: 'villager', name: 'Villager 3' }),
    ]
    const scriptSnapshot: ScriptDefinition = {
      id: 'test-custom',
      source: 'custom',
      name: 'Test Custom',
      icon: 'moon',
      roles: ['imp', 'butler'],
      enforceDistribution: false,
      wakeOrder: {
        firstNight: [],
        otherNights: [{ roleId: 'imp' }, { roleId: 'butler' }],
      },
      isOfficial: false,
    }
    const game = {
      ...makeGameWithHistory(
        [
          {
            type: 'game_created',
            stateOverrides: { phase: 'night', round: 2 },
          },
          { type: 'night_started' },
          {
            type: 'night_action',
            data: { roleId: 'imp', playerId: 'p2' },
          },
        ],
        makeState({
          phase: 'night',
          round: 2,
          players,
        }),
      ),
      scriptId: 'custom',
      scriptSnapshot,
    }

    const step = getNextStep(game)
    expect(step).toEqual({
      type: 'night_action_skip',
      playerId: 'p1',
      roleId: 'butler',
    })
  })

  it('queues Ravenkeeper after they are killed during the night', () => {
    const ravenkeeper = makePlayer({ id: 'p1', roleId: 'ravenkeeper', name: 'Ravenkeeper' })
    const deadRavenkeeper = addEffectTo(ravenkeeper, 'dead')
    const imp = makePlayer({ id: 'p2', roleId: 'imp', name: 'Imp' })
    const players = [
      deadRavenkeeper,
      imp,
      makePlayer({ id: 'p3', roleId: 'villager', name: 'Villager' }),
      makePlayer({ id: 'p4', roleId: 'villager', name: 'Villager 2' }),
      makePlayer({ id: 'p5', roleId: 'villager', name: 'Villager 3' }),
    ]
    const scriptSnapshot: ScriptDefinition = {
      id: 'test-custom',
      source: 'custom',
      name: 'Test Custom',
      icon: 'moon',
      roles: ['imp', 'ravenkeeper'],
      enforceDistribution: false,
      wakeOrder: {
        firstNight: [],
        otherNights: [{ roleId: 'imp' }, { roleId: 'ravenkeeper' }],
      },
      isOfficial: false,
    }
    const game = {
      ...makeGameWithHistory(
        [
          {
            type: 'game_created',
            stateOverrides: { phase: 'night', round: 2, players: [ravenkeeper, imp] },
          },
          {
            type: 'night_started',
            data: { round: 2 },
            stateOverrides: { phase: 'night', round: 2, players: [ravenkeeper, imp] },
          },
          {
            type: 'night_action',
            data: { roleId: 'imp', playerId: 'p2', action: 'kill', targetId: 'p1' },
            stateOverrides: { phase: 'night', round: 2, players },
          },
        ],
        makeState({
          phase: 'night',
          round: 2,
          players,
        }),
      ),
      scriptId: 'custom',
      scriptSnapshot,
    }

    const step = getNextStep(game)
    expect(step).toEqual({
      type: 'night_action',
      playerId: 'p1',
      roleId: 'ravenkeeper',
    })
  })

  it('queues a newly gained later-night role after an earlier action has resolved', () => {
    const players = [
      makePlayer({ id: 'p1', roleId: 'poisoner', name: 'Poisoner' }),
      makePlayer({ id: 'p2', roleId: 'villager', name: 'Changed Player' }),
      makePlayer({ id: 'p3', roleId: 'empath', name: 'Empath' }),
      makePlayer({ id: 'p4', roleId: 'villager', name: 'Villager' }),
      makePlayer({ id: 'p5', roleId: 'villager', name: 'Villager 2' }),
    ]
    const transformedPlayers = [
      players[0],
      makePlayer({
        ...players[1],
        roleId: 'imp',
        baseRoleId: players[1].baseRoleId,
        baseAlignment: players[1].baseAlignment,
        currentAlignment: 'evil',
      }),
      players[2],
      players[3],
      players[4],
    ]
    const scriptSnapshot: ScriptDefinition = {
      id: 'test-custom',
      source: 'custom',
      name: 'Test Custom',
      icon: 'moon',
      roles: ['poisoner', 'empath', 'imp'],
      enforceDistribution: false,
      wakeOrder: {
        firstNight: [],
        otherNights: [
          { roleId: 'poisoner' },
          { roleId: 'empath' },
          { roleId: 'imp' },
        ],
      },
      isOfficial: false,
    }
    const game = {
      ...makeGameWithHistory(
        [
          {
            type: 'game_created',
            stateOverrides: { phase: 'night', round: 2, players },
          },
          { type: 'night_started' },
          {
            type: 'night_action',
            data: { roleId: 'poisoner', playerId: 'p1', action: 'poison' },
            stateOverrides: { players },
          },
          {
            type: 'role_changed',
            data: {
              playerId: 'p2',
              fromRole: 'villager',
              toRole: 'imp',
              sourceCause: 'test_transformation',
            },
            stateOverrides: {
              players: transformedPlayers,
            },
          },
        ],
        makeState({
          phase: 'night',
          round: 2,
          players: transformedPlayers,
        }),
      ),
      scriptId: 'custom',
      scriptSnapshot,
    }

    const step = getNextStep(game)
    expect(step).toEqual({
      type: 'night_action',
      playerId: 'p3',
      roleId: 'empath',
    })

    const empathDone = addHistoryEntry(game, {
      type: 'night_action',
      message: [{ type: 'text', content: 'empath acted' }],
      data: { roleId: 'empath', playerId: 'p3', action: 'info' },
    })

    const nextStep = getNextStep(empathDone)
    expect(nextStep).toEqual({
      type: 'night_action',
      playerId: 'p2',
      roleId: 'imp',
    })
  })

  it('does not queue a newly gained role when a skip directive marks its wake as passed', () => {
    const players = [
      makePlayer({ id: 'p1', roleId: 'poisoner', name: 'Poisoner' }),
      makePlayer({ id: 'p2', roleId: 'villager', name: 'Changed Player' }),
      makePlayer({ id: 'p3', roleId: 'empath', name: 'Empath' }),
      makePlayer({ id: 'p4', roleId: 'villager', name: 'Villager' }),
      makePlayer({ id: 'p5', roleId: 'villager', name: 'Villager 2' }),
    ]
    const transformedPlayers = [
      players[0],
      makePlayer({
        ...players[1],
        roleId: 'imp',
        baseRoleId: players[1].baseRoleId,
        baseAlignment: players[1].baseAlignment,
        currentAlignment: 'evil',
      }),
      players[2],
      players[3],
      players[4],
    ]
    const scriptSnapshot: ScriptDefinition = {
      id: 'test-custom',
      source: 'custom',
      name: 'Test Custom',
      icon: 'moon',
      roles: ['poisoner', 'empath', 'imp'],
      enforceDistribution: false,
      wakeOrder: {
        firstNight: [],
        otherNights: [
          { roleId: 'poisoner' },
          { roleId: 'empath' },
          { roleId: 'imp' },
        ],
      },
      isOfficial: false,
    }
    const game = {
      ...makeGameWithHistory(
        [
          {
            type: 'game_created',
            stateOverrides: { phase: 'night', round: 2, players },
          },
          { type: 'night_started' },
          {
            type: 'night_action',
            data: { roleId: 'poisoner', playerId: 'p1', action: 'poison' },
            stateOverrides: { players },
          },
          {
            type: 'role_changed',
            data: {
              playerId: 'p2',
              fromRole: 'villager',
              toRole: 'imp',
              sourceCause: 'test_transformation',
            },
            stateOverrides: {
              players: transformedPlayers,
            },
          },
          {
            type: 'night_queue_directive',
            data: {
              playerId: 'p2',
              roleId: 'imp',
              directive: 'skip',
            },
          },
        ],
        makeState({
          phase: 'night',
          round: 2,
          players: transformedPlayers,
        }),
      ),
      scriptId: 'custom',
      scriptSnapshot,
    }

    const step = getNextStep(game)
    expect(step).toEqual({
      type: 'night_action',
      playerId: 'p3',
      roleId: 'empath',
    })

    const empathDone = addHistoryEntry(game, {
      type: 'night_action',
      message: [{ type: 'text', content: 'empath acted' }],
      data: { roleId: 'empath', playerId: 'p3', action: 'info' },
    })

    const nextStep = getNextStep(empathDone)
    expect(nextStep).toEqual({
      type: 'night_waiting',
    })
  })

  it('adds a skip queue directive when a Fang Gu jump creates a new demon', () => {
    const state = makeState({
      phase: 'night',
      round: 2,
      players: [
        addEffectTo(makePlayer({ id: 'fang', roleId: 'fang_gu' }), 'fang_gu_jump'),
        makePlayer({ id: 'outsider', roleId: 'sweetheart' }),
        makePlayer({ id: 'town', roleId: 'chef' }),
      ],
    })
    const game = {
      ...makeGameWithHistory(
      [{ type: 'night_started', data: { round: 2 }, stateOverrides: state }],
      state,
      ),
      scriptId: 'sects-and-violets' as const,
    }

    const afterJump = applyPipelineChanges(game, {
      entries: [
        {
          type: 'night_queue_directive',
          message: [],
          data: {
            playerId: 'outsider',
            roleId: 'fang_gu',
            directive: 'skip',
            sourceCause: 'fang_gu_jump',
          },
        },
      ],
      changeRoles: { outsider: 'fang_gu' },
      changeAlignments: { outsider: 'evil' },
    })

    const directive = [...afterJump.history].reverse().find(
      (entry) =>
        entry.type === 'night_queue_directive' &&
        entry.data.playerId === 'outsider' &&
        entry.data.roleId === 'fang_gu',
    )

    expect(directive?.data.directive).toBe('skip')
  })
})

// ============================================================================
// NIGHT ACTIONS
// ============================================================================

describe('applyNightAction', () => {
  it('records entries in history', () => {
    const players = makeStandardPlayers()
    const game = makeGame(makeState({ phase: 'night', round: 1, players }))

    const updated = applyNightAction(game, {
      entries: [
        {
          type: 'night_action',
          message: [{ type: 'text', content: 'killed' }],
          data: {
            roleId: 'imp',
            playerId: 'p5',
            action: 'kill',
            targetId: 'p1',
          },
        },
      ],
    })

    expect(updated.history).toHaveLength(2)
    expect(updated.history[1].type).toBe('night_action')
  })

  it('applies direct effect changes', () => {
    const players = makeStandardPlayers()
    const game = makeGame(makeState({ phase: 'night', round: 1, players }))

    const updated = applyNightAction(game, {
      entries: [
        {
          type: 'night_action',
          message: [{ type: 'text', content: 'protected' }],
          data: { roleId: 'monk', playerId: 'p3' },
        },
      ],
      addEffects: {
        p1: [{ type: 'safe', expiresAt: 'end_of_night' }],
      },
    })

    const state = getCurrentState(updated)
    const p1 = state.players.find((p) => p.id === 'p1')!
    expect(hasEffect(p1, 'safe')).toBe(true)
  })
})

describe('skipNightAction', () => {
  it('records a skip entry', () => {
    const players = makeStandardPlayers()
    const game = makeGame(makeState({ phase: 'night', round: 1, players }))

    const updated = skipNightAction(game, 'chef', 'p2')
    expect(updated.history).toHaveLength(2)
    expect(updated.history[1].type).toBe('night_skipped')
    expect(updated.history[1].data.roleId).toBe('chef')
  })
})


// ============================================================================
// NOMINATIONS AND VOTING
// ============================================================================

describe('nominate', () => {
  it('creates a nomination entry and stays in day phase', () => {
    const players = makeStandardPlayers()
    const game = makeGame(makeState({ phase: 'day', round: 1, players }))

    const updated = nominate(game, 'p1', 'p5')
    const state = getCurrentState(updated)
    expect(state.phase).toBe('day')

    // Should have a nomination entry
    const nomEntry = updated.history.find((e) => e.type === 'nomination')
    expect(nomEntry).toBeDefined()
    expect(nomEntry!.data.nominatorId).toBe('p1')
    expect(nomEntry!.data.nomineeId).toBe('p5')
  })

  it('returns unchanged game for invalid player IDs', () => {
    const players = makeStandardPlayers()
    const game = makeGame(makeState({ phase: 'day', round: 1, players }))

    const updated = nominate(game, 'nonexistent', 'p5')
    expect(updated).toBe(game)
  })
})

describe('resolveVote', () => {
  // Helper: creates a game state in the day phase with a day_started event
  // so getBlockStatus/getNomineesToday can scan history properly
  function makeDayGame(players: PlayerState[]) {
    return makeGameWithHistory(
      [
        { type: 'game_created' },
        { type: 'day_started', stateOverrides: { phase: 'day', round: 1 } },
      ],
      makeState({ phase: 'setup', round: 0, players }),
    )
  }

  it('puts player on block when votes meet threshold (5 alive, 3 needed)', () => {
    const players = makeStandardPlayers() // 5 players
    const game = makeDayGame(players)

    // 3 votes >= ceil(5/2)=3 => meets threshold, goes on block
    const updated = resolveVote(game, 'p5', 3, ['p1', 'p2', 'p3'])
    const state = getCurrentState(updated)
    expect(state.phase).toBe('day')

    // Player is NOT dead yet — execution deferred to end of day
    const p5 = state.players.find((p) => p.id === 'p5')!
    expect(hasEffect(p5, 'dead')).toBe(false)

    // Vote entry should show replacesBlock = true
    const voteEntry = updated.history.find((e) => e.type === 'vote')
    expect(voteEntry?.data.replacesBlock).toBe(true)
    expect(voteEntry?.data.meetsThreshold).toBe(true)
    expect(voteEntry?.data.voteCount).toBe(3)
  })

  it('fails when votes are below threshold', () => {
    const players = makeStandardPlayers() // 5 players
    const game = makeDayGame(players)

    // 2 votes < ceil(5/2)=3 => below threshold
    const updated = resolveVote(game, 'p5', 2, ['p1', 'p2'])
    const state = getCurrentState(updated)
    expect(state.phase).toBe('day')

    const voteEntry = updated.history.find((e) => e.type === 'vote')
    expect(voteEntry?.data.replacesBlock).toBe(false)
    expect(voteEntry?.data.meetsThreshold).toBe(false)
  })

  it('replaces block when new vote is strictly higher', () => {
    const players = makeStandardPlayers()
    const game = makeDayGame(players)

    // First nomination: p5 gets 3 votes (goes on block)
    const afterFirst = resolveVote(game, 'p5', 3, ['p1', 'p2', 'p3'])

    // Second nomination: p4 gets 4 votes (higher, replaces)
    const afterSecond = resolveVote(afterFirst, 'p4', 4, ['p1', 'p2', 'p3', 'p5'])

    const voteEntries = afterSecond.history.filter((e) => e.type === 'vote')
    const lastVote = voteEntries[voteEntries.length - 1]
    expect(lastVote?.data.replacesBlock).toBe(true)
    expect(lastVote?.data.nomineeId).toBe('p4')
  })

  it('clears block on tie (same vote count as current block)', () => {
    const players = makeStandardPlayers()
    const game = makeDayGame(players)

    // First: p5 gets 3 votes (on block)
    const afterFirst = resolveVote(game, 'p5', 3, ['p1', 'p2', 'p3'])

    // Second: p4 gets 3 votes (tie)
    const afterSecond = resolveVote(afterFirst, 'p4', 3, ['p1', 'p2', 'p5'])

    const voteEntries = afterSecond.history.filter((e) => e.type === 'vote')
    // Should have a clearsBlock entry
    const clearEntry = voteEntries.find((e) => e.data.clearsBlock === true)
    expect(clearEntry).toBeDefined()
  })

  it('fails with 0 votes', () => {
    const players = makeStandardPlayers()
    const game = makeDayGame(players)

    const updated = resolveVote(game, 'p5', 0)
    const voteEntry = updated.history.find((e) => e.type === 'vote')
    expect(voteEntry?.data.meetsThreshold).toBe(false)
    expect(voteEntry?.data.replacesBlock).toBe(false)
  })

  it("tracks dead voter's used vote", () => {
    const players = makeStandardPlayers()
    // Kill p1 first
    players[0] = addEffectTo(players[0], 'dead')
    const game = makeDayGame(players)

    // Dead player p1 votes — threshold is ceil(4/2)=2 (only 4 alive)
    const updated = resolveVote(game, 'p5', 3, ['p1', 'p2', 'p3'])
    const state = getCurrentState(updated)

    const p1 = state.players.find((p) => p.id === 'p1')!
    expect(hasEffect(p1, 'used_dead_vote')).toBe(true)
  })

  it("does not track dead voter if they don't vote", () => {
    const players = makeStandardPlayers()
    players[0] = addEffectTo(players[0], 'dead')
    const game = makeDayGame(players)

    // p1 (dead) does NOT vote
    const updated = resolveVote(game, 'p5', 2, ['p2', 'p3'])
    const state = getCurrentState(updated)

    const p1 = state.players.find((p) => p.id === 'p1')!
    expect(hasEffect(p1, 'used_dead_vote')).toBe(false)
  })

  it('frees nominator and nominee again when a nomination is canceled before voting completes', () => {
    const players = makeStandardPlayers()
    const game = makeDayGame(players)

    const nominated = nominate(game, 'p1', 'p5')
    expect(getNominatorsToday(nominated)).toEqual(new Set(['p1']))
    expect(getNomineesToday(nominated)).toEqual(new Set(['p5']))

    const canceled = cancelNomination(nominated, 'p1', 'p5')
    expect(getNominatorsToday(canceled)).toEqual(new Set())
    expect(getNomineesToday(canceled)).toEqual(new Set())
  })
})

// ============================================================================
// MANUAL EFFECT MANAGEMENT
// ============================================================================

describe('manual effect management', () => {
  it('addEffectToPlayer adds an effect', () => {
    const players = makeStandardPlayers()
    const game = makeGame(makeState({ phase: 'day', round: 1, players }))

    const updated = addEffectToPlayer(game, 'p1', 'safe')
    const state = getCurrentState(updated)
    const p1 = state.players.find((p) => p.id === 'p1')!
    expect(hasEffect(p1, 'safe')).toBe(true)
  })

  it('removeEffectFromPlayer removes an effect', () => {
    const players = makeStandardPlayers()
    players[0] = addEffectTo(players[0], 'safe')
    const game = makeGame(makeState({ phase: 'day', round: 1, players }))

    const updated = removeEffectFromPlayer(game, 'p1', 'safe')
    const state = getCurrentState(updated)
    const p1 = state.players.find((p) => p.id === 'p1')!
    expect(hasEffect(p1, 'safe')).toBe(false)
  })
})
