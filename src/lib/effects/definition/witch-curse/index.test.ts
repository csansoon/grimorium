import { beforeEach, describe, expect, it } from 'vitest'
import definition from '.'
import { NominateIntent } from '../../../pipeline/types'
import {
  addEffectTo,
  makeGame,
  makePlayer,
  makeState,
  resetPlayerCounter,
} from '../../../__tests__/helpers'

beforeEach(() => resetPlayerCounter())

describe('WitchCurse effect', () => {
  const handler = definition.handlers![0]

  it('applies when the cursed player nominates', () => {
    const cursed = addEffectTo(
      makePlayer({ id: 'cursed', roleId: 'washerwoman' }),
      'witch_curse',
      { witchId: 'witch' },
      'end_of_day',
    )
    const state = makeState({
      phase: 'day',
      round: 2,
      players: [cursed, makePlayer({ id: 'nominee', roleId: 'chef' })],
    })
    const intent: NominateIntent = {
      type: 'nominate',
      nominatorId: 'cursed',
      nomineeId: 'nominee',
    }

    expect(handler.appliesTo(intent, cursed, state)).toBe(true)
  })

  it('kills the nominator and removes the curse when triggered', () => {
    const cursed = addEffectTo(
      makePlayer({ id: 'cursed', roleId: 'washerwoman' }),
      'witch_curse',
      { witchId: 'witch' },
      'end_of_day',
    )
    const nominee = makePlayer({ id: 'nominee', roleId: 'chef' })
    const state = makeState({
      phase: 'day',
      round: 2,
      players: [cursed, nominee],
    })
    const game = makeGame(state)
    const intent: NominateIntent = {
      type: 'nominate',
      nominatorId: 'cursed',
      nomineeId: 'nominee',
    }

    const result = handler.handle(intent, cursed, state, game)
    expect(result.action).toBe('allow')
    if (result.action !== 'allow') return

    expect(result.stateChanges?.entries).toEqual([
      expect.objectContaining({
        type: 'execution',
        data: expect.objectContaining({
          playerId: 'cursed',
          cause: 'witch',
          witchTriggered: true,
        }),
      }),
    ])
    expect(result.stateChanges?.addEffects).toEqual({
      cursed: [
        expect.objectContaining({
          type: 'dead',
          data: { cause: 'witch' },
          expiresAt: 'never',
        }),
      ],
    })
    expect(result.stateChanges?.removeEffects).toEqual({
      cursed: ['witch_curse'],
    })
  })
})
