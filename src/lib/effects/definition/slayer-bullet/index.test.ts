import { describe, it, expect, beforeEach } from 'vitest'
import definition from '.'
import { resolveSlayerShot } from '../../../../components/screens/SlayerActionScreen'
import { applyPipelineChanges, resolveIntent } from '../../../pipeline'
import { getCurrentState, hasEffect } from '../../../types'
import {
  makePlayer,
  makeState,
  addEffectTo,
  makeGame,
  resetPlayerCounter,
} from '../../../__tests__/helpers'

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

  describe('shot resolution', () => {
    it('emits a kill intent for an alive Demon instead of killing directly', () => {
      const slayer = addEffectTo(
        makePlayer({ id: 'slayer', roleId: 'slayer' }),
        'slayer_bullet',
      )
      const imp = makePlayer({ id: 'imp', roleId: 'imp' })
      const result = resolveSlayerShot(
        makeState({ phase: 'day', players: [slayer, imp] }),
        slayer.id,
        imp.id,
      )!

      expect(result.addEffects).toBeUndefined()
      expect(result.intent).toEqual({
        type: 'kill',
        sourceId: slayer.id,
        targetId: imp.id,
        cause: 'slayer',
      })
      expect(result.removeEffects?.[slayer.id]).toContain('slayer_bullet')
    })

    it('can kill an alive Recluse when the Storyteller registers them as Demon', () => {
      const slayer = addEffectTo(
        makePlayer({ id: 'slayer', roleId: 'slayer' }),
        'slayer_bullet',
      )
      const recluse = addEffectTo(
        makePlayer({ id: 'recluse', roleId: 'recluse' }),
        'misregister',
        {
          canRegisterAs: {
            teams: ['minion', 'demon'],
            alignments: ['evil'],
          },
        },
      )
      const result = resolveSlayerShot(
        makeState({ phase: 'day', players: [slayer, recluse] }),
        slayer.id,
        recluse.id,
        true,
      )!

      expect(result.intent?.type).toBe('kill')
      expect(result.entries[0].data.registeredAsDemon).toBe(true)
    })

    it('spends the shot without killing an already-dead target', () => {
      const slayer = addEffectTo(
        makePlayer({ id: 'slayer', roleId: 'slayer' }),
        'slayer_bullet',
      )
      const deadImp = addEffectTo(
        makePlayer({ id: 'imp', roleId: 'imp' }),
        'dead',
      )
      const result = resolveSlayerShot(
        makeState({ phase: 'day', players: [slayer, deadImp] }),
        slayer.id,
        deadImp.id,
      )!

      expect(result.intent).toBeUndefined()
      expect(result.entries[0].data.hit).toBe(false)
      expect(result.removeEffects?.[slayer.id]).toContain('slayer_bullet')
    })

    it('misses while malfunctioning even when targeting the Demon', () => {
      let slayer = addEffectTo(
        makePlayer({ id: 'slayer', roleId: 'slayer' }),
        'slayer_bullet',
      )
      slayer = addEffectTo(slayer, 'poisoned')
      const imp = makePlayer({ id: 'imp', roleId: 'imp' })
      const result = resolveSlayerShot(
        makeState({ phase: 'day', players: [slayer, imp] }),
        slayer.id,
        imp.id,
        false,
        true,
      )!

      expect(result.intent).toBeUndefined()
      expect(result.entries[0].data.malfunctioned).toBe(true)
    })

    it('lets Scarlet Woman become the Demon after a successful shot', () => {
      const slayer = addEffectTo(
        makePlayer({ id: 'slayer', roleId: 'slayer' }),
        'slayer_bullet',
      )
      const imp = makePlayer({ id: 'imp', roleId: 'imp' })
      const scarletWoman = addEffectTo(
        makePlayer({ id: 'sw', roleId: 'scarlet_woman' }),
        'demon_successor',
      )
      const players = [
        slayer,
        imp,
        scarletWoman,
        makePlayer({ id: 'p4', roleId: 'chef' }),
        makePlayer({ id: 'p5', roleId: 'saint' }),
      ]
      const game = makeGame(makeState({ phase: 'day', round: 1, players }))
      const shot = resolveSlayerShot(getCurrentState(game), slayer.id, imp.id)!
      const afterShot = applyPipelineChanges(game, {
        entries: shot.entries,
        removeEffects: shot.removeEffects,
      })
      const pipelineResult = resolveIntent(
        shot.intent!,
        getCurrentState(afterShot),
        afterShot,
      )
      expect(pipelineResult.type).toBe('resolved')
      if (pipelineResult.type !== 'resolved') return

      const updated = applyPipelineChanges(
        afterShot,
        pipelineResult.stateChanges,
      )
      const updatedState = getCurrentState(updated)
      expect(
        hasEffect(updatedState.players.find((p) => p.id === imp.id)!, 'dead'),
      ).toBe(true)
      expect(
        updatedState.players.find((p) => p.id === scarletWoman.id)?.roleId,
      ).toBe('imp')
    })
  })
})
