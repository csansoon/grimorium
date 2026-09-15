import { describe, expect, it } from 'vitest'
import { makePlayer, makeState } from '../../lib/__tests__/helpers'
import { getEvilTeamMembers } from './EvilTeamReveal'

describe('getEvilTeamMembers', () => {
  it('exposes player names and teams without character IDs', () => {
    const viewer = makePlayer({ id: 'spy', name: 'Spy', roleId: 'spy' })
    const state = makeState({
      players: [
        viewer,
        makePlayer({ id: 'imp', name: 'Demon', roleId: 'imp' }),
        makePlayer({ id: 'poisoner', name: 'Minion', roleId: 'poisoner' }),
        makePlayer({ id: 'chef', name: 'Good', roleId: 'chef' }),
      ],
    })

    expect(getEvilTeamMembers(state, viewer)).toEqual([
      { playerId: 'imp', playerName: 'Demon', team: 'demon' },
      { playerId: 'poisoner', playerName: 'Minion', team: 'minion' },
    ])
  })
})
