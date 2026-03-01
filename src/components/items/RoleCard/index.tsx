import { getRole } from '../../../lib/roles'
import { getTeam, TeamId } from '../../../lib/teams'
import {
  useI18n,
  interpolate,
  getRoleName as getRegistryRoleName,
  getRoleQuote as getRegistryRoleQuote,
  getRoleLines as getRegistryRoleLines,
} from '../../../lib/i18n'
import { Icon, type IconName } from '../../atoms'
import { cn } from '../../../lib/utils'
import { CardShell } from './CardShell'
import { CardIcon } from './CardIcon'

type Props = {
  roleId: string
}

// ─── Line type → icon mapping ───────────────────────────────────────────────

const LINE_TYPE_ICON: Record<string, IconName> = {
  // Timing
  NIGHT: 'moon',
  FIRST_NIGHT: 'cloudMoon',
  DAY: 'sun',
  // Information
  INFO: 'eye',
  TEAM: 'users',
  // Effects
  KILL: 'skull',
  PROTECT: 'shield',
  PASSIVE: 'star',
  // Setup
  SETUP: 'dices',
  // Consequences
  ON_DEATH: 'ghost',
  CAVEAT: 'alertTriangle',
  // Meta
  WIN: 'trophy',
  ADVICE: 'info',
}

// ─── Main component ─────────────────────────────────────────────────────────

/**
 * Tarot-style role card with team-specific visual flair.
 *
 * Each team gets its own decorative personality:
 *  - **Townsfolk** — golden glow, twinkling stars, elegant double-line frame
 *  - **Outsider** — silver shimmer, fractured dashed frame, prismatic feel
 *  - **Minion** — ember glow, rising fire particles, smoldering frame
 *  - **Demon** — crimson pulse, scan-line interference, sigil geometry
 *
 * Features a holographic foil shimmer, animated border glow, rotating arcane
 * seal behind the icon, and a dramatic summon animation on mount.
 *
 * This is a pure presentational component — it renders only the card itself.
 * Wrap it in a `TeamBackground` and add context text / action links as siblings.
 */
export function RoleCard({ roleId }: Props) {
  const { t, language } = useI18n()
  const role = getRole(roleId)

  if (!role) {
    return (
      <p className='text-red-400 font-tarot text-center p-4'>
        {interpolate(t.ui.unknownRoleId, { roleId })}
      </p>
    )
  }

  const team = getTeam(role.team)
  const teamId = role.team as TeamId

  const teamTranslation = t.teams[teamId]

  const roleName = getRegistryRoleName(role.id, language)
  const roleQuote = getRegistryRoleQuote(role.id, language)
  const roleLines = getRegistryRoleLines(role.id, language)
  const teamName = teamTranslation?.name ?? teamId

  return (
    <CardShell teamId={teamId} icon={role.icon}>
      {/* Top: Icon + Name + Team Badge — fixed at top, slightly lowered */}
      <div className='flex flex-col items-center pt-4'>
        {/* Role Icon with arcane seal */}
        <CardIcon icon={role.icon} teamId={teamId} />

        {/* Role Name */}
        <h1
          className={cn(
            'font-tarot text-xl sm:text-3xl font-bold text-center uppercase tracking-widest-xl mb-2',
            team.colors.cardText,
          )}
          style={{ textShadow: team.colors.cardIconGlow }}
        >
          {roleName}
        </h1>

        {/* Team Badge */}
        <p
          className={cn(
            'text-center text-xs tracking-widest uppercase',
            team.colors.cardTeamBadge,
          )}
        >
          {teamName}
        </p>
      </div>

      {/* Middle: Divider + Quote + Lines — centered in remaining space */}
      <div className='flex-1 flex flex-col items-center justify-center p-4 sm:p-2'>
        {/* Icon-tagged ability/condition lines */}
        {roleLines.length > 0 && (
          <div className='w-full space-y-1.5 sm:space-y-2'>
            {roleLines.map((line, i) => (
              <div key={i} className='flex items-start gap-2'>
                <span className='shrink-0 mt-px'>
                  <Icon
                    name={LINE_TYPE_ICON[line.type] ?? 'circle'}
                    size='sm'
                    className={cn(team.colors.cardWinAccent, 'opacity-70')}
                  />
                </span>
                <span
                  className={cn(
                    'text-xs sm:text-sm leading-snug',
                    team.colors.cardText,
                    line.type === 'WIN' ? 'opacity-90 font-medium' : 'opacity-70',
                  )}
                >
                  {line.text}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Flavor Quote */}
      {roleQuote && (
        <p
          className={cn(
            'text-center text-xs sm:text-sm italic leading-relaxed mb-3 sm:mb-0',
            team.colors.cardText,
            'opacity-60',
          )}
        >
          "{roleQuote}"
        </p>
      )}
    </CardShell>
  )
}

