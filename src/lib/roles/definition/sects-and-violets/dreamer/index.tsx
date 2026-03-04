import { useMemo, useState } from 'react'
import { RoleDefinition } from '../../../types'
import { isAlive } from '../../../../types'
import {
  registerRoleTranslations,
  getRoleTranslations,
  useI18n,
} from '../../../../i18n'
import { getRolesForGame } from '../../../index'
import { DefaultRoleReveal } from '../../../../../components/items/DefaultRoleReveal'
import { PlayerPickerList, RolePickerGrid } from '../../../../../components/inputs'
import { Button, Icon, BackButton } from '../../../../../components/atoms'
import { ScreenFooter } from '../../../../../components/layouts/ScreenFooter'
import { PlayerFacingScreen } from '../../../../../components/layouts/PlayerFacingScreen'
import { PlayerRolePairRevealScreen } from '../../../../../components/screens/SectsAndVioletsActionScreens'
import { perceive } from '../../../../pipeline'
import {
  GOOD_ROLE_IDS,
  EVIL_ROLE_IDS,
} from '../helpers'
import { shouldForceFalseInfo } from '../../../runtime-helpers'

import en from './i18n/en'
import es from './i18n/es'

registerRoleTranslations('dreamer', 'en', en)
registerRoleTranslations('dreamer', 'es', es)

type Phase =
  | 'select_target'
  | 'select_alternate'
  | 'select_good_role'
  | 'select_evil_role'
  | 'show_result'

const definition: RoleDefinition = {
  id: 'dreamer',
  team: 'townsfolk',
  icon: 'moon',
  nightOrder: 18,
  chaos: 45,
  shouldWake: (_game, player) => isAlive(player),

  RoleReveal: DefaultRoleReveal,

  NightAction: ({ game, state, player, onComplete }) => {
    const { t, language } = useI18n()
    const roleT = getRoleTranslations('dreamer', language)
    const [phase, setPhase] = useState<Phase>('select_target')
    const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null)
    const [selectedAlternateRoleId, setSelectedAlternateRoleId] = useState<string | null>(null)
    const [selectedGoodRoleId, setSelectedGoodRoleId] = useState<string | null>(null)
    const [selectedEvilRoleId, setSelectedEvilRoleId] = useState<string | null>(null)

    const malfunctioning = shouldForceFalseInfo(state, player)
    const target = state.players.find((candidate) => candidate.id === selectedTargetId) ?? null
    const actualRoleId = target
      ? perceive(target, player, 'role', state).roleId
      : null
    const actualRoleIsGood = actualRoleId ? GOOD_ROLE_IDS.has(actualRoleId) : true

    const allRoles = useMemo(
      () => getRolesForGame(game),
      [game],
    )
    const alternateRoles = useMemo(
      () =>
        allRoles.filter((role) =>
          actualRoleIsGood ? EVIL_ROLE_IDS.has(role.id) : GOOD_ROLE_IDS.has(role.id),
        ),
      [actualRoleIsGood, allRoles],
    )
    const goodRoles = useMemo(
      () => allRoles.filter((role) => GOOD_ROLE_IDS.has(role.id)),
      [allRoles],
    )
    const evilRoles = useMemo(
      () => allRoles.filter((role) => EVIL_ROLE_IDS.has(role.id)),
      [allRoles],
    )

    const shownRoleIds = useMemo((): [string, string] | null => {
      if (malfunctioning) {
        if (!selectedGoodRoleId || !selectedEvilRoleId) return null
        return [selectedGoodRoleId, selectedEvilRoleId]
      }
      if (!actualRoleId || !selectedAlternateRoleId) return null
      return actualRoleIsGood
        ? [actualRoleId, selectedAlternateRoleId]
        : [selectedAlternateRoleId, actualRoleId]
    }, [
      actualRoleId,
      actualRoleIsGood,
      malfunctioning,
      selectedAlternateRoleId,
      selectedEvilRoleId,
      selectedGoodRoleId,
    ])

    const complete = () => {
      if (!selectedTargetId || !shownRoleIds) return
      onComplete({
        entries: [
          {
            type: 'night_action',
            message: [
              {
                type: 'text',
                content: `${player.name} dreamed about ${target?.name ?? 'a player'} and saw ${shownRoleIds[0]} and ${shownRoleIds[1]}.`,
              },
            ],
            data: {
              roleId: 'dreamer',
              playerId: player.id,
              action: 'dreamer_info',
              targetId: selectedTargetId,
              shownRoleIds,
              actualRoleId,
              malfunctioned: malfunctioning || undefined,
            },
          },
        ],
      })
    }

    if (phase === 'show_result' && shownRoleIds && target) {
      return (
        <PlayerRolePairRevealScreen
          playerName={player.name}
          icon='moon'
          title={roleT.infoTitle}
          subtitle={target.name}
          description={roleT.revealDescription.replace('{player}', target.name)}
          roleIds={shownRoleIds}
          onComplete={complete}
        />
      )
    }

    if (phase === 'select_alternate' && target && actualRoleId) {
      return (
        <div className='min-h-app bg-gradient-to-b from-indigo-950 via-grimoire-purple to-grimoire-darker flex flex-col'>
          <div className='bg-gradient-to-b from-white/5 to-transparent px-4 py-4'>
            <div className='max-w-lg mx-auto'>
              <div className='flex items-center mb-4'>
                <BackButton onClick={() => setPhase('select_target')} />
                <span className='text-parchment-500 text-xs ml-1'>
                  {t.common.back}
                </span>
              </div>
              <div className='text-center'>
                <div className='flex justify-center mb-2'>
                  <Icon name='moon' size='3xl' className='text-indigo-300' />
                </div>
                <h1 className='font-tarot text-2xl text-parchment-100 tracking-widest-xl uppercase'>
                  {roleT.chooseAlternateTitle}
                </h1>
                <p className='text-parchment-400 text-sm'>
                  {roleT.chooseAlternateDescription.replace('{player}', target.name)}
                </p>
              </div>
            </div>
          </div>
          <div className='flex-1 px-4 pb-4 max-w-lg mx-auto w-full overflow-y-auto'>
            <RolePickerGrid
              roles={alternateRoles}
              state={state}
              selected={selectedAlternateRoleId ? [selectedAlternateRoleId] : []}
              onSelect={(roleId) =>
                setSelectedAlternateRoleId((prev) =>
                  prev === roleId ? null : roleId,
                )
              }
              selectionCount={1}
              colorMode='team'
            />
          </div>
          <ScreenFooter borderColor='border-indigo-500/30'>
            <Button
              onClick={() => setPhase('show_result')}
              disabled={!selectedAlternateRoleId}
              fullWidth
              size='lg'
              variant='primary'
            >
              {roleT.showDreamLabel}
            </Button>
          </ScreenFooter>
        </div>
      )
    }

    if (phase === 'select_good_role' || phase === 'select_evil_role') {
      const isGoodPhase = phase === 'select_good_role'
      const roles = isGoodPhase ? goodRoles : evilRoles
      const selected = isGoodPhase ? selectedGoodRoleId : selectedEvilRoleId

      return (
        <div className='min-h-app bg-gradient-to-b from-indigo-950 via-grimoire-purple to-grimoire-darker flex flex-col'>
          <div className='bg-gradient-to-b from-white/5 to-transparent px-4 py-4'>
            <div className='max-w-lg mx-auto'>
              <div className='flex items-center mb-4'>
                <BackButton
                  onClick={() =>
                    setPhase(isGoodPhase ? 'select_target' : 'select_good_role')
                  }
                />
                <span className='text-parchment-500 text-xs ml-1'>
                  {t.common.back}
                </span>
              </div>
              <div className='text-center'>
                <div className='flex justify-center mb-2'>
                  <Icon name='moon' size='3xl' className='text-indigo-300' />
                </div>
                <h1 className='font-tarot text-2xl text-parchment-100 tracking-widest-xl uppercase'>
                  {isGoodPhase ? roleT.chooseGoodTitle : roleT.chooseEvilTitle}
                </h1>
                <p className='text-parchment-400 text-sm'>
                  {isGoodPhase ? roleT.chooseGoodDescription : roleT.chooseEvilDescription}
                </p>
              </div>
            </div>
          </div>
          <div className='flex-1 px-4 pb-4 max-w-lg mx-auto w-full overflow-y-auto'>
            <RolePickerGrid
              roles={roles}
              state={state}
              selected={selected ? [selected] : []}
              onSelect={(roleId) =>
                isGoodPhase
                  ? setSelectedGoodRoleId((prev) =>
                      prev === roleId ? null : roleId,
                    )
                  : setSelectedEvilRoleId((prev) =>
                      prev === roleId ? null : roleId,
                    )
              }
              selectionCount={1}
              colorMode='team'
            />
          </div>
          <ScreenFooter borderColor='border-indigo-500/30'>
            <Button
              onClick={() =>
                setPhase(isGoodPhase ? 'select_evil_role' : 'show_result')
              }
              disabled={!selected}
              fullWidth
              size='lg'
              variant='primary'
            >
              {isGoodPhase ? t.common.continue : roleT.showDreamLabel}
            </Button>
          </ScreenFooter>
        </div>
      )
    }

    return (
      <PlayerFacingScreen playerName={player.name}>
        <div className='min-h-app bg-gradient-to-b from-indigo-950 via-grimoire-purple to-grimoire-darker flex flex-col'>
          <div className='px-4 py-6 text-center'>
            <div className='flex justify-center mb-4'>
              <div className='w-20 h-20 rounded-full flex items-center justify-center border bg-indigo-500/10 border-indigo-400/30'>
                <Icon name='moon' size='3xl' className='text-indigo-400' />
              </div>
            </div>
            <h1 className='font-tarot text-xl text-parchment-100 tracking-wider uppercase mb-1'>
              {roleT.chooseTargetTitle}
            </h1>
            <p className='text-parchment-400 text-sm max-w-sm mx-auto'>
              {roleT.chooseTargetDescription}
            </p>
          </div>
          <div className='flex-1 px-4 pb-4 max-w-lg mx-auto w-full overflow-y-auto'>
            <PlayerPickerList
              players={state.players}
              selected={selectedTargetId ? [selectedTargetId] : []}
              onSelect={(playerId) => setSelectedTargetId(playerId)}
              selectionCount={1}
              variant='blue'
            />
          </div>
          <ScreenFooter borderColor='border-indigo-500/30'>
            <Button
              onClick={() =>
                setPhase(malfunctioning ? 'select_good_role' : 'select_alternate')
              }
              disabled={!selectedTargetId}
              fullWidth
              size='lg'
              variant='primary'
            >
              {roleT.continueLabel}
            </Button>
          </ScreenFooter>
        </div>
      </PlayerFacingScreen>
    )
  },
}

export default definition
