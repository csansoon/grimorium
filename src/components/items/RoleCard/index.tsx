import { getRole } from '../../../lib/roles'
import { getTeam, TeamId } from '../../../lib/teams'
import {
  useI18n,
  getRoleName as getRegistryRoleName,
  getRoleDescription as getRegistryRoleDescription,
} from '../../../lib/i18n'
import { Icon } from '../../atoms'
import { MysticDivider } from '..'
import { cn } from '../../../lib/utils'
import { CardShell } from './CardShell'
import { CardIcon } from './CardIcon'

type Props = {
  roleId: string
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
        Unknown role: {roleId}
      </p>
    )
  }

  const team = getTeam(role.team)
  const teamId = role.team as TeamId

  const teamTranslation = t.teams[teamId]

  const roleName = getRegistryRoleName(role.id, language)
  const roleDescription = getRegistryRoleDescription(role.id, language)
  const teamName = teamTranslation?.name ?? teamId
  const winCondition = teamTranslation?.winCondition ?? ''

  return (
    <CardShell teamId={teamId} icon={role.icon}>
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
          'text-center text-xs tracking-widest uppercase mb-3 sm:mb-6',
          team.colors.cardTeamBadge,
        )}
      >
        {teamName}
      </p>

      {/* Divider — team-specific icon */}
      <MysticDivider
        icon={team.colors.cardDividerIcon}
        iconClassName={cn(team.colors.cardWinAccent, 'opacity-50')}
      />

      {/* Description */}
      <p
        className={cn(
          'text-center text-sm leading-relaxed mb-3 sm:mb-6',
          team.colors.cardText,
          'opacity-80',
        )}
      >
        {roleDescription}
      </p>

      {/* Win Condition */}
      <div className={cn('rounded-lg p-3 sm:p-4', team.colors.cardWinBg)}>
        <div className='flex items-center justify-center gap-2 mb-1 sm:mb-2'>
          <Icon name='trophy' size='sm' className={team.colors.cardWinAccent} />
          <span
            className={cn(
              'text-xs font-semibold uppercase tracking-wider',
              team.colors.cardWinAccent,
            )}
          >
            {t.common.winCondition}
          </span>
        </div>
        <p
          className={cn(
            'text-center text-xs leading-relaxed',
            team.colors.cardText,
            'opacity-70',
          )}
        >
          {winCondition}
        </p>
      </div>
    </CardShell>
  )
}
