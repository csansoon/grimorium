import type { GameState } from '../../../../types'
import { getPlayer } from '../../../../types'
import {
  getRoleName,
  getRoleTranslations,
  useI18n,
} from '../../../../i18n'
import { Badge, Icon, type IconName } from '../../../../../components/atoms'
import { cn } from '../../../../../lib/utils'
import type { SpyInfoPing, SpyInfoRoleId } from './info'

type Props = {
  state: GameState
  pings: SpyInfoPing[]
}

const SOURCE_ROLE_ICONS: Record<SpyInfoRoleId, IconName> = {
  washerwoman: 'shirt',
  librarian: 'bookMarked',
  investigator: 'search',
}

export function SpyInfoPingsPanel({ state, pings }: Props) {
  const { t, language } = useI18n()
  const roleT = getRoleTranslations('spy', language)

  if (pings.length === 0) return null

  const getPlayerName = (playerId: string) =>
    getPlayer(state, playerId)?.name ?? t.ui.unknownPlayer

  return (
    <section className='rounded-xl border border-orange-500/25 bg-orange-950/20 p-4 space-y-3'>
      <div className='flex items-start gap-3'>
        <div className='mt-0.5 flex h-9 w-9 items-center justify-center rounded-full border border-orange-400/30 bg-orange-500/10'>
          <Icon name='hatGlasses' size='md' className='text-orange-300' />
        </div>
        <div className='min-w-0'>
          <h3 className='text-sm font-medium uppercase tracking-[0.18em] text-orange-200'>
            {roleT.spyInfoPingsTitle}
          </h3>
          <p className='mt-1 text-xs text-parchment-400'>
            {roleT.spyInfoPingsDescription}
          </p>
        </div>
      </div>

      <div className='space-y-2'>
        {pings.map((ping) => (
          <article
            key={`${ping.sourcePlayerId}-${ping.sourceRoleId}-${ping.entryId}`}
            className='rounded-lg border border-white/10 bg-black/20 p-3 space-y-3'
          >
            <div className='flex flex-wrap items-center gap-2'>
              <Badge variant='minion' className='gap-1.5'>
                <Icon name={SOURCE_ROLE_ICONS[ping.sourceRoleId]} size='sm' />
                {getRoleName(ping.sourceRoleId, language)}
              </Badge>
              <span className='text-xs text-parchment-500'>
                {roleT.shownTo}
              </span>
              <Badge variant='player'>{getPlayerName(ping.sourcePlayerId)}</Badge>
              {ping.malfunctioned && (
                <Badge variant='warning'>{roleT.arbitraryInfo}</Badge>
              )}
            </div>

            {ping.action === 'no_target' ? (
              <p className='text-sm text-parchment-300'>{roleT.noTargetInfo}</p>
            ) : (
              <div className='space-y-3'>
                <div className='flex flex-wrap items-center gap-2 text-sm text-parchment-300'>
                  <span className='text-parchment-500'>{roleT.shownRole}</span>
                  <Badge variant='role'>
                    {getRoleName(ping.shownRoleId, language)}
                  </Badge>
                </div>

                <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
                  {ping.shownPlayers.map((playerId) => {
                    const isCorrectPing = playerId === ping.targetId

                    return (
                      <div
                        key={`${ping.entryId}-${playerId}`}
                        className={cn(
                          'rounded-lg border px-3 py-2',
                          isCorrectPing
                            ? 'border-emerald-500/30 bg-emerald-950/25'
                            : 'border-white/10 bg-white/5',
                        )}
                      >
                        <div className='flex items-center justify-between gap-2'>
                          <span className='text-sm font-medium text-parchment-100'>
                            {getPlayerName(playerId)}
                          </span>
                          <Badge
                            variant={isCorrectPing ? 'success' : 'warning'}
                            className='shrink-0'
                          >
                            {isCorrectPing
                              ? roleT.correctPing
                              : roleT.wrongPing}
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}