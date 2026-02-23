import { useI18n } from '../../lib/i18n'
import { Button, Icon } from '../atoms'

type Props = {
  onReady: () => void
}

export function ReturnDeviceScreen({ onReady }: Props) {
  const { t } = useI18n()

  return (
    <div className='min-h-app bg-gradient-to-b from-grimoire-purple via-grimoire-dark to-grimoire-darker flex flex-col items-center justify-center px-6'>
      <div className='text-center max-w-sm'>
        <div className='mb-6'>
          <Icon
            name='smartphone'
            size='4xl'
            className='text-mystic-gold/80 mx-auto'
          />
        </div>
        <h1 className='font-tarot text-2xl text-parchment-100 tracking-widest-xl uppercase mb-3'>
          {t.game.returnDeviceToNarrator}
        </h1>
        <p className='text-parchment-500 text-sm mb-10'>
          {t.game.returnDeviceDescription}
        </p>
        <Button onClick={onReady} size='lg' variant='gold' fullWidth>
          <Icon name='check' size='md' className='mr-2' />
          {t.game.returnDeviceReady}
        </Button>
      </div>
    </div>
  )
}
