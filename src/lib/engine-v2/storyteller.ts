import {
  createBooleanSelectionChoiceIntent,
  createStorytellerChoiceIntent,
  createStorytellerNoticeIntent,
  resolveEngineIntent,
} from './intents'
import type { EngineState } from './state'
import type {
  EngineIntent,
  StorytellerChoice,
  StorytellerNotice,
  WinningTeam,
} from './types'

type AutomaticNoticeInput = Omit<StorytellerNotice, 'resolutionMode'>

type PlayerSelectionPromptInput = Omit<
  StorytellerChoice,
  'kind' | 'minSelections' | 'maxSelections'
> & {
  minSelections?: number
  maxSelections?: number
}

export function emitAutomaticOutcomeNotice(
  state: EngineState,
  notice: AutomaticNoticeInput,
): EngineState {
  return resolveEngineIntent(state, createAutomaticOutcomeNoticeIntent(notice))
}

export function createAutomaticOutcomeNoticeIntent(
  notice: AutomaticNoticeInput,
): EngineIntent {
  return createStorytellerNoticeIntent({
    ...notice,
    resolutionMode: 'automatic',
  })
}

export function requestPlayerSelectionPrompt(
  state: EngineState,
  prompt: PlayerSelectionPromptInput,
): EngineState {
  return resolveEngineIntent(state, createPlayerSelectionPromptIntent(prompt))
}

export function createPlayerSelectionPromptIntent(
  prompt: PlayerSelectionPromptInput,
): EngineIntent {
  return createStorytellerChoiceIntent({
    ...prompt,
    minSelections: prompt.minSelections ?? 1,
    maxSelections: prompt.maxSelections ?? 1,
  })
}

type GameOutcomeProposalInput = {
  title: string
  message: string
  winner: WinningTeam
  reason: string
  sourcePlayerId?: string
  sourceRoleId?: string
}

export function proposeGameOutcome(
  state: EngineState,
  proposal: GameOutcomeProposalInput,
): EngineState {
  return resolveEngineIntent(state, createGameOutcomeProposalIntent(proposal))
}

export function createGameOutcomeProposalIntent(
  proposal: GameOutcomeProposalInput,
): EngineIntent {
  return createBooleanSelectionChoiceIntent({
    id: `${proposal.sourceRoleId ?? 'game'}:outcome:${proposal.winner}:${proposal.reason}`,
    resolutionMode: 'choice_required',
    title: proposal.title,
    message: proposal.message,
    sourcePlayerId: proposal.sourcePlayerId,
    sourceRoleId: proposal.sourceRoleId,
    candidatePlayerIds: ['true', 'false'],
    candidateLabels: {
      true: 'End game',
      false: 'Continue',
    },
    onResolve: [
      {
        kind: 'resolve_game_outcome',
        winner: proposal.winner,
        title: proposal.title,
        message: proposal.message,
        reason: proposal.reason,
        sourcePlayerId: proposal.sourcePlayerId,
        sourceRoleId: proposal.sourceRoleId,
        confirmValue: 'true',
      },
    ],
  })
}
