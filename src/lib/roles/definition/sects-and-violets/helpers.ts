import { Game, GameState, PlayerState, isAlive } from '../../../types'
import { perceive } from '../../../pipeline'
import { getNominatorsToday, getVotersToday } from '../../../game'
import { getCurrentRoleId } from '../../../identity'

export const GOOD_ROLE_IDS = new Set([
  'villager',
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
  'recluse',
  'drunk',
  'butler',
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
])

export const EVIL_ROLE_IDS = new Set([
  'imp',
  'scarlet_woman',
  'poisoner',
  'baron',
  'spy',
  'evil_twin',
  'witch',
  'cerenovus',
  'pit_hag',
  'fang_gu',
  'vigormortis',
  'no_dashii',
  'vortox',
])

const DEMON_ROLE_IDS = new Set([
  'imp',
  'fang_gu',
  'vigormortis',
  'no_dashii',
  'vortox',
])
const MINION_ROLE_IDS = new Set([
  'poisoner',
  'scarlet_woman',
  'baron',
  'spy',
  'evil_twin',
  'witch',
  'cerenovus',
  'pit_hag',
])

export function isGoodRoleId(roleId: string): boolean {
  return GOOD_ROLE_IDS.has(roleId)
}

export function isEvilRoleId(roleId: string): boolean {
  return EVIL_ROLE_IDS.has(roleId)
}

export function isRoleMalfunctioning(player: PlayerState): boolean {
  return player.effects.some(
    (effect) => effect.type === 'poisoned' || effect.type === 'drunk',
  )
}

export function countClosestMinionDistance(state: GameState): number {
  const demonIndices = state.players
    .map((player, index) => ({ player, index }))
    .filter(({ player }) => DEMON_ROLE_IDS.has(getCurrentRoleId(player)))
    .map(({ index }) => index)
  const minionIndices = state.players
    .map((player, index) => ({ player, index }))
    .filter(({ player }) => MINION_ROLE_IDS.has(getCurrentRoleId(player)))
    .map(({ index }) => index)

  if (demonIndices.length === 0 || minionIndices.length === 0) {
    return 0
  }

  const playerCount = state.players.length
  let closest = Number.MAX_SAFE_INTEGER

  for (const demonIndex of demonIndices) {
    for (const minionIndex of minionIndices) {
      const diff = Math.abs(demonIndex - minionIndex)
      closest = Math.min(closest, diff, playerCount - diff)
    }
  }

  return closest === Number.MAX_SAFE_INTEGER ? 0 : closest
}

export function countDeadEvilPlayers(
  state: GameState,
  observer: PlayerState,
): number {
  return state.players.filter((player) => {
    if (isAlive(player)) return false
    return perceive(player, observer, 'alignment', state).alignment === 'evil'
  }).length
}

export function playersShareAlignment(
  state: GameState,
  observer: PlayerState,
  firstPlayerId: string,
  secondPlayerId: string,
): boolean {
  const firstPlayer = state.players.find((player) => player.id === firstPlayerId)
  const secondPlayer = state.players.find((player) => player.id === secondPlayerId)
  if (!firstPlayer || !secondPlayer) return false

  return (
    perceive(firstPlayer, observer, 'alignment', state).alignment ===
    perceive(secondPlayer, observer, 'alignment', state).alignment
  )
}

export function didDemonVoteToday(game: Game): boolean {
  const voters = getVotersToday(game)
  const state = game.history.at(-1)?.stateAfter
  if (!state) return false

  return state.players.some(
    (player) =>
      voters.has(player.id) && DEMON_ROLE_IDS.has(getCurrentRoleId(player)),
  )
}

export function didMinionNominateToday(game: Game): boolean {
  const nominators = getNominatorsToday(game)
  const state = game.history.at(-1)?.stateAfter
  if (!state) return false

  return state.players.some(
    (player) =>
      nominators.has(player.id) && MINION_ROLE_IDS.has(getCurrentRoleId(player)),
  )
}
