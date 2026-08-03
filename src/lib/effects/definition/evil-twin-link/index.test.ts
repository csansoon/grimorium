import { beforeEach, describe, expect, it } from 'vitest'
import definition from '.'
import {
  addEffectTo,
  makeGameWithHistory,
  makePlayer,
  makeState,
  resetPlayerCounter,
} from '../../../__tests__/helpers'

beforeEach(() => resetPlayerCounter())

describe('EvilTwinLink effect', () => {
  const winCondition = definition.winConditions![0]

  it('gives good the win when the evil twin is executed', () => {
    const evilTwin = addEffectTo(
      makePlayer({ id: 'evil', roleId: 'evil_twin' }),
      'evil_twin_link',
      { counterpartId: 'good', isEvilTwin: true },
    )
    const goodTwin = addEffectTo(
      makePlayer({ id: 'good', roleId: 'chef' }),
      'evil_twin_link',
      { counterpartId: 'evil', isEvilTwin: false },
    )
    const state = makeState({
      phase: 'day',
      round: 3,
      players: [evilTwin, goodTwin, makePlayer({ id: 'imp', roleId: 'imp' })],
    })
    const game = makeGameWithHistory([{ type: 'execution', data: { playerId: 'evil' } }], state)

    expect(winCondition.check(state, game)).toBe('townsfolk')
  })

  it('gives evil the win when the good twin is executed', () => {
    const evilTwin = addEffectTo(
      makePlayer({ id: 'evil', roleId: 'evil_twin' }),
      'evil_twin_link',
      { counterpartId: 'good', isEvilTwin: true },
    )
    const goodTwin = addEffectTo(
      makePlayer({ id: 'good', roleId: 'chef' }),
      'evil_twin_link',
      { counterpartId: 'evil', isEvilTwin: false },
    )
    const state = makeState({
      phase: 'day',
      round: 3,
      players: [evilTwin, goodTwin, makePlayer({ id: 'imp', roleId: 'imp' })],
    })
    const game = makeGameWithHistory([{ type: 'execution', data: { playerId: 'good' } }], state)

    expect(winCondition.check(state, game)).toBe('demon')
  })
})
