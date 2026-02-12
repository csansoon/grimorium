import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { ROLES } from '../../lib/roles'
import { RoleDefinition, RoleId } from '../../lib/roles/types'
import { Language } from '../../lib/i18n/types'
import {
  SCRIPTS,
  ScriptId,
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

type SelectionMode = 'generate' | 'manual'

export function RoleSelection({ players, scriptId, onNext, onBack }: Props) {
  const { t, language } = useI18n()
  const script = SCRIPTS[scriptId]
  const isCustomMode = scriptId === 'custom'

  // ── State ──────────────────────────────────────────────────────────
  const [roleCounts, setRoleCounts] = useState<Record<string, number>>(() => {
    return { imp: 1 }
  })
  const [mode, setMode] = useState<SelectionMode>(
    isCustomMode ? 'manual' : 'generate',
  )
  const [selectedPreset, setSelectedPreset] =
    useState<GeneratorPreset>('interesting')
  const [presetPools, setPresetPools] = useState<Record<
    GeneratorPreset,
    GeneratedPool
  > | null>(null)
  const [appliedToast, setAppliedToast] = useState<{
    preset: string
    count: number
  } | null>(null)
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const totalRoles = Object.values(roleCounts).reduce((a, b) => a + b, 0)
  const impCount = roleCounts['imp'] ?? 0

  // Auto-generate pools when entering generate mode
  useEffect(() => {
    if (mode === 'generate' && !presetPools && !isCustomMode) {
      const pools = generateRolePools(script, players.length)
      const selected = selectPresetPools(pools)
      setPresetPools(selected)
    }
  }, [mode, presetPools, isCustomMode, script, players.length])

  // ── Computed ───────────────────────────────────────────────────────

  // Recommended distribution, adjusted for selected roles with modifiers
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

  // ── Handlers ───────────────────────────────────────────────────────

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

  const regenerate = useCallback(() => {
    const pools = generateRolePools(script, players.length)
    const selected = selectPresetPools(pools)
    setPresetPools(selected)
  }, [script, players.length])

  const applyGeneratedPool = (pool: GeneratedPool, presetName: string) => {
    const newCounts: Record<string, number> = {}
    for (const roleId of pool.roles) {
      newCounts[roleId] = (newCounts[roleId] ?? 0) + 1
    }
    setRoleCounts(newCounts)
    setMode('manual')

    // Show toast
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    setAppliedToast({ preset: presetName, count: pool.roles.length })
    toastTimeoutRef.current = setTimeout(() => setAppliedToast(null), 3000)
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

  // ── Render ─────────────────────────────────────────────────────────

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

      {/* Mode Switcher (script-based only) */}
      {!isCustomMode && (
        <div className='px-4 py-2.5 bg-white/[0.03] border-b border-white/10'>
          <div className='max-w-lg mx-auto'>
            <div className='flex rounded-lg bg-white/5 p-1 gap-1'>
              <button
                type='button'
                onClick={() => setMode('generate')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-medium tracking-wide uppercase transition-all',
                  mode === 'generate'
                    ? 'bg-mystic-gold/20 text-mystic-gold shadow-sm border border-mystic-gold/30'
                    : 'text-parchment-500 hover:text-parchment-300 border border-transparent',
                )}
              >
                <Icon name='dices' size='sm' />
                {t.scripts.generate}
              </button>
              <button
                type='button'
                onClick={() => setMode('manual')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-medium tracking-wide uppercase transition-all',
                  mode === 'manual'
                    ? 'bg-mystic-gold/20 text-mystic-gold shadow-sm border border-mystic-gold/30'
                    : 'text-parchment-500 hover:text-parchment-300 border border-transparent',
                )}
              >
                <Icon name='settings' size='sm' />
                {t.scripts.manual}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Distribution Tracker (manual mode) */}
      {mode === 'manual' && recommended && (
        <DistributionTracker
          recommended={recommended}
          teamCounts={teamCounts}
        />
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
      <div className='flex-1 overflow-y-auto relative'>
        {/* Applied toast */}
        {appliedToast && (
          <div className='sticky top-0 z-20 px-4 pt-2 pb-0 animate-toast-in'>
            <div className='max-w-lg mx-auto'>
              <div className='bg-green-500/15 border border-green-400/30 rounded-lg px-3 py-2 flex items-center gap-2 backdrop-blur-sm'>
                <div className='w-5 h-5 rounded-full bg-green-400/20 flex items-center justify-center flex-shrink-0'>
                  <Icon name='check' size='xs' className='text-green-300' />
                </div>
                <span className='text-green-200 text-xs font-medium'>
                  {interpolate(t.scripts.presetApplied, {
                    preset: appliedToast.preset,
                  })}
                  {' \u2014 '}
                  {interpolate(t.scripts.rolesSelected, {
                    count: appliedToast.count,
                  })}
                </span>
              </div>
            </div>
          </div>
        )}

        {mode === 'generate' ? (
          <GenerateView
            presetPools={presetPools}
            selectedPreset={selectedPreset}
            onSelectPreset={setSelectedPreset}
            onApply={applyGeneratedPool}
            onRegenerate={regenerate}
            language={language}
          />
        ) : (
          <ManualRoleGrid
            rolesByTeam={rolesByTeam}
            roleCounts={roleCounts}
            teamCounts={teamCounts}
            recommended={recommended}
            isCustomMode={isCustomMode}
            language={language}
            onToggle={toggleRole}
            onIncrement={incrementRole}
            onDecrement={decrementRole}
          />
        )}
      </div>

      {/* Footer */}
      <ScreenFooter>
        {/* Team completion dots */}
        {recommended && totalRoles > 0 && (
          <div className='flex justify-center gap-3 mb-2.5'>
            {TEAM_ORDER.map((teamId) => {
              const team = getTeam(teamId)
              const target = recommended[teamId]
              const current = teamCounts[teamId]
              const isMatch = current === target
              const isOver = current > target
              return (
                <div key={teamId} className='flex items-center gap-1'>
                  <div
                    className={cn(
                      'w-2 h-2 rounded-full transition-all duration-300',
                      isMatch
                        ? 'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.5)]'
                        : isOver
                          ? 'bg-amber-400'
                          : current > 0
                            ? team.colors.text.replace('text-', 'bg-')
                            : 'bg-white/20',
                    )}
                  />
                  <span
                    className={cn(
                      'text-[10px] tabular-nums font-medium',
                      isMatch
                        ? 'text-green-400'
                        : isOver
                          ? 'text-amber-400'
                          : 'text-parchment-500',
                    )}
                  >
                    {current}/{target}
                  </span>
                </div>
              )
            })}
          </div>
        )}
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
// DISTRIBUTION TRACKER (compact, always visible in manual mode)
// ============================================================================

type DistributionTrackerProps = {
  recommended: Record<TeamId, number>
  teamCounts: Record<TeamId, number>
}

function DistributionTracker({
  recommended,
  teamCounts,
}: DistributionTrackerProps) {
  return (
    <div className='bg-white/[0.03] border-b border-white/10'>
      <div className='max-w-lg mx-auto flex items-center justify-around py-2 px-4'>
        {TEAM_ORDER.map((teamId) => {
          const team = getTeam(teamId)
          const target = recommended[teamId]
          const current = teamCounts[teamId]
          const isMatch = current === target
          const isOver = current > target

          return (
            <div key={teamId} className='flex items-center gap-1.5'>
              <Icon
                name={team.icon}
                size='sm'
                className={cn(
                  'transition-colors',
                  isMatch
                    ? 'text-green-400'
                    : isOver
                      ? 'text-amber-400'
                      : team.colors.text,
                )}
              />
              <span
                className={cn(
                  'text-sm font-bold tabular-nums transition-colors',
                  isMatch
                    ? 'text-green-400'
                    : isOver
                      ? 'text-amber-400'
                      : current > 0
                        ? 'text-parchment-200'
                        : 'text-parchment-500',
                )}
              >
                {current}/{target}
              </span>
              {isMatch && (
                <Icon name='check' size='xs' className='text-green-400' />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================================
// GENERATE VIEW (preset tabs + role display)
// ============================================================================

const PRESET_CONFIG: {
  id: GeneratorPreset
  icon: 'sparkles' | 'dices' | 'flameKindling'
  color: string
  activeColor: string
  borderColor: string
  bgColor: string
  glowColor: string
}[] = [
  {
    id: 'simple',
    icon: 'sparkles',
    color: 'text-blue-400/60',
    activeColor: 'text-blue-300',
    borderColor: 'border-blue-400/40',
    bgColor: 'bg-blue-500/15',
    glowColor: 'rgba(96, 165, 250, 0.12)',
  },
  {
    id: 'interesting',
    icon: 'dices',
    color: 'text-mystic-gold/60',
    activeColor: 'text-mystic-gold',
    borderColor: 'border-mystic-gold/40',
    bgColor: 'bg-mystic-gold/15',
    glowColor: 'rgba(212, 175, 55, 0.12)',
  },
  {
    id: 'chaotic',
    icon: 'flameKindling',
    color: 'text-red-400/60',
    activeColor: 'text-red-400',
    borderColor: 'border-red-500/40',
    bgColor: 'bg-red-500/15',
    glowColor: 'rgba(239, 68, 68, 0.12)',
  },
]

type GenerateViewProps = {
  presetPools: Record<GeneratorPreset, GeneratedPool> | null
  selectedPreset: GeneratorPreset
  onSelectPreset: (preset: GeneratorPreset) => void
  onApply: (pool: GeneratedPool, presetName: string) => void
  onRegenerate: () => void
  language: Language
}

function GenerateView({
  presetPools,
  selectedPreset,
  onSelectPreset,
  onApply,
  onRegenerate,
  language,
}: GenerateViewProps) {
  const { t } = useI18n()

  const activeConfig = PRESET_CONFIG.find((p) => p.id === selectedPreset)!
  const activePool = presetPools?.[selectedPreset]
  const presetName =
    t.scripts[selectedPreset as keyof typeof t.scripts] ?? selectedPreset

  // Group roles of active pool by team
  const poolRolesByTeam = useMemo(() => {
    if (!activePool) return null
    const groups: Record<TeamId, RoleId[]> = {
      townsfolk: [],
      outsider: [],
      minion: [],
      demon: [],
    }
    for (const roleId of activePool.roles) {
      const role = ROLES[roleId]
      if (role) {
        groups[role.team].push(roleId)
      }
    }
    return groups
  }, [activePool])

  return (
    <div className='px-4 py-4 max-w-lg mx-auto w-full'>
      {/* Preset Tabs */}
      <div className='flex gap-2 mb-4'>
        {PRESET_CONFIG.map((preset) => {
          const isActive = selectedPreset === preset.id
          const name =
            t.scripts[preset.id as keyof typeof t.scripts] ?? preset.id
          const desc =
            t.scripts[
              `${preset.id}Description` as keyof typeof t.scripts
            ] ?? ''

          return (
            <button
              key={preset.id}
              type='button'
              onClick={() => onSelectPreset(preset.id)}
              className={cn(
                'flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all',
                isActive
                  ? cn(preset.borderColor, preset.bgColor)
                  : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]',
              )}
              style={
                isActive
                  ? { boxShadow: `0 0 20px ${preset.glowColor}` }
                  : undefined
              }
            >
              <Icon
                name={preset.icon}
                size='md'
                className={isActive ? preset.activeColor : preset.color}
              />
              <span
                className={cn(
                  'text-[11px] font-tarot tracking-wider uppercase leading-tight',
                  isActive ? preset.activeColor : 'text-parchment-400',
                )}
              >
                {name}
              </span>
              <span className='text-[10px] text-parchment-500 leading-tight text-center hidden min-[380px]:block'>
                {desc}
              </span>
            </button>
          )
        })}
      </div>

      {/* Active Preset Content */}
      {presetPools && activePool && poolRolesByTeam ? (
        <div
          className={cn(
            'rounded-xl border-2 overflow-hidden',
            activeConfig.borderColor,
          )}
          style={{ boxShadow: `0 0 16px ${activeConfig.glowColor}` }}
        >
          {/* Chaos score header */}
          <div
            className={cn(
              'px-4 py-2.5 flex items-center justify-between',
              activeConfig.bgColor,
            )}
          >
            <span
              className={cn(
                'text-sm font-tarot tracking-wider uppercase',
                activeConfig.activeColor,
              )}
            >
              {presetName}
            </span>
            <div className='flex items-center gap-1.5'>
              <span className='text-[10px] text-parchment-500 uppercase tracking-wider'>
                {t.scripts.chaos}
              </span>
              <span
                className={cn(
                  'text-sm font-bold tabular-nums',
                  activeConfig.activeColor,
                )}
              >
                {activePool.totalChaos}
              </span>
            </div>
          </div>

          {/* Role pills grouped by team */}
          <div className='px-4 py-3 space-y-2'>
            {TEAM_ORDER.map((teamId) => {
              const roles = poolRolesByTeam[teamId]
              if (roles.length === 0) return null
              const team = getTeam(teamId)

              return (
                <div key={teamId} className='flex flex-wrap gap-1.5'>
                  {roles.map((roleId, i) => (
                    <span
                      key={`${roleId}-${i}`}
                      className={cn(
                        'inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] border font-medium',
                        team.colors.badge,
                        team.colors.badgeText,
                      )}
                    >
                      <Icon name={ROLES[roleId].icon} size='xs' />
                      {getRoleName(roleId, language)}
                    </span>
                  ))}
                </div>
              )
            })}
          </div>

          {/* Use This Pool button */}
          <div className='px-4 pb-3'>
            <button
              onClick={() =>
                onApply(activePool, String(presetName))
              }
              className={cn(
                'w-full rounded-lg border-2 py-2.5 text-sm font-tarot tracking-wider uppercase transition-all',
                'hover:bg-white/5 active:scale-[0.98]',
                activeConfig.borderColor,
                activeConfig.activeColor,
              )}
            >
              {t.scripts.useThisPool}
            </button>
          </div>
        </div>
      ) : (
        <div className='text-center py-8 text-parchment-500 text-sm'>...</div>
      )}

      {/* Regenerate button */}
      {presetPools && (
        <button
          onClick={onRegenerate}
          className='w-full flex items-center justify-center gap-2 py-3 mt-3 text-xs text-parchment-400 hover:text-parchment-200 transition-colors'
        >
          <Icon name='shuffle' size='sm' />
          {t.scripts.regenerate}
        </button>
      )}
    </div>
  )
}

// ============================================================================
// MANUAL ROLE GRID (with sticky team section headers)
// ============================================================================

type ManualRoleGridProps = {
  rolesByTeam: Record<TeamId, RoleDefinition[]>
  roleCounts: Record<string, number>
  teamCounts: Record<TeamId, number>
  recommended: Record<TeamId, number> | null
  isCustomMode: boolean
  language: Language
  onToggle: (roleId: string) => void
  onIncrement: (roleId: string) => void
  onDecrement: (roleId: string) => void
}

function ManualRoleGrid({
  rolesByTeam,
  roleCounts,
  teamCounts,
  recommended,
  isCustomMode,
  language,
  onToggle,
  onIncrement,
  onDecrement,
}: ManualRoleGridProps) {
  return (
    <>
      {TEAM_ORDER.map((teamId) => {
        const roles = rolesByTeam[teamId]
        if (roles.length === 0) return null

        return (
          <TeamSection
            key={teamId}
            teamId={teamId}
            roles={roles}
            roleCounts={roleCounts}
            teamCount={teamCounts[teamId]}
            recommendedCount={recommended?.[teamId] ?? null}
            isCustomMode={isCustomMode}
            language={language}
            onToggle={onToggle}
            onIncrement={onIncrement}
            onDecrement={onDecrement}
          />
        )
      })}
    </>
  )
}

// ============================================================================
// TEAM SECTION (sticky header + role card grid)
// ============================================================================

type TeamSectionProps = {
  teamId: TeamId
  roles: RoleDefinition[]
  roleCounts: Record<string, number>
  teamCount: number
  recommendedCount: number | null
  isCustomMode: boolean
  language: Language
  onToggle: (roleId: string) => void
  onIncrement: (roleId: string) => void
  onDecrement: (roleId: string) => void
}

function TeamSection({
  teamId,
  roles,
  roleCounts,
  teamCount,
  recommendedCount,
  isCustomMode,
  language,
  onToggle,
  onIncrement,
  onDecrement,
}: TeamSectionProps) {
  const { t } = useI18n()
  const team = getTeam(teamId)

  const getTeamName = (tid: string) => {
    const key = tid as keyof typeof t.teams
    return t.teams[key]?.name ?? tid
  }

  const isMatch =
    recommendedCount !== null && teamCount === recommendedCount
  const isOver =
    recommendedCount !== null && teamCount > recommendedCount

  return (
    <div>
      {/* Sticky Team Header */}
      <div className='sticky top-0 z-[5] bg-grimoire-dark/95 backdrop-blur-sm border-b border-white/[0.06] px-4 py-2'>
        <div className='max-w-lg mx-auto flex items-center gap-2'>
          <Icon name={team.icon} size='sm' className={team.colors.text} />
          <span
            className={cn(
              'text-xs font-tarot tracking-wider uppercase',
              team.colors.text,
            )}
          >
            {getTeamName(teamId)}
          </span>
          {teamCount > 0 && (
            <Badge
              variant={teamId}
              className='text-[10px] px-1.5 py-0 ml-auto'
            >
              {teamCount}
              {recommendedCount !== null && (
                <span className='opacity-60'>/{recommendedCount}</span>
              )}
            </Badge>
          )}
          {isMatch && (
            <Icon
              name='check'
              size='xs'
              className='text-green-400 ml-auto'
            />
          )}
          {isOver && (
            <Icon
              name='alertTriangle'
              size='xs'
              className='text-amber-400 ml-auto'
            />
          )}
        </div>
      </div>

      {/* Role Grid */}
      <div className='px-4 pt-3 pb-4'>
        <div className='max-w-lg mx-auto grid grid-cols-2 gap-2.5'>
          {roles.map((role) => (
            <RoleCard
              key={role.id}
              role={role}
              team={team}
              count={roleCounts[role.id] ?? 0}
              isCustomMode={isCustomMode}
              language={language}
              onToggle={() => onToggle(role.id)}
              onIncrement={() => onIncrement(role.id)}
              onDecrement={() => onDecrement(role.id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// ROLE CARD
// ============================================================================

type RoleCardProps = {
  role: RoleDefinition
  team: ReturnType<typeof getTeam>
  count: number
  isCustomMode: boolean
  language: Language
  onToggle: () => void
  onIncrement: () => void
  onDecrement: () => void
}

function RoleCard({
  role,
  team,
  count,
  isCustomMode,
  language,
  onToggle,
  onIncrement,
  onDecrement,
}: RoleCardProps) {
  const isSelected = count > 0
  const desc = getRoleDescription(role.id, language)

  return (
    <button
      type='button'
      onClick={onToggle}
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
              isSelected ? team.colors.text : 'text-parchment-500'
            }
          />
        </div>
        <div
          className={cn(
            'text-[11px] font-tarot tracking-wider uppercase mt-2',
            isSelected ? 'text-parchment-100' : 'text-parchment-300',
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
            onClick={onDecrement}
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
            onClick={onIncrement}
            className='w-6 h-6 flex items-center justify-center text-parchment-400 hover:text-parchment-100 hover:bg-white/10 rounded transition-colors'
          >
            <Icon name='plus' size='xs' />
          </button>
        </div>
      )}
    </button>
  )
}
