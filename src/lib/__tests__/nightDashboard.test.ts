import { describe, expect, it } from 'vitest'
import { mergeNightDashboardItems } from '../../components/screens/NightDashboard'
import { AvailableNightFollowUp } from '../pipeline/types'
import { NightRoleStatus } from '../game'

describe('mergeNightDashboardItems', () => {
  it('inserts a role change reveal before the same player acting on their new role', () => {
    const nightActions: NightRoleStatus[] = [
      {
        roleId: 'poisoner',
        playerId: 'p1',
        playerName: 'Poisoner',
        status: 'done',
      },
      {
        roleId: 'fang_gu',
        playerId: 'p2',
        playerName: 'Changed Demon',
        status: 'pending',
      },
      {
        roleId: 'empath',
        playerId: 'p3',
        playerName: 'Empath',
        status: 'pending',
      },
    ]

    const followUps: AvailableNightFollowUp[] = [
      {
        id: 'role_change_reveal_p2',
        playerId: 'p2',
        playerName: 'Changed Demon',
        icon: 'sparkles',
        label: 'Your role has changed!',
        placement: 'before_player_action',
        ActionComponent: (() => null) as any,
      },
    ]

    const items = mergeNightDashboardItems(nightActions, followUps)

    expect(items.map((item) => `${item.type}:${item.data.playerId}`)).toEqual([
      'night_action:p1',
      'night_follow_up:p2',
      'night_action:p2',
      'night_action:p3',
    ])
  })

  it('leaves role change reveals at the end if the changed player has no pending night action', () => {
    const nightActions: NightRoleStatus[] = [
      {
        roleId: 'poisoner',
        playerId: 'p1',
        playerName: 'Poisoner',
        status: 'pending',
      },
    ]

    const followUps: AvailableNightFollowUp[] = [
      {
        id: 'role_change_reveal_p2',
        playerId: 'p2',
        playerName: 'Changed Townsfolk',
        icon: 'sparkles',
        label: 'Your role has changed!',
        placement: 'before_player_action',
        ActionComponent: (() => null) as any,
      },
    ]

    const items = mergeNightDashboardItems(nightActions, followUps)

    expect(items.map((item) => `${item.type}:${item.data.playerId}`)).toEqual([
      'night_action:p1',
      'night_follow_up:p2',
    ])
  })
})
