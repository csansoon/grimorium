import { useState, useEffect } from 'react'
import { Button, Icon } from '../atoms'
import { cn } from '../../lib/utils'
import { useI18n } from '../../lib/i18n'

export type DeathRevealEntry = {
    playerId: string
    playerName: string
    roleId: string
}

type Props = {
    deaths: DeathRevealEntry[]
    onContinue: () => void
}

export function DeathRevealScreen({ deaths, onContinue }: Props) {
    const { t } = useI18n()
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isFlipped, setIsFlipped] = useState(false)

    const currentDeath = deaths[currentIndex]
    const isLastDeath = currentIndex === deaths.length - 1

    // Auto-flip after a short delay when showing a new death
    useEffect(() => {
        setIsFlipped(false)
        const timer = setTimeout(() => {
            setIsFlipped(true)
        }, 1200)

        return () => clearTimeout(timer)
    }, [currentIndex])

    const handleNext = () => {
        if (isLastDeath) {
            onContinue()
        } else {
            setCurrentIndex((i) => i + 1)
        }
    }

    if (!currentDeath) return null

    return (
        <div className='min-h-app bg-gradient-to-b from-red-950 via-grimoire-blood to-grimoire-darker flex flex-col relative overflow-hidden'>
            {/* Header */}
            <div className='absolute top-0 inset-x-0 p-6 text-center z-10 bg-gradient-to-b from-grimoire-dark/80 to-transparent pointer-events-none'>
                <div className='flex justify-center mb-2'>
                    <Icon name='skull' size='3xl' className='text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]' />
                </div>
                <h1 className='font-tarot text-2xl text-red-50 tracking-widest-xl uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]'>
                    {t.game.deathRevealTitle}
                </h1>
                <p className='text-red-200/80 text-sm mt-1 uppercase tracking-widest drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]'>
                    {t.game.deathRevealSubtitle}
                </p>
            </div>

            {/* 3D Card + Player Name + Button — all in one centered column */}
            <div className='flex-1 flex flex-col items-center justify-center px-6 py-4 min-h-0 gap-4'>
                <div className='death-card-container'>
                    <div className={cn('death-card-inner', isFlipped && 'is-flipped')}>
                        {/* BACK FACE (Player Name + Skull) */}
                        <div className='death-card-face'>
                            <div
                                className={cn(
                                    'w-full aspect-[2.5/3.5] rounded-xl border-2 flex flex-col items-center justify-center p-8 bg-parchment-texture relative overflow-hidden',
                                    'bg-gradient-to-b from-slate-800 to-slate-950 border-red-500/40',
                                )}
                                style={{
                                    boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.8), inset 0 0 40px rgba(0,0,0,0.6)',
                                }}
                            >
                                <div className='absolute inset-0 bg-red-950/40 mix-blend-multiply' />
                                <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40' />

                                <div className='relative z-10 flex flex-col items-center'>
                                    <div className='w-20 h-20 rounded-full bg-red-950/80 border-2 border-red-500/30 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(239,68,68,0.2)]'>
                                        <Icon name='skull' size='3xl' className='text-red-400 opacity-80' />
                                    </div>
                                    <h2 className='font-tarot text-2xl sm:text-3xl text-parchment-100 tracking-widest text-center drop-shadow-lg mb-2'>
                                        {currentDeath.playerName}
                                    </h2>
                                </div>
                            </div>
                        </div>

                        {/* FRONT FACE — public deaths never reveal a character */}
                        <div className='death-card-face death-card-front'>
                            <div
                                className='w-full aspect-[2.5/3.5] rounded-xl border-2 border-red-500/40 bg-gradient-to-b from-slate-800 to-slate-950 flex flex-col items-center justify-center p-8 relative overflow-hidden'
                                style={{ boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.8), inset 0 0 60px rgba(153, 27, 27, 0.4)' }}
                            >
                                <div className='absolute inset-0 bg-red-950/30 mix-blend-multiply' />
                                <Icon name='skull' size='3xl' className='text-red-400/80 mb-7 relative z-10' />
                                <h2 className='font-tarot text-2xl sm:text-3xl text-parchment-100 tracking-widest text-center drop-shadow-lg relative z-10'>
                                    {currentDeath.playerName}
                                </h2>
                                <div className='absolute inset-x-0 bottom-[15%] flex justify-center pointer-events-none'>
                                    <div className='bg-red-950/90 border-2 border-red-500/50 px-6 py-2 rounded shadow-[0_0_30px_rgba(239,68,68,0.5)] transform -rotate-12 backdrop-blur-sm'>
                                        <span className='font-tarot text-2xl text-red-400 tracking-widest-xl uppercase'>
                                            {t.game.deathRevealDead}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Player Name (below the card, fades in after flip) */}
                <div className={cn(
                    'flex flex-col items-center transition-all duration-700',
                    isFlipped ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                )}>
                    <h2 className='font-tarot text-2xl sm:text-3xl text-parchment-100 tracking-widest text-center drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]'>
                        {currentDeath.playerName}
                    </h2>
                </div>

                {/* Floating Button (no footer background) */}
                <Button
                    onClick={handleNext}
                    size='lg'
                    variant='danger'
                    disabled={!isFlipped}
                    className={cn(
                        'transition-all duration-500 px-12',
                        isFlipped ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
                    )}
                >
                    {isLastDeath ? t.game.deathRevealContinue : t.game.deathRevealNextDeath}
                    <Icon name='arrowRight' size='md' className='ml-2' />
                </Button>
            </div>
        </div>
    )
}
