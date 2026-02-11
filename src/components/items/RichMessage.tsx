import {
  RichMessage as RichMessageType,
  GameState,
  getPlayer,
} from '../../lib/types'
import { getRole } from '../../lib/roles'
import {
  useI18n,
  Translations,
  getRoleName as getRegistryRoleName,
  getEffectName as getRegistryEffectName,
  getRoleTranslations,
  getEffectTranslations,
} from '../../lib/i18n'
import type { Language } from '../../lib/i18n'
import { Badge, Icon } from '../atoms'
import { ReactNode } from 'react'

type Props = {
  message: RichMessageType
  state: GameState
}

// Helper to resolve a dot-notation key by walking an object
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveNestedKey(obj: any, parts: string[]): string | undefined {
  let value = obj
  for (const part of parts) {
    if (value && typeof value === 'object' && part in value) {
      value = value[part]
    } else {
      return undefined
    }
  }
  return typeof value === 'string' ? value : undefined
}

// Helper to get a translation value by dot-notation key.
// Checks the global translations first, then falls back to the
// distributed role/effect registries.
function getTranslation(
  t: Translations,
  key: string,
  lang: Language,
): string | undefined {
  const parts = key.split('.')

  // Try global translations first
  const globalResult = resolveNestedKey(t, parts)
  if (globalResult !== undefined) return globalResult

  // Fallback: check role registry for keys like "roles.<roleId>.xxx"
  if (parts[0] === 'roles' && parts.length >= 3) {
    const roleId = parts[1]
    const roleT = getRoleTranslations(roleId, lang)
    return resolveNestedKey(roleT, parts.slice(2))
  }

  // Fallback: check effect registry for keys like "effects.<effectId>.xxx"
  if (parts[0] === 'effects' && parts.length >= 3) {
    const effectId = parts[1]
    const effectT = getEffectTranslations(effectId, lang)
    return resolveNestedKey(effectT, parts.slice(2))
  }

  return undefined
}

// Param keys that represent player IDs
const PLAYER_PARAM_KEYS = [
  'player',
  'player1',
  'player2',
  'target',
  'nominator',
  'nominee',
  'slayer',
  'redirect',
]
// Param keys that represent role IDs
const ROLE_PARAM_KEYS = ['role']
// Param keys that represent effect IDs
const EFFECT_PARAM_KEYS = ['effect']

export function RichMessage({ message, state }: Props) {
  const { t, language } = useI18n()

  const getLocalRoleName = (roleId: string) =>
    getRegistryRoleName(roleId, language)

  const getLocalEffectName = (effectType: string) =>
    getRegistryEffectName(effectType, language)

  // Render a player badge with their role icon
  const renderPlayerBadge = (playerId: string, key: string | number) => {
    const player = getPlayer(state, playerId)
    if (!player) return <span key={key}>[Unknown Player]</span>
    const role = getRole(player.roleId)
    return (
      <Badge
        key={key}
        variant='player'
        className='inline-flex items-center gap-1'
      >
        {role && <Icon name={role.icon} size='xs' />}
        {player.name}
      </Badge>
    )
  }

  // Render a role badge
  const renderRoleBadge = (roleId: string, key: string | number) => {
    const role = getRole(roleId)
    if (!role) return <span key={key}>[Unknown Role]</span>
    const teamVariant = role.team as
      | 'townsfolk'
      | 'outsider'
      | 'minion'
      | 'demon'
    return (
      <Badge
        key={key}
        variant={teamVariant}
        className='inline-flex items-center gap-1'
      >
        <Icon name={role.icon} size='xs' /> {getLocalRoleName(roleId)}
      </Badge>
    )
  }

  // Parse a template with params and render with badges
  const renderI18nWithParams = (
    template: string,
    params: Record<string, string | number>,
    baseKey: string,
  ): ReactNode[] => {
    const result: ReactNode[] = []
    // Match {paramName} placeholders
    const regex = /\{(\w+)\}/g
    let lastIndex = 0
    let match

    while ((match = regex.exec(template)) !== null) {
      // Add text before the placeholder
      if (match.index > lastIndex) {
        result.push(
          <span key={`${baseKey}-text-${lastIndex}`}>
            {template.slice(lastIndex, match.index)}
          </span>,
        )
      }

      const paramKey = match[1]
      const paramValue = params[paramKey]

      if (paramValue !== undefined) {
        if (PLAYER_PARAM_KEYS.includes(paramKey)) {
          // Render as player badge
          result.push(
            renderPlayerBadge(
              String(paramValue),
              `${baseKey}-player-${paramKey}`,
            ),
          )
        } else if (ROLE_PARAM_KEYS.includes(paramKey)) {
          // Render as role badge
          result.push(
            renderRoleBadge(String(paramValue), `${baseKey}-role-${paramKey}`),
          )
        } else if (EFFECT_PARAM_KEYS.includes(paramKey)) {
          // Render as effect badge
          result.push(
            <Badge key={`${baseKey}-effect-${paramKey}`} variant='effect'>
              {getLocalEffectName(String(paramValue))}
            </Badge>,
          )
        } else {
          // Render as plain text
          result.push(
            <span key={`${baseKey}-param-${paramKey}`}>{paramValue}</span>,
          )
        }
      } else {
        // Placeholder not found in params, keep as is
        result.push(
          <span key={`${baseKey}-missing-${paramKey}`}>{match[0]}</span>,
        )
      }

      lastIndex = match.index + match[0].length
    }

    // Add remaining text after last placeholder
    if (lastIndex < template.length) {
      result.push(
        <span key={`${baseKey}-text-end`}>{template.slice(lastIndex)}</span>,
      )
    }

    return result
  }

  return (
    <span className='inline-flex flex-wrap items-center gap-1'>
      {message.map((part, index) => {
        switch (part.type) {
          case 'text':
            return <span key={index}>{part.content}</span>

          case 'i18n': {
            const template = getTranslation(t, part.key, language)
            if (!template) return <span key={index}>[{part.key}]</span>

            if (part.params && Object.keys(part.params).length > 0) {
              // Render with badges for player/role params
              return (
                <span
                  key={index}
                  className='inline-flex flex-wrap items-center gap-1'
                >
                  {renderI18nWithParams(
                    template,
                    part.params as Record<string, string | number>,
                    `i18n-${index}`,
                  )}
                </span>
              )
            }
            return <span key={index}>{template}</span>
          }

          case 'player': {
            return renderPlayerBadge(part.playerId, index)
          }

          case 'role': {
            return renderRoleBadge(part.roleId, index)
          }

          case 'effect': {
            return (
              <Badge key={index} variant='effect'>
                {getLocalEffectName(part.effectType)}
              </Badge>
            )
          }

          default:
            return null
        }
      })}
    </span>
  )
}
