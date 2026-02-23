import { useState, useMemo } from 'react'
import { RoleDefinition } from '../../types'
import { isAlive, hasEffect } from '../../../types'
import { isMalfunctioning } from '../../../effects'
import {
  useI18n,
  registerRoleTranslations,
  getRoleName,
  getRoleDescription,
  getRoleTranslations,
} from '../../../i18n'
import { getRole, getAllRoles } from '../../index'
import { isGoodTeam, getTeam } from '../../../teams'
import { DefaultRoleReveal } from '../../../../components/items/DefaultRoleReveal'
import {
  NightActionLayout,
  NarratorSetupLayout,
  NightStepListLayout,
  PlayerFacingScreen,
} from '../../../../components/layouts'
import type { NightStep } from '../../../../components/layouts'
import { PlayerPickerList, RolePickerGrid } from '../../../../components/inputs'
import {
  StepSection,
  MysticDivider,
  EvilTeamReveal,
  RoleCard,
} from '../../../../components/items'
import { Button, Icon } from '../../../../components/atoms'
import {
  HandbackButton,
} from '../../../../components/layouts'

import en from './i18n/en'
import es from './i18n/es'

registerRoleTranslations('imp', 'en', en)
registerRoleTranslations('imp', 'es', es)

type Phase =
  | 'step_list'
  // First night phases
  | 'show_minions'
  | 'select_bluffs'
  | 'show_bluffs'
  // Kill phases (subsequent nights)
  | 'choose_victim'
  // Role change reveal (when this player just became the Imp)
  | 'show_new_role'

/**
 * The Imp — Demon role.
 *
 * First night: The Imp is shown their Minions, the narrator selects 3 good
 * roles not in play as bluffs, and those bluffs are shown to the Imp.
 * No kill action on the first night.
 *
 * Subsequent nights: the Imp selects a target and emits a kill intent.
 * If the Imp targets themselves and there are alive Minions, a kill intent
 * with cause "imp_self_kill" is emitted through the pipeline. This allows
 * protection effects (Safe/Monk) to prevent the self-kill. If the kill is
 * allowed, the imp_starpass_pending effect handler requests UI for the
 * narrator to select which Minion becomes the new Imp. The demon_successor
 * handler is explicitly excluded for self-kills — it is always the
 * narrator's choice.
 *
 * All effect interactions (Safe protection, Deflect redirect) are handled
 * by the pipeline through effect handlers. The Imp has zero knowledge
 * of other roles.
 */
const definition: RoleDefinition = {
  id: 'imp',
  team: 'demon',
  icon: 'flameKindling',
  nightOrder: 30,
  chaos: 30,
  shouldWake: (_game, player) => isAlive(player),

  nightSteps: [
    {
      id: 'show_minions',
      icon: 'users',
      getLabel: (t) => t.game.stepShowMinions,
      condition: (_game, _player, state) => state.round === 1,
      audience: 'player_reveal',
    },
    {
      id: 'select_bluffs',
      icon: 'shuffle',
      getLabel: (t) => t.game.stepSelectBluffs,
      condition: (_game, _player, state) => state.round === 1,
      audience: 'narrator',
    },
    {
      id: 'show_bluffs',
      icon: 'eye',
      getLabel: (t) => t.game.stepShowBluffs,
      condition: (_game, _player, state) => state.round === 1,
      audience: 'player_reveal',
    },
    {
      id: 'choose_victim',
      icon: 'flameKindling',
      getLabel: (t) => t.game.stepChooseVictim,
      condition: (_game, _player, state) => state.round > 1,
      audience: 'player_choice',
    },
    // Self-kill starpass: handled by the imp_starpass_pending effect
    // handler via request_ui in the pipeline, not as a nightStep.
  ],

  RoleReveal: DefaultRoleReveal,

  NightAction: ({ state, player, onComplete }) => {
    const { t, language } = useI18n()
    const roleT = getRoleTranslations('imp', language)
    const isFirstNight = state.round === 1

    // Detect if this player just became the Imp (has pending_role_reveal)
    const isPendingRoleReveal = hasEffect(player, 'pending_role_reveal')

    const [phase, setPhase] = useState<Phase>('step_list')
    const [showMinionsDone, setShowMinionsDone] = useState(false)
    const [selectedBluffs, setSelectedBluffs] = useState<string[]>([])
    const [selectBluffsDone, setSelectBluffsDone] = useState(false)
    const [selectedTarget, setSelectedTarget] = useState<string | null>(null)

    const alivePlayers = state.players.filter((p) => isAlive(p))

    const malfunctioning = isMalfunctioning(player)

    // ================================================================
    // First Night Helpers
    // ================================================================

    // Find minion players in the game
    const minionPlayers = useMemo(
      () =>
        state.players.filter((p) => {
          const role = getRole(p.roleId)
          return role?.team === 'minion'
        }),
      [state.players],
    )

    // Find good roles NOT in play (candidates for bluffs)
    const goodRolesNotInPlay = useMemo(() => {
      const rolesInPlay = new Set(state.players.map((p) => p.roleId))
      return getAllRoles().filter(
        (role) => isGoodTeam(role.team) && !rolesInPlay.has(role.id),
      )
    }, [state.players])

    // ================================================================
    // Self-Kill Helpers
    // ================================================================

    // Check if there are alive minions (for self-kill starpass detection)
    const hasAliveMinions = useMemo(
      () =>
        state.players.some((p) => {
          if (!isAlive(p)) return false
          const role = getRole(p.roleId)
          return role?.team === 'minion'
        }),
      [state.players],
    )

    // ================================================================
    // Step List
    // ================================================================

    const steps: NightStep[] = useMemo(() => {
      // Role change reveal: single step to show the new role
      if (isPendingRoleReveal) {
        return [
          {
            id: 'show_new_role',
            icon: 'sparkles',
            label: t.game.yourRoleHasChanged,
            status: 'pending',
            audience: 'player_reveal' as const,
          },
        ]
      }

      if (isFirstNight) {
        return [
          {
            id: 'show_minions',
            icon: 'users',
            label: t.game.stepShowMinions,
            status: showMinionsDone ? 'done' : 'pending',
            audience: 'player_reveal' as const,
          },
          {
            id: 'select_bluffs',
            icon: 'shuffle',
            label: t.game.stepSelectBluffs,
            status: selectBluffsDone ? 'done' : 'pending',
            audience: 'narrator' as const,
          },
          {
            id: 'show_bluffs',
            icon: 'eye',
            label: t.game.stepShowBluffs,
            status: 'pending',
            audience: 'player_reveal' as const,
          },
        ]
      }

      return [
        {
          id: 'choose_victim',
          icon: 'flameKindling',
          label: t.game.stepChooseVictim,
          status: 'pending',
          audience: 'player_choice' as const,
        },
      ]
    }, [
      isPendingRoleReveal,
      isFirstNight,
      showMinionsDone,
      selectBluffsDone,
      t,
    ])

    const handleSelectStep = (stepId: string) => {
      setPhase(stepId as Phase)
    }

    // ================================================================
    // First Night: Complete handler
    // ================================================================

    const handleFirstNightComplete = () => {
      onComplete({
        entries: [
          {
            type: 'night_action',
            message: [
              {
                type: 'i18n',
                key: 'roles.imp.history.shownMinionsAndBluffs',
                params: {
                  player: player.id,
                },
              },
              ...selectedBluffs.flatMap((id, i) => [
                ...(i > 0 ? [{ type: 'text' as const, content: ', ' }] : []),
                { type: 'role' as const, roleId: id },
              ]),
            ],
            data: {
              roleId: 'imp',
              playerId: player.id,
              action: 'first_night_info',
              minionIds: minionPlayers.map((p) => p.id),
              bluffRoleIds: selectedBluffs,
            },
          },
        ],
      })
    }

    // ================================================================
    // Kill confirm handler (subsequent nights)
    // ================================================================

    const handleConfirmKill = () => {
      if (!selectedTarget) return

      const target = state.players.find((p) => p.id === selectedTarget)
      if (!target) return

      // Self-kill with alive minions: route through pipeline with
      // imp_starpass_pending effect. Protection (Safe/Monk) can prevent
      // the kill, blocking the starpass. If allowed, the effect handler
      // requests UI for the narrator to select the new Imp.
      if (selectedTarget === player.id && hasAliveMinions && !malfunctioning) {
        onComplete({
          entries: [
            {
              type: 'night_action',
              message: [
                {
                  type: 'i18n',
                  key: 'roles.imp.history.selfKilled',
                  params: { player: player.id },
                },
              ],
              data: {
                roleId: 'imp',
                playerId: player.id,
                action: 'self_kill',
              },
            },
          ],
          addEffects: {
            [player.id]: [
              { type: 'imp_starpass_pending', expiresAt: 'end_of_night' },
            ],
          },
          intent: {
            type: 'kill' as const,
            sourceId: player.id,
            targetId: player.id,
            cause: 'imp_self_kill',
          },
        })
        return
      }

      // Normal kill (or self-kill with no alive minions, or malfunctioning)
      onComplete({
        entries: [
          {
            type: 'night_action',
            message: [
              {
                type: 'i18n',
                key: 'roles.imp.history.choseToKill',
                params: {
                  player: player.id,
                  target: target.id,
                },
              },
            ],
            data: {
              roleId: 'imp',
              playerId: player.id,
              action: 'kill',
              targetId: target.id,
              ...(malfunctioning ? { malfunctioned: true } : {}),
            },
          },
        ],
        // When malfunctioning, the kill intent is NOT emitted
        ...(!malfunctioning && {
          intent: {
            type: 'kill' as const,
            sourceId: player.id,
            targetId: target.id,
            cause: 'demon',
          },
        }),
      })
    }

    // ================================================================
    // Role change reveal handler (when this player just became the Imp)
    // ================================================================

    const handleRoleRevealComplete = () => {
      onComplete({
        entries: [
          {
            type: 'night_action',
            message: [
              {
                type: 'i18n',
                key: 'history.roleChanged',
                params: {
                  player: player.id,
                  role: player.roleId,
                },
              },
            ],
            data: {
              roleId: 'imp',
              playerId: player.id,
              action: 'role_change_revealed',
            },
          },
        ],
        removeEffects: { [player.id]: ['pending_role_reveal'] },
      })
    }

    // ================================================================
    // Bluff toggle handler
    // ================================================================

    const handleBluffToggle = (roleId: string) => {
      setSelectedBluffs((prev) => {
        if (prev.includes(roleId)) {
          return prev.filter((id) => id !== roleId)
        } else if (prev.length < 3) {
          return [...prev, roleId]
        }
        return prev
      })
    }

    // ================================================================
    // RENDER: Step List
    // ================================================================

    if (phase === 'step_list') {
      return (
        <NightStepListLayout
          icon='flameKindling'
          roleName={getRoleName('imp', language)}
          playerName={player.name}
          isEvil
          steps={steps}
          onSelectStep={handleSelectStep}
        />
      )
    }

    // ================================================================
    // RENDER: Show New Role (player-facing role change reveal)
    // ================================================================

    if (phase === 'show_new_role') {
      const role = getRole(player.roleId)
      const teamId = role?.team ?? 'demon'
      const team = getTeam(teamId)

      return (
        <PlayerFacingScreen playerName={player.name}>
          <NightActionLayout
            player={player}
            title={t.game.yourRoleHasChanged}
            description={roleT.roleChangedDescription}
          >
            <div className='mb-6 flex justify-center'>
              <RoleCard roleId={player.roleId} />
            </div>

            <HandbackButton
              onClick={handleRoleRevealComplete}
              fullWidth
              size='lg'
              variant={team.isEvil ? 'evil' : 'default'}
            >
              <Icon name='check' size='md' className='mr-2' />
              {t.common.iUnderstandMyRole}
            </HandbackButton>
          </NightActionLayout>
        </PlayerFacingScreen>
      )
    }

    // ================================================================
    // RENDER: Show Minions (player-facing)
    // ================================================================

    if (phase === 'show_minions') {
      return (
        <PlayerFacingScreen playerName={player.name}>
          <NightActionLayout
            player={player}
            title={roleT.demonMinionsTitle}
            description={roleT.demonMinionsDescription}
          >
            <div className='mb-6'>
              <p className='text-sm text-red-300/70 text-center font-medium mb-3'>
                {roleT.theseAreYourMinions}
              </p>
              <EvilTeamReveal
                state={state}
                viewer={player}
                viewerType='demon'
              />
            </div>

            <HandbackButton
              onClick={() => {
                setShowMinionsDone(true)
                setPhase('step_list')
              }}
              fullWidth
              size='lg'
              variant='evil'
            >
              <Icon name='check' size='md' className='mr-2' />
              {t.common.continue}
            </HandbackButton>
          </NightActionLayout>
        </PlayerFacingScreen>
      )
    }

    // ================================================================
    // RENDER: Select Bluffs (narrator-facing)
    // ================================================================

    if (phase === 'select_bluffs') {
      return (
        <NarratorSetupLayout
          icon='flameKindling'
          roleName={getRoleName('imp', language)}
          playerName={player.name}
          audience='narrator'
          onShowToPlayer={() => {
            setSelectBluffsDone(true)
            setPhase('step_list')
          }}
          showToPlayerDisabled={selectedBluffs.length !== 3}
          showToPlayerLabel={t.common.confirm}
        >
          <div className='text-center mb-4'>
            <h3 className='text-lg font-semibold text-amber-200'>
              {roleT.selectBluffsTitle}
            </h3>
            <p className='text-sm text-stone-400 mt-1'>
              {roleT.selectBluffsDescription}
            </p>
          </div>

          <StepSection
            step={1}
            label={roleT.selectThreeBluffs}
            count={{
              current: selectedBluffs.length,
              max: 3,
            }}
          >
            <RolePickerGrid
              roles={goodRolesNotInPlay}
              state={state}
              selected={selectedBluffs}
              onSelect={handleBluffToggle}
              selectionCount={3}
              colorMode='team'
            />
          </StepSection>
        </NarratorSetupLayout>
      )
    }

    // ================================================================
    // RENDER: Show Bluffs (player-facing)
    // ================================================================

    if (phase === 'show_bluffs') {
      const bluffRoles = selectedBluffs.map((id) => getRole(id)).filter(Boolean)

      return (
        <PlayerFacingScreen playerName={player.name}>
          <NightActionLayout
            player={player}
            title={roleT.demonBluffsTitle}
            description={roleT.demonBluffsDescription}
          >
            <div className='mb-6'>
              <p className='text-sm text-red-300/70 text-center font-medium mb-3'>
                {roleT.theseAreYourBluffs}
              </p>
              <div className='grid grid-cols-1 gap-3'>
                {bluffRoles.map((role) => {
                  if (!role) return null
                  const desc = getRoleDescription(role.id, language)
                  return (
                    <div
                      key={role.id}
                      className='rounded-xl border-2 border-indigo-500/30 bg-gradient-to-b from-indigo-900/30 to-blue-900/20 p-4'
                      style={{
                        boxShadow:
                          '0 0 16px rgba(99,102,241,0.15), inset 0 1px 0 rgba(255,255,255,0.06)',
                      }}
                    >
                      <div className='flex items-start gap-3'>
                        {/* Role icon medallion */}
                        <div className='w-10 h-10 rounded-full bg-indigo-800/40 border border-indigo-500/30 flex items-center justify-center flex-shrink-0'>
                          <Icon
                            name={role.icon}
                            size='md'
                            className='text-indigo-300'
                          />
                        </div>
                        <div className='flex-1 min-w-0'>
                          <div className='text-parchment-100 font-tarot tracking-wider uppercase text-sm'>
                            {getRoleName(role.id, language)}
                          </div>
                          {desc && (
                            <p className='text-xs text-parchment-400 mt-1 leading-snug'>
                              {desc}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <MysticDivider />

            <HandbackButton
              onClick={handleFirstNightComplete}
              fullWidth
              size='lg'
              variant='evil'
              className='mt-4'
            >
              <Icon name='check' size='md' className='mr-2' />
              {t.common.iUnderstandMyRole}
            </HandbackButton>
          </NightActionLayout>
        </PlayerFacingScreen>
      )
    }

    // ================================================================
    // RENDER: Choose Victim (subsequent nights)
    // ================================================================

    return (
      <NightActionLayout
        player={player}
        title={t.game.choosePlayerToKill}
        description={t.game.selectVictim}
        audience='player_choice'
      >
        <div className='mb-6'>
          <PlayerPickerList
            players={alivePlayers}
            selected={selectedTarget ? [selectedTarget] : []}
            onSelect={setSelectedTarget}
            selectionCount={1}
            variant='red'
          />
        </div>

        <Button
          onClick={handleConfirmKill}
          disabled={!selectedTarget}
          fullWidth
          size='lg'
          variant='evil'
        >
          <Icon name='flameKindling' size='md' className='mr-2' />
          {t.game.confirmKill}
        </Button>
      </NightActionLayout>
    )
  },
}

export default definition
