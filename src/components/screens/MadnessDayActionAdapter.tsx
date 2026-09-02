import type { DayActionProps } from '../../lib/pipeline/types'
import { findMadnessResolutionEntry } from '../../lib/madnessResolution'
import { useI18n } from '../../lib/i18n'
import { MadnessResolutionScreen } from './MadnessResolutionScreen'

type Props = DayActionProps & {
  effectType: string
}

export function MadnessDayActionAdapter({
  state,
  playerId,
  onComplete,
  onBack,
  effectType,
}: Props) {
  const { language } = useI18n()
  const entry = findMadnessResolutionEntry(state, language, playerId, effectType)
  if (!entry) return null

  return (
    <MadnessResolutionScreen
      state={state}
      entry={entry}
      onComplete={onComplete}
      onBack={onBack}
    />
  )
}
