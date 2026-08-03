import { useMemo, useState } from 'react'
import { GameState } from '../../lib/types'
import { useI18n, getRoleName } from '../../lib/i18n'
import { Button, Icon, BackButton } from '../atoms'
import { PlayerPickerList, type PlayerGroup } from '../inputs'
import { MysticDivider } from '../items'
import { OracleCard, NumberReveal, TeamBackground } from '../items'
import { ScreenFooter } from '../layouts/ScreenFooter'
import { PlayerFacingScreen } from '../layouts/PlayerFacingScreen'
import { HandbackButton } from '../layouts'
import type { IconName } from '../atoms/icon'
import { getRole } from '../../lib/roles'
import type { FalseInfoMode } from '../../lib/roles/runtime-helpers'

type StorytellerChoiceScreenProps = {
  state: GameState
  icon: IconName
  title: string
  description: string
  selectionCount?: number | null
  confirmLabel: string
  variant?: 'red' | 'blue'
  players?: GameState['players']
  disabled?: Set<string>
  groups?: PlayerGroup[]
  onBack?: () => void
  onConfirm: (selectedIds: string[]) => void
}

const headerTheme = {
  red: {
    bg: 'from-red-950 via-rose-950 to-grimoire-dark',
    glow: 'text-red-400 text-glow-red',
    footer: 'border-red-500/30',
    button: 'slayer' as const,
  },
  blue: {
    bg: 'from-indigo-950 via-grimoire-purple to-grimoire-darker',
    glow: 'text-indigo-300',
    footer: 'border-indigo-500/30',
    button: 'primary' as const,
  },
}

export function StorytellerChoiceScreen({
  state,
  icon,
  title,
  description,
  selectionCount = 1,
  confirmLabel,
  variant = 'blue',
  players,
  disabled,
  groups,
  onBack,
  onConfirm,
}: StorytellerChoiceScreenProps) {
  const { t } = useI18n()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const theme = headerTheme[variant]
  const selectablePlayers = players ?? state.players

  const handleSelect = (playerId: string) => {
    if (selectionCount === 1) {
      setSelectedIds([playerId])
      return
    }

    setSelectedIds((current) => {
      if (current.includes(playerId)) {
        return current.filter((id) => id !== playerId)
      }
      if (selectionCount != null && current.length >= selectionCount) {
        return current
      }
      return [...current, playerId]
    })
  }

  const canConfirm =
    selectionCount == null
      ? selectedIds.length > 0
      : selectedIds.length === selectionCount

  return (
    <div className={`min-h-app bg-gradient-to-b ${theme.bg} flex flex-col`}>
      <div className='bg-gradient-to-b from-white/5 to-transparent px-4 py-3 sm:py-4'>
        <div className='max-w-lg mx-auto'>
          {onBack && (
            <div className='flex items-center mb-4'>
              <BackButton onClick={onBack} />
              <span className='text-parchment-500 text-xs ml-1'>
                {t.common.back}
              </span>
            </div>
          )}

          <div className='text-center'>
            <div className='flex justify-center mb-2'>
              <Icon name={icon} size='3xl' className={theme.glow} />
            </div>
            <h1 className='font-tarot text-xl sm:text-2xl text-parchment-100 tracking-[0.18em] sm:tracking-widest-xl uppercase'>
              {title}
            </h1>
            <p className='text-parchment-400 text-sm'>{description}</p>
          </div>
        </div>
      </div>

      <div className='flex-1 px-4 pb-3 sm:pb-4 max-w-lg mx-auto w-full overflow-y-auto'>
        <MysticDivider className='mb-4 sm:mb-6' />
        <PlayerPickerList
          players={selectablePlayers}
          selected={selectedIds}
          onSelect={handleSelect}
          selectionCount={selectionCount}
          variant={variant}
          disabled={disabled}
          groups={groups}
        />
      </div>

      <ScreenFooter borderColor={theme.footer}>
        <Button
          onClick={() => onConfirm(selectedIds)}
          disabled={!canConfirm}
          fullWidth
          size='lg'
          variant={theme.button}
        >
          <Icon name={icon} size='md' className='mr-2' />
          {confirmLabel}
        </Button>
      </ScreenFooter>
    </div>
  )
}

type SageRevealScreenProps = {
  state: GameState
  playerId: string
  demonId: string
  decoyId: string
  onComplete: () => void
}

export function SageRevealScreen({
  state,
  playerId,
  demonId,
  decoyId,
  onComplete,
}: SageRevealScreenProps) {
  const { t } = useI18n()
  const sage = state.players.find((player) => player.id === playerId)
  const choices = useMemo(
    () =>
      [demonId, decoyId]
        .map((id) => state.players.find((player) => player.id === id))
        .filter(Boolean),
    [decoyId, demonId, state.players],
  )

  if (!sage) return null

  return (
    <PlayerFacingScreen playerName={sage.name}>
      <div className='min-h-app bg-gradient-to-b from-indigo-950 via-grimoire-purple to-grimoire-darker flex flex-col'>
        <div className='flex-1 px-4 py-5 sm:px-6 sm:py-10 flex flex-col items-center justify-center text-center'>
          <div className='w-16 h-16 sm:w-20 sm:h-20 rounded-full border border-indigo-400/30 bg-indigo-400/10 flex items-center justify-center mb-4 sm:mb-6'>
            <Icon name='bookUser' size='3xl' className='text-indigo-300' />
          </div>
          <p className='text-indigo-200/70 text-xs uppercase tracking-[0.32em] mb-2'>
            {t.game.showToPlayer}
          </p>
          <h1 className='font-tarot text-2xl sm:text-3xl text-parchment-100 tracking-[0.22em] sm:tracking-widest-xl uppercase mb-3 sm:mb-4'>
            Sage
          </h1>
          <p className='text-parchment-300 text-sm sm:text-base max-w-xs mb-4 sm:mb-6'>
            One of these players is the Demon.
          </p>
          <div className='w-full max-w-sm space-y-3'>
            {choices.map((player) => (
              <div
                key={player!.id}
                className='rounded-2xl border border-indigo-400/20 bg-white/5 px-4 py-4'
              >
                <div className='text-lg font-semibold text-parchment-100'>
                  {player!.name}
                </div>
              </div>
            ))}
          </div>
        </div>

        <ScreenFooter borderColor='border-indigo-500/30'>
          <HandbackButton
            onClick={onComplete}
            fullWidth
            size='lg'
            variant='primary'
          >
            {t.common.continue}
          </HandbackButton>
        </ScreenFooter>
      </div>
    </PlayerFacingScreen>
  )
}

type StorytellerBooleanScreenProps = {
  icon: IconName
  title: string
  description: string
  trueLabel: string
  falseLabel: string
  falseInfoWarning?: boolean
  falseInfoMode?: FalseInfoMode | null
  onBack?: () => void
  onSelect: (value: boolean) => void
}

export function StorytellerBooleanScreen({
  icon,
  title,
  description,
  trueLabel,
  falseLabel,
  falseInfoWarning = false,
  falseInfoMode = null,
  onBack,
  onSelect,
}: StorytellerBooleanScreenProps) {
  const { t } = useI18n()

  return (
    <div className='min-h-app bg-gradient-to-b from-indigo-950 via-grimoire-purple to-grimoire-darker flex flex-col'>
      <div className='bg-gradient-to-b from-white/5 to-transparent px-4 py-3 sm:py-4'>
        <div className='max-w-lg mx-auto'>
          {onBack && (
            <div className='flex items-center mb-4'>
              <BackButton onClick={onBack} />
              <span className='text-parchment-500 text-xs ml-1'>
                {t.common.back}
              </span>
            </div>
          )}

          <div className='text-center'>
            <div className='flex justify-center mb-2'>
              <Icon name={icon} size='3xl' className='text-indigo-300' />
            </div>
            <h1 className='font-tarot text-xl sm:text-2xl text-parchment-100 tracking-[0.18em] sm:tracking-widest-xl uppercase'>
              {title}
            </h1>
            <p className='text-parchment-400 text-sm'>{description}</p>
          </div>
        </div>
      </div>

      {(falseInfoWarning || falseInfoMode) && (
        <div className='px-4'>
          <div className='max-w-lg mx-auto rounded-lg bg-amber-900/40 border border-amber-500/40 px-3 py-2 flex items-start gap-2'>
            <Icon name='flask' size='sm' className='text-amber-400 flex-shrink-0 mt-0.5' />
            <span className='text-amber-300 text-xs'>
              {falseInfoMode === 'vortox'
                ? t.game.falseInfoReminder
                : t.game.arbitraryInfoReminder}
            </span>
          </div>
        </div>
      )}

      <div className='flex-1 px-4 pb-3 sm:pb-4 max-w-lg mx-auto w-full flex flex-col justify-center gap-3 sm:gap-4 overflow-y-auto'>
        <Button onClick={() => onSelect(true)} fullWidth size='lg' variant='primary'>
          <Icon name='thumbsUp' size='md' className='mr-2' />
          {trueLabel}
        </Button>
        <Button onClick={() => onSelect(false)} fullWidth size='lg' variant='secondary'>
          <Icon name='thumbsDown' size='md' className='mr-2' />
          {falseLabel}
        </Button>
      </div>
    </div>
  )
}

type StorytellerNumberScreenProps = {
  icon: IconName
  title: string
  description: string
  value: number
  min?: number
  max?: number
  confirmLabel: string
  falseInfoWarning?: boolean
  falseInfoMode?: FalseInfoMode | null
  onBack?: () => void
  onChange: (value: number) => void
  onConfirm: () => void
}

export function StorytellerNumberScreen({
  icon,
  title,
  description,
  value,
  min = 0,
  max = 12,
  confirmLabel,
  falseInfoWarning = false,
  falseInfoMode = null,
  onBack,
  onChange,
  onConfirm,
}: StorytellerNumberScreenProps) {
  const { t } = useI18n()

  return (
    <div className='min-h-app bg-gradient-to-b from-indigo-950 via-grimoire-purple to-grimoire-darker flex flex-col'>
      <div className='bg-gradient-to-b from-white/5 to-transparent px-4 py-3 sm:py-4'>
        <div className='max-w-lg mx-auto'>
          {onBack && (
            <div className='flex items-center mb-4'>
              <BackButton onClick={onBack} />
              <span className='text-parchment-500 text-xs ml-1'>
                {t.common.back}
              </span>
            </div>
          )}

          <div className='text-center'>
            <div className='flex justify-center mb-2'>
              <Icon name={icon} size='3xl' className='text-indigo-300' />
            </div>
            <h1 className='font-tarot text-xl sm:text-2xl text-parchment-100 tracking-[0.18em] sm:tracking-widest-xl uppercase'>
              {title}
            </h1>
            <p className='text-parchment-400 text-sm'>{description}</p>
          </div>
        </div>
      </div>

      {(falseInfoWarning || falseInfoMode) && (
        <div className='px-4'>
          <div className='max-w-lg mx-auto rounded-lg bg-amber-900/40 border border-amber-500/40 px-3 py-2 flex items-start gap-2'>
            <Icon name='flask' size='sm' className='text-amber-400 flex-shrink-0 mt-0.5' />
            <span className='text-amber-300 text-xs'>
              {falseInfoMode === 'vortox'
                ? t.game.falseInfoReminder
                : t.game.arbitraryInfoReminder}
            </span>
          </div>
        </div>
      )}

      <div className='flex-1 px-4 pb-3 sm:pb-4 max-w-lg mx-auto w-full flex flex-col justify-center items-center gap-4 sm:gap-6 overflow-y-auto'>
        <div className='flex items-center gap-3 sm:gap-4'>
          <button
            type='button'
            onClick={() => onChange(Math.max(min, value - 1))}
            disabled={value <= min}
            className='w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-parchment-200 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all'
          >
            <Icon name='minus' size='lg' />
          </button>
          <div className='w-20 h-20 sm:w-24 sm:h-24 rounded-full border border-mystic-gold/30 bg-white/5 flex items-center justify-center'>
            <span className='font-tarot text-4xl sm:text-5xl text-mystic-gold'>{value}</span>
          </div>
          <button
            type='button'
            onClick={() => onChange(Math.min(max, value + 1))}
            disabled={value >= max}
            className='w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-parchment-200 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all'
          >
            <Icon name='plus' size='lg' />
          </button>
        </div>
      </div>

      <ScreenFooter borderColor='border-indigo-500/30'>
        <Button onClick={onConfirm} fullWidth size='lg' variant='primary'>
          <Icon name={icon} size='md' className='mr-2' />
          {confirmLabel}
        </Button>
      </ScreenFooter>
    </div>
  )
}

type PlayerNumberRevealScreenProps = {
  playerName: string
  icon: IconName
  title: string
  subtitle: string
  label: string
  value: number
  teamId?: 'townsfolk' | 'outsider' | 'minion' | 'demon'
  onComplete: () => void
}

export function PlayerNumberRevealScreen({
  playerName,
  icon,
  title,
  subtitle,
  label,
  value,
  teamId = 'townsfolk',
  onComplete,
}: PlayerNumberRevealScreenProps) {
  const { t } = useI18n()

  return (
    <PlayerFacingScreen playerName={playerName}>
      <TeamBackground teamId={teamId}>
        <div className='min-h-app flex flex-col'>
          <div className='flex-1 px-4 py-5 sm:px-6 sm:py-8 flex items-center justify-center overflow-y-auto'>
            <div className='w-full max-w-sm'>
              <OracleCard
                icon={icon}
                teamId={teamId}
                title={title}
                subtitle={subtitle}
              >
                <NumberReveal value={value} label={label} teamId={teamId} />
              </OracleCard>
            </div>
          </div>

          <ScreenFooter borderColor='border-indigo-500/30'>
            <HandbackButton
              onClick={onComplete}
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

type PlayerBooleanRevealScreenProps = {
  playerName: string
  icon: IconName
  title: string
  subtitle: string
  question: string
  value: boolean
  trueText: string
  falseText: string
  onComplete: () => void
}

export function PlayerBooleanRevealScreen({
  playerName,
  icon,
  title,
  subtitle,
  question,
  value,
  trueText,
  falseText,
  onComplete,
}: PlayerBooleanRevealScreenProps) {
  const { t } = useI18n()

  return (
    <PlayerFacingScreen playerName={playerName}>
      <TeamBackground teamId='townsfolk'>
        <div className='min-h-app flex flex-col'>
          <div className='flex-1 px-4 py-5 sm:px-6 sm:py-8 flex items-center justify-center overflow-y-auto'>
            <div className='w-full max-w-sm'>
              <OracleCard
                icon={icon}
                teamId='townsfolk'
                title={title}
                subtitle={subtitle}
              >
                <div className='text-center py-3 sm:py-5 space-y-4'>
                  <p className='text-parchment-200 text-sm uppercase tracking-[0.22em] opacity-80'>
                    {question}
                  </p>
                  <div className='flex flex-col items-center gap-3'>
                    <div className='inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-mystic-gold/10 border border-mystic-gold/30'>
                      <Icon
                        name={value ? 'thumbsUp' : 'thumbsDown'}
                        size='3xl'
                        className={value ? 'text-emerald-300' : 'text-rose-300'}
                      />
                    </div>
                    <p className='font-tarot text-2xl sm:text-3xl text-parchment-100 uppercase tracking-[0.18em] sm:tracking-widest-xl text-center'>
                      {value ? trueText : falseText}
                    </p>
                  </div>
                </div>
              </OracleCard>
            </div>
          </div>

          <ScreenFooter borderColor='border-indigo-500/30'>
            <HandbackButton
              onClick={onComplete}
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

type PlayerRolePairRevealScreenProps = {
  playerName: string
  icon: IconName
  title: string
  subtitle: string
  description: string
  roleIds: [string, string]
  onComplete: () => void
}

export function PlayerRolePairRevealScreen({
  playerName,
  icon,
  title,
  subtitle,
  description,
  roleIds,
  onComplete,
}: PlayerRolePairRevealScreenProps) {
  const { t, language } = useI18n()

  return (
    <PlayerFacingScreen playerName={playerName}>
      <TeamBackground teamId='townsfolk'>
        <div className='min-h-app flex flex-col'>
          <div className='flex-1 px-4 py-5 sm:px-6 sm:py-8 flex items-center justify-center overflow-y-auto'>
            <div className='w-full max-w-sm rounded-[2rem] border-2 border-mystic-gold/35 bg-[linear-gradient(180deg,rgba(247,239,216,0.96),rgba(236,225,197,0.98))] shadow-[0_22px_70px_rgba(3,8,32,0.35)] overflow-hidden'>
              <div className='relative px-4 pt-5 pb-4 sm:px-6 sm:pt-7 sm:pb-6'>
                <div className='pointer-events-none absolute inset-[10px] rounded-[1.55rem] border border-mystic-gold/15' />

                <div className='relative flex flex-col items-center text-center'>
                  <div className='w-14 h-14 sm:w-16 sm:h-16 rounded-full border border-mystic-gold/35 bg-mystic-gold/10 flex items-center justify-center mb-3 sm:mb-4'>
                    <Icon
                      name={icon}
                      size='2xl'
                      className='text-mystic-gold'
                    />
                  </div>

                  <h1 className='font-tarot text-xl sm:text-3xl text-grimoire-dark uppercase tracking-[0.18em] sm:tracking-widest-xl'>
                    {title}
                  </h1>
                  <p className='mt-2 text-xs uppercase tracking-[0.32em] text-mystic-gold'>
                    {subtitle}
                  </p>

                  <MysticDivider className='w-full my-4 sm:my-5' />

                  <p className='text-center text-[#8f7f57] text-sm leading-relaxed mb-4'>
                    {description}
                  </p>

                  <div className='w-full space-y-3'>
                    {roleIds.map((roleId) => {
                      const role = getRole(roleId)
                      return (
                        <div
                          key={roleId}
                          className='rounded-2xl border border-black/10 bg-black/5 px-4 py-3 flex items-center gap-3 min-h-[64px]'
                        >
                          <div className='w-11 h-11 rounded-full border border-black/10 bg-white/20 flex items-center justify-center shrink-0'>
                            <Icon
                              name={role?.icon ?? 'circle'}
                              size='md'
                              className='text-mystic-gold'
                            />
                          </div>
                          <div className='min-w-0 font-tarot text-lg text-grimoire-dark tracking-[0.22em] uppercase leading-tight'>
                            {getRoleName(roleId, language)}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <ScreenFooter borderColor='border-indigo-500/30'>
            <HandbackButton
              onClick={onComplete}
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

type StorytellerTextBooleanScreenProps = {
  icon: IconName
  title: string
  description: string
  questionLabel: string
  question: string
  onQuestionChange: (value: string) => void
  trueLabel: string
  falseLabel: string
  falseInfoWarning?: boolean
  falseInfoMode?: FalseInfoMode | null
  onBack?: () => void
  onSelect: (value: boolean) => void
}

export function StorytellerTextBooleanScreen({
  icon,
  title,
  description,
  questionLabel,
  question,
  onQuestionChange,
  trueLabel,
  falseLabel,
  falseInfoWarning = false,
  falseInfoMode = null,
  onBack,
  onSelect,
}: StorytellerTextBooleanScreenProps) {
  const { t } = useI18n()

  return (
    <div className='min-h-app bg-gradient-to-b from-indigo-950 via-grimoire-purple to-grimoire-darker flex flex-col'>
      <div className='bg-gradient-to-b from-white/5 to-transparent px-4 py-3 sm:py-4'>
        <div className='max-w-lg mx-auto'>
          {onBack && (
            <div className='flex items-center mb-4'>
              <BackButton onClick={onBack} />
              <span className='text-parchment-500 text-xs ml-1'>
                {t.common.back}
              </span>
            </div>
          )}

          <div className='text-center'>
            <div className='flex justify-center mb-2'>
              <Icon name={icon} size='3xl' className='text-indigo-300' />
            </div>
            <h1 className='font-tarot text-xl sm:text-2xl text-parchment-100 tracking-[0.18em] sm:tracking-widest-xl uppercase'>
              {title}
            </h1>
            <p className='text-parchment-400 text-sm'>{description}</p>
          </div>
        </div>
      </div>

      {(falseInfoWarning || falseInfoMode) && (
        <div className='px-4'>
          <div className='max-w-lg mx-auto rounded-lg bg-amber-900/40 border border-amber-500/40 px-3 py-2 flex items-start gap-2'>
            <Icon name='flask' size='sm' className='text-amber-400 flex-shrink-0 mt-0.5' />
            <span className='text-amber-300 text-xs'>
              {falseInfoMode === 'vortox'
                ? t.game.falseInfoReminder
                : t.game.arbitraryInfoReminder}
            </span>
          </div>
        </div>
      )}

      <div className='flex-1 px-4 py-3 sm:py-4 max-w-lg mx-auto w-full space-y-4 overflow-y-auto'>
        <div>
          <label className='block text-xs uppercase tracking-[0.18em] text-parchment-500 mb-2'>
            {questionLabel}
          </label>
          <textarea
            value={question}
            onChange={(event) => onQuestionChange(event.target.value)}
            rows={4}
            className='w-full rounded-xl border border-white/10 bg-grimoire-dark/80 px-4 py-3 text-sm text-parchment-100 placeholder:text-parchment-600 focus:outline-none focus:ring-2 focus:ring-mystic-gold/30'
          />
        </div>

        <div className='grid grid-cols-1 gap-3 pt-2'>
          <Button onClick={() => onSelect(true)} fullWidth size='lg' variant='primary'>
            <Icon name='thumbsUp' size='md' className='mr-2' />
            {trueLabel}
          </Button>
          <Button onClick={() => onSelect(false)} fullWidth size='lg' variant='secondary'>
            <Icon name='thumbsDown' size='md' className='mr-2' />
            {falseLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
