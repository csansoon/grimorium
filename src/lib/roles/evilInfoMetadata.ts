import type { EvilInfoModifier, RoleId } from './types'

const ROLE_EVIL_INFO_MODIFIERS: Partial<Record<RoleId, EvilInfoModifier>> = {}

export function getRoleEvilInfoModifier(
  roleId: RoleId,
): EvilInfoModifier | undefined {
  return ROLE_EVIL_INFO_MODIFIERS[roleId]
}
