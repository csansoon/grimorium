import { describe, expect, it } from 'vitest'
import { makeGameWithHistory, makeState } from '../../../../__tests__/helpers'
import { getSpyInfoPings } from './info'

describe('Spy information pings', () => {
  it('collects two-player info-role pings for the Spy', () => {
    const game = makeGameWithHistory(
      [
        { type: 'night_started', data: { round: 1 } },
        {
          type: 'night_action',
          data: {
            roleId: 'washerwoman',
            playerId: 'washerwoman',
            action: 'see_target',
            shownPlayers: ['alice', 'bob'],
            targetId: 'alice',
            shownRoleId: 'chef',
            malfunctioned: true,
          },
        },
      ],
      makeState(),
    )

    expect(getSpyInfoPings(game)).toEqual([
      expect.objectContaining({
        sourceRoleId: 'washerwoman',
        sourcePlayerId: 'washerwoman',
        action: 'see_target',
        shownPlayers: ['alice', 'bob'],
        targetId: 'alice',
        shownRoleId: 'chef',
        malfunctioned: true,
      }),
    ])
  })

  it('collects no-target info-role records', () => {
    const game = makeGameWithHistory(
      [
        { type: 'night_started', data: { round: 1 } },
        {
          type: 'night_action',
          data: {
            roleId: 'librarian',
            playerId: 'librarian',
            action: 'no_target',
          },
        },
      ],
      makeState(),
    )

    expect(getSpyInfoPings(game)).toEqual([
      expect.objectContaining({
        sourceRoleId: 'librarian',
        sourcePlayerId: 'librarian',
        action: 'no_target',
        malfunctioned: false,
      }),
    ])
  })

  it('uses prepared setup data when the matching night action is not recorded yet', () => {
    const game = makeGameWithHistory(
      [
        {
          type: 'setup_action',
          data: {
            playerId: 'investigator',
            roleId: 'investigator',
            preparedNightAction: {
              roleId: 'investigator',
              playerId: 'investigator',
              action: 'see_target',
              shownPlayers: ['alice', 'bob'],
              targetId: 'bob',
              shownRoleId: 'poisoner',
            },
          },
        },
      ],
      makeState(),
    )

    expect(getSpyInfoPings(game)).toEqual([
      expect.objectContaining({
        sourceRoleId: 'investigator',
        action: 'see_target',
        shownPlayers: ['alice', 'bob'],
        targetId: 'bob',
        shownRoleId: 'poisoner',
      }),
    ])
  })

  it('ignores unrelated roles and malformed info-role records', () => {
    const game = makeGameWithHistory(
      [
        { type: 'night_started', data: { round: 1 } },
        {
          type: 'night_action',
          data: {
            roleId: 'chef',
            playerId: 'chef',
            action: 'count_evil_pairs',
            evilPairs: 1,
          },
        },
        {
          type: 'night_action',
          data: {
            roleId: 'investigator',
            playerId: 'investigator',
            action: 'see_target',
            shownPlayers: ['alice'],
            targetId: 'alice',
            shownRoleId: 'poisoner',
          },
        },
      ],
      makeState(),
    )

    expect(getSpyInfoPings(game)).toEqual([])
  })

  it('prefers completed night action data over prepared setup data', () => {
    const game = makeGameWithHistory(
      [
        {
          type: 'setup_action',
          data: {
            playerId: 'washerwoman',
            roleId: 'washerwoman',
            preparedNightAction: {
              roleId: 'washerwoman',
              playerId: 'washerwoman',
              action: 'see_target',
              shownPlayers: ['old_a', 'old_b'],
              targetId: 'old_a',
              shownRoleId: 'chef',
            },
          },
        },
        {
          type: 'night_action',
          data: {
            roleId: 'washerwoman',
            playerId: 'washerwoman',
            action: 'see_target',
            shownPlayers: ['new_a', 'new_b'],
            targetId: 'new_b',
            shownRoleId: 'mayor',
          },
        },
      ],
      makeState(),
    )

    expect(getSpyInfoPings(game)).toEqual([
      expect.objectContaining({
        shownPlayers: ['new_a', 'new_b'],
        targetId: 'new_b',
        shownRoleId: 'mayor',
      }),
    ])
  })

  it('can stop at a replay cutoff entry', () => {
    const game = makeGameWithHistory(
      [
        {
          type: 'night_action',
          data: {
            roleId: 'washerwoman',
            playerId: 'washerwoman',
            action: 'see_target',
            shownPlayers: ['alice', 'bob'],
            targetId: 'alice',
            shownRoleId: 'chef',
          },
        },
        {
          type: 'night_action',
          data: {
            roleId: 'spy',
            playerId: 'spy',
            action: 'view_grimoire',
          },
        },
        {
          type: 'night_action',
          data: {
            roleId: 'investigator',
            playerId: 'investigator',
            action: 'see_target',
            shownPlayers: ['carol', 'dave'],
            targetId: 'dave',
            shownRoleId: 'poisoner',
          },
        },
      ],
      makeState(),
    )

    expect(getSpyInfoPings(game, { upToEntryId: game.history[1].id })).toEqual([
      expect.objectContaining({ sourceRoleId: 'washerwoman' }),
    ])
  })
})