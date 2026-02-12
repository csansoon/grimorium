import { RoleId } from '../roles/types'
import { TeamId } from '../teams/types'
import { IconName } from '../../components/atoms/icon'

export type ScriptId = 'trouble-brewing' | 'custom'

export type ScriptDefinition = {
  id: ScriptId
  icon: IconName
  /** Available roles for this script ('custom' includes all roles) */
  roles: RoleId[]
  /** Whether to enforce the standard team distribution rules */
  enforceDistribution: boolean
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
