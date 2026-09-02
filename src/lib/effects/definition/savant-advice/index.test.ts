import { beforeEach, describe, expect, it } from 'vitest'
import definition from '.'
import {
  addEffectTo,
  makePlayer,
  makeState,
  resetPlayerCounter,
} from '../../../__tests__/helpers'

beforeEach(() => resetPlayerCounter())

describe('SavantAdvice effect', () => {
  const dayAction = definition.dayActions![0]

  it('is available when the player is alive and has the savant_advice effect', () => {
    const savant = addEffectTo(
      makePlayer({ id: 'savant', roleId: 'savant' }),
      'savant_advice',
    )
    const state = makeState({ phase: 'day', players: [savant] })
    expect(dayAction.condition(savant, state)).toBe(true)
  })

  it('is not available when the player is dead', () => {
    let savant = addEffectTo(
      makePlayer({ id: 'savant', roleId: 'savant' }),
      'savant_advice',
    )
    savant = addEffectTo(savant, 'dead')
    const state = makeState({ phase: 'day', players: [savant] })
    expect(dayAction.condition(savant, state)).toBe(false)
  })
})
