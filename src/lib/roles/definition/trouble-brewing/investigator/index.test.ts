import { describe, it, expect, beforeEach } from 'vitest'
import definition from '.'
import { perceive, canRegisterAsTeam } from '../../../../pipeline/perception'
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

describe('Investigator', () => {
  // ================================================================
  // SHOULD WAKE
  // ================================================================

  describe('shouldWake', () => {
    it('wakes only on the first night', () => {
      const player = makePlayer({ id: 'p1', roleId: 'investigator' })
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
        makePlayer({ id: 'p1', roleId: 'investigator' }),
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
  // PERCEPTION (Investigator uses "team" to find minions)
  // ================================================================

  describe('perception integration', () => {
    it('identifies minion correctly via team perception', () => {
      const investigator = makePlayer({
        id: 'p1',
        roleId: 'investigator',
      })

      // Imp is demon, not minion
      const imp = makePlayer({ id: 'p2', roleId: 'imp' })
      const stateWithImp = makeState({ players: [investigator, imp] })
      const perception = perceive(imp, investigator, 'team', stateWithImp)
      expect(perception.team).toBe('demon') // imp is demon, not minion
    })

    it('good player appearing as minion creates false positive', () => {
      const investigator = makePlayer({
        id: 'p1',
        roleId: 'investigator',
      })
      const villager = addEffectTo(
        makePlayer({ id: 'p2', roleId: 'villager' }),
        'misregister',
        { perceiveAs: { team: 'minion' } },
      )
      const state = makeState({ players: [investigator, villager] })

      const perception = perceive(villager, investigator, 'team', state)
      expect(perception.team).toBe('minion') // false positive
    })

    it('Recluse with misregister can register as minion', () => {
      const investigator = makePlayer({
        id: 'p1',
        roleId: 'investigator',
      })
      const recluse = addEffectTo(
        makePlayer({ id: 'p2', roleId: 'recluse' }),
        'misregister',
        {
          canRegisterAs: {
            teams: ['minion', 'demon'],
            alignments: ['evil'],
          },
        },
      )
      const state = makeState({ players: [investigator, recluse] })

      // perceive returns outsider (actual team) without perceiveAs config
      const perception = perceive(recluse, investigator, 'team', state)
      expect(perception.team).toBe('outsider')

      // But canRegisterAsTeam returns true (declared by instance data)
      expect(canRegisterAsTeam(recluse, 'minion')).toBe(true)
      expect(canRegisterAsTeam(recluse, 'demon')).toBe(true)
    })

    it('Recluse with perceiveAs configured shows as minion via perceive', () => {
      const investigator = makePlayer({
        id: 'p1',
        roleId: 'investigator',
      })
      const recluse = addEffectTo(
        makePlayer({ id: 'p2', roleId: 'recluse' }),
        'misregister',
        {
          canRegisterAs: {
            teams: ['minion', 'demon'],
            alignments: ['evil'],
          },
          perceiveAs: { team: 'minion', alignment: 'evil' },
        },
      )
      const state = makeState({ players: [investigator, recluse] })

      const perception = perceive(recluse, investigator, 'team', state)
      expect(perception.team).toBe('minion')
    })

    it('role shown is affected by role perception modifiers', () => {
      const investigator = makePlayer({
        id: 'p1',
        roleId: 'investigator',
      })
      const villager = addEffectTo(
        makePlayer({ id: 'p2', roleId: 'villager' }),
        'misregister',
        { perceiveAs: { roleId: 'imp' } },
      )
      const state = makeState({ players: [investigator, villager] })

      const rolePerception = perceive(villager, investigator, 'role', state)
      expect(rolePerception.roleId).toBe('imp') // shown wrong role
    })
  })
})
