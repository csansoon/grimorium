import { EffectDefinition } from '../../types'
import { DayActionDefinition, DayActionProps } from '../../../pipeline/types'
import { hasEffect, isAlive } from '../../../types'
import { useI18n, getRoleName } from '../../../i18n'
import { Button, Icon, BackButton } from '../../../../components/atoms'
import { ScreenFooter } from '../../../../components/layouts/ScreenFooter'

function CerenovusMadnessAction({
  state,
  playerId,
  onComplete,
  onBack,
}: DayActionProps) {
  const { t, language } = useI18n()
  const player = state.players.find((candidate) => candidate.id === playerId)
  const effect = player?.effects.find((candidate) => candidate.type === 'cerenovus_madness')
  const madAsRoleId = effect?.data?.madAsRoleId as string | undefined
  if (!player) return null

  return (
    <div className='min-h-app bg-gradient-to-b from-red-950 via-rose-950 to-grimoire-dark flex flex-col'>
      <div className='bg-gradient-to-b from-white/5 to-transparent px-4 py-4'>
        <div className='max-w-lg mx-auto'>
          <div className='flex items-center mb-4'>
            <BackButton onClick={onBack} />
            <span className='text-parchment-500 text-xs ml-1'>
              {t.common.back}
            </span>
          </div>
          <div className='text-center'>
            <div className='flex justify-center mb-2'>
              <Icon name='drama' size='3xl' className='text-red-400 text-glow-red' />
            </div>
            <h1 className='font-tarot text-2xl text-parchment-100 tracking-widest-xl uppercase'>
              Cerenovus
            </h1>
            <p className='text-parchment-400 text-sm'>
              Execute this player if they broke madness.
            </p>
          </div>
        </div>
      </div>
      <div className='flex-1 px-6 py-8 max-w-lg mx-auto w-full space-y-4'>
        <div className='rounded-2xl border border-red-500/20 bg-white/5 px-5 py-5 text-center'>
          <div className='text-sm uppercase tracking-[0.24em] text-red-200/70 mb-2'>
            Player
          </div>
          <div className='text-2xl font-semibold text-parchment-100'>
            {player.name}
          </div>
          {madAsRoleId && (
            <div className='text-sm text-parchment-400 mt-3'>
              Mad as {getRoleName(madAsRoleId, language)}
            </div>
          )}
        </div>
      </div>
      <ScreenFooter borderColor='border-red-500/30'>
        <Button
          onClick={() =>
            onComplete({
              entries: [
                {
                  type: 'execution',
                  message: [
                    { type: 'text', content: 'Cerenovus executed: ' },
                    { type: 'player', playerId },
                  ],
                  data: { playerId, cause: 'cerenovus' },
                },
              ],
              intent: { type: 'execute', playerId, cause: 'cerenovus' },
              removeEffects: { [playerId]: ['cerenovus_madness'] },
            })
          }
          fullWidth
          size='lg'
          variant='slayer'
        >
          <Icon name='drama' size='md' className='mr-2' />
          Execute for Madness
        </Button>
      </ScreenFooter>
    </div>
  )
}

const dayAction: DayActionDefinition = {
  id: 'cerenovus_madness',
  icon: 'drama',
  getLabel: () => 'Resolve Cerenovus',
  getDescription: () => 'Use this if the selected player broke madness.',
  condition: (player) => isAlive(player) && hasEffect(player, 'cerenovus_madness'),
  ActionComponent: CerenovusMadnessAction,
}

const definition: EffectDefinition = {
  id: 'cerenovus_madness',
  icon: 'drama',
  defaultType: 'pending',
  dayActions: [dayAction],
}

export default definition
