import { describe, it, expect, beforeEach } from 'vitest'
import definition from '.'
import {
  makePlayer,
  makeState,
  addEffectTo,
  resetPlayerCounter,
} from '../../../__tests__/helpers'
import {
  buildSlayerShotResult,
  shouldPromptForSlayerDemonRegistration,
} from '../../../../components/screens/SlayerActionScreen'

const recluseMisregisterData = {
  canRegisterAs: { teams: ['minion', 'demon'], alignments: ['evil'] },
}

beforeEach(() => resetPlayerCounter())

describe('SlayerBullet effect', () => {
  const dayAction = definition.dayActions![0]

  // ================================================================
  // DAY ACTION CONDITION
  // ================================================================

  describe('day action condition', () => {
    it('available when player is alive and has the slayer_bullet effect', () => {
      const slayer = addEffectTo(
        makePlayer({ id: 'p1', roleId: 'slayer' }),
        'slayer_bullet',
      )
      const state = makeState({ players: [slayer] })
      expect(dayAction.condition(slayer, state)).toBe(true)
    })

    it('not available when player is dead', () => {
      let slayer = addEffectTo(
        makePlayer({ id: 'p1', roleId: 'slayer' }),
        'slayer_bullet',
      )
      slayer = addEffectTo(slayer, 'dead')
      const state = makeState({ players: [slayer] })
      expect(dayAction.condition(slayer, state)).toBe(false)
    })

    it('not available when slayer_bullet has been removed (already used)', () => {
      // Player without slayer_bullet effect
      const slayer = makePlayer({ id: 'p1', roleId: 'slayer' })
      const state = makeState({ players: [slayer] })
      expect(dayAction.condition(slayer, state)).toBe(false)
    })
  })

  // ================================================================
  // DAY ACTION METADATA
  // ================================================================

  describe('day action metadata', () => {
    it('has a UI component for the action', () => {
      expect(dayAction.ActionComponent).toBeDefined()
    })
  })

  // ================================================================
  // SLAYER SHOT PERCEPTION
  // ================================================================

  describe('slayer demon registration prompt', () => {
    it('prompts when the target can register as the Demon', () => {
      const slayer = makePlayer({ id: 'slayer', roleId: 'slayer' })
      const recluse = addEffectTo(
        makePlayer({ id: 'recluse', roleId: 'recluse' }),
        'misregister',
        recluseMisregisterData,
      )

      expect(shouldPromptForSlayerDemonRegistration(slayer, recluse)).toBe(
        true,
      )
    })

    it('does not prompt for a target that cannot register as the Demon', () => {
      const slayer = makePlayer({ id: 'slayer', roleId: 'slayer' })
      const saint = makePlayer({ id: 'saint', roleId: 'saint' })

      expect(shouldPromptForSlayerDemonRegistration(slayer, saint)).toBe(false)
    })

    it('does not prompt when the Slayer is malfunctioning', () => {
      const slayer = addEffectTo(
        makePlayer({ id: 'slayer', roleId: 'slayer' }),
        'poisoned',
      )
      const recluse = addEffectTo(
        makePlayer({ id: 'recluse', roleId: 'recluse' }),
        'misregister',
        recluseMisregisterData,
      )

      expect(shouldPromptForSlayerDemonRegistration(slayer, recluse)).toBe(
        false,
      )
    })
  })

  describe('slayer shot result', () => {
    it('hits an actual Demon target and emits a kill intent', () => {
      const slayer = makePlayer({ id: 'slayer', roleId: 'slayer' })
      const imp = makePlayer({ id: 'imp', roleId: 'imp' })
      const state = makeState({ players: [slayer, imp] })

      const result = buildSlayerShotResult(state, slayer.id, imp.id)

      expect(result?.entries[0].data).toMatchObject({
        slayerId: slayer.id,
        targetId: imp.id,
        hit: true,
        perceivedTeam: 'demon',
      })
      expect(result?.intent).toEqual({
        type: 'kill',
        sourceId: slayer.id,
        targetId: imp.id,
        cause: 'slayer_shot',
      })
      expect(result?.removeEffects).toEqual({
        [slayer.id]: ['slayer_bullet'],
      })
    })

    it('misses a Recluse without a Demon registration override', () => {
      const slayer = makePlayer({ id: 'slayer', roleId: 'slayer' })
      const recluse = addEffectTo(
        makePlayer({ id: 'recluse', roleId: 'recluse' }),
        'misregister',
        recluseMisregisterData,
      )
      const state = makeState({ players: [slayer, recluse] })

      const result = buildSlayerShotResult(state, slayer.id, recluse.id)

      expect(result?.entries[0].data).toMatchObject({
        slayerId: slayer.id,
        targetId: recluse.id,
        hit: false,
        perceivedTeam: 'outsider',
      })
      expect(result?.intent).toBeUndefined()
    })

    it('hits a Recluse when the Storyteller registers them as the Demon', () => {
      const slayer = makePlayer({ id: 'slayer', roleId: 'slayer' })
      const recluse = addEffectTo(
        makePlayer({ id: 'recluse', roleId: 'recluse' }),
        'misregister',
        recluseMisregisterData,
      )
      const state = makeState({ players: [slayer, recluse] })
      const perceptionOverrides = {
        [recluse.id]: { team: 'demon' as const },
      }

      const result = buildSlayerShotResult(
        state,
        slayer.id,
        recluse.id,
        perceptionOverrides,
      )

      expect(result?.entries[0].data).toMatchObject({
        slayerId: slayer.id,
        targetId: recluse.id,
        hit: true,
        perceivedTeam: 'demon',
        perceptionOverrides,
      })
      expect(result?.intent).toMatchObject({
        type: 'kill',
        sourceId: slayer.id,
        targetId: recluse.id,
      })
    })

    it('misses when the Slayer is malfunctioning even if the target registers as the Demon', () => {
      const slayer = addEffectTo(
        makePlayer({ id: 'slayer', roleId: 'slayer' }),
        'poisoned',
      )
      const recluse = addEffectTo(
        makePlayer({ id: 'recluse', roleId: 'recluse' }),
        'misregister',
        recluseMisregisterData,
      )
      const state = makeState({ players: [slayer, recluse] })

      const result = buildSlayerShotResult(state, slayer.id, recluse.id, {
        [recluse.id]: { team: 'demon' },
      })

      expect(result?.entries[0].data).toMatchObject({
        slayerId: slayer.id,
        targetId: recluse.id,
        hit: false,
        perceivedTeam: 'demon',
        malfunctioned: true,
      })
      expect(result?.intent).toBeUndefined()
    })
  })
})
