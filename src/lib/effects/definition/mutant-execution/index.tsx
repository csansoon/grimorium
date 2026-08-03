import { EffectDefinition } from '../../types'
import { DayActionDefinition, DayActionProps } from '../../../pipeline/types'
import { isAlive } from '../../../types'
import { useI18n } from '../../../i18n'
import { Button, Icon, BackButton } from '../../../../components/atoms'
import { ScreenFooter } from '../../../../components/layouts/ScreenFooter'

function MutantExecutionAction({
  state,
  playerId,
  onComplete,
  onBack,
}: DayActionProps) {
  const { t } = useI18n()
  const player = state.players.find((candidate) => candidate.id === playerId)
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
              <Icon name='zapOff' size='3xl' className='text-red-400 text-glow-red' />
            </div>
            <h1 className='font-tarot text-2xl text-parchment-100 tracking-widest-xl uppercase'>
              Mutant
            </h1>
            <p className='text-parchment-400 text-sm'>
              Execute this player if their madness was broken.
            </p>
          </div>
        </div>
      </div>

      <div className='flex-1 px-6 py-8 max-w-lg mx-auto w-full'>
        <div className='rounded-2xl border border-red-500/20 bg-white/5 px-5 py-5 text-center'>
          <div className='text-sm uppercase tracking-[0.24em] text-red-200/70 mb-2'>
            Player
          </div>
          <div className='text-2xl font-semibold text-parchment-100'>
            {player.name}
          </div>
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
                    { type: 'text', content: 'Mutant executed: ' },
                    { type: 'player', playerId },
                  ],
                  data: { playerId, cause: 'mutant' },
                },
              ],
              intent: { type: 'execute', playerId, cause: 'mutant' },
            })
          }
          fullWidth
          size='lg'
          variant='slayer'
        >
          <Icon name='zapOff' size='md' className='mr-2' />
          Execute Mutant
        </Button>
      </ScreenFooter>
    </div>
  )
}

const dayAction: DayActionDefinition = {
  id: 'mutant_execution',
  icon: 'zapOff',
  getLabel: () => 'Execute Mutant',
  getDescription: () => 'Use this if the Mutant broke madness.',
  condition: (player) => isAlive(player),
  ActionComponent: MutantExecutionAction,
}

const definition: EffectDefinition = {
  id: 'mutant_execution',
  icon: 'zapOff',
  defaultType: 'passive',
  persistence: {
    targetRoleChange: 'remove',
  },
  dayActions: [dayAction],
}

export default definition
