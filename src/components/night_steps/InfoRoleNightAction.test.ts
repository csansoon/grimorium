import { describe, expect, it } from 'vitest'
import { getEffect } from '../../lib/effects'
import { buildInfoPingEffects } from './InfoRoleNightAction'

describe('first-night information pings', () => {
  it('marks the correct player and the decoy for the Grimoire', () => {
    const effects = buildInfoPingEffects(
      ['correct-player', 'wrong-player'],
      'correct-player',
      'washerwoman',
      'chef',
    )

    expect(effects).toEqual({
      'correct-player': [
        {
          type: 'info_ping_correct',
          data: { sourceRoleId: 'washerwoman', shownRoleId: 'chef' },
          expiresAt: 'never',
        },
      ],
      'wrong-player': [
        {
          type: 'info_ping_wrong',
          data: { sourceRoleId: 'washerwoman', shownRoleId: 'chef' },
          expiresAt: 'never',
        },
      ],
    })
  })

  it('marks whichever selected player the Storyteller identifies as the claimed role', () => {
    const effects = buildInfoPingEffects(
      ['first-player', 'second-player'],
      'second-player',
      'investigator',
      'poisoner',
    )

    expect(effects['first-player'][0].type).toBe('info_ping_wrong')
    expect(effects['second-player'][0].type).toBe('info_ping_correct')
  })

  it('uses visibly distinct Grimoire markers', () => {
    expect(getEffect('info_ping_correct')?.icon).toBe('checkCircle')
    expect(getEffect('info_ping_wrong')?.icon).toBe('x')
  })
})
