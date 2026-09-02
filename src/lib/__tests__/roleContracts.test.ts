import { describe, expect, it } from 'vitest'
import { ROLE_TEST_CONTRACTS } from '../testing/roleContracts'
import { runScenario } from '../testing/scenarioRunner'
import { assertEngineInvariants } from '../testing/invariants'
import { RoleId } from '../roles/types'

const EXPECTED_ROLES: RoleId[] = [
  'villager',
  'imp',
  'washerwoman',
  'librarian',
  'investigator',
  'chef',
  'empath',
  'fortune_teller',
  'undertaker',
  'monk',
  'ravenkeeper',
  'soldier',
  'virgin',
  'slayer',
  'mayor',
  'saint',
  'scarlet_woman',
  'recluse',
  'poisoner',
  'drunk',
  'butler',
  'baron',
  'spy',
  'sweetheart',
  'sage',
  'klutz',
  'mutant',
  'barber',
  'clockmaker',
  'oracle',
  'seamstress',
  'flowergirl',
  'town_crier',
  'mathematician',
  'dreamer',
  'snake_charmer',
  'savant',
  'philosopher',
  'artist',
  'evil_twin',
  'witch',
  'cerenovus',
  'pit_hag',
  'fang_gu',
  'vigormortis',
  'no_dashii',
  'vortox',
]

describe('role contract registry', () => {
  it('has one contract per registered role', () => {
    const roleIds = [...EXPECTED_ROLES].sort()
    const contractRoleIds = Object.keys(ROLE_TEST_CONTRACTS).sort()

    expect(contractRoleIds).toEqual(roleIds)
  })

  it('enforces non-self-target contracts for key info roles', () => {
    expect(ROLE_TEST_CONTRACTS.dreamer.allowsSelfTarget).toBe(false)
    expect(ROLE_TEST_CONTRACTS.seamstress.allowsSelfTarget).toBe(false)
    expect(ROLE_TEST_CONTRACTS.snake_charmer.allowsSelfTarget).toBe(false)
  })

  it('supports malformed/invalid intents without crashing scenario execution', () => {
    const ctx = runScenario({
      name: 'Malformed Intent Safety',
      roles: ['imp', 'washerwoman', 'villager', 'chef', 'monk'],
      steps: [
        { type: 'start_night' },
        {
          type: 'resolve_intent',
          intent: {
            type: 'kill',
            sourceId: 'missing-player',
            targetId: 'also-missing',
            cause: 'test-intent',
          },
        },
      ],
    })

    assertEngineInvariants(ctx.game)
    expect(ctx.getState().players).toHaveLength(5)
  })
})
