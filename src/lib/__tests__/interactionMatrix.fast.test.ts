import { describe, expect, it } from 'vitest'
import { RoleId } from '../roles/types'
import { getNextStep } from '../game'
import { assertEngineInvariants } from '../testing/invariants'
import { generatePairwiseRoleCases } from '../testing/interactionMatrix'
import { runScenario } from '../testing/scenarioRunner'

function buildRoleSetForMatrix(pair: [RoleId, RoleId]): RoleId[] {
  const roles: RoleId[] = Array.from(new Set(pair))
  if (!roles.includes('imp')) roles.push('imp')
  if (!roles.includes('poisoner')) roles.push('poisoner')
  while (roles.length < 6) roles.push('villager')
  return roles
}

describe('interaction matrix smoke', () => {
  const cases = generatePairwiseRoleCases('smoke')

  it('generates smoke interaction cases', () => {
    expect(cases.length).toBeGreaterThan(0)
  })

  for (const matrixCase of cases) {
    it(`runs smoke case: ${matrixCase.id}`, () => {
      const ctx = runScenario({
        name: `Smoke ${matrixCase.id}`,
        roles: buildRoleSetForMatrix(matrixCase.roles),
        steps: [{ type: 'start_night' }, { type: 'drain_night', maxSteps: 140 }],
      })

      assertEngineInvariants(ctx.game)
      expect(getNextStep(ctx.game).type).toBe('night_waiting')
    })
  }
})

