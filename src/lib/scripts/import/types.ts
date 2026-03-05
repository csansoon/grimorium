import { RoleId } from '../../roles/types'
import { EditableScriptDraft } from '../types'

export type ImportedCharacterRef = {
  id: string
}

export type ImportedScriptPayload = {
  name: string
  author?: string
  characters: ImportedCharacterRef[]
}

export type UnsupportedImportedCharacter = {
  inputId: string
  normalizedId: string
}

export type ImportValidationSuccess = {
  supported: true
  resolvedScript: EditableScriptDraft
}

export type ImportValidationFailure = {
  supported: false
  unsupportedCharacters: UnsupportedImportedCharacter[]
  payload?: ImportedScriptPayload
}

export type ImportValidationResult =
  | ImportValidationSuccess
  | ImportValidationFailure

export type ResolvedImportedCharacter = {
  inputId: string
  normalizedId: string
  roleId: RoleId
}

