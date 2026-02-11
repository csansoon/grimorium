import { useState, useMemo } from 'react'
import { GameState, getAlivePlayers } from '../../lib/types'
import { useI18n } from '../../lib/i18n'
import { Button, Icon, BackButton } from '../atoms'
import { ScreenFooter } from '../layouts/ScreenFooter'
import { MysticDivider } from '../items'
import { PlayerPickerList } from '../inputs'

type Props = {
  state: GameState
  onNominate: (nominatorId: string, nomineeId: string) => void
  onBack: () => void
}

export function NominationScreen({ state, onNominate, onBack }: Props) {
  const { t } = useI18n()
  const [nominator, setNominator] = useState<string | null>(null)
  const [nominee, setNominee] = useState<string | null>(null)

  const alivePlayers = getAlivePlayers(state)

  const nomineeCandidates = useMemo(
    () => alivePlayers.filter((p) => p.id !== nominator),
    [alivePlayers, nominator],
  )

  const handleSelectNominator = (playerId: string) => {
    setNominator(playerId)
    // Clear nominee if it's the same as the new nominator
    if (nominee === playerId) setNominee(null)
  }

  const handleNominate = () => {
    if (nominator && nominee) {
      onNominate(nominator, nominee)
    }
  }

  const canNominate = nominator && nominee

  return (
    <div className='min-h-app bg-gradient-to-b from-red-950 via-grimoire-blood to-grimoire-darker flex flex-col'>
      {/* Header */}
      <div className='sticky top-0 z-10 bg-grimoire-dark/95 backdrop-blur-sm border-b border-red-500/30 px-4 py-3'>
        <div className='flex items-center gap-3 max-w-lg mx-auto'>
          <BackButton onClick={onBack} />
          <div>
            <h1 className='font-tarot text-lg text-parchment-100 tracking-wider uppercase'>
              {t.game.newNomination}
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className='flex-1 px-4 py-6 max-w-lg mx-auto w-full'>
        {/* Nominator Selection */}
        <div className='mb-6'>
          <label className='flex items-center gap-2 text-parchment-400 text-xs tracking-wider uppercase mb-3'>
            <Icon name='userRound' size='sm' />
            {t.game.whoIsNominating}
          </label>
          <PlayerPickerList
            players={alivePlayers}
            selected={nominator ? [nominator] : []}
            onSelect={handleSelectNominator}
            selectionCount={1}
            variant='red'
          />
        </div>

        {/* Divider */}
        <MysticDivider
          icon='swords'
          iconClassName='text-red-500/50'
          className='mb-6'
        />

        {/* Nominee Selection */}
        <div className='mb-6'>
          <label className='flex items-center gap-2 text-parchment-400 text-xs tracking-wider uppercase mb-3'>
            <Icon name='userX' size='sm' />
            {t.game.whoAreTheyNominating}
          </label>
          <PlayerPickerList
            players={nomineeCandidates}
            selected={nominee ? [nominee] : []}
            onSelect={setNominee}
            selectionCount={1}
            variant='red'
          />
        </div>

        {/* Summary */}
        {nominator && nominee && (
          <div className='bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6 text-center'>
            <p className='text-parchment-200 text-sm'>
              <span className='font-medium text-parchment-100'>
                {alivePlayers.find((p) => p.id === nominator)?.name}
              </span>
              {' nominates '}
              <span className='font-medium text-red-300'>
                {alivePlayers.find((p) => p.id === nominee)?.name}
              </span>
              {' for execution'}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <ScreenFooter borderColor='border-red-500/30'>
        <Button
          onClick={handleNominate}
          disabled={!canNominate}
          fullWidth
          size='lg'
          variant='evil'
        >
          <Icon name='swords' size='md' className='mr-2' />
          {t.game.startNomination}
        </Button>
      </ScreenFooter>
    </div>
  )
}
