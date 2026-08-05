import type { Game, HistoryEntry } from '../../../../types'

export type SpyInfoRoleId = 'washerwoman' | 'librarian' | 'investigator'

type SpyInfoBase = {
  sourceRoleId: SpyInfoRoleId
  sourcePlayerId: string
  entryId: string
  entryIndex: number
  malfunctioned: boolean
}

export type SpyInfoPing =
  | (SpyInfoBase & {
      action: 'see_target'
      shownPlayers: [string, string]
      targetId: string
      shownRoleId: string
    })
  | (SpyInfoBase & {
      action: 'no_target'
    })

type GetSpyInfoPingsOptions = {
  upToEntryId?: string
}

const SPY_VISIBLE_INFO_ROLE_IDS: SpyInfoRoleId[] = [
  'washerwoman',
  'librarian',
  'investigator',
]

const SPY_VISIBLE_INFO_ROLE_ORDER = new Map(
  SPY_VISIBLE_INFO_ROLE_IDS.map((roleId, index) => [roleId, index]),
)

function isSpyInfoRoleId(roleId: unknown): roleId is SpyInfoRoleId {
  return (
    typeof roleId === 'string' &&
    SPY_VISIBLE_INFO_ROLE_ORDER.has(roleId as SpyInfoRoleId)
  )
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function normalizeInfoPing(
  entry: HistoryEntry,
  entryIndex: number,
  data: Record<string, unknown>,
): SpyInfoPing | null {
  if (!isSpyInfoRoleId(data.roleId)) return null
  if (typeof data.playerId !== 'string') return null

  const base = {
    sourceRoleId: data.roleId,
    sourcePlayerId: data.playerId,
    entryId: entry.id,
    entryIndex,
    malfunctioned: data.malfunctioned === true,
  }

  if (data.action === 'no_target') {
    return {
      ...base,
      action: 'no_target',
    }
  }

  if (data.action !== 'see_target') return null
  if (!isStringArray(data.shownPlayers) || data.shownPlayers.length < 2) {
    return null
  }
  if (typeof data.targetId !== 'string') return null
  if (typeof data.shownRoleId !== 'string') return null

  return {
    ...base,
    action: 'see_target',
    shownPlayers: [data.shownPlayers[0], data.shownPlayers[1]],
    targetId: data.targetId,
    shownRoleId: data.shownRoleId,
  }
}

function getEntryData(entry: HistoryEntry): Record<string, unknown> | null {
  if (entry.type === 'night_action') return entry.data
  if (entry.type !== 'setup_action') return null

  const preparedData = entry.data.preparedNightAction
  if (!preparedData || typeof preparedData !== 'object') return null

  return preparedData as Record<string, unknown>
}

export function getSpyInfoPings(
  game: Game,
  options: GetSpyInfoPingsOptions = {},
): SpyInfoPing[] {
  const cutoffIndex = options.upToEntryId
    ? game.history.findIndex((entry) => entry.id === options.upToEntryId)
    : -1
  const endIndex = cutoffIndex >= 0 ? cutoffIndex : game.history.length - 1
  const pingsBySource = new Map<
    string,
    { ping: SpyInfoPing; isCompletedNightAction: boolean }
  >()

  for (let index = 0; index <= endIndex; index++) {
    const entry = game.history[index]
    const data = getEntryData(entry)
    if (!data) continue

    const ping = normalizeInfoPing(entry, index, data)
    if (!ping) continue

    const key = `${ping.sourcePlayerId}:${ping.sourceRoleId}`
    const isCompletedNightAction = entry.type === 'night_action'
    const existing = pingsBySource.get(key)

    if (!existing) {
      pingsBySource.set(key, { ping, isCompletedNightAction })
      continue
    }

    if (isCompletedNightAction || !existing.isCompletedNightAction) {
      pingsBySource.set(key, { ping, isCompletedNightAction })
    }
  }

  return [...pingsBySource.values()]
    .map(({ ping }) => ping)
    .sort((left, right) => {
      const leftRoleOrder = SPY_VISIBLE_INFO_ROLE_ORDER.get(left.sourceRoleId) ?? 0
      const rightRoleOrder = SPY_VISIBLE_INFO_ROLE_ORDER.get(right.sourceRoleId) ?? 0

      if (leftRoleOrder !== rightRoleOrder) return leftRoleOrder - rightRoleOrder
      return left.entryIndex - right.entryIndex
    })
}