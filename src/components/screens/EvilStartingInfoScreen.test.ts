import { describe, expect, it } from 'vitest'
import { getDemonBluffCandidates } from './EvilStartingInfoScreen'
import {
  addEffectTo,
  makeGame,
  makePlayer,
  makeState,
} from '../../lib/__tests__/helpers'

describe('Demon starting bluffs', () => {
  it('offers only out-of-play good characters from the selected script', () => {
    const state = makeState({
      players: [
        makePlayer({ roleId: 'imp' }),
        makePlayer({ roleId: 'chef' }),
        makePlayer({ roleId: 'saint' }),
      ],
    })
    const game = { ...makeGame(state), scriptId: 'trouble-brewing' }
    const ids = getDemonBluffCandidates(game, state).map((role) => role.id)

    expect(ids).not.toContain('chef')
    expect(ids).not.toContain('saint')
    expect(ids).not.toContain('villager')
    expect(ids).toContain('washerwoman')
  })

  it("treats the Drunk's believed Townsfolk as out of play", () => {
    const drunk = addEffectTo(makePlayer({ roleId: 'chef' }), 'drunk', {
      actualRole: 'drunk',
    })
    const state = makeState({
      players: [makePlayer({ roleId: 'imp' }), drunk],
    })
    const game = { ...makeGame(state), scriptId: 'trouble-brewing' }
    const ids = getDemonBluffCandidates(game, state).map((role) => role.id)

    expect(ids).toContain('chef')
    expect(ids).not.toContain('drunk')
  })
})
