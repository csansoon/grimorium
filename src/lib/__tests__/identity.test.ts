import { describe, expect, it } from 'vitest'
import {
  getAlignmentForTeam,
  getBaseAlignment,
  getBaseRoleId,
  getCurrentAlignment,
  getCurrentRoleId,
  getCurrentTeam,
  initializePlayerIdentity,
  isEvil,
  isGood,
} from '../identity'
import { addHistoryEntry, createGame } from '../game'
import { makeGame, makePlayer, makeState } from './helpers'
import { getCurrentState } from '../types'

describe('identity helpers', () => {
  it('initializes missing identity fields from the current role', () => {
    const player = initializePlayerIdentity({
      id: 'p1',
      name: 'Alice',
      roleId: 'imp',
      effects: [],
    })

    expect(player.baseRoleId).toBe('imp')
    expect(player.baseAlignment).toBe('evil')
    expect(player.currentAlignment).toBe('evil')
  })

  it('falls back to role-derived values when compatibility fields are absent', () => {
    const player = {
      id: 'p1',
      name: 'Alice',
      roleId: 'washerwoman',
      effects: [],
    }

    expect(getCurrentRoleId(player)).toBe('washerwoman')
    expect(getBaseRoleId(player)).toBe('washerwoman')
    expect(getCurrentTeam(player)).toBe('townsfolk')
    expect(getCurrentAlignment(player)).toBe('good')
    expect(getBaseAlignment(player)).toBe('good')
    expect(isGood(player)).toBe(true)
    expect(isEvil(player)).toBe(false)
  })

  it('maps teams to alignments consistently', () => {
    expect(getAlignmentForTeam('townsfolk')).toBe('good')
    expect(getAlignmentForTeam('outsider')).toBe('good')
    expect(getAlignmentForTeam('minion')).toBe('evil')
    expect(getAlignmentForTeam('demon')).toBe('evil')
  })
})

describe('identity compatibility in game state', () => {
  it('creates players with base and current identity populated', () => {
    const game = createGame('Test', 'custom', [
      { name: 'Alice', roleId: 'washerwoman' },
      { name: 'Bob', roleId: 'imp' },
    ])

    const state = getCurrentState(game)

    expect(state.players[0].baseRoleId).toBe('washerwoman')
    expect(state.players[0].baseAlignment).toBe('good')
    expect(state.players[0].currentAlignment).toBe('good')

    expect(state.players[1].baseRoleId).toBe('imp')
    expect(state.players[1].baseAlignment).toBe('evil')
    expect(state.players[1].currentAlignment).toBe('evil')
  })

  it('preserves base identity but updates current alignment on role change', () => {
    const player = makePlayer({ id: 'p1', roleId: 'washerwoman' })
    const game = makeGame(makeState({ players: [player] }))

    const updated = addHistoryEntry(
      game,
      {
        type: 'role_changed',
        message: [{ type: 'text', content: 'changed' }],
        data: { playerId: 'p1', fromRole: 'washerwoman', toRole: 'imp' },
      },
      undefined,
      undefined,
      undefined,
      undefined,
      { p1: 'imp' },
    )

    const nextPlayer = getCurrentState(updated).players[0]

    expect(nextPlayer.roleId).toBe('imp')
    expect(nextPlayer.baseRoleId).toBe('washerwoman')
    expect(nextPlayer.baseAlignment).toBe('good')
    expect(nextPlayer.currentAlignment).toBe('evil')
  })
})
