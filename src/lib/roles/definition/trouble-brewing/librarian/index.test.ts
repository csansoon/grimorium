import { describe, it, expect, beforeEach } from 'vitest'
import definition from '.'
import { perceive } from '../../../../pipeline/perception'
import {
  makePlayer,
  makeState,
  addEffectTo,
  makeGameWithHistory,
  resetPlayerCounter,
} from '../../../../__tests__/helpers'

beforeEach(() => {
  resetPlayerCounter()
})

describe('Librarian', () => {
  // ================================================================
  // SHOULD WAKE
  // ================================================================

  describe('shouldWake', () => {
    it('wakes only on the first night', () => {
      const player = makePlayer({ id: 'p1', roleId: 'librarian' })
      const round1 = makeGameWithHistory(
        [
          {
            type: 'night_started',
            data: { round: 1 },
            stateOverrides: { round: 1 },
          },
        ],
        makeState({ round: 1, players: [player] }),
      )
      const round2 = makeGameWithHistory(
        [
          {
            type: 'night_started',
            data: { round: 2 },
            stateOverrides: { round: 2 },
          },
        ],
        makeState({ round: 2, players: [player] }),
      )

      expect(definition.shouldWake!(round1, player)).toBe(true)
      expect(definition.shouldWake!(round2, player)).toBe(false)
    })

    it('does not wake when dead', () => {
      const player = addEffectTo(
        makePlayer({ id: 'p1', roleId: 'librarian' }),
        'dead',
      )
      const game = makeGameWithHistory(
        [
          {
            type: 'night_started',
            data: { round: 1 },
            stateOverrides: { round: 1 },
          },
        ],
        makeState({ round: 1, players: [player] }),
      )
      expect(definition.shouldWake!(game, player)).toBe(false)
    })
  })

  // ================================================================
  // PERCEPTION (Librarian uses "team" to find outsiders)
  // ================================================================

  describe('perception integration', () => {
    it('identifies outsider correctly via team perception', () => {
      const librarian = makePlayer({ id: 'p1', roleId: 'librarian' })
      const saint = makePlayer({ id: 'p2', roleId: 'saint' })
      const state = makeState({ players: [librarian, saint] })

      const perception = perceive(saint, librarian, 'team', state)
      expect(perception.team).toBe('outsider')
    })

    it('does not identify townsfolk as outsider', () => {
      const librarian = makePlayer({ id: 'p1', roleId: 'librarian' })
      const villager = makePlayer({ id: 'p2', roleId: 'villager' })
      const state = makeState({ players: [librarian, villager] })

      const perception = perceive(villager, librarian, 'team', state)
      expect(perception.team).toBe('townsfolk')
    })

    it('evil player appearing as outsider creates false positive', () => {
      const librarian = makePlayer({ id: 'p1', roleId: 'librarian' })
      const imp = addEffectTo(
        makePlayer({ id: 'p2', roleId: 'imp' }),
        'misregister',
        { perceiveAs: { team: 'outsider' } },
      )
      const state = makeState({ players: [librarian, imp] })

      const perception = perceive(imp, librarian, 'team', state)
      expect(perception.team).toBe('outsider') // false positive
    })

    it('outsider appearing as townsfolk creates false negative', () => {
      const librarian = makePlayer({ id: 'p1', roleId: 'librarian' })
      const saint = addEffectTo(
        makePlayer({ id: 'p2', roleId: 'saint' }),
        'misregister',
        { perceiveAs: { team: 'townsfolk' } },
      )
      const state = makeState({ players: [librarian, saint] })

      const perception = perceive(saint, librarian, 'team', state)
      expect(perception.team).toBe('townsfolk') // real outsider hidden
    })
  })
})
