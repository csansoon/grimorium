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

  it('falls back to the next pending action when a before_player_action follow-up has no matching player wake', () => {
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
      'night_follow_up:p2',
      'night_action:p1',
    ])
  })

  it('keeps a role change reveal before an immediate gained wake for the same player', () => {
    const nightActions: NightRoleStatus[] = [
      {
        roleId: 'poisoner',
        playerId: 'p1',
        playerName: 'Poisoner',
        status: 'done',
      },
      {
        roleId: 'imp',
        playerId: 'p2',
        playerName: 'New Demon',
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
        playerName: 'New Demon',
        icon: 'sparkles',
        label: 'Your role has changed!',
        placement: 'before_player_action',
        ActionComponent: (() => null) as any,
      },
    ]

    const items = mergeNightDashboardItems(nightActions, followUps)

    expect(
      items.map((item) =>
        item.type === 'night_action'
          ? `${item.type}:${item.data.playerId}:${item.data.roleId}`
          : `${item.type}:${item.data.playerId}:${item.data.id}`,
      ),
    ).toEqual([
      'night_action:p1:poisoner',
      'night_follow_up:p2:role_change_reveal_p2',
      'night_action:p2:imp',
      'night_action:p3:empath',
    ])
  })

  it('places a Sweetheart resolution before later pending night actions', () => {
    const nightActions: NightRoleStatus[] = [
      {
        roleId: 'fang_gu',
        playerId: 'p1',
        playerName: 'Fang Gu',
        status: 'done',
      },
      {
        roleId: 'dreamer',
        playerId: 'p2',
        playerName: 'Dreamer',
        status: 'pending',
      },
      {
        roleId: 'oracle',
        playerId: 'p3',
        playerName: 'Oracle',
        status: 'pending',
      },
    ]

    const followUps: AvailableNightFollowUp[] = [
      {
        id: 'sweetheart_resolve_sweet',
        playerId: 'sweet',
        playerName: 'Sweetheart',
        icon: 'handHeart',
        label: 'Resolve Sweetheart',
        placement: 'before_player_action',
        ActionComponent: (() => null) as any,
      },
    ]

    const items = mergeNightDashboardItems(nightActions, followUps)

    expect(items.map((item) => `${item.type}:${item.data.playerId}`)).toEqual([
      'night_action:p1',
      'night_follow_up:sweet',
      'night_action:p2',
      'night_action:p3',
    ])
  })
})
