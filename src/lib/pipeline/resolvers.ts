import {
  Intent,
  KillIntent,
  NominateIntent,
  ExecuteIntent,
  StateChanges,
} from './types'
import { GameState, isAlive } from '../types'

// ============================================================================
// DEFAULT RESOLVERS
// ============================================================================
// These define what happens when an intent is NOT prevented or redirected
// by any handler. They produce the "default" state changes for each intent.
// ============================================================================

type IntentResolver = (intent: Intent, state: GameState) => StateChanges

/**
 * Default kill resolution: add a "dead" effect to the target.
 * No history entry needed — death announcements happen in startDay().
 */
function resolveKill(intent: Intent, state: GameState): StateChanges {
  const kill = intent as KillIntent
  const target = state.players.find((player) => player.id === kill.targetId)
  if (!target || !isAlive(target)) return { entries: [] }

  return {
    entries: [],
    addEffects: {
      [kill.targetId]: [
        {
          type: 'dead',
          data: { cause: kill.cause },
          expiresAt: 'never',
        },
      ],
    },
  }
}

/**
 * Default nomination resolution: record the nomination and transition to voting.
 */
function resolveNominate(intent: Intent, _state: GameState): StateChanges {
  const nom = intent as NominateIntent
  return {
    entries: [
      {
        type: 'nomination',
        message: [
          {
            type: 'i18n',
            key: 'history.nominates',
            params: {
              nominator: nom.nominatorId,
              nominee: nom.nomineeId,
            },
          },
        ],
        data: {
          nominatorId: nom.nominatorId,
          nomineeId: nom.nomineeId,
        },
      },
    ],
    // Phase stays 'day' — the GameScreen state machine handles showing
    // the voting UI via its own Screen type, independently of Phase.
  }
}

/**
 * Default execution resolution: kill the player and record the execution.
 */
function resolveExecute(intent: Intent, state: GameState): StateChanges {
  const exec = intent as ExecuteIntent
  const target = state.players.find((player) => player.id === exec.playerId)
  const died = !!target && isAlive(target)

  return {
    entries: [
      {
        type: 'execution',
        message: [
          {
            type: 'i18n',
            key: 'history.executed',
            params: { player: exec.playerId },
          },
        ],
        data: { playerId: exec.playerId, died },
      },
    ],
    addEffects: died
      ? {
          [exec.playerId]: [
            {
              type: 'dead',
              data: { cause: exec.cause },
              expiresAt: 'never',
            },
          ],
        }
      : undefined,
  }
}

// ============================================================================
// RESOLVER REGISTRY
// ============================================================================

const resolvers: Record<string, IntentResolver> = {
  kill: resolveKill,
  nominate: resolveNominate,
  execute: resolveExecute,
}

export function getDefaultResolver(
  intentType: string,
): IntentResolver | undefined {
  return resolvers[intentType]
}
