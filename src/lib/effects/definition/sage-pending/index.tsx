import { useState } from 'react'
import { EffectDefinition } from '../../types'
import {
  NightFollowUpDefinition,
  NightFollowUpProps,
} from '../../../pipeline/types'
import { hasEffect } from '../../../types'
import {
  SageRevealScreen,
  StorytellerChoiceScreen,
} from '../../../../components/screens/SectsAndVioletsActionScreens'
import { shouldForceFalseInfo } from '../../../roles/runtime-helpers'

function SageFollowUp({ state, playerId, onComplete }: NightFollowUpProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const sage = state.players.find((player) => player.id === playerId)
  const pending = sage?.effects.find((effect) => effect.type === 'sage_pending')
  const demonId = pending?.data?.demonId as string | undefined
  const falseInfo = sage ? shouldForceFalseInfo(state, sage) : false

  if (!sage || (!demonId && !falseInfo)) return null

  if ((falseInfo && selectedIds.length === 2) || (!falseInfo && selectedIds.length === 1)) {
    const shownDemonId = falseInfo ? selectedIds[0] : demonId!
    const shownDecoyId = falseInfo ? selectedIds[1] : selectedIds[0]

    return (
      <SageRevealScreen
        state={state}
        playerId={playerId}
        demonId={shownDemonId}
        decoyId={shownDecoyId}
        onComplete={() =>
          onComplete({
            entries: [
              {
                type: 'night_action',
                message: [
                  { type: 'text', content: 'Sage learns one of ' },
                  { type: 'player', playerId: shownDemonId },
                  { type: 'text', content: ' or ' },
                  { type: 'player', playerId: shownDecoyId },
                  { type: 'text', content: ' is the Demon.' },
                ],
                data: {
                  action: 'sage_info',
                  playerId,
                  demonId,
                  shownIds: [shownDemonId, shownDecoyId],
                  malfunctioned: falseInfo || undefined,
                },
              },
            ],
            removeEffects: {
              [playerId]: ['sage_pending'],
            },
          })
        }
      />
    )
  }

  return (
    <StorytellerChoiceScreen
      state={state}
      icon='bookUser'
      title='Sage'
      description={
        falseInfo
          ? 'Choose two false players to show to the Sage.'
          : 'Choose the decoy player to show with the Demon.'
      }
      confirmLabel='Show Sage their pair'
      selectionCount={falseInfo ? 2 : 1}
      players={state.players.filter(
        (player) =>
          player.id !== playerId && (falseInfo || player.id !== demonId),
      )}
      onConfirm={(ids) => setSelectedIds(ids)}
    />
  )
}

const nightFollowUp: NightFollowUpDefinition = {
  id: 'sage_resolve',
  icon: 'bookUser',
  getLabel: () => 'Resolve Sage',
  condition: (player) => hasEffect(player, 'sage_pending'),
  ActionComponent: SageFollowUp,
}

const definition: EffectDefinition = {
  id: 'sage_pending',
  icon: 'bookUser',
  defaultType: 'pending',
  nightFollowUps: [nightFollowUp],
}

export default definition
