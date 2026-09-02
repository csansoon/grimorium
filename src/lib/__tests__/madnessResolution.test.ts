import { beforeEach, describe, expect, it } from 'vitest'

import {
  buildMarkMadnessBrokenResult,
  buildResolvePendingMadnessResult,
  getMadnessResolutionEntries,
} from '../madnessResolution'
import { getAvailableDayActions } from '../pipeline'
import { addEffectTo, makePlayer, makeState, resetPlayerCounter } from './helpers'

const mockT = {}

beforeEach(() => resetPlayerCounter())

describe('shared madness resolution', () => {
  it('builds active and pending madness entries from effect metadata', () => {
    const state = makeState({
      phase: 'day',
      round: 2,
      players: [
        addEffectTo(
          makePlayer({ id: 'mad', name: 'Maddy', roleId: 'oracle' }),
          'cerenovus_madness',
          { madAsRoleId: 'clockmaker', cerenovusId: 'cer' },
        ),
        addEffectTo(
          makePlayer({ id: 'mutant', name: 'Muta', roleId: 'mutant' }),
          'madness_break_pending',
          {
            sourceRoleId: 'mutant',
            sourceEffectType: 'mutant_execution',
          },
        ),
      ],
    })

    const entries = getMadnessResolutionEntries(state, 'en')

    expect(entries).toHaveLength(2)
    expect(entries[0]).toMatchObject({
      playerId: 'mad',
      effectType: 'cerenovus_madness',
      status: 'active',
      title: 'Cerenovus madness',
      sourceRoleId: 'cerenovus',
      madAsRoleId: 'clockmaker',
    })
    expect(entries[1]).toMatchObject({
      playerId: 'mutant',
      effectType: 'madness_break_pending',
      status: 'pending',
      title: 'Pending Mutant madness',
      sourceRoleId: 'mutant',
    })
  })

  it('records a pending consequence from active Cerenovus madness', () => {
    const state = makeState({
      phase: 'day',
      round: 2,
      players: [
        addEffectTo(
          makePlayer({ id: 'mad', name: 'Maddy', roleId: 'oracle' }),
          'cerenovus_madness',
          { madAsRoleId: 'clockmaker', cerenovusId: 'cer' },
        ),
      ],
    })

    const [entry] = getMadnessResolutionEntries(state, 'en')
    const result = buildMarkMadnessBrokenResult(state, entry)

    expect(result.addEffects?.mad?.[0]).toMatchObject({
      type: 'madness_break_pending',
      data: {
        sourceRoleId: 'cerenovus',
        sourceEffectType: 'cerenovus_madness',
        madAsRoleId: 'clockmaker',
      },
    })
    expect(result.removeEffects).toEqual({ mad: ['cerenovus_madness'] })
  })

  it('exposes a resolution day action for a living pending madness consequence', () => {
    const aliveState = makeState({
      phase: 'day',
      round: 2,
      players: [
        addEffectTo(
          makePlayer({ id: 'mutant', roleId: 'mutant' }),
          'madness_break_pending',
          {
            sourceRoleId: 'mutant',
            sourceEffectType: 'mutant_execution',
          },
        ),
      ],
    })

    expect(
      getAvailableDayActions(aliveState, mockT, 'resolution').some(
        (action) =>
          action.playerId === 'mutant' &&
          action.id.startsWith('madness_break_pending'),
      ),
    ).toBe(true)

    const deadState = makeState({
      phase: 'day',
      round: 2,
      players: [addEffectTo(aliveState.players[0], 'dead')],
    })

    expect(
      getAvailableDayActions(deadState, mockT, 'resolution').some(
        (action) =>
          action.playerId === 'mutant' &&
          action.id.startsWith('madness_break_pending'),
      ),
    ).toBe(false)
  })

  it('builds execute, kill, and dismiss results for pending consequences', () => {
    const pendingEntry = {
      id: 'madness_break_pending:mutant',
      playerId: 'mutant',
      effectType: 'madness_break_pending' as const,
      status: 'pending' as const,
      icon: 'drama' as const,
      sourceRoleId: 'mutant',
      title: 'Pending Mutant madness',
      description: 'Pending.',
    }

    expect(buildResolvePendingMadnessResult(pendingEntry, 'dismiss')).toMatchObject({
      removeEffects: { mutant: ['madness_break_pending'] },
    })
    expect(buildResolvePendingMadnessResult(pendingEntry, 'execute')).toMatchObject({
      intent: { type: 'execute', playerId: 'mutant', cause: 'madness' },
    })
    expect(buildResolvePendingMadnessResult(pendingEntry, 'kill')).toMatchObject({
      intent: {
        type: 'kill',
        sourceId: 'mutant',
        targetId: 'mutant',
        cause: 'madness',
      },
    })
  })
})
