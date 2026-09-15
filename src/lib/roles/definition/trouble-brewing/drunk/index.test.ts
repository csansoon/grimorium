import { it, expect } from 'vitest'
import definition, {
  createDrunkSetupResult,
  getDrunkBelievedRoleOptions,
} from '.'
import { makePlayer, makeState } from '../../../../__tests__/helpers'

// The Drunk's ability malfunction behavior is tested in Drunk.test.ts (effects).
// The Drunk's unconditional perception modifier is also tested there.
// The SetupAction component is UI-based and tested via the component.

it('Drunk has no NightAction (acts as the believed role)', () => {
  expect(definition.NightAction).toBeNull()
})

it('Drunk has no nightOrder (never wakes as Drunk)', () => {
  expect(definition.nightOrder).toBeNull()
})

it('Drunk is an outsider', () => {
  expect(definition.team).toBe('outsider')
})

it('Drunk has a SetupAction for choosing believed role', () => {
  expect(definition.SetupAction).toBeDefined()
})

it('only offers official Townsfolk characters that are not in play', () => {
  const state = makeState({
    players: [
      makePlayer({ roleId: 'drunk' }),
      makePlayer({ roleId: 'chef' }),
      makePlayer({ roleId: 'imp' }),
    ],
  })

  const options = getDrunkBelievedRoleOptions(state)

  expect(options.every((role) => role.team === 'townsfolk')).toBe(true)
  expect(options.map((role) => role.id)).not.toContain('chef')
  expect(options.map((role) => role.id)).not.toContain('villager')
  expect(options.map((role) => role.id)).toContain('empath')
})

it('gives a Drunk Slayer one apparent shot', () => {
  const result = createDrunkSetupResult('drunk-player', 'slayer')

  expect(result.addEffects?.['drunk-player']).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ type: 'drunk' }),
      expect.objectContaining({ type: 'slayer_bullet' }),
    ]),
  )
})

it('does not grant another believed role its passive effects', () => {
  const result = createDrunkSetupResult('drunk-player', 'soldier')

  expect(
    result.addEffects?.['drunk-player']?.map((effect) => effect.type),
  ).toEqual(['drunk'])
})
