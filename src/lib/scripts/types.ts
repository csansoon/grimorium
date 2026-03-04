import { RoleId } from '../roles/types'
import { IconName } from '../../components/atoms/icon'

export type BuiltinScriptId = 'trouble-brewing' | 'sects-and-violets' | 'custom'
export type ScriptId = string
export type ScriptSource = 'builtin' | 'imported' | 'custom'

export type ScriptWakeEntry = {
  roleId: RoleId
  mode?: 'active' | 'reactive'
  note?: string
  hidden?: boolean
}

export type ScriptWakeOrder = {
  firstNight: ScriptWakeEntry[]
  otherNights: ScriptWakeEntry[]
}

export type ScriptDefinition = {
  id: ScriptId
  source: ScriptSource
  name: string
  author?: string
  icon: IconName
  roles: RoleId[]
  enforceDistribution: boolean
  wakeOrder: ScriptWakeOrder
  isOfficial: boolean
}

export type SavedScriptDefinition = ScriptDefinition & {
  source: 'imported' | 'custom'
  isOfficial: false
}

export type EditableScriptDraft = {
  id?: string
  source: 'imported' | 'custom'
  name: string
  author?: string
  icon: IconName
  roles: RoleId[]
  enforceDistribution: boolean
  wakeOrder: ScriptWakeOrder
}

export type RoleDistribution = {
  townsfolk: number
  outsider: number
  minion: number
  demon: number
}

export type GeneratorPreset = 'simple' | 'interesting' | 'chaotic'

export type GeneratedPool = {
  roles: RoleId[]
  totalChaos: number
  distribution: RoleDistribution
}
