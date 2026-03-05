import { RoleId } from '../../roles/types'

export const EXTERNAL_ROLE_ID_ALIASES: Record<string, RoleId> = {
  fortuneteller: 'fortune_teller',
  fortune_teller: 'fortune_teller',
}

export function normalizeExternalRoleId(rawId: string): string {
  return rawId
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '')
}

