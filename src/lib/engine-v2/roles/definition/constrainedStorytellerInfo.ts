import { getRole } from '../../../roles'
import {
  createBooleanSelectionChoiceIntent,
  createInformationIntent,
  createNumberSelectionChoiceIntent,
  createRoleSelectionChoiceIntent,
  createStorytellerChoiceIntent,
} from '../../intents'
import type {
  EngineIntent,
  InformationFragment,
  StorytellerChoice,
} from '../../types'
import type { EngineState } from '../../state'
import { isPlayerMalfunctioning } from '../runtime'

type ChoiceKind = StorytellerChoice['kind']

export type SelectionFragment =
  | InformationFragment
  | { kind: 'selected_role' }
  | { kind: 'selected_player' }
  | { kind: 'selected_boolean' }
  | { kind: 'selected_number' }
  | { kind: 'selected_text' }
  | { kind: 'selected_role_pair_first' }
  | { kind: 'selected_role_pair_second' }
  | { kind: 'selected_player_pair_first' }
  | { kind: 'selected_player_pair_second' }

export type PacketTemplate = {
  title: string
  summary?: string
  fragments: SelectionFragment[]
}

type BaseChoiceInput = {
  id: string
  kind: ChoiceKind
  resolutionMode?: StorytellerChoice['resolutionMode']
  title: string
  message: string
  sourcePlayerId?: string
  sourceRoleId?: string
  candidateIds: string[]
  candidateLabels?: Record<string, string>
  packet: PacketTemplate
}

type TruthfulInfo<TTruth> = {
  truth: TTruth
  packet: {
    title: string
    summary?: string
    fragments: InformationFragment[]
  }
}

export type MalfunctionPolicy =
  | {
      kind: 'arbitrary_boolean'
      promptTitle: string
      promptMessage: string
      truthyLabel?: string
      falsyLabel?: string
      packet: PacketTemplate
    }
  | {
      kind: 'arbitrary_bounded_number'
      promptTitle: string
      promptMessage: string
      min?: number
      max: number
      packet: PacketTemplate
    }
  | {
      kind: 'constrained_false_role'
      promptTitle: string
      promptMessage: string
      candidateRoleIds: string[]
      packet: PacketTemplate
    }
  | {
      kind: 'constrained_good_evil_pair'
      promptTitle: string
      promptMessage: string
      candidatePairIds: string[]
      packet: PacketTemplate
    }

type InformationFlowConfig<TTruth> = {
  id: string
  playerId: string
  sourceRoleId: string
  truthful: () => TruthfulInfo<TTruth>
  malfunctionPolicy?: MalfunctionPolicy | null
}

export function getRoleChoiceLabels(roleIds: string[]): Record<string, string> {
  return Object.fromEntries(
    roleIds.map((roleId) => [roleId, getRole(roleId)?.id ?? roleId]),
  )
}

export function getBooleanChoiceLabels(
  truthyLabel = 'Yes',
  falsyLabel = 'No',
): Record<string, string> {
  return {
    true: truthyLabel,
    false: falsyLabel,
  }
}

export function getNumberChoiceIds(max: number, min = 0): string[] {
  if (!Number.isFinite(max) || max < min) {
    return []
  }

  return Array.from({ length: max - min + 1 }, (_, index) => String(min + index))
}

export function getRolePairChoiceLabels(
  pairIds: string[],
): Record<string, string> {
  return Object.fromEntries(
    pairIds.map((pairId) => {
      const [firstRoleId, secondRoleId] = pairId.split('|')
      const firstLabel = firstRoleId ? getRole(firstRoleId)?.id ?? firstRoleId : ''
      const secondLabel = secondRoleId
        ? getRole(secondRoleId)?.id ?? secondRoleId
        : ''
      return [pairId, `${firstLabel} + ${secondLabel}`]
    }),
  )
}

function createConstrainedChoice(input: BaseChoiceInput): EngineIntent {
  const baseChoice = {
    id: input.id,
    resolutionMode: input.resolutionMode ?? 'choice_required',
    title: input.title,
    message: input.message,
    sourcePlayerId: input.sourcePlayerId,
    sourceRoleId: input.sourceRoleId,
    candidatePlayerIds: input.candidateIds,
    candidateLabels: input.candidateLabels,
    onResolve: [
      {
        kind: 'queue_information_from_selection' as const,
        packet: {
          audience: 'player' as const,
          playerId: input.sourcePlayerId,
          title: input.packet.title,
          summary: input.packet.summary,
          sourcePlayerId: input.sourcePlayerId,
          sourceRoleId: input.sourceRoleId,
        },
        fragments: input.packet.fragments,
      },
    ],
  }

  switch (input.kind) {
    case 'role_selection':
      return createRoleSelectionChoiceIntent(baseChoice)
    case 'boolean_selection':
      return createBooleanSelectionChoiceIntent(baseChoice)
    case 'number_selection':
      return createNumberSelectionChoiceIntent(baseChoice)
    case 'player_selection':
    default:
      return createStorytellerChoiceIntent(baseChoice)
  }
}

function createChoiceFromPolicy(input: {
  id: string
  playerId: string
  sourceRoleId: string
  policy: MalfunctionPolicy
}): EngineIntent {
  const base = {
    id: input.id,
    sourcePlayerId: input.playerId,
    sourceRoleId: input.sourceRoleId,
  }

  switch (input.policy.kind) {
    case 'arbitrary_boolean':
      return createConstrainedChoice({
        ...base,
        kind: 'boolean_selection',
        title: input.policy.promptTitle,
        message: input.policy.promptMessage,
        candidateIds: ['true', 'false'],
        candidateLabels: getBooleanChoiceLabels(
          input.policy.truthyLabel,
          input.policy.falsyLabel,
        ),
        packet: input.policy.packet,
      })
    case 'arbitrary_bounded_number':
      return createConstrainedChoice({
        ...base,
        kind: 'number_selection',
        title: input.policy.promptTitle,
        message: input.policy.promptMessage,
        candidateIds: getNumberChoiceIds(input.policy.max, input.policy.min ?? 0),
        packet: input.policy.packet,
      })
    case 'constrained_false_role':
      return createConstrainedChoice({
        ...base,
        kind: 'role_selection',
        title: input.policy.promptTitle,
        message: input.policy.promptMessage,
        candidateIds: input.policy.candidateRoleIds,
        candidateLabels: getRoleChoiceLabels(input.policy.candidateRoleIds),
        packet: input.policy.packet,
      })
    case 'constrained_good_evil_pair':
      return createConstrainedChoice({
        ...base,
        kind: 'role_selection',
        title: input.policy.promptTitle,
        message: input.policy.promptMessage,
        candidateIds: input.policy.candidatePairIds,
        candidateLabels: getRolePairChoiceLabels(input.policy.candidatePairIds),
        packet: input.policy.packet,
      })
  }
}

export function createDeterministicInformationPacket(input: {
  packetTitle: string
  packetSummary?: string
  playerId: string
  sourcePlayerId?: string
  sourceRoleId?: string
  fragments: InformationFragment[]
}): EngineIntent {
  return createInformationIntent({
    audience: 'player',
    playerId: input.playerId,
    title: input.packetTitle,
    summary: input.packetSummary,
    fragments: input.fragments,
    sourcePlayerId: input.sourcePlayerId,
    sourceRoleId: input.sourceRoleId,
  })
}

export function createInformationFlow<TTruth>(
  config: InformationFlowConfig<TTruth>,
): EngineIntent {
  if (config.malfunctionPolicy) {
    return createChoiceFromPolicy({
      id: config.id,
      playerId: config.playerId,
      sourceRoleId: config.sourceRoleId,
      policy: config.malfunctionPolicy,
    })
  }

  const truthful = config.truthful()
  return createDeterministicInformationPacket({
    packetTitle: truthful.packet.title,
    packetSummary: truthful.packet.summary,
    playerId: config.playerId,
    sourcePlayerId: config.playerId,
    sourceRoleId: config.sourceRoleId,
    fragments: truthful.packet.fragments,
  })
}

export function arbitraryBooleanPolicy(input: {
  promptTitle: string
  promptMessage: string
  truthyLabel?: string
  falsyLabel?: string
  packet: PacketTemplate
}): MalfunctionPolicy {
  return {
    kind: 'arbitrary_boolean',
    ...input,
  }
}

export function arbitraryBoundedNumberPolicy(input: {
  promptTitle: string
  promptMessage: string
  min?: number
  max: number
  packet: PacketTemplate
}): MalfunctionPolicy {
  return {
    kind: 'arbitrary_bounded_number',
    ...input,
  }
}

export function constrainedFalseRolePolicy(input: {
  promptTitle: string
  promptMessage: string
  candidateRoleIds: string[]
  packet: PacketTemplate
}): MalfunctionPolicy {
  return {
    kind: 'constrained_false_role',
    ...input,
  }
}

export function constrainedGoodEvilPairPolicy(input: {
  promptTitle: string
  promptMessage: string
  candidatePairIds: string[]
  packet: PacketTemplate
}): MalfunctionPolicy {
  return {
    kind: 'constrained_good_evil_pair',
    ...input,
  }
}

export function whenMalfunctioning(
  malfunctioning: boolean,
  policy: MalfunctionPolicy,
): MalfunctionPolicy | null {
  return malfunctioning ? policy : null
}

export function playerMalfunctionPolicy(
  state: EngineState,
  playerId: string,
  policy: MalfunctionPolicy,
): MalfunctionPolicy | null {
  return isPlayerMalfunctioning(state, playerId) ? policy : null
}

export function playerHasMalfunction(
  state: EngineState,
  playerId: string,
): boolean {
  return isPlayerMalfunctioning(state, playerId)
}
