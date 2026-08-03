import { useState } from 'react'
import { RoleDefinition } from '../../../types'
import { isAlive } from '../../../../types'
import {
  registerRoleTranslations,
  getRoleTranslations,
  useI18n,
} from '../../../../i18n'
import { DefaultRoleReveal } from '../../../../../components/items/DefaultRoleReveal'
import { PlayerPickerList } from '../../../../../components/inputs'
import { Button, Icon } from '../../../../../components/atoms'
import { ScreenFooter } from '../../../../../components/layouts/ScreenFooter'
import { PlayerFacingScreen } from '../../../../../components/layouts/PlayerFacingScreen'
import { isRoleMalfunctioning } from '../../../runtime-helpers'

import en from './i18n/en'
import es from './i18n/es'

registerRoleTranslations('no_dashii', 'en', en)
registerRoleTranslations('no_dashii', 'es', es)

const definition: RoleDefinition = {
  id: 'no_dashii',
  team: 'demon',
  icon: 'cloudMoon',
  nightOrder: 32,
  chaos: 88,
  shouldWake: (game, player) =>
    isAlive(player) && (game.history.at(-1)?.stateAfter.round ?? 0) > 1,

  RoleReveal: DefaultRoleReveal,

  NightAction: ({ state, player, onComplete }) => {
    const { language } = useI18n()
    const roleT = getRoleTranslations('no_dashii', language)
    const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null)
    const malfunctioning = isRoleMalfunctioning(player)

    const complete = () => {
      if (!selectedTargetId) return
      const target = state.players.find((candidate) => candidate.id === selectedTargetId)
      if (!target) return

      onComplete({
        entries: [
          {
            type: 'night_action',
            message: [
              {
                type: 'text',
                content: `${player.name} targeted ${target.name} as the No Dashii.`,
              },
            ],
            data: {
              roleId: 'no_dashii',
              playerId: player.id,
              action: 'no_dashii_kill',
              targetId: target.id,
              malfunctioned: malfunctioning || undefined,
            },
          },
        ],
        ...(!malfunctioning && {
          intent: {
            type: 'kill',
            sourceId: player.id,
            targetId: target.id,
            cause: 'demon',
          },
        }),
      })
    }

    return (
      <PlayerFacingScreen playerName={player.name}>
        <div className='min-h-app bg-gradient-to-b from-red-950 via-grimoire-blood to-grimoire-darker flex flex-col'>
          <div className='px-4 py-6 text-center'>
            <div className='flex justify-center mb-4'>
              <div className='w-20 h-20 rounded-full flex items-center justify-center border bg-red-500/10 border-red-400/30'>
                <Icon name='cloudMoon' size='3xl' className='text-red-300' />
              </div>
            </div>
            <h1 className='font-tarot text-xl text-parchment-100 tracking-wider uppercase mb-1'>
              {roleT.chooseTargetTitle}
            </h1>
            <p className='text-parchment-400 text-sm max-w-sm mx-auto'>
              {roleT.chooseTargetDescription}
            </p>
          </div>
          <div className='flex-1 px-4 pb-4 max-w-lg mx-auto w-full overflow-y-auto'>
            <PlayerPickerList
              players={state.players.filter((candidate) => candidate.id !== player.id)}
              selected={selectedTargetId ? [selectedTargetId] : []}
              onSelect={(playerId) => setSelectedTargetId(playerId)}
              selectionCount={1}
              variant='red'
            />
          </div>
          <ScreenFooter borderColor='border-red-500/30'>
            <Button
              onClick={complete}
              disabled={!selectedTargetId}
              fullWidth
              size='lg'
              variant='evil'
            >
              {roleT.confirmChoiceLabel}
            </Button>
          </ScreenFooter>
        </div>
      </PlayerFacingScreen>
    )
  },
}

export default definition
