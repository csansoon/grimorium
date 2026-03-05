import { describe, expect, it } from 'vitest'
import { buildTransformationStateChanges } from '../transformations'
import { makePlayer, makeState } from './helpers'

describe('buildTransformationStateChanges', () => {
  it('builds role swap changes with reveal, queue, and status effects', () => {
    const state = makeState({
      players: [
        makePlayer({ id: 'charmer', roleId: 'snake_charmer' }),
        makePlayer({ id: 'demon', roleId: 'imp' }),
      ],
    })

    const changes = buildTransformationStateChanges(state, {
      kind: 'role_swap',
      source: {
        cause: 'snake_charmer_swap',
        playerId: 'charmer',
        roleId: 'snake_charmer',
      },
      targets: [
        {
          playerId: 'charmer',
          newRoleId: 'imp',
          reveal: 'immediate',
        },
        {
          playerId: 'demon',
          newRoleId: 'snake_charmer',
          reveal: 'pending',
          queuePolicy: 'skip_if_window_passed',
          addEffects: [{ type: 'poisoned', expiresAt: 'never' }],
        },
      ],
    })

    expect(changes.changeRoles).toEqual({
      charmer: 'imp',
      demon: 'snake_charmer',
    })
    expect(changes.addEffects?.demon).toEqual([
      { type: 'poisoned', expiresAt: 'never' },
      { type: 'pending_role_reveal', expiresAt: 'never' },
    ])
    expect(changes.entries.map((entry) => entry.type)).toEqual([
      'role_changed',
      'role_change_revealed',
      'role_changed',
      'night_queue_directive',
    ])
    expect(changes.entries[3].data).toMatchObject({
      playerId: 'demon',
      roleId: 'snake_charmer',
      directive: 'skip',
    })
  })

  it('emits alignment-only changes when explicitly requested', () => {
    const state = makeState({
      players: [makePlayer({ id: 'p1', roleId: 'washerwoman' })],
    })

    const changes = buildTransformationStateChanges(state, {
      kind: 'role_change',
      source: { cause: 'alignment_test' },
      targets: [
        {
          playerId: 'p1',
          newAlignment: 'evil',
        },
      ],
    })

    expect(changes.changeRoles).toBeUndefined()
    expect(changes.changeAlignments).toEqual({ p1: 'evil' })
  })

  it('preserves explicit alignment even when role changes team', () => {
    const state = makeState({
      players: [makePlayer({ id: 'p1', roleId: 'artist' })],
    })

    const changes = buildTransformationStateChanges(state, {
      kind: 'role_change',
      source: { cause: 'pit_hag_change' },
      targets: [
        {
          playerId: 'p1',
          newRoleId: 'vortox',
          newAlignment: 'good',
        },
      ],
    })

    expect(changes.changeRoles).toEqual({ p1: 'vortox' })
    expect(changes.changeAlignments).toEqual({ p1: 'good' })
  })

  it('can include initial effects of the new role', () => {
    const state = makeState({
      players: [makePlayer({ id: 'p1', roleId: 'villager' })],
    })

    const changes = buildTransformationStateChanges(state, {
      kind: 'role_change',
      source: { cause: 'role_gain' },
      targets: [
        {
          playerId: 'p1',
          newRoleId: 'soldier',
          includeNewRoleInitialEffects: true,
        },
      ],
    })

    expect(changes.changeRoles).toEqual({ p1: 'soldier' })
    expect(changes.addEffects?.p1).toEqual([
      { type: 'safe', expiresAt: 'never', data: { source: 'soldier' } },
    ])
  })

  it('removes role-bound effects from the transformed player', () => {
    const state = makeState({
      players: [
        {
          ...makePlayer({ id: 'p1', roleId: 'soldier' }),
          effects: [
            {
              id: 'safe-1',
              type: 'safe',
              data: { source: 'soldier' },
              expiresAt: 'never',
            },
            {
              id: 'drunk-1',
              type: 'drunk',
              data: { actualRole: 'drunk' },
              expiresAt: 'never',
            },
          ],
        },
      ],
    })

    const changes = buildTransformationStateChanges(state, {
      kind: 'role_change',
      source: { cause: 'barber_swap' },
      targets: [{ playerId: 'p1', newRoleId: 'imp' }],
    })

    expect(changes.removeEffects).toEqual({ p1: ['safe'] })
  })

  it('removes source-bound effects from other players when the source role changes', () => {
    const state = makeState({
      players: [
        makePlayer({ id: 'poisoner', roleId: 'poisoner' }),
        {
          ...makePlayer({ id: 'target', roleId: 'chef' }),
          effects: [
            {
              id: 'poisoned-1',
              type: 'poisoned',
              sourcePlayerId: 'poisoner',
              data: { source: 'poisoner' },
              expiresAt: 'end_of_day',
            },
          ],
        },
      ],
    })

    const changes = buildTransformationStateChanges(state, {
      kind: 'role_change',
      source: { cause: 'imp_starpass', playerId: 'imp', roleId: 'imp' },
      targets: [{ playerId: 'poisoner', newRoleId: 'imp' }],
    })

    expect(changes.removeEffects).toEqual({ target: ['poisoned'] })
  })
})
