import { getRole } from '../../lib/roles'
import { useI18n, getRoleName as getRegistryRoleName } from '../../lib/i18n'
import { Badge, Icon } from '../atoms'
import { cn } from '../../lib/utils'

type Props = {
  roleId: string
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function RoleBadge({
  roleId,
  showIcon = true,
  size = 'md',
  className,
}: Props) {
  const { language } = useI18n()
  const role = getRole(roleId)
  if (!role) return null

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  }

  const teamVariant = role.team as 'townsfolk' | 'outsider' | 'minion' | 'demon'

  const roleName = getRegistryRoleName(roleId, language)

  return (
    <Badge variant={teamVariant} className={cn(sizeClasses[size], className)}>
      {showIcon && <Icon name={role.icon} size='sm' />}
      <span>{roleName}</span>
    </Badge>
  )
}
