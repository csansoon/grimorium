import { describe, it, expect, beforeEach } from 'vitest'
import definition from '.'
import { NominateIntent } from '../../../pipeline/types'
import {
  makePlayer,
  makeState,
  addEffectTo,
  makeGame,
  resetPlayerCounter,
} from '../../../__tests__/helpers'

beforeEach(() => resetPlayerCounter())

describe('Pure effect', () => {
  const handler = definition.handlers![0]

  // ================================================================
  // HANDLER — APPLIES TO
  // ================================================================

  describe('appliesTo', () => {
    it('applies when the nominee is the player with the pure effect', () => {
      const virgin = addEffectTo(
        makePlayer({ id: 'p2', roleId: 'virgin' }),
        'pure',
      )
      const state = makeState({ players: [virgin] })
      const intent: NominateIntent = {
        type: 'nominate',
        nominatorId: 'p1',
        nomineeId: 'p2',
      }

      expect(handler.appliesTo(intent, virgin, state)).toBe(true)
    })

    it('does not apply when a different player is nominated', () => {
      const virgin = addEffectTo(
        makePlayer({ id: 'p2', roleId: 'virgin' }),
        'pure',
      )
      const state = makeState({ players: [virgin] })
      const intent: NominateIntent = {
        type: 'nominate',
        nominatorId: 'p1',
        nomineeId: 'p3',
      }

      expect(handler.appliesTo(intent, virgin, state)).toBe(false)
    })
  })

  // ================================================================
  // HANDLER — TOWNSFOLK NOMINATOR (kill & prevent)
  // ================================================================

  describe('townsfolk nominates virgin', () => {
    it('prevents the nomination', () => {
      const nominator = makePlayer({ id: 'p1', roleId: 'washerwoman' }) // townsfolk
      const virgin = addEffectTo(
        makePlayer({ id: 'p2', roleId: 'virgin' }),
        'pure',
      )
      const state = makeState({
        phase: 'day',
        round: 1,
        players: [nominator, virgin],
      })
      const game = makeGame(state)
      const intent: NominateIntent = {
        type: 'nominate',
        nominatorId: 'p1',
        nomineeId: 'p2',
      }

      const result = handler.handle(intent, virgin, state, game)
      expect(result.action).toBe('prevent')
    })

    it('kills the townsfolk nominator (adds dead effect)', () => {
      const nominator = makePlayer({ id: 'p1', roleId: 'washerwoman' })
      const virgin = addEffectTo(
        makePlayer({ id: 'p2', roleId: 'virgin' }),
        'pure',
      )
      const state = makeState({
        phase: 'day',
        round: 1,
        players: [nominator, virgin],
      })
      const game = makeGame(state)
      const intent: NominateIntent = {
        type: 'nominate',
        nominatorId: 'p1',
        nomineeId: 'p2',
      }

      const result = handler.handle(intent, virgin, state, game)
      if (result.action === 'prevent') {
        expect(result.stateChanges?.addEffects?.['p1']).toBeDefined()
        expect(result.stateChanges!.addEffects!['p1'][0].type).toBe('dead')
      }
    })

    it('removes the pure effect from the virgin', () => {
      const nominator = makePlayer({ id: 'p1', roleId: 'washerwoman' })
      const virgin = addEffectTo(
        makePlayer({ id: 'p2', roleId: 'virgin' }),
        'pure',
      )
      const state = makeState({
        phase: 'day',
        round: 1,
        players: [nominator, virgin],
      })
      const game = makeGame(state)
      const intent: NominateIntent = {
        type: 'nominate',
        nominatorId: 'p1',
        nomineeId: 'p2',
      }

      const result = handler.handle(intent, virgin, state, game)
      if (result.action === 'prevent') {
        expect(result.stateChanges?.removeEffects?.['p2']).toContain('pure')
      }
    })

    it('generates a virgin_execution history entry', () => {
      const nominator = makePlayer({ id: 'p1', roleId: 'washerwoman' })
      const virgin = addEffectTo(
        makePlayer({ id: 'p2', roleId: 'virgin' }),
        'pure',
      )
      const state = makeState({
        phase: 'day',
        round: 1,
        players: [nominator, virgin],
      })
      const game = makeGame(state)
      const intent: NominateIntent = {
        type: 'nominate',
        nominatorId: 'p1',
        nomineeId: 'p2',
      }

      const result = handler.handle(intent, virgin, state, game)
      if (result.action === 'prevent') {
        expect(result.stateChanges?.entries?.[0].type).toBe('virgin_execution')
      }
    })
  })

  // ================================================================
  // HANDLER — DRUNK NOMINATOR (perceived as Outsider, not Townsfolk)
  // ================================================================

  describe('drunk (believing townsfolk) nominates virgin', () => {
    it('allows the nomination (drunk is an outsider, not townsfolk)', () => {
      // Drunk's roleId was changed to "chef" during setup, but they have the drunk effect
      const nominator = addEffectTo(
        makePlayer({ id: 'p1', roleId: 'chef' }),
        'drunk',
        { actualRole: 'drunk' },
      )
      const virgin = addEffectTo(
        makePlayer({ id: 'p2', roleId: 'virgin' }),
        'pure',
      )
      const state = makeState({
        phase: 'day',
        round: 1,
        players: [nominator, virgin],
      })
      const game = makeGame(state)
      const intent: NominateIntent = {
        type: 'nominate',
        nominatorId: 'p1',
        nomineeId: 'p2',
      }

      const result = handler.handle(intent, virgin, state, game)
      expect(result.action).toBe('allow')
    })

    it('spends purity without killing the drunk nominator', () => {
      const nominator = addEffectTo(
        makePlayer({ id: 'p1', roleId: 'chef' }),
        'drunk',
        { actualRole: 'drunk' },
      )
      const virgin = addEffectTo(
        makePlayer({ id: 'p2', roleId: 'virgin' }),
        'pure',
      )
      const state = makeState({
        phase: 'day',
        round: 1,
        players: [nominator, virgin],
      })
      const game = makeGame(state)
      const intent: NominateIntent = {
        type: 'nominate',
        nominatorId: 'p1',
        nomineeId: 'p2',
      }

      const result = handler.handle(intent, virgin, state, game)
      if (result.action === 'allow') {
        expect(result.stateChanges?.removeEffects?.['p2']).toContain('pure')
        expect(result.stateChanges?.addEffects?.['p1']).toBeUndefined()
        expect(result.stateChanges?.entries?.[0].type).toBe('virgin_spent')
      }
    })
  })

  // ================================================================
  // HANDLER — SPY REGISTRATION (Storyteller choice)
  // ================================================================

  describe('spy nominates virgin', () => {
    function makeScenario() {
      const spy = addEffectTo(
        makePlayer({ id: 'p1', roleId: 'spy' }),
        'misregister',
        {
          canRegisterAs: {
            teams: ['townsfolk', 'outsider'],
            alignments: ['good'],
          },
        },
      )
      const virgin = addEffectTo(
        makePlayer({ id: 'p2', roleId: 'virgin' }),
        'pure',
      )
      const state = makeState({
        phase: 'day',
        round: 1,
        players: [spy, virgin],
      })
      const intent: NominateIntent = {
        type: 'nominate',
        nominatorId: spy.id,
        nomineeId: virgin.id,
      }

      return { spy, virgin, state, game: makeGame(state), intent }
    }

    it('asks the Storyteller how the Spy registers for this nomination', () => {
      const { virgin, state, game, intent } = makeScenario()

      expect(handler.handle(intent, virgin, state, game).action).toBe(
        'request_ui',
      )
    })

    it('executes the Spy when registered as Townsfolk', () => {
      const { spy, virgin, state, game, intent } = makeScenario()
      const prompt = handler.handle(intent, virgin, state, game)
      expect(prompt.action).toBe('request_ui')
      if (prompt.action !== 'request_ui') return

      const result = prompt.resume(true)
      expect(result.action).toBe('prevent')
      if (result.action !== 'prevent') return
      expect(result.stateChanges?.addEffects?.[spy.id]?.[0].type).toBe('dead')
      expect(result.stateChanges?.entries[0].type).toBe('virgin_execution')
    })

    it('allows the nomination when the Spy registers normally', () => {
      const { virgin, state, game, intent } = makeScenario()
      const prompt = handler.handle(intent, virgin, state, game)
      expect(prompt.action).toBe('request_ui')
      if (prompt.action !== 'request_ui') return

      const result = prompt.resume(false)
      expect(result.action).toBe('allow')
      if (result.action !== 'allow') return
      expect(result.stateChanges?.removeEffects?.[virgin.id]).toContain('pure')
      expect(result.stateChanges?.entries[0].type).toBe('virgin_spent')
    })
  })

  // ================================================================
  // HANDLER — NON-TOWNSFOLK NOMINATOR (allow, spend purity)
  // ================================================================

  describe('non-townsfolk nominates virgin', () => {
    it('allows the nomination to proceed', () => {
      const nominator = makePlayer({ id: 'p1', roleId: 'imp' }) // demon
      const virgin = addEffectTo(
        makePlayer({ id: 'p2', roleId: 'virgin' }),
        'pure',
      )
      const state = makeState({
        phase: 'day',
        round: 1,
        players: [nominator, virgin],
      })
      const game = makeGame(state)
      const intent: NominateIntent = {
        type: 'nominate',
        nominatorId: 'p1',
        nomineeId: 'p2',
      }

      const result = handler.handle(intent, virgin, state, game)
      expect(result.action).toBe('allow')
    })

    it('removes the pure effect (purity spent)', () => {
      const nominator = makePlayer({ id: 'p1', roleId: 'imp' })
      const virgin = addEffectTo(
        makePlayer({ id: 'p2', roleId: 'virgin' }),
        'pure',
      )
      const state = makeState({
        phase: 'day',
        round: 1,
        players: [nominator, virgin],
      })
      const game = makeGame(state)
      const intent: NominateIntent = {
        type: 'nominate',
        nominatorId: 'p1',
        nomineeId: 'p2',
      }

      const result = handler.handle(intent, virgin, state, game)
      if (result.action === 'allow') {
        expect(result.stateChanges?.removeEffects?.['p2']).toContain('pure')
      }
    })

    it('does not kill the nominator', () => {
      const nominator = makePlayer({ id: 'p1', roleId: 'imp' })
      const virgin = addEffectTo(
        makePlayer({ id: 'p2', roleId: 'virgin' }),
        'pure',
      )
      const state = makeState({
        phase: 'day',
        round: 1,
        players: [nominator, virgin],
      })
      const game = makeGame(state)
      const intent: NominateIntent = {
        type: 'nominate',
        nominatorId: 'p1',
        nomineeId: 'p2',
      }

      const result = handler.handle(intent, virgin, state, game)
      if (result.action === 'allow') {
        expect(result.stateChanges?.addEffects?.['p1']).toBeUndefined()
      }
    })

    it('generates a virgin_spent history entry', () => {
      const nominator = makePlayer({ id: 'p1', roleId: 'imp' })
      const virgin = addEffectTo(
        makePlayer({ id: 'p2', roleId: 'virgin' }),
        'pure',
      )
      const state = makeState({
        phase: 'day',
        round: 1,
        players: [nominator, virgin],
      })
      const game = makeGame(state)
      const intent: NominateIntent = {
        type: 'nominate',
        nominatorId: 'p1',
        nomineeId: 'p2',
      }

      const result = handler.handle(intent, virgin, state, game)
      if (result.action === 'allow') {
        expect(result.stateChanges?.entries?.[0].type).toBe('virgin_spent')
      }
    })
  })
})
