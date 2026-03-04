import { getAllRoles } from '../../roles'
import { RoleId } from '../../roles/types'
import { deriveScriptWakeOrderFromRoleIds } from '..'
import { normalizeExternalRoleId, EXTERNAL_ROLE_ID_ALIASES } from './aliases'
import {
  ImportedScriptPayload,
  ImportValidationResult,
  ResolvedImportedCharacter,
  UnsupportedImportedCharacter,
} from './types'

function buildNormalizedRoleMap(): Map<string, RoleId> {
  return new Map(
    getAllRoles().map((role) => [
      normalizeExternalRoleId(role.id),
      role.id,
    ]),
  )
}

export function resolveImportedScript(
  payload: ImportedScriptPayload,
): ImportValidationResult {
  const normalizedRoleMap = buildNormalizedRoleMap()
  const unsupportedCharacters: UnsupportedImportedCharacter[] = []
  const resolvedCharacters: ResolvedImportedCharacter[] = []

  for (const character of payload.characters) {
    const normalizedId = normalizeExternalRoleId(character.id)
    const resolvedRoleId =
      EXTERNAL_ROLE_ID_ALIASES[normalizedId] ??
      normalizedRoleMap.get(normalizedId)

    if (!resolvedRoleId) {
      unsupportedCharacters.push({
        inputId: character.id,
        normalizedId,
      })
      continue
    }

    resolvedCharacters.push({
      inputId: character.id,
      normalizedId,
      roleId: resolvedRoleId,
    })
  }

  if (unsupportedCharacters.length > 0) {
    return {
      supported: false,
      unsupportedCharacters,
      payload,
    }
  }

  const roles = Array.from(
    new Set(resolvedCharacters.map((character) => character.roleId)),
  )

  return {
    supported: true,
    resolvedScript: {
      source: 'imported',
      name: payload.name,
      author: payload.author,
      icon: 'scrollText',
      roles,
      enforceDistribution: true,
      wakeOrder: deriveScriptWakeOrderFromRoleIds(roles),
    },
  }
}
