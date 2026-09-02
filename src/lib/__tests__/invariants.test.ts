import { describe, expect, it } from 'vitest'
import { addHistoryEntry } from '../game'
import { makeGame, makePlayer, makeState } from './helpers'
import { assertEngineInvariants } from '../testing/invariants'
import { runScenario } from '../testing/scenarioRunner'

describe('engine invariants', () => {
  it('passes for a healthy drained night scenario', () => {
    const ctx = runScenario({
      name: 'Invariant Healthy Night',
      roles: ['imp', 'poisoner', 'washerwoman', 'chef', 'villager'],
      steps: [{ type: 'start_night' }, { type: 'drain_night' }],
    })

    expect(() => assertEngineInvariants(ctx.game)).not.toThrow()
  })

  it('fails on dangling source-bound effect references', () => {
    const game = makeGame(
      makeState({
        phase: 'day',
        round: 1,
        players: [
          makePlayer({
            id: 'alive-player',
            roleId: 'washerwoman',
          }),
        ],
      }),
    )

    const corrupted = addHistoryEntry(
      game,
      {
        type: 'effect_added',
        message: [{ type: 'text', content: 'corrupt source effect' }],
        data: {},
      },
      undefined,
      {
        'alive-player': [
          {
            type: 'poisoned',
            sourcePlayerId: 'missing-source',
          },
        ],
      },
    )

    expect(() => assertEngineInvariants(corrupted)).toThrow(/Dangling sourcePlayerId/)
  })
})

