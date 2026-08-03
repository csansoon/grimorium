import { describe, expect, it } from 'vitest'
import { syncDerivedEffects } from '../stateSync'
import { generateId } from '../types'
import { addEffectTo, makePlayer, makeState } from './helpers'

describe('syncDerivedEffects philosopher drunk links', () => {
  it('keeps philosopher-sourced drunk while the source player is alive', () => {
    const source = makePlayer({ id: 'phil', roleId: 'savant' })
    const target = makePlayer({
      id: 'savant',
      roleId: 'savant',
      effects: [
        {
          id: generateId(),
          type: 'drunk',
          data: {
            source: 'philosopher',
            philosopherId: 'phil',
            chosenRoleId: 'savant',
          },
          sourcePlayerId: 'phil',
          expiresAt: 'never',
        },
      ],
    })

    const synced = syncDerivedEffects(
      makeState({
        phase: 'night',
        round: 2,
        players: [source, target],
      }),
    )

    const syncedTarget = synced.players.find((player) => player.id === 'savant')
    expect(syncedTarget).toBeDefined()
    expect(
      syncedTarget?.effects.some(
        (effect) =>
          effect.type === 'drunk' &&
          effect.data?.source === 'philosopher' &&
          effect.sourcePlayerId === 'phil',
      ),
    ).toBe(true)
  })

  it('removes philosopher-sourced drunk when the source player is dead', () => {
    const deadSource = addEffectTo(
      makePlayer({ id: 'phil', roleId: 'savant' }),
      'dead',
    )
    const target = makePlayer({
      id: 'savant',
      roleId: 'savant',
      effects: [
        {
          id: generateId(),
          type: 'drunk',
          data: {
            source: 'philosopher',
            philosopherId: 'phil',
            chosenRoleId: 'savant',
          },
          sourcePlayerId: 'phil',
          expiresAt: 'never',
        },
      ],
    })

    const synced = syncDerivedEffects(
      makeState({
        phase: 'night',
        round: 2,
        players: [deadSource, target],
      }),
    )

    const syncedTarget = synced.players.find((player) => player.id === 'savant')
    expect(syncedTarget).toBeDefined()
    expect(
      syncedTarget?.effects.some(
        (effect) =>
          effect.type === 'drunk' && effect.data?.source === 'philosopher',
      ),
    ).toBe(false)
  })

  it('removes philosopher-sourced drunk when the source player is poisoned', () => {
    const poisonedSource = addEffectTo(
      makePlayer({ id: 'phil', roleId: 'savant' }),
      'poisoned',
      { source: 'poisoner' },
      'end_of_day',
    )
    const target = makePlayer({
      id: 'savant',
      roleId: 'savant',
      effects: [
        {
          id: generateId(),
          type: 'drunk',
          data: {
            source: 'philosopher',
            philosopherId: 'phil',
            chosenRoleId: 'savant',
          },
          sourcePlayerId: 'phil',
          expiresAt: 'never',
        },
      ],
    })

    const synced = syncDerivedEffects(
      makeState({
        phase: 'night',
        round: 2,
        players: [poisonedSource, target],
      }),
    )

    const syncedTarget = synced.players.find((player) => player.id === 'savant')
    expect(syncedTarget).toBeDefined()
    expect(
      syncedTarget?.effects.some(
        (effect) =>
          effect.type === 'drunk' && effect.data?.source === 'philosopher',
      ),
    ).toBe(false)
  })

  it('removes philosopher-sourced drunk when the source player is drunk', () => {
    const drunkSource = addEffectTo(
      makePlayer({ id: 'phil', roleId: 'savant' }),
      'drunk',
      { source: 'sweetheart' },
    )
    const target = makePlayer({
      id: 'savant',
      roleId: 'savant',
      effects: [
        {
          id: generateId(),
          type: 'drunk',
          data: {
            source: 'philosopher',
            philosopherId: 'phil',
            chosenRoleId: 'savant',
          },
          sourcePlayerId: 'phil',
          expiresAt: 'never',
        },
      ],
    })

    const synced = syncDerivedEffects(
      makeState({
        phase: 'night',
        round: 2,
        players: [drunkSource, target],
      }),
    )

    const syncedTarget = synced.players.find((player) => player.id === 'savant')
    expect(syncedTarget).toBeDefined()
    expect(
      syncedTarget?.effects.some(
        (effect) =>
          effect.type === 'drunk' && effect.data?.source === 'philosopher',
      ),
    ).toBe(false)
  })
})
