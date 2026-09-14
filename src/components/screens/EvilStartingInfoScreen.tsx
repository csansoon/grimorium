import { useMemo, useState } from 'react'
import type { Game, GameState, PlayerState } from '../../lib/types'
import { getAllRoles, getRole } from '../../lib/roles'
import { SCRIPTS } from '../../lib/scripts'
import { isGoodTeam } from '../../lib/teams'
import type { NightActionResult } from '../../lib/roles/types'
import { getRoleDescription, getRoleName, useI18n } from '../../lib/i18n'
import { Icon } from '../atoms'
import { RolePickerGrid } from '../inputs'
import { EvilTeamReveal, StepSection } from '../items'
import {
  HandbackButton,
  NarratorSetupLayout,
  NightActionLayout,
  PlayerFacingScreen,
} from '../layouts'

type Props = {
  game: Game
  state: GameState
  player: PlayerState
  kind: 'minion' | 'demon'
  onComplete: (result: NightActionResult) => void
}

export function getDemonBluffCandidates(game: Game, state: GameState) {
  const rolesInPlay = new Set(
    state.players.map((candidate) => {
      const actualRole = candidate.effects.find(
        (effect) => typeof effect.data?.actualRole === 'string',
      )?.data?.actualRole
      return typeof actualRole === 'string' ? actualRole : candidate.roleId
    }),
  )
  const scriptRoles = new Set(
    SCRIPTS[game.scriptId as keyof typeof SCRIPTS]?.roles ?? [],
  )

  return getAllRoles().filter(
    (role) =>
      scriptRoles.has(role.id) &&
      isGoodTeam(role.team) &&
      !rolesInPlay.has(role.id),
  )
}

export function EvilStartingInfoScreen({
  game,
  state,
  player,
  kind,
  onComplete,
}: Props) {
  const { t, language } = useI18n()
  const [selectedBluffs, setSelectedBluffs] = useState<string[]>([])
  const [readyToReveal, setReadyToReveal] = useState(kind === 'minion')

  const goodRolesNotInPlay = useMemo(() => {
    return getDemonBluffCandidates(game, state)
  }, [game.scriptId, state.players])

  const finish = () => {
    onComplete({
      entries: [
        {
          type: 'starting_info',
          message: [
            {
              type: 'i18n',
              key: 'history.evilStartingInfoShown',
              params: { player: player.id },
            },
          ],
          data: {
            playerId: player.id,
            roleId: player.roleId,
            kind,
            ...(kind === 'demon' ? { bluffRoleIds: selectedBluffs } : {}),
          },
        },
      ],
    })
  }

  const toggleBluff = (roleId: string) => {
    setSelectedBluffs((current) => {
      if (current.includes(roleId)) {
        return current.filter((id) => id !== roleId)
      }
      return current.length < 3 ? [...current, roleId] : current
    })
  }

  if (kind === 'demon' && !readyToReveal) {
    return (
      <NarratorSetupLayout
        icon='flameKindling'
        roleName={t.game.demonStartingInfo}
        playerName={player.name}
        audience='narrator'
        onShowToPlayer={() => setReadyToReveal(true)}
        showToPlayerDisabled={selectedBluffs.length !== 3}
      >
        <div className='text-center mb-4'>
          <h3 className='text-lg font-semibold text-amber-200'>
            {t.game.selectDemonBluffs}
          </h3>
          <p className='text-sm text-stone-400 mt-1'>
            {t.game.selectDemonBluffsDescription}
          </p>
        </div>

        <StepSection
          step={1}
          label={t.game.stepSelectBluffs}
          count={{ current: selectedBluffs.length, max: 3 }}
        >
          <RolePickerGrid
            roles={goodRolesNotInPlay}
            state={state}
            selected={selectedBluffs}
            onSelect={toggleBluff}
            selectionCount={3}
            colorMode='team'
          />
        </StepSection>
      </NarratorSetupLayout>
    )
  }

  const bluffRoles = selectedBluffs.map((id) => getRole(id)).filter(Boolean)

  return (
    <PlayerFacingScreen playerName={player.name}>
      <NightActionLayout
        player={player}
        title={
          kind === 'minion'
            ? t.game.minionStartingInfo
            : t.game.demonStartingInfo
        }
        description={
          kind === 'minion'
            ? t.game.minionStartingInfoDescription
            : t.game.demonStartingInfoDescription
        }
      >
        <div className='mb-6'>
          <EvilTeamReveal state={state} viewer={player} viewerType={kind} />
        </div>

        {kind === 'demon' && (
          <div className='mb-6'>
            <p className='text-sm text-indigo-300 text-center font-medium mb-3'>
              {t.game.theseAreYourBluffs}
            </p>
            <div className='grid grid-cols-1 gap-3'>
              {bluffRoles.map((role) =>
                role ? (
                  <div
                    key={role.id}
                    className='rounded-xl border-2 border-indigo-500/30 bg-gradient-to-b from-indigo-900/30 to-blue-900/20 p-4'
                  >
                    <div className='flex items-start gap-3'>
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
                        <p className='text-xs text-parchment-400 mt-1 leading-snug'>
                          {getRoleDescription(role.id, language)}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null,
              )}
            </div>
          </div>
        )}

        <HandbackButton onClick={finish} fullWidth size='lg' variant='evil'>
          <Icon name='check' size='md' className='mr-2' />
          {t.common.continue}
        </HandbackButton>
      </NightActionLayout>
    </PlayerFacingScreen>
  )
}
