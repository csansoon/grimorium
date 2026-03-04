import { useMemo } from 'react'
import {
  Game,
  GameState,
  HistoryEntry,
  getPlayer,
} from '../../lib/types'
import {
  getNightActionEntries,
  getNightActionSummary,
  type NightSystemStepId,
} from '../../lib/game'
import { useI18n, getRoleName } from '../../lib/i18n'
import { Button, Icon } from '../atoms'
import { RichMessage as RichMessageDisplay } from '../items/RichMessage'
import {
  EvilTeamReveal,
  MysticDivider,
  OracleCard,
  NumberReveal,
  RoleCard,
  TeamBackground,
} from '../items'
import { Grimoire } from '../items/Grimoire'
import { NightActionLayout } from '../layouts'
import { ScreenFooter } from '../layouts/ScreenFooter'
import { cn } from '../../lib/utils'
import { getRole } from '../../lib/roles'

type Props = {
  game: Game
  state: GameState
  playerId: string
  roleId: string
  systemStepId?: NightSystemStepId
  onBack: () => void
}

function ReplaySection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className='rounded-xl border border-white/10 bg-white/5 p-4 space-y-3'>
      <h3 className='text-sm font-medium uppercase tracking-[0.18em] text-parchment-300'>
        {title}
      </h3>
      {children}
    </section>
  )
}

function ReplayPlayerChips({
  state,
  ids,
}: {
  state: GameState
  ids: string[]
}) {
  return (
    <div className='flex flex-wrap gap-2'>
      {ids.map((id) => {
        const player = getPlayer(state, id)
        if (!player) return null
        const role = getRole(player.roleId)
        return (
          <div
            key={id}
            className='inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-parchment-200'
          >
            {role && <Icon name={role.icon} size='sm' className='text-parchment-400' />}
            <span>{player.name}</span>
          </div>
        )
      })}
    </div>
  )
}

function ReplayBooleanCard({
  icon,
  title,
  value,
  trueLabel,
  falseLabel,
}: {
  icon: string
  title: string
  value: boolean
  trueLabel: string
  falseLabel: string
}) {
  return (
    <TeamBackground teamId={value ? 'townsfolk' : 'outsider'}>
      <OracleCard
        icon={icon as any}
        teamId={value ? 'townsfolk' : 'outsider'}
        title={title}
        subtitle=''
      >
        <div
          className={cn(
            'rounded-xl border px-4 py-5 text-center text-xl font-semibold',
            value
              ? 'border-emerald-500/30 bg-emerald-900/20 text-emerald-300'
              : 'border-rose-500/30 bg-rose-900/20 text-rose-300',
          )}
        >
          {value ? trueLabel : falseLabel}
        </div>
      </OracleCard>
    </TeamBackground>
  )
}

function getReplayTitle(
  entry: HistoryEntry,
  t: ReturnType<typeof useI18n>['t'],
): string {
  const action = entry.data.action as string | undefined
  const roleId = entry.data.roleId as string | undefined

  if (action === 'first_night_info') {
    return roleId === 'imp' ? t.game.demonInfo : t.game.minionInfo
  }
  if (
    action === 'kill' ||
    action === 'fang_gu_kill' ||
    action === 'vigormortis_kill' ||
    action === 'no_dashii_kill' ||
    action === 'vortox_kill' ||
    action === 'self_kill'
  ) {
    return t.game.stepChooseVictim
  }
  if (action === 'poison') return t.game.stepChooseTarget
  if (action === 'protect') return t.game.stepChoosePlayer
  if (action === 'choose_master') return t.game.stepChooseMaster
  if (action === 'view_grimoire') return t.game.stepViewGrimoire
  if (action === 'check') return t.game.stepSelectPlayers
  if (action === 'dreamer_info') return t.game.stepShowResult
  if (action === 'saw_role' || action === 'saw_executed') return t.game.stepShowRole
  return t.game.actionSummary
}

function ReplayEntry({
  entry,
}: {
  entry: HistoryEntry
}) {
  const { t, language } = useI18n()
  const action = entry.data.action as string | undefined
  const snapshotState = entry.stateAfter
  const viewer = getPlayer(snapshotState, entry.data.playerId as string)

  if (!viewer) return null

  if (action === 'first_night_info') {
    if (entry.data.roleId === 'imp') {
      const minionIds = Array.isArray(entry.data.minionIds)
        ? (entry.data.minionIds as string[])
        : []
      const bluffRoleIds = Array.isArray(entry.data.bluffRoleIds)
        ? (entry.data.bluffRoleIds as string[])
        : []

      return (
        <ReplaySection title={t.game.demonInfo}>
          {minionIds.length > 0 && (
            <div className='space-y-2'>
              <div className='text-sm text-parchment-400'>{t.game.stepShowMinions}</div>
              <ReplayPlayerChips state={snapshotState} ids={minionIds} />
            </div>
          )}
          {bluffRoleIds.length > 0 && (
            <div className='space-y-2'>
              <div className='text-sm text-parchment-400'>{t.game.stepShowBluffs}</div>
              <div className='grid grid-cols-1 gap-3'>
                {bluffRoleIds.map((roleId) => (
                  <div
                    key={roleId}
                    className='rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-3'
                  >
                    <RoleCard roleId={roleId} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </ReplaySection>
      )
    }

    return (
      <ReplaySection title={t.game.minionInfo}>
        <EvilTeamReveal
          state={snapshotState}
          viewer={viewer}
          viewerType='minion'
        />
      </ReplaySection>
    )
  }

  if (action === 'system_minion_info') {
    return (
      <ReplaySection title={t.game.minionInfo}>
        <EvilTeamReveal
          state={snapshotState}
          viewer={viewer}
          viewerType='minion'
        />
      </ReplaySection>
    )
  }

  if (action === 'system_demon_info') {
    return (
      <ReplaySection title={t.game.demonInfo}>
        <EvilTeamReveal
          state={snapshotState}
          viewer={viewer}
          viewerType='demon'
        />
      </ReplaySection>
    )
  }

  if (action === 'system_demon_bluffs') {
    const bluffRoleIds = Array.isArray(entry.data.bluffRoleIds)
      ? (entry.data.bluffRoleIds as string[])
      : []

    return (
      <ReplaySection title={t.game.stepShowBluffs}>
        <div className='grid grid-cols-1 gap-3'>
          {bluffRoleIds.map((bluffRoleId) => (
            <div
              key={bluffRoleId}
              className='rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-3'
            >
              <RoleCard roleId={bluffRoleId} />
            </div>
          ))}
        </div>
      </ReplaySection>
    )
  }

  if (action === 'view_grimoire') {
    return (
      <ReplaySection title={t.game.stepViewGrimoire}>
        <Grimoire state={snapshotState} compact />
      </ReplaySection>
    )
  }

  if (
    action === 'kill' ||
    action === 'fang_gu_kill' ||
    action === 'vigormortis_kill' ||
    action === 'no_dashii_kill' ||
    action === 'vortox_kill' ||
    action === 'poison' ||
    action === 'protect' ||
    action === 'witch_curse'
  ) {
    const targetId = (entry.data.targetId ??
      entry.data.masterId ??
      entry.data.cursedPlayerId) as string | undefined
    return (
      <ReplaySection title={getReplayTitle(entry, t)}>
        {targetId ? (
          <ReplayPlayerChips state={snapshotState} ids={[targetId]} />
        ) : (
          <div className='text-sm text-parchment-500'>{t.game.noActionRecorded}</div>
        )}
      </ReplaySection>
    )
  }

  if (action === 'self_kill') {
    return (
      <ReplaySection title={t.game.stepChooseVictim}>
        <ReplayPlayerChips state={snapshotState} ids={[viewer.id]} />
      </ReplaySection>
    )
  }

  if (action === 'check') {
    const checkedPlayers = Array.isArray(entry.data.checkedPlayers)
      ? (entry.data.checkedPlayers as string[])
      : []
    const result = entry.data.result === 'yes'
    return (
      <ReplaySection title={getReplayTitle(entry, t)}>
        <ReplayPlayerChips state={snapshotState} ids={checkedPlayers} />
        <ReplayBooleanCard
          icon='eye'
          title={t.game.stepShowResult}
          value={result}
          trueLabel='Yes'
          falseLabel='No'
        />
      </ReplaySection>
    )
  }

  if (
    action === 'count_evil_pairs' ||
    action === 'count_evil_neighbors' ||
    action === 'clockmaker_info' ||
    action === 'oracle_info' ||
    action === 'mathematician_info'
  ) {
    const value = Number(
      entry.data.evilPairs ??
        entry.data.evilNeighbors ??
        entry.data.distance ??
        entry.data.deadEvilCount ??
        entry.data.abnormalCount,
    )
    return (
      <ReplaySection title={getReplayTitle(entry, t)}>
        <NumberReveal value={value} label={t.game.stepShowResult} teamId='townsfolk' />
      </ReplaySection>
    )
  }

  if (
    action === 'flowergirl_info' ||
    action === 'town_crier_info' ||
    action === 'seamstress_info'
  ) {
    const value = Boolean(
      entry.data.demonVoted ??
        entry.data.minionNominated ??
        entry.data.sameAlignment,
    )
    const label =
      action === 'seamstress_info'
        ? t.game.stepShowResult
        : getReplayTitle(entry, t)

    return (
      <ReplaySection title={label}>
        {action === 'seamstress_info' &&
          Array.isArray(entry.data.selectedIds) && (
            <ReplayPlayerChips
              state={snapshotState}
              ids={entry.data.selectedIds as string[]}
            />
          )}
        <ReplayBooleanCard
          icon='sparkles'
          title={t.game.stepShowResult}
          value={value}
          trueLabel='Yes'
          falseLabel='No'
        />
      </ReplaySection>
    )
  }

  if (action === 'dreamer_info') {
    const targetId = entry.data.targetId as string | undefined
    const shownRoleIds = Array.isArray(entry.data.shownRoleIds)
      ? (entry.data.shownRoleIds as string[])
      : []
    return (
      <ReplaySection title={getReplayTitle(entry, t)}>
        {targetId && <ReplayPlayerChips state={snapshotState} ids={[targetId]} />}
        <div className='grid grid-cols-1 gap-3'>
          {shownRoleIds.map((roleId) => (
            <div key={roleId} className='rounded-xl border border-white/10 bg-white/5 p-3'>
              <RoleCard roleId={roleId} />
            </div>
          ))}
        </div>
      </ReplaySection>
    )
  }

  if (action === 'see_target') {
    const shownPlayers = Array.isArray(entry.data.shownPlayers)
      ? (entry.data.shownPlayers as string[])
      : []
    const shownRoleId = entry.data.shownRoleId as string | undefined

    return (
      <ReplaySection title={t.game.stepShowResult}>
        <div className='text-sm text-parchment-400'>{t.game.oneOfThemIsThe}</div>
        {shownPlayers.length > 0 && (
          <ReplayPlayerChips state={snapshotState} ids={shownPlayers} />
        )}
        {shownRoleId && (
          <div className='rounded-xl border border-white/10 bg-white/5 p-3'>
            <RoleCard roleId={shownRoleId} />
          </div>
        )}
      </ReplaySection>
    )
  }

  if (action === 'no_target') {
    return (
      <ReplaySection title={t.game.stepShowResult}>
        <div className='rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-parchment-200'>
          <RichMessageDisplay message={entry.message} state={snapshotState} />
        </div>
      </ReplaySection>
    )
  }

  if (action === 'saw_role' || action === 'saw_executed') {
    const targetId = (entry.data.targetId ?? entry.data.executedPlayerId) as
      | string
      | undefined
    const shownRoleId = (entry.data.shownRoleId ?? entry.data.executedRoleId) as
      | string
      | undefined
    return (
      <ReplaySection title={getReplayTitle(entry, t)}>
        {targetId && <ReplayPlayerChips state={snapshotState} ids={[targetId]} />}
        {shownRoleId && (
          <div className='rounded-xl border border-white/10 bg-white/5 p-3'>
            <RoleCard roleId={shownRoleId} />
          </div>
        )}
      </ReplaySection>
    )
  }

  if (action === 'philosopher_choice') {
    const chosenRoleId = entry.data.chosenRoleId as string | undefined
    const drunkTargetId = entry.data.drunkTargetId as string | undefined
    return (
      <ReplaySection title={t.game.stepChoosePlayer}>
        {chosenRoleId && (
          <div className='rounded-xl border border-white/10 bg-white/5 p-3'>
            <div className='text-sm text-parchment-400 mb-2'>{getRoleName(chosenRoleId, language)}</div>
            <RoleCard roleId={chosenRoleId} />
          </div>
        )}
        {drunkTargetId && (
          <>
            <MysticDivider />
            <ReplayPlayerChips state={snapshotState} ids={[drunkTargetId]} />
          </>
        )}
      </ReplaySection>
    )
  }

  if (action === 'cerenovus_madness') {
    const targetId = entry.data.targetId as string | undefined
    const madAsRoleId = entry.data.madAsRoleId as string | undefined
    return (
      <ReplaySection title={t.game.stepShowResult}>
        {targetId && <ReplayPlayerChips state={snapshotState} ids={[targetId]} />}
        {madAsRoleId && (
          <div className='rounded-xl border border-white/10 bg-white/5 p-3'>
            <div className='text-sm text-parchment-400 mb-2'>
              {t.game.showToPlayer}
            </div>
            <RoleCard roleId={madAsRoleId} />
          </div>
        )}
      </ReplaySection>
    )
  }

  if (action === 'pit_hag_change') {
    const targetId = entry.data.targetId as string | undefined
    const newRoleId = entry.data.newRoleId as string | undefined
    return (
      <ReplaySection title={t.game.stepChooseTarget}>
        {targetId && <ReplayPlayerChips state={snapshotState} ids={[targetId]} />}
        {newRoleId && (
          <div className='rounded-xl border border-white/10 bg-white/5 p-3'>
            <RoleCard roleId={newRoleId} />
          </div>
        )}
      </ReplaySection>
    )
  }

  if (action === 'snake_charmer_choice') {
    const targetId = entry.data.targetId as string | undefined
    const hitDemon = Boolean(entry.data.hitDemon)
    return (
      <ReplaySection title={t.game.stepChooseTarget}>
        {targetId ? (
          <ReplayPlayerChips state={snapshotState} ids={[targetId]} />
        ) : (
          <div className='text-sm text-parchment-500'>{t.game.noActionRecorded}</div>
        )}
        {hitDemon && (
          <div className='rounded-xl border border-rose-500/20 bg-rose-950/20 p-3 text-sm text-rose-200'>
            {t.game.yourRoleHasChanged}
          </div>
        )}
      </ReplaySection>
    )
  }

  if (action === 'role_change_revealed') {
    const currentRoleId = viewer.roleId
    return (
      <ReplaySection title={t.game.yourRoleHasChanged}>
        <div className='rounded-xl border border-white/10 bg-white/5 p-3'>
          <RoleCard roleId={currentRoleId} />
        </div>
      </ReplaySection>
    )
  }

  if (action === 'wait') {
    return (
      <ReplaySection title={t.game.actionSummary}>
        <div className='rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-parchment-200'>
          <RichMessageDisplay message={entry.message} state={snapshotState} />
        </div>
      </ReplaySection>
    )
  }

  if (action === 'choose_master') {
    const masterId = entry.data.masterId as string | undefined
    return (
      <ReplaySection title={getReplayTitle(entry, t)}>
        {masterId ? (
          <ReplayPlayerChips state={snapshotState} ids={[masterId]} />
        ) : (
          <div className='text-sm text-parchment-500'>{t.game.noActionRecorded}</div>
        )}
      </ReplaySection>
    )
  }

  return (
    <ReplaySection title={getReplayTitle(entry, t)}>
      <div className='rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-parchment-200'>
        <RichMessageDisplay message={entry.message} state={snapshotState} />
      </div>
    </ReplaySection>
  )
}

export function NightActionReplayScreen({
  game,
  state,
  playerId,
  roleId,
  systemStepId,
  onBack,
}: Props) {
  const { t } = useI18n()
  const player = getPlayer(state, playerId)
  const entries = getNightActionEntries(game, playerId, roleId, systemStepId)
  const fallbackMessages = getNightActionSummary(
    game,
    playerId,
    roleId,
    systemStepId,
  )

  const content = useMemo(() => {
    if (entries.length > 0) {
      return entries.map((entry, index) => (
        <ReplayEntry key={`${entry.id}-${index}`} entry={entry} />
      ))
    }

    return (
      <div className='space-y-3'>
        {fallbackMessages.length === 0 ? (
          <div className='rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-parchment-500'>
            {t.game.noActionRecorded}
          </div>
        ) : (
          fallbackMessages.map((message, index) => (
            <div
              key={index}
              className='rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-parchment-200'
            >
              <RichMessageDisplay message={message} state={state} />
            </div>
          ))
        )}
      </div>
    )
  }, [entries, fallbackMessages, state, t.game.noActionRecorded])

  if (!player) return null

  return (
    <NightActionLayout
      player={player}
      title={t.game.actionSummary}
      description={t.game.actionReplayDescription}
      audience='player_reveal'
    >
      <div className='space-y-3'>{content}</div>

      <ScreenFooter borderColor='border-indigo-500/30'>
        <Button onClick={onBack} fullWidth size='lg' variant='secondary'>
          <Icon name='arrowLeft' size='md' className='mr-2' />
          {t.common.back}
        </Button>
      </ScreenFooter>
    </NightActionLayout>
  )
}
