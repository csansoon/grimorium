import { useI18n, interpolate } from '../../lib/i18n'
import { Button, Icon } from '../atoms'

type Props = {
  playerName: string
  onReady: () => void
}

export function HandDeviceScreen({ playerName, onReady }: Props) {
  const { t } = useI18n()

  return (
    <div className='min-h-app bg-gradient-to-b from-indigo-950 via-grimoire-purple to-grimoire-darker flex flex-col items-center justify-center px-6'>
      <div className='text-center max-w-sm'>
        <div className='mb-6'>
          <Icon
            name='smartphone'
            size='4xl'
            className='text-indigo-400/80 mx-auto'
          />
        </div>
        <h1 className='font-tarot text-2xl text-parchment-100 tracking-widest-xl uppercase mb-3'>
          {interpolate(t.game.handDeviceTo, { player: playerName })}
        </h1>
        <p className='text-parchment-500 text-sm mb-10'>
          {t.game.tapWhenReady}
        </p>
        <Button onClick={onReady} size='lg' variant='default' fullWidth>
          <Icon name='check' size='md' className='mr-2' />
          {t.game.tapWhenReady}
        </Button>
      </div>
    </div>
  )
}
