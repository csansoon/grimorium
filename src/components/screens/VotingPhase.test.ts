import { describe, expect, it } from 'vitest'
import { addEffectTo, makePlayer, makeState } from '../../lib/__tests__/helpers'
import { canPlayerVote } from './VotingPhase'

describe('Butler voting', () => {
  it('requires a living Butler master to be voting', () => {
    const master = makePlayer({ id: 'master' })
    const butler = addEffectTo(
      makePlayer({ id: 'butler', roleId: 'butler' }),
      'butler_master',
      { masterId: master.id },
    )
    const state = makeState({ players: [master, butler] })

    expect(canPlayerVote(butler, state, { master: false })).toBe(false)
    expect(canPlayerVote(butler, state, { master: true })).toBe(true)
  })

  it('still enforces a spent ghost vote after the Butler dies', () => {
    let butler = addEffectTo(
      makePlayer({ id: 'butler', roleId: 'butler' }),
      'butler_master',
      {
        masterId: 'master',
      },
    )
    butler = addEffectTo(butler, 'dead')
    butler = addEffectTo(butler, 'used_dead_vote')
    const state = makeState({ players: [makePlayer({ id: 'master' }), butler] })

    expect(canPlayerVote(butler, state, { master: true })).toBe(false)
  })
})
