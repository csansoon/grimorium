import { describe, it, expect, beforeEach } from 'vitest'
import { perceive } from '../../../pipeline/perception'
import {
  makePlayer,
  makeState,
  addEffectTo,
  resetPlayerCounter,
} from '../../../__tests__/helpers'

beforeEach(() => {
  resetPlayerCounter()
})

describe('Misregister', () => {
  describe('perception modifier (Recluse — evil misregistration)', () => {
    const recluseData = {
      canRegisterAs: { teams: ['minion', 'demon'], alignments: ['evil'] },
    }

    it('does not alter perception when no perceiveAs data is set', () => {
      const observer = makePlayer({ id: 'obs', roleId: 'chef' })
      const recluse = addEffectTo(
        makePlayer({ id: 'r1', roleId: 'recluse' }),
        'misregister',
        recluseData,
      )
      const state = makeState({ players: [observer, recluse] })

      const alignment = perceive(recluse, observer, 'alignment', state)
      expect(alignment.alignment).toBe('good')

      const team = perceive(recluse, observer, 'team', state)
      expect(team.team).toBe('outsider')

      const role = perceive(recluse, observer, 'role', state)
      expect(role.roleId).toBe('recluse')
    })

    it('registers as evil alignment when perceiveAs overrides alignment', () => {
      const observer = makePlayer({ id: 'obs', roleId: 'chef' })
      const recluse = addEffectTo(
        makePlayer({ id: 'r1', roleId: 'recluse' }),
        'misregister',
        { ...recluseData, perceiveAs: { alignment: 'evil' } },
      )
      const state = makeState({ players: [observer, recluse] })

      const perception = perceive(recluse, observer, 'alignment', state)
      expect(perception.alignment).toBe('evil')
      // Team and role should remain unchanged
      expect(perception.team).toBe('outsider')
      expect(perception.roleId).toBe('recluse')
    })

    it('registers as minion team when perceiveAs overrides team', () => {
      const observer = makePlayer({
        id: 'obs',
        roleId: 'washerwoman',
      })
      const recluse = addEffectTo(
        makePlayer({ id: 'r1', roleId: 'recluse' }),
        'misregister',
        { ...recluseData, perceiveAs: { team: 'minion' } },
      )
      const state = makeState({ players: [observer, recluse] })

      const perception = perceive(recluse, observer, 'team', state)
      expect(perception.team).toBe('minion')
      // Alignment and role unchanged
      expect(perception.alignment).toBe('good')
      expect(perception.roleId).toBe('recluse')
    })

    it('registers as demon team when perceiveAs overrides team', () => {
      const observer = makePlayer({
        id: 'obs',
        roleId: 'washerwoman',
      })
      const recluse = addEffectTo(
        makePlayer({ id: 'r1', roleId: 'recluse' }),
        'misregister',
        { ...recluseData, perceiveAs: { team: 'demon' } },
      )
      const state = makeState({ players: [observer, recluse] })

      const perception = perceive(recluse, observer, 'team', state)
      expect(perception.team).toBe('demon')
    })

    it('registers as a specific Minion role when perceiveAs overrides roleId', () => {
      const observer = makePlayer({
        id: 'obs',
        roleId: 'undertaker',
      })
      const recluse = addEffectTo(
        makePlayer({ id: 'r1', roleId: 'recluse' }),
        'misregister',
        {
          ...recluseData,
          perceiveAs: { roleId: 'imp', team: 'demon', alignment: 'evil' },
        },
      )
      const state = makeState({ players: [observer, recluse] })

      const perception = perceive(recluse, observer, 'role', state)
      expect(perception.roleId).toBe('imp')
      expect(perception.team).toBe('demon')
      expect(perception.alignment).toBe('evil')
    })

    it('applies overrides in all perception contexts', () => {
      const observer = makePlayer({ id: 'obs', roleId: 'empath' })
      const recluse = addEffectTo(
        makePlayer({ id: 'r1', roleId: 'recluse' }),
        'misregister',
        {
          ...recluseData,
          perceiveAs: { alignment: 'evil', team: 'minion' },
        },
      )
      const state = makeState({ players: [observer, recluse] })

      expect(perceive(recluse, observer, 'alignment', state).alignment).toBe(
        'evil',
      )
      expect(perceive(recluse, observer, 'team', state).team).toBe('minion')
      const rolePerception = perceive(recluse, observer, 'role', state)
      expect(rolePerception.alignment).toBe('evil')
      expect(rolePerception.team).toBe('minion')
    })

    it('works regardless of observer role (not restricted)', () => {
      const chef = makePlayer({ id: 'obs1', roleId: 'chef' })
      const empath = makePlayer({ id: 'obs2', roleId: 'empath' })
      const fortuneTeller = makePlayer({
        id: 'obs3',
        roleId: 'fortune_teller',
      })
      const recluse = addEffectTo(
        makePlayer({ id: 'r1', roleId: 'recluse' }),
        'misregister',
        { ...recluseData, perceiveAs: { alignment: 'evil' } },
      )
      const state = makeState({
        players: [chef, empath, fortuneTeller, recluse],
      })

      expect(perceive(recluse, chef, 'alignment', state).alignment).toBe('evil')
      expect(perceive(recluse, empath, 'alignment', state).alignment).toBe(
        'evil',
      )
      expect(
        perceive(recluse, fortuneTeller, 'alignment', state).alignment,
      ).toBe('evil')
    })

    it('works even when the player is dead', () => {
      const observer = makePlayer({ id: 'obs', roleId: 'undertaker' })
      let recluse = addEffectTo(
        makePlayer({ id: 'r1', roleId: 'recluse' }),
        'misregister',
        { ...recluseData, perceiveAs: { roleId: 'imp', team: 'demon' } },
      )
      recluse = addEffectTo(recluse, 'dead')
      const state = makeState({ players: [observer, recluse] })

      const perception = perceive(recluse, observer, 'role', state)
      expect(perception.roleId).toBe('imp')
      expect(perception.team).toBe('demon')
    })

    it('only overrides fields specified in perceiveAs (partial overrides)', () => {
      const observer = makePlayer({ id: 'obs', roleId: 'empath' })
      const recluse = addEffectTo(
        makePlayer({ id: 'r1', roleId: 'recluse' }),
        'misregister',
        { ...recluseData, perceiveAs: { alignment: 'evil' } },
      )
      const state = makeState({ players: [observer, recluse] })

      const perception = perceive(recluse, observer, 'alignment', state)
      expect(perception.alignment).toBe('evil')
      expect(perception.team).toBe('outsider') // unchanged
      expect(perception.roleId).toBe('recluse') // unchanged
    })
  })

  describe('perception modifier (Spy — good misregistration)', () => {
    const spyData = {
      canRegisterAs: { teams: ['townsfolk', 'outsider'], alignments: ['good'] },
    }

    it('registers as good alignment when perceiveAs overrides alignment', () => {
      const observer = makePlayer({ id: 'obs', roleId: 'chef' })
      const spy = addEffectTo(
        makePlayer({ id: 's1', roleId: 'spy' }),
        'misregister',
        { ...spyData, perceiveAs: { alignment: 'good' } },
      )
      const state = makeState({ players: [observer, spy] })

      const perception = perceive(spy, observer, 'alignment', state)
      expect(perception.alignment).toBe('good')
      expect(perception.team).toBe('minion')
      expect(perception.roleId).toBe('spy')
    })

    it('registers as townsfolk team when perceiveAs overrides team', () => {
      const observer = makePlayer({
        id: 'obs',
        roleId: 'washerwoman',
      })
      const spy = addEffectTo(
        makePlayer({ id: 's1', roleId: 'spy' }),
        'misregister',
        { ...spyData, perceiveAs: { team: 'townsfolk' } },
      )
      const state = makeState({ players: [observer, spy] })

      const perception = perceive(spy, observer, 'team', state)
      expect(perception.team).toBe('townsfolk')
      expect(perception.alignment).toBe('evil')
      expect(perception.roleId).toBe('spy')
    })

    it('registers as a specific Townsfolk role when perceiveAs overrides roleId', () => {
      const observer = makePlayer({
        id: 'obs',
        roleId: 'undertaker',
      })
      const spy = addEffectTo(
        makePlayer({ id: 's1', roleId: 'spy' }),
        'misregister',
        {
          ...spyData,
          perceiveAs: {
            roleId: 'washerwoman',
            team: 'townsfolk',
            alignment: 'good',
          },
        },
      )
      const state = makeState({ players: [observer, spy] })

      const perception = perceive(spy, observer, 'role', state)
      expect(perception.roleId).toBe('washerwoman')
      expect(perception.team).toBe('townsfolk')
      expect(perception.alignment).toBe('good')
    })
  })
})
