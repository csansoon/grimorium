import { PlayerState } from '../../lib/types'
import { getRole } from '../../lib/roles'
import { useI18n, interpolate, getRoleName } from '../../lib/i18n'
import { Button, Icon, BackButton } from '../atoms'
import { MysticDivider } from '../items'

type Props = {
  player: PlayerState
  action: 'role_reveal' | 'night_action' | 'role_change'
  onProceed: () => void
  onMainMenu: () => void
}

export function NarratorPrompt({
  player,
  action,
  onProceed,
  onMainMenu,
}: Props) {
  const { t, language } = useI18n()
  const role = getRole(player.roleId)
  const roleName = role ? getRoleName(role.id, language) : 'Unknown'

  const isRoleReveal = action === 'role_reveal'
  const isRoleChange = action === 'role_change'

  const getIcon = () => {
    if (isRoleReveal)
      return {
        name: 'eye' as const,
        className: 'text-mystic-gold text-glow-gold',
      }
    if (isRoleChange)
      return {
        name: 'sparkles' as const,
        className: 'text-purple-400 text-glow-gold',
      }
    return { name: 'moon' as const, className: 'text-indigo-400' }
  }

  const getMessage = () => {
    if (isRoleReveal)
      return interpolate(t.game.narratorGiveDevice, { player: player.name })
    if (isRoleChange)
      return interpolate(t.game.narratorRoleChanged, { player: player.name })
    return interpolate(t.game.narratorWakePlayer, {
      player: player.name,
      role: roleName,
    })
  }

  const icon = getIcon()

  return (
    <div className='min-h-app bg-gradient-to-b from-grimoire-purple via-grimoire-dark to-grimoire-darker flex flex-col'>
      {/* Back button */}
      <div className='px-4 py-4'>
        <BackButton onClick={onMainMenu} label={t.common.mainMenu} />
      </div>

      <div className='flex-1 flex items-center justify-center p-4'>
        <div className='max-w-sm w-full text-center'>
          {/* Icon */}
          <div className='mb-8'>
            <div className='w-24 h-24 mx-auto rounded-full bg-mystic-gold/10 border border-mystic-gold/30 flex items-center justify-center'>
              <Icon name={icon.name} size='3xl' className={icon.className} />
            </div>
          </div>

          {/* Narrator label */}
          <p className='text-parchment-500 text-xs tracking-widest uppercase mb-2'>
            Narrator
          </p>

          {/* Message */}
          <p className='font-tarot text-xl text-parchment-100 leading-relaxed mb-8'>
            {getMessage()}
          </p>

          {/* Decorative divider */}
          <MysticDivider className='mb-8' />

          {/* Button */}
          <Button onClick={onProceed} fullWidth size='lg' variant='gold'>
            {t.game.readyShowToPlayer}
          </Button>
        </div>
      </div>
    </div>
  )
}
