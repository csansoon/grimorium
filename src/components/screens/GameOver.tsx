import { Game, GameState, hasEffect } from '../../lib/types'
import { getRole } from '../../lib/roles'
import {
  useI18n,
  getEffectName as getRegistryEffectName,
  getRoleName,
  interpolate,
} from '../../lib/i18n'
import { Button, Badge, Icon } from '../atoms'
import { MysticDivider } from '../items'
import { cn } from '../../lib/utils'
import type { WinReasonCode } from '../../lib/game'

type Props = {
  game: Game
  state: GameState
  onMainMenu: () => void
  onShowHistory: () => void
}

function getWinReasonText(
  t: ReturnType<typeof useI18n>['t'],
  reason?: string,
): string {
  switch (reason as WinReasonCode | undefined) {
    case 'all_demons_dead':
      return t.game.winReasonAllDemonsDead
    case 'final_two_alive':
      return t.game.winReasonFinalTwoAlive
    case 'vortox_no_execution':
      return t.game.winReasonVortoxNoExecution
    case 'martyrdom_execution':
      return t.game.winReasonMartyrdomExecution
    case 'evil_twin_good_executed':
      return t.game.winReasonEvilTwinGoodExecuted
    case 'evil_twin_evil_executed':
      return t.game.winReasonEvilTwinEvilExecuted
    case 'mayor_peaceful_victory':
      return t.game.winReasonMayorPeacefulVictory
    default:
      return t.game.winReasonSpecialAbility
  }
}

export function GameOver({ game, state, onMainMenu, onShowHistory }: Props) {
  const { t, language } = useI18n()
  const winner = state.winner
  const isGoodWin = winner === 'townsfolk'
  const gameEndedEntry = [...game.history]
    .reverse()
    .find((entry) => entry.type === 'game_ended')
  const winReason = getWinReasonText(t, gameEndedEntry?.data?.winReason as string | undefined)
  const winReasonSourceRoleId = gameEndedEntry?.data?.winReasonSourceRoleId as
    | string
    | undefined
  const winReasonSourceEffectType = gameEndedEntry?.data
    ?.winReasonSourceEffectType as string | undefined
  const winReasonSourceRole = winReasonSourceRoleId
    ? getRoleName(winReasonSourceRoleId, language)
    : null
  const winReasonSourceEffect = winReasonSourceEffectType
    ? getRegistryEffectName(winReasonSourceEffectType, language)
    : null
  const winReasonSourceText = winReasonSourceRole
    ? interpolate(t.game.winReasonSourceRole, { role: winReasonSourceRole })
    : winReasonSourceEffect
      ? interpolate(t.game.winReasonSourceEffect, { effect: winReasonSourceEffect })
      : null

  return (
    <div
      className={cn(
        'min-h-app flex flex-col bg-gradient-to-b',
        isGoodWin
          ? 'from-indigo-950 via-blue-950 to-grimoire-dark'
          : 'from-red-950 via-grimoire-blood to-grimoire-darker',
      )}
    >
      {/* Victory Banner */}
      <div className='flex-1 flex items-center justify-center px-4 py-8'>
        <div className='text-center'>
          {/* Icon */}
          <div className='mb-6'>
            <div
              className={cn(
                'w-28 h-28 mx-auto rounded-full flex items-center justify-center border-2',
                isGoodWin
                  ? 'bg-mystic-gold/10 border-mystic-gold/40'
                  : 'bg-red-900/30 border-red-600/40',
              )}
            >
              {isGoodWin ? (
                <Icon
                  name='trophy'
                  size='4xl'
                  className='text-mystic-gold text-glow-gold'
                />
              ) : (
                <Icon
                  name='skull'
                  size='4xl'
                  className='text-red-500 text-glow-crimson'
                />
              )}
            </div>
          </div>

          {/* Title */}
          <h1
            className={cn(
              'font-tarot text-4xl font-bold tracking-widest-xl uppercase mb-3',
              isGoodWin
                ? 'text-parchment-100'
                : 'text-red-400 text-glow-crimson',
            )}
          >
            {isGoodWin ? t.game.goodWins : t.game.evilWins}
          </h1>
          <p className='text-parchment-400 text-sm mb-8'>
            {isGoodWin ? t.game.townVanquishedDemon : t.game.demonConqueredTown}
          </p>

          <div className='max-w-sm mx-auto mb-8 rounded-xl border border-white/15 bg-black/25 px-4 py-3 text-left'>
            <div className='text-xs uppercase tracking-[0.2em] text-parchment-500 mb-1'>
              {t.game.winTriggeredBy}
            </div>
            <div className='text-sm text-parchment-200'>{winReason}</div>
            {winReasonSourceText && (
              <div className='text-xs text-parchment-400 mt-1'>{winReasonSourceText}</div>
            )}
          </div>

          {/* Divider */}
          <MysticDivider
            icon={isGoodWin ? 'sparkles' : 'skull'}
            iconClassName={
              isGoodWin ? 'text-mystic-gold/40' : 'text-red-500/40'
            }
            className='mb-6'
          />

          {/* Final Roles */}
          <div className='max-w-sm mx-auto'>
            <h2 className='font-tarot text-sm text-parchment-400 tracking-wider uppercase mb-4'>
              {t.game.finalRoles}
            </h2>
            <div className='space-y-2'>
              {state.players.map((player) => {
                const role = getRole(player.roleId)
                const isDead = hasEffect(player, 'dead')

                return (
                  <div
                    key={player.id}
                    className={cn(
                      'flex items-center justify-between py-2 px-3 rounded-lg',
                      isDead ? 'opacity-50' : '',
                    )}
                  >
                    <span className='flex items-center gap-2'>
                      {isDead && (
                        <Icon
                          name='skull'
                          size='sm'
                          className='text-parchment-500'
                        />
                      )}
                      <span
                        className={cn(
                          'text-sm',
                          isDead ? 'text-parchment-500' : 'text-parchment-200',
                        )}
                      >
                        {player.name}
                      </span>
                    </span>
                    {role && (
                      <Badge
                        variant={role.team}
                        className='inline-flex items-center gap-1'
                      >
                        <Icon name={role.icon} size='xs' />{' '}
                        {getRoleName(role.id, language)}
                      </Badge>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className='px-4 pb-8 max-w-lg mx-auto w-full space-y-3'>
        <Button
          onClick={onShowHistory}
          fullWidth
          size='lg'
          variant='secondary'
          className='font-tarot uppercase tracking-wider'
        >
          <Icon name='history' size='md' className='mr-2' />
          {t.common.history}
        </Button>
        <Button
          onClick={onMainMenu}
          fullWidth
          size='lg'
          variant={isGoodWin ? 'gold' : 'evil'}
        >
          {t.game.backToMainMenu}
        </Button>
      </div>
    </div>
  )
}
