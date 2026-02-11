import { useState } from 'react'
import { RoleDefinition, SetupActionProps } from '../../../types'
import { getAllRoles } from '../../../index'
import {
  useI18n,
  registerRoleTranslations,
  getRoleTranslations,
} from '../../../../i18n'
import { DefaultRoleReveal } from '../../../../../components/items/DefaultRoleReveal'
import { Button, Icon } from '../../../../../components/atoms'
import { RolePickerGrid } from '../../../../../components/inputs'

import en from './i18n/en'
import es from './i18n/es'

registerRoleTranslations('drunk', 'en', en)
registerRoleTranslations('drunk', 'es', es)

/**
 * The Drunk — Outsider role.
 *
 * The Drunk does not know they are the Drunk. They believe they are a
 * Townsfolk character. During the setup phase (before role revelation),
 * the narrator chooses which Townsfolk role the Drunk believes they are.
 *
 * The Drunk's roleId is then changed to that Townsfolk role, and a
 * permanent "drunk" effect is applied. The game treats them as the
 * believed role in every way (night order, NightAction, shouldWake),
 * but the drunk effect causes their ability to malfunction.
 *
 * The Drunk effect's perception modifier ensures info roles see "Drunk"
 * and "Outsider" when checking this player's identity.
 *
 * nightOrder is null because the Drunk never wakes as "Drunk" — they
 * wake as their believed role.
 * NightAction is null for the same reason.
 */

function DrunkSetupAction({ player, state, onComplete }: SetupActionProps) {
  const { t, language } = useI18n()
  const roleT = getRoleTranslations('drunk', language)
  const [selectedRole, setSelectedRole] = useState<string | null>(null)

  // Get all Townsfolk roles for the narrator to choose from
  const townsfolkRoles = getAllRoles().filter((r) => r.team === 'townsfolk')

  const handleSelect = (roleId: string) => {
    setSelectedRole((prev) => (prev === roleId ? null : roleId))
  }

  const handleConfirm = () => {
    if (!selectedRole) return

    onComplete({
      changeRole: selectedRole,
      addEffects: {
        [player.id]: [
          {
            type: 'drunk',
            data: { actualRole: 'drunk' },
            expiresAt: 'never',
          },
        ],
      },
    })
  }

  return (
    <div className='min-h-app bg-gradient-to-b from-grimoire-purple via-grimoire-dark to-grimoire-darker flex flex-col'>
      {/* Header */}
      <div className='sticky top-0 z-10 bg-grimoire-dark/95 backdrop-blur-sm border-b border-mystic-gold/20 px-4 py-3'>
        <div className='flex items-center gap-3 max-w-lg mx-auto'>
          <div className='w-10 h-10 rounded-full bg-amber-900/30 border border-amber-700/50 flex items-center justify-center'>
            <Icon name='beer' size='md' className='text-amber-400' />
          </div>
          <div>
            <h1 className='font-tarot text-lg text-parchment-100 tracking-wider uppercase'>
              {roleT.drunkSetupTitle}
            </h1>
            <p className='text-xs text-parchment-500'>{player.name}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className='flex-1 px-4 py-4 max-w-lg mx-auto w-full overflow-y-auto'>
        <div className='rounded-xl border border-amber-700/30 bg-amber-900/10 p-4 mb-4'>
          <p className='text-sm text-parchment-300'>
            {roleT.drunkSetupDescription}
          </p>
        </div>

        <h3 className='text-sm font-medium text-parchment-400 uppercase tracking-wider mb-3'>
          {roleT.chooseBelievedRole}
        </h3>

        <div className='mb-6'>
          <RolePickerGrid
            roles={townsfolkRoles}
            state={state}
            selected={selectedRole ? [selectedRole] : []}
            onSelect={handleSelect}
            selectionCount={1}
            colorMode='team'
          />
        </div>
      </div>

      {/* Footer */}
      <div className='sticky bottom-0 bg-grimoire-dark/95 backdrop-blur-sm border-t border-mystic-gold/20 px-4 py-3'>
        <div className='max-w-lg mx-auto'>
          <Button
            onClick={handleConfirm}
            disabled={!selectedRole}
            fullWidth
            size='lg'
            variant='gold'
          >
            <Icon name='check' size='md' className='mr-2' />
            {t.common.confirm}
          </Button>
        </div>
      </div>
    </div>
  )
}

const definition: RoleDefinition = {
  id: 'drunk',
  team: 'outsider',
  icon: 'beer',
  nightOrder: null, // Never wakes as "Drunk"

  RoleReveal: DefaultRoleReveal, // Never shown — player sees their believed role

  NightAction: null, // The believed role's NightAction runs instead

  SetupAction: DrunkSetupAction,
}

export default definition
