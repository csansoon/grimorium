import { describe, expect, it } from 'vitest'
import { RoleId } from '../roles/types'
import { getNextStep } from '../game'
import { assertEngineInvariants } from '../testing/invariants'
import {
  CURATED_TRIAD_CASES,
  generatePairwiseRoleCases,
} from '../testing/interactionMatrix'
import { runScenario } from '../testing/scenarioRunner'

function buildRoleSetForMatrix(rolesToInclude: RoleId[]): RoleId[] {
  const roles: RoleId[] = Array.from(new Set(rolesToInclude))
  if (!roles.includes('imp')) roles.push('imp')
  if (!roles.includes('poisoner')) roles.push('poisoner')
  while (roles.length < 7) roles.push('villager')
  return roles
}

describe('interaction matrix full', () => {
  const pairwiseCases = generatePairwiseRoleCases('full')

  it('generates full interaction cases', () => {
    expect(pairwiseCases.length).toBeGreaterThan(20)
  })

  for (const matrixCase of pairwiseCases) {
    it(`runs pairwise full case: ${matrixCase.id}`, () => {
      const ctx = runScenario({
        name: `Full ${matrixCase.id}`,
        roles: buildRoleSetForMatrix(matrixCase.roles),
        steps: [{ type: 'start_night' }, { type: 'drain_night', maxSteps: 160 }],
      })

      assertEngineInvariants(ctx.game)
      expect(getNextStep(ctx.game).type).toBe('night_waiting')
    })
  }

  for (const triadCase of CURATED_TRIAD_CASES) {
    it(`runs curated triad baseline: ${triadCase.id}`, () => {
      const ctx = runScenario({
        name: `Triad ${triadCase.id}`,
        roles: buildRoleSetForMatrix(triadCase.roles),
        steps: [
          { type: 'start_night' },
          { type: 'drain_night', maxSteps: 180 },
          { type: 'start_day' },
        ],
      })

      assertEngineInvariants(ctx.game)
      expect(ctx.getState().phase).toBe('day')
    })
  }
})

