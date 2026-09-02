import { RoleDefinition } from '../../../lib/roles'
import { getRoleTeamId } from '../../../lib/identity'
import { CardIcon } from './CardIcon'

/**
 * @deprecated Use `CardIcon` directly for new code.
 * This wrapper exists for backward compatibility.
 */
export function RoleIcon({ role }: { role: RoleDefinition }) {
  return <CardIcon icon={role.icon} teamId={getRoleTeamId(role) ?? 'townsfolk'} />
}
