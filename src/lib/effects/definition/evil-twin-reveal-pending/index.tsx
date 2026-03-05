import { EffectDefinition } from '../../types'
import { NightFollowUpDefinition, NightFollowUpProps } from '../../../pipeline/types'
import { PlayerFacingScreen } from '../../../../components/layouts/PlayerFacingScreen'
import { TeamBackground } from '../../../../components/items/TeamBackground'
import { HandbackButton } from '../../../../components/layouts'
import { ScreenFooter } from '../../../../components/layouts/ScreenFooter'
import { useI18n } from '../../../i18n'

function EvilTwinRevealAction({
  state,
  playerId,
  onComplete,
}: NightFollowUpProps) {
  const { t } = useI18n()
  const player = state.players.find((candidate) => candidate.id === playerId)
  const effect = player?.effects.find((candidate) => candidate.type === 'evil_twin_reveal_pending')
  const counterpartId = effect?.data?.counterpartId as string | undefined
  const isEvilTwin = effect?.data?.isEvilTwin === true
  const counterpart = state.players.find((candidate) => candidate.id === counterpartId)
  if (!player || !counterpart) return null

  return (
    <PlayerFacingScreen playerName={player.name}>
      <TeamBackground teamId='townsfolk'>
        <div className='min-h-app flex flex-col'>
          <div className='flex-1 px-6 py-10 flex flex-col items-center justify-center text-center'>
            <div className='w-20 h-20 rounded-full border border-indigo-400/30 bg-indigo-400/10 flex items-center justify-center mb-6'>
              <div className='text-4xl text-indigo-300'>II</div>
            </div>
            <h1 className='font-tarot text-3xl text-parchment-100 tracking-widest-xl uppercase mb-4'>
              Evil Twin
            </h1>
            <p className='text-parchment-300 text-base max-w-xs mb-6'>
              {isEvilTwin ? t.game.yourGoodTwinIs : t.game.yourEvilTwinIs}
            </p>
            <div className='rounded-2xl border border-indigo-400/20 bg-white/5 px-4 py-4 w-full max-w-sm'>
              <div className='text-lg font-semibold text-parchment-100'>
                {counterpart.name}
              </div>
            </div>
          </div>
          <ScreenFooter borderColor='border-indigo-500/30'>
            <HandbackButton
              onClick={() =>
                onComplete({
                  entries: [],
                  removeEffects: { [playerId]: ['evil_twin_reveal_pending'] },
                })
              }
              fullWidth
              size='lg'
              variant='primary'
            >
              {t.common.continue}
            </HandbackButton>
          </ScreenFooter>
        </div>
      </TeamBackground>
    </PlayerFacingScreen>
  )
}

const followUp: NightFollowUpDefinition = {
  id: 'evil_twin_reveal',
  icon: 'users',
  getLabel: () => 'Reveal Evil Twin',
  condition: () => true,
  ActionComponent: EvilTwinRevealAction,
}

const definition: EffectDefinition = {
  id: 'evil_twin_reveal_pending',
  icon: 'users',
  defaultType: 'pending',
  nightFollowUps: [followUp],
}

export default definition
