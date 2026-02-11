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

describe('SpyMisregister', () => {
  describe('perception modifier', () => {
    it('does not alter perception when no perceiveAs data is set', () => {
      const observer = makePlayer({ id: 'obs', roleId: 'chef' })
      const spy = addEffectTo(
        makePlayer({ id: 's1', roleId: 'spy' }),
        'spy_misregister',
      )
      const state = makeState({ players: [observer, spy] })

      const alignment = perceive(spy, observer, 'alignment', state)
      expect(alignment.alignment).toBe('evil')

      const team = perceive(spy, observer, 'team', state)
      expect(team.team).toBe('minion')

      const role = perceive(spy, observer, 'role', state)
      expect(role.roleId).toBe('spy')
    })

    it('registers as good alignment when perceiveAs overrides alignment', () => {
      const observer = makePlayer({ id: 'obs', roleId: 'chef' })
      const spy = addEffectTo(
        makePlayer({ id: 's1', roleId: 'spy' }),
        'spy_misregister',
        {
          perceiveAs: { alignment: 'good' },
        },
      )
      const state = makeState({ players: [observer, spy] })

      const perception = perceive(spy, observer, 'alignment', state)
      expect(perception.alignment).toBe('good')
      // Team and role should remain unchanged
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
        'spy_misregister',
        {
          perceiveAs: { team: 'townsfolk' },
        },
      )
      const state = makeState({ players: [observer, spy] })

      const perception = perceive(spy, observer, 'team', state)
      expect(perception.team).toBe('townsfolk')
      // Alignment and role unchanged
      expect(perception.alignment).toBe('evil')
      expect(perception.roleId).toBe('spy')
    })

    it('registers as outsider team when perceiveAs overrides team', () => {
      const observer = makePlayer({
        id: 'obs',
        roleId: 'washerwoman',
      })
      const spy = addEffectTo(
        makePlayer({ id: 's1', roleId: 'spy' }),
        'spy_misregister',
        {
          perceiveAs: { team: 'outsider' },
        },
      )
      const state = makeState({ players: [observer, spy] })

      const perception = perceive(spy, observer, 'team', state)
      expect(perception.team).toBe('outsider')
    })

    it('registers as a specific Townsfolk role when perceiveAs overrides roleId', () => {
      const observer = makePlayer({
        id: 'obs',
        roleId: 'undertaker',
      })
      const spy = addEffectTo(
        makePlayer({ id: 's1', roleId: 'spy' }),
        'spy_misregister',
        {
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

    it('applies overrides in all perception contexts', () => {
      const observer = makePlayer({ id: 'obs', roleId: 'empath' })
      const spy = addEffectTo(
        makePlayer({ id: 's1', roleId: 'spy' }),
        'spy_misregister',
        {
          perceiveAs: { alignment: 'good', team: 'townsfolk' },
        },
      )
      const state = makeState({ players: [observer, spy] })

      // "alignment" context
      expect(perceive(spy, observer, 'alignment', state).alignment).toBe('good')
      // "team" context
      expect(perceive(spy, observer, 'team', state).team).toBe('townsfolk')
      // "role" context also applies team/alignment overrides
      const rolePerception = perceive(spy, observer, 'role', state)
      expect(rolePerception.alignment).toBe('good')
      expect(rolePerception.team).toBe('townsfolk')
    })

    it('works regardless of observer role (not restricted)', () => {
      const chef = makePlayer({ id: 'obs1', roleId: 'chef' })
      const empath = makePlayer({ id: 'obs2', roleId: 'empath' })
      const fortuneTeller = makePlayer({
        id: 'obs3',
        roleId: 'fortune_teller',
      })
      const spy = addEffectTo(
        makePlayer({ id: 's1', roleId: 'spy' }),
        'spy_misregister',
        {
          perceiveAs: { alignment: 'good' },
        },
      )
      const state = makeState({
        players: [chef, empath, fortuneTeller, spy],
      })

      expect(perceive(spy, chef, 'alignment', state).alignment).toBe('good')
      expect(perceive(spy, empath, 'alignment', state).alignment).toBe('good')
      expect(perceive(spy, fortuneTeller, 'alignment', state).alignment).toBe(
        'good',
      )
    })

    it('works even when the Spy is dead', () => {
      const observer = makePlayer({ id: 'obs', roleId: 'undertaker' })
      let spy = addEffectTo(
        makePlayer({ id: 's1', roleId: 'spy' }),
        'spy_misregister',
        {
          perceiveAs: { roleId: 'washerwoman', team: 'townsfolk' },
        },
      )
      spy = addEffectTo(spy, 'dead')
      const state = makeState({ players: [observer, spy] })

      const perception = perceive(spy, observer, 'role', state)
      expect(perception.roleId).toBe('washerwoman')
      expect(perception.team).toBe('townsfolk')
    })

    it('only overrides fields specified in perceiveAs (partial overrides)', () => {
      const observer = makePlayer({ id: 'obs', roleId: 'empath' })
      // Only override alignment, leave team and roleId as-is
      const spy = addEffectTo(
        makePlayer({ id: 's1', roleId: 'spy' }),
        'spy_misregister',
        {
          perceiveAs: { alignment: 'good' },
        },
      )
      const state = makeState({ players: [observer, spy] })

      const perception = perceive(spy, observer, 'alignment', state)
      expect(perception.alignment).toBe('good')
      expect(perception.team).toBe('minion') // unchanged
      expect(perception.roleId).toBe('spy') // unchanged
    })
  })
})
