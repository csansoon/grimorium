import { useState, useMemo, useCallback } from 'react'
import { ROLES } from '../../lib/roles'
import { RoleDefinition, RoleId } from '../../lib/roles/types'
import { Language } from '../../lib/i18n/types'
import {
  SCRIPTS,
  ScriptId,
  ScriptDefinition,
  getRecommendedDistribution,
  applyDistributionModifiers,
} from '../../lib/scripts'
import {
  GeneratedPool,
  GeneratorPreset,
} from '../../lib/scripts/types'
import {
  generateRolePools,
  selectPresetPools,
} from '../../lib/scripts/generator'
import { getTeam, TeamId } from '../../lib/teams'
import {
  useI18n,
  interpolate,
  getRoleName,
  getRoleDescription,
} from '../../lib/i18n'
import { Button, Icon, Badge, BackButton } from '../atoms'
import { ScreenFooter } from '../layouts/ScreenFooter'
import { cn } from '../../lib/utils'

type Props = {
  players: string[]
  scriptId: ScriptId
  onNext: (selectedRoles: string[]) => void
  onBack: () => void
}

const TEAM_ORDER: TeamId[] = ['townsfolk', 'outsider', 'minion', 'demon']

export function RoleSelection({ players, scriptId, onNext, onBack }: Props) {
  const { t, language } = useI18n()
  const script = SCRIPTS[scriptId]
  const isCustomMode = scriptId === 'custom'

  const [roleCounts, setRoleCounts] = useState<Record<string, number>>(() => {
    return { imp: 1 }
  })
  const [showGenerator, setShowGenerator] = useState(false)

  const totalRoles = Object.values(roleCounts).reduce((a, b) => a + b, 0)
  const impCount = roleCounts['imp'] ?? 0

  // Compute recommended distribution, adjusted for selected roles with modifiers
  const recommended = useMemo(() => {
    const base = getRecommendedDistribution(players.length)
    if (!base) return null
    const modifiers = Object.entries(roleCounts).flatMap(
      ([roleId, count]) => {
        const role = ROLES[roleId as keyof typeof ROLES]
        return Array(count).fill(role?.distributionModifier) as (
          | Partial<Record<TeamId, number>>
          | undefined
        )[]
      },
    )
    return applyDistributionModifiers(base, modifiers)
  }, [players.length, roleCounts])

  const toggleRole = (roleId: string) => {
    const current = roleCounts[roleId] ?? 0
    if (current === 0) {
      setRoleCounts({ ...roleCounts, [roleId]: 1 })
    } else {
      const newCounts = { ...roleCounts }
      delete newCounts[roleId]
      setRoleCounts(newCounts)
    }
  }

  const incrementRole = (roleId: string) => {
    setRoleCounts({
      ...roleCounts,
      [roleId]: (roleCounts[roleId] ?? 0) + 1,
    })
  }

  const decrementRole = (roleId: string) => {
    const current = roleCounts[roleId] ?? 0
    if (current > 1) {
      setRoleCounts({ ...roleCounts, [roleId]: current - 1 })
    } else if (current === 1) {
      const newCounts = { ...roleCounts }
      delete newCounts[roleId]
      setRoleCounts(newCounts)
    }
  }

  const applyGeneratedPool = (pool: GeneratedPool) => {
    const newCounts: Record<string, number> = {}
    for (const roleId of pool.roles) {
      newCounts[roleId] = (newCounts[roleId] ?? 0) + 1
    }
    setRoleCounts(newCounts)
    setShowGenerator(false)
  }

  const handleNext = () => {
    const selectedRoles: string[] = []
    for (const [roleId, count] of Object.entries(roleCounts)) {
      for (let i = 0; i < count; i++) {
        selectedRoles.push(roleId)
      }
    }
    onNext(selectedRoles)
  }

  const canProceed = totalRoles >= players.length && impCount >= 1

  // Roles for this script, grouped by team
  const rolesByTeam = useMemo(() => {
    const result: Record<TeamId, RoleDefinition[]> = {
      townsfolk: [],
      outsider: [],
      minion: [],
      demon: [],
    }
    for (const roleId of script.roles) {
      const role = ROLES[roleId]
      if (role) {
        result[role.team].push(role)
      }
    }
    return result
  }, [script.roles])

  const getTeamName = (teamId: string) => {
    const key = teamId as keyof typeof t.teams
    return t.teams[key]?.name ?? teamId
  }

  // Count currently selected roles per team
  const teamCounts = useMemo(() => {
    const counts: Record<TeamId, number> = {
      townsfolk: 0,
      outsider: 0,
      minion: 0,
      demon: 0,
    }
    for (const [roleId, count] of Object.entries(roleCounts)) {
      const role = ROLES[roleId as keyof typeof ROLES]
      if (role) {
        counts[role.team] += count
      }
    }
    return counts
  }, [roleCounts])

  return (
    <div className='min-h-app bg-gradient-to-b from-grimoire-purple via-grimoire-dark to-grimoire-darker flex flex-col'>
      {/* Header */}
      <div className='sticky top-0 z-10 bg-grimoire-dark/95 backdrop-blur-sm border-b border-mystic-gold/20 px-4 py-3'>
        <div className='flex items-center gap-3 max-w-lg mx-auto'>
          <BackButton onClick={onBack} />
          <div className='flex-1'>
            <h1 className='font-tarot text-lg text-parchment-100 tracking-wider uppercase'>
              {t.newGame.step2Title}
            </h1>
            <p className='text-xs text-parchment-500'>
              {t.newGame.step2Subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Recommendation bar */}
      {recommended && (
        <div className='px-4 py-2.5 bg-white/5 border-b border-white/10'>
          <div className='max-w-lg mx-auto'>
            <div className='flex items-center gap-2 mb-1.5'>
              <Icon name='sparkles' size='sm' className='text-mystic-gold/70' />
              <span className='text-xs text-parchment-400 font-medium'>
                {t.newGame.suggested} ({players.length}{' '}
                {t.common.players.toLowerCase()}):
              </span>
            </div>
            <div className='flex items-center gap-1.5 flex-wrap'>
              {TEAM_ORDER.map((teamId) => {
                const count = recommended[teamId]
                const currentCount = teamCounts[teamId]
                const isMatch = currentCount === count
                return (
                  <Badge
                    key={teamId}
                    variant={teamId}
                    className={cn(
                      'text-[10px] px-2 py-0.5',
                      isMatch && 'ring-1 ring-green-400/50',
                    )}
                  >
                    {count} {getTeamName(teamId)}
                    {totalRoles > 0 && (
                      <span className='opacity-60 ml-0.5'>
                        ({currentCount})
                      </span>
                    )}
                  </Badge>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Warnings */}
      {totalRoles > 0 && (totalRoles < players.length || impCount < 1) && (
        <div className='px-4 py-2 bg-mystic-crimson/20 border-b border-red-500/30'>
          <div className='max-w-lg mx-auto space-y-1'>
            {totalRoles < players.length && (
              <div className='flex items-center gap-2 text-red-300 text-xs'>
                <Icon name='alertTriangle' size='sm' />
                {interpolate(t.newGame.needAtLeastRoles, {
                  count: players.length,
                })}
              </div>
            )}
            {impCount < 1 && (
              <div className='flex items-center gap-2 text-red-300 text-xs'>
                <Icon name='alertTriangle' size='sm' />
                {t.newGame.needAtLeastImp}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className='flex-1 px-4 py-4 max-w-lg mx-auto w-full overflow-y-auto'>
        {/* Generator section (only for script-based games) */}
        {!isCustomMode && (
          <RoleGenerator
            script={script}
            playerCount={players.length}
            showGenerator={showGenerator}
            onToggle={() => setShowGenerator(!showGenerator)}
            onSelectPool={applyGeneratedPool}
          />
        )}

        {/* Manual role selection */}
        {TEAM_ORDER.map((teamId) => {
          const roles = rolesByTeam[teamId]
          if (roles.length === 0) return null
          const team = getTeam(teamId)

          return (
            <div key={teamId} className='mb-6'>
              {/* Team Header */}
              <div className='flex items-center gap-2 mb-3 ml-1'>
                <Icon
                  name={team.icon}
                  size='sm'
                  className={team.colors.text}
                />
                <span
                  className={cn(
                    'text-xs font-tarot tracking-wider uppercase',
                    team.colors.text,
                  )}
                >
                  {getTeamName(teamId)}
                </span>
                {teamCounts[teamId] > 0 && (
                  <Badge
                    variant={teamId}
                    className='text-[10px] px-1.5 py-0 ml-auto'
                  >
                    {teamCounts[teamId]}
                  </Badge>
                )}
              </div>

              {/* Card Grid */}
              <div className='grid grid-cols-2 gap-2.5'>
                {roles.map((role) => {
                  const count = roleCounts[role.id] ?? 0
                  const isSelected = count > 0
                  const desc = getRoleDescription(role.id, language)

                  return (
                    <button
                      key={role.id}
                      type='button'
                      onClick={() => toggleRole(role.id)}
                      className={cn(
                        'rounded-xl border-2 transition-all relative flex flex-col',
                        isSelected
                          ? cn(
                              team.colors.cardBorder,
                              'bg-gradient-to-b from-white/10 to-white/5',
                            )
                          : 'border-white/10 bg-white/5 hover:bg-white/[0.08]',
                      )}
                      style={
                        isSelected
                          ? {
                              boxShadow: `0 0 16px ${team.colors.cardGlow}, inset 0 1px 0 rgba(255,255,255,0.06)`,
                            }
                          : undefined
                      }
                    >
                      {/* Card body */}
                      <div className='px-3 pt-4 pb-3 text-center flex-1'>
                        {/* Selected checkmark */}
                        {isSelected && (
                          <div className='absolute top-2 right-2'>
                            <div
                              className={cn(
                                'w-5 h-5 rounded-full flex items-center justify-center',
                                team.colors.badge,
                              )}
                            >
                              <Icon
                                name='check'
                                size='xs'
                                className={team.colors.badgeText}
                              />
                            </div>
                          </div>
                        )}

                        {/* Role icon medallion */}
                        <div
                          className={cn(
                            'w-9 h-9 rounded-full flex items-center justify-center mx-auto',
                            isSelected
                              ? team.colors.cardIconBg
                              : 'bg-white/5 border border-white/10',
                          )}
                        >
                          <Icon
                            name={role.icon}
                            size='md'
                            className={
                              isSelected
                                ? team.colors.text
                                : 'text-parchment-500'
                            }
                          />
                        </div>
                        <div
                          className={cn(
                            'text-[11px] font-tarot tracking-wider uppercase mt-2',
                            isSelected
                              ? 'text-parchment-100'
                              : 'text-parchment-300',
                          )}
                        >
                          {getRoleName(role.id, language)}
                        </div>
                        <p className='text-[11px] text-parchment-500 line-clamp-2 mt-1 leading-snug text-left'>
                          {desc}
                        </p>
                      </div>

                      {/* +/- Controls (only when selected, only in custom mode) */}
                      {isSelected && isCustomMode && (
                        <div
                          className='flex items-center justify-center gap-2 pt-2 pb-2.5 border-t border-white/10'
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type='button'
                            onClick={() => decrementRole(role.id)}
                            className='w-6 h-6 flex items-center justify-center text-parchment-400 hover:text-parchment-100 hover:bg-white/10 rounded transition-colors'
                          >
                            <Icon name='minus' size='xs' />
                          </button>
                          <span
                            className={cn(
                              'text-sm font-medium min-w-[1.5rem] text-center',
                              team.colors.text,
                            )}
                          >
                            {count}
                          </span>
                          <button
                            type='button'
                            onClick={() => incrementRole(role.id)}
                            className='w-6 h-6 flex items-center justify-center text-parchment-400 hover:text-parchment-100 hover:bg-white/10 rounded transition-colors'
                          >
                            <Icon name='plus' size='xs' />
                          </button>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer with counter on button */}
      <ScreenFooter>
        <Button
          onClick={handleNext}
          disabled={!canProceed}
          fullWidth
          size='lg'
          variant='gold'
        >
          {t.newGame.nextAssignRoles}
          <span className='ml-2 opacity-70 font-sans text-sm normal-case'>
            ({totalRoles}/{players.length})
          </span>
          <Icon name='arrowRight' size='md' className='ml-1' />
        </Button>
      </ScreenFooter>
    </div>
  )
}

// ============================================================================
// ROLE GENERATOR COMPONENT
// ============================================================================

type RoleGeneratorProps = {
  script: ScriptDefinition
  playerCount: number
  showGenerator: boolean
  onToggle: () => void
  onSelectPool: (pool: GeneratedPool) => void
}

const PRESET_CONFIG: {
  id: GeneratorPreset
  icon: 'sparkles' | 'dices' | 'flameKindling'
  color: string
  borderColor: string
  bgColor: string
  glowColor: string
}[] = [
  {
    id: 'simple',
    icon: 'sparkles',
    color: 'text-blue-300',
    borderColor: 'border-blue-400/30',
    bgColor: 'bg-blue-500/10',
    glowColor: 'rgba(96, 165, 250, 0.15)',
  },
  {
    id: 'interesting',
    icon: 'dices',
    color: 'text-mystic-gold',
    borderColor: 'border-mystic-gold/30',
    bgColor: 'bg-mystic-gold/10',
    glowColor: 'rgba(212, 175, 55, 0.15)',
  },
  {
    id: 'chaotic',
    icon: 'flameKindling',
    color: 'text-red-400',
    borderColor: 'border-red-500/30',
    bgColor: 'bg-red-500/10',
    glowColor: 'rgba(239, 68, 68, 0.15)',
  },
]

function RoleGenerator({
  script,
  playerCount,
  showGenerator,
  onToggle,
  onSelectPool,
}: RoleGeneratorProps) {
  const { t, language } = useI18n()
  const [presetPools, setPresetPools] = useState<Record<
    GeneratorPreset,
    GeneratedPool
  > | null>(null)

  const regenerate = useCallback(() => {
    const pools = generateRolePools(script, playerCount)
    const selected = selectPresetPools(pools)
    setPresetPools(selected)
  }, [script, playerCount])

  const handleToggle = () => {
    if (!showGenerator && !presetPools) {
      regenerate()
    }
    onToggle()
  }

  return (
    <div className='mb-6'>
      {/* Generator toggle button */}
      <button
        onClick={handleToggle}
        className={cn(
          'w-full rounded-xl border-2 transition-all p-3',
          showGenerator
            ? 'border-mystic-gold/40 bg-gradient-to-r from-mystic-gold/10 to-mystic-gold/5'
            : 'border-mystic-gold/20 bg-white/5 hover:bg-white/[0.07]',
        )}
      >
        <div className='flex items-center gap-3'>
          <div className='w-8 h-8 rounded-lg bg-mystic-gold/10 border border-mystic-gold/30 flex items-center justify-center'>
            <Icon name='dices' size='md' className='text-mystic-gold' />
          </div>
          <div className='flex-1 text-left'>
            <span className='text-sm font-tarot tracking-wider uppercase text-mystic-gold'>
              {t.scripts.generateRoles}
            </span>
          </div>
          <Icon
            name={showGenerator ? 'chevronUp' : 'chevronDown'}
            size='sm'
            className='text-mystic-gold/60'
          />
        </div>
      </button>

      {/* Generator content */}
      {showGenerator && (
        <div className='mt-3 space-y-3'>
          {presetPools ? (
            <>
              {PRESET_CONFIG.map((preset) => {
                const pool = presetPools[preset.id]
                const presetName =
                  t.scripts[preset.id as keyof typeof t.scripts] ?? preset.id
                const presetDesc =
                  t.scripts[
                    `${preset.id}Description` as keyof typeof t.scripts
                  ] ?? ''

                return (
                  <PresetPoolCard
                    key={preset.id}
                    pool={pool}
                    presetName={presetName}
                    presetDesc={presetDesc}
                    icon={preset.icon}
                    color={preset.color}
                    borderColor={preset.borderColor}
                    bgColor={preset.bgColor}
                    glowColor={preset.glowColor}
                    onSelect={() => onSelectPool(pool)}
                    language={language}
                  />
                )
              })}

              {/* Regenerate button */}
              <button
                onClick={regenerate}
                className='w-full flex items-center justify-center gap-2 py-2 text-xs text-parchment-400 hover:text-parchment-200 transition-colors'
              >
                <Icon name='shuffle' size='sm' />
                {t.scripts.regenerate}
              </button>
            </>
          ) : (
            <div className='text-center py-4 text-parchment-500 text-sm'>
              ...
            </div>
          )}

          {/* Divider with "or pick manually" */}
          <div className='flex items-center gap-3 py-1'>
            <div className='flex-1 h-px bg-white/10' />
            <span className='text-[11px] text-parchment-500 uppercase tracking-wider'>
              {t.scripts.orPickManually}
            </span>
            <div className='flex-1 h-px bg-white/10' />
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// PRESET POOL CARD
// ============================================================================

type PresetPoolCardProps = {
  pool: GeneratedPool
  presetName: string
  presetDesc: string
  icon: 'sparkles' | 'dices' | 'flameKindling'
  color: string
  borderColor: string
  bgColor: string
  glowColor: string
  onSelect: () => void
  language: Language
}

function PresetPoolCard({
  pool,
  presetName,
  presetDesc,
  icon,
  color,
  borderColor,
  bgColor,
  glowColor,
  onSelect,
  language,
}: PresetPoolCardProps) {
  const { t } = useI18n()

  // Group roles by team for display
  const rolesByTeam = useMemo(() => {
    const groups: Record<TeamId, RoleId[]> = {
      townsfolk: [],
      outsider: [],
      minion: [],
      demon: [],
    }
    for (const roleId of pool.roles) {
      const role = ROLES[roleId]
      if (role) {
        groups[role.team].push(roleId)
      }
    }
    return groups
  }, [pool.roles])

  return (
    <div
      className={cn('rounded-xl border-2 overflow-hidden', borderColor)}
      style={{ boxShadow: `0 0 16px ${glowColor}` }}
    >
      {/* Header */}
      <div className={cn('px-4 py-3 flex items-center gap-3', bgColor)}>
        <Icon name={icon} size='md' className={color} />
        <div className='flex-1'>
          <div className={cn('text-sm font-tarot tracking-wider uppercase', color)}>
            {presetName}
          </div>
          <div className='text-[11px] text-parchment-500'>{presetDesc}</div>
        </div>
        <div className='flex items-center gap-1.5'>
          <span className='text-[10px] text-parchment-500 uppercase tracking-wider'>
            {t.scripts.chaos}
          </span>
          <span className={cn('text-sm font-bold tabular-nums', color)}>
            {pool.totalChaos}
          </span>
        </div>
      </div>

      {/* Role pills */}
      <div className='px-4 py-3'>
        {TEAM_ORDER.map((teamId) => {
          const roles = rolesByTeam[teamId]
          if (roles.length === 0) return null
          const team = getTeam(teamId)

          return (
            <div key={teamId} className='mb-2 last:mb-0'>
              <div className='flex flex-wrap gap-1'>
                {roles.map((roleId, i) => (
                  <span
                    key={`${roleId}-${i}`}
                    className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border',
                      team.colors.badge,
                      team.colors.badgeText,
                    )}
                  >
                    <Icon name={ROLES[roleId].icon} size='xs' />
                    {getRoleName(roleId, language)}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Select button */}
      <div className='px-4 pb-3'>
        <button
          onClick={onSelect}
          className={cn(
            'w-full rounded-lg border py-2 text-xs font-tarot tracking-wider uppercase transition-all',
            'hover:bg-white/5 active:scale-[0.98]',
            borderColor,
            color,
          )}
        >
          {t.scripts.selectThisPool}
        </button>
      </div>
    </div>
  )
}
