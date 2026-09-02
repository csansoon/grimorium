import { describe, expect, it } from 'vitest'

import {
  addAftermathHandler,
  addAbilityOverride,
  addModifier,
  appearsDeadToTown,
  breakMadness,
  countsAsAliveForWin,
  createAliveLifeState,
  createDeadLifeState,
  createAlignmentChangeIntent,
  createDayCastVoteIntent,
  createDayCloseVoteIntent,
  createDayLockNominationIntent,
  createDayOpenVoteIntent,
  createDayResolveExecutionIntent,
  createDayStartNominationIntent,
  applyRoleAbility,
  createEngineState,
  createInformationIntent,
  createLethalIntent,
  createRoleChangeIntent,
  createRoleSwapIntent,
  deliverInformation,
  getEngineNightQueue,
  getPlayer,
  hasEffectiveStatusEffect,
  hasStatusEffect,
  registerTriggerAction,
  recordTriggerEvent,
  resolveSpecialExecution,
  resolveEngineIntent,
  resolvePendingMadnessConsequence,
  resolveStorytellerChoice,
  runResolutionBundle,
  runLethalIntent,
  scheduleLethalIntent,
  startDay,
  setEnginePhase,
  setPlayerDrunkForPhases,
  setPlayerPoisonedForPhases,
  setPlayerNote,
  revivePlayer,
  type DefensiveModifier,
  type EnginePlayer,
  type ResolutionBundle,
} from '../engine-v2'
import { BUILTIN_SCRIPTS } from '../scripts'

function createPlayer(
  id: string,
  roleId: string,
  alignment: 'good' | 'evil' = 'good',
): EnginePlayer {
  return {
    id,
    name: id,
    roleId,
    alignment,
    life: createAliveLifeState(),
  }
}

function usageKey(playerId: string, abilityId: string): string {
  return `${playerId}:${abilityId}`
}

describe('engine-v2 lethal kernel', () => {
  it('kills a normal target when no defense applies', () => {
    const state = createEngineState([
      createPlayer('imp', 'imp', 'evil'),
      createPlayer('target', 'villager'),
    ])

    const result = runLethalIntent(
      state,
      createLethalIntent({
        kind: 'attack',
        sourcePlayerId: 'imp',
        targetPlayerId: 'target',
        cause: 'demon_attack',
        phase: 'other_night',
      }),
    )

    expect(result.resolved.outcome).toEqual({
      kind: 'dead',
      cause: 'demon_attack',
    })
    expect(result.state.lastResolutionTrace?.outcome.kind).toBe('dead')
    expect(getPlayer(result.state, 'target')?.life.projection.trueState).toBe('dead')
    expect(result.state.events.some((event) => event.type === 'player_died')).toBe(true)
  })

  it('prevents a demon attack through protection', () => {
    let state = createEngineState([
      createPlayer('imp', 'imp', 'evil'),
      createPlayer('monk', 'monk'),
      createPlayer('target', 'fortune_teller'),
    ])

    state = addModifier(state, {
      id: 'monk-protect',
      kind: 'attack_protection',
      sourcePlayerId: 'monk',
      targetPlayerId: 'target',
      reason: 'Monk protection is active.',
    })

    const result = runLethalIntent(
      state,
      createLethalIntent({
        kind: 'attack',
        sourcePlayerId: 'imp',
        targetPlayerId: 'target',
        cause: 'demon_attack',
        phase: 'other_night',
      }),
    )

    expect(result.resolved.outcome).toEqual({
      kind: 'prevented',
      reason: 'Monk protection is active.',
      byModifierIds: ['monk-protect'],
    })
    expect(getPlayer(result.state, 'target')?.life.projection.trueState).toBe('alive')
  })

  it('derives Tea Lady protection dynamically from the role registry', () => {
    const state = createEngineState([
      createPlayer('left', 'dreamer'),
      createPlayer('tea', 'tea_lady'),
      createPlayer('right', 'clockmaker'),
      createPlayer('demon', 'imp', 'evil'),
    ])

    const protectedLeft = runLethalIntent(
      state,
      createLethalIntent({
        kind: 'attack',
        sourcePlayerId: 'demon',
        targetPlayerId: 'left',
        cause: 'demon_attack',
        phase: 'other_night',
      }),
    )

    expect(protectedLeft.resolved.outcome).toEqual({
      kind: 'prevented',
      reason: 'Tea Lady protection is active while both alive neighbors are good.',
      byModifierIds: ['tea_lady:tea:left:attack_protection'],
    })

    const protectedRight = runLethalIntent(
      state,
      createLethalIntent({
        kind: 'execute',
        sourcePlayerId: 'demon',
        targetPlayerId: 'right',
        cause: 'execution',
        phase: 'execution',
      }),
    )

    expect(protectedRight.resolved.outcome).toEqual({
      kind: 'prevented',
      reason: 'Tea Lady protection is active while both alive neighbors are good.',
      byModifierIds: ['tea_lady:tea:right:execution_protection'],
    })
  })

  it('drops Tea Lady protection immediately if Tea Lady is poisoned', () => {
    const poisoned = setPlayerPoisonedForPhases(
      createEngineState([
        createPlayer('left', 'dreamer'),
        createPlayer('tea', 'tea_lady'),
        createPlayer('right', 'clockmaker'),
        createPlayer('demon', 'imp', 'evil'),
      ]),
      {
        targetPlayerId: 'tea',
        sourcePlayerId: 'demon',
        sourceRoleId: 'poisoner',
        reason: 'Tea Lady is poisoned.',
        startPhase: 'other_night',
        endPhase: 'dawn',
      },
    )

    const result = runLethalIntent(
      poisoned,
      createLethalIntent({
        kind: 'attack',
        sourcePlayerId: 'demon',
        targetPlayerId: 'left',
        cause: 'demon_attack',
        phase: 'other_night',
      }),
    )

    expect(result.resolved.outcome).toEqual({
      kind: 'dead',
      cause: 'demon_attack',
    })
  })

  it('registers Monk protection through the role registry and clears it at dawn', () => {
    const state = applyRoleAbility(
      createEngineState([
        createPlayer('monk', 'monk'),
        createPlayer('target', 'dreamer'),
        createPlayer('demon', 'imp', 'evil'),
      ], 'other_night'),
      'monk',
      {
        kind: 'protect',
        targetPlayerId: 'target',
      },
    )

    const protectedResult = runLethalIntent(
      state,
      createLethalIntent({
        kind: 'attack',
        sourcePlayerId: 'demon',
        targetPlayerId: 'target',
        cause: 'demon_attack',
        phase: 'other_night',
      }),
    )

    expect(protectedResult.resolved.outcome).toEqual({
      kind: 'prevented',
      reason: 'Monk protection is active until dawn.',
      byModifierIds: ['monk:monk:target:1'],
    })
    expect(state.abilityUsage[usageKey('monk', 'protect')]).toEqual({
      useCount: 1,
      lastUsedNightSequence: 0,
    })

    const dawnState = setEnginePhase(protectedResult.state, 'dawn')
    expect(
      dawnState.activeModifiers.some((modifier) => modifier.id === 'monk:monk:target:1'),
    ).toBe(false)
  })

  it('allows Monk only once per night and resets on the next night', () => {
    const nightState = createEngineState([
      createPlayer('monk', 'monk'),
      createPlayer('target_a', 'dreamer'),
      createPlayer('target_b', 'clockmaker'),
    ], 'other_night')

    const first = applyRoleAbility(nightState, 'monk', {
      kind: 'protect',
      targetPlayerId: 'target_a',
    })
    const secondSameNight = applyRoleAbility(first, 'monk', {
      kind: 'protect',
      targetPlayerId: 'target_b',
    })

    expect(secondSameNight).toEqual(first)

    const nextNight = setEnginePhase(setEnginePhase(first, 'day'), 'other_night')
    const secondNightUse = applyRoleAbility(nextNight, 'monk', {
      kind: 'protect',
      targetPlayerId: 'target_b',
    })

    expect(secondNightUse.activeModifiers.some((modifier) => modifier.targetPlayerId === 'target_b')).toBe(true)
    expect(secondNightUse.abilityUsage[usageKey('monk', 'protect')]).toEqual({
      useCount: 2,
      lastUsedNightSequence: 1,
    })
  })

  it('has poisoned Monk fail closed while still spending the nightly use', () => {
    const poisonedState = setPlayerPoisonedForPhases(
      createEngineState([
        createPlayer('monk', 'monk'),
        createPlayer('target', 'dreamer'),
        createPlayer('demon', 'imp', 'evil'),
      ], 'other_night'),
      {
        targetPlayerId: 'monk',
        sourcePlayerId: 'demon',
        sourceRoleId: 'poisoner',
        reason: 'Monk is poisoned.',
        startPhase: 'other_night',
        endPhase: 'dawn',
      },
    )

    const attempted = applyRoleAbility(poisonedState, 'monk', {
      kind: 'protect',
      targetPlayerId: 'target',
    })

    expect(attempted.activeModifiers).toHaveLength(0)
    expect(attempted.triggerRegistrations).toHaveLength(0)
    expect(attempted.abilityUsage[usageKey('monk', 'protect')]).toEqual({
      useCount: 1,
      lastUsedNightSequence: 0,
    })
  })

  it('registers Witch curse through the role registry and kills on nomination trigger', () => {
    const state = applyRoleAbility(
      createEngineState([
        createPlayer('witch', 'witch', 'evil'),
        createPlayer('target', 'dreamer'),
      ], 'other_night'),
      'witch',
      {
        kind: 'curse',
        targetPlayerId: 'target',
      },
    )

    expect(state.triggerRegistrations).toHaveLength(1)
    expect(state.triggerRegistrations[0]).toMatchObject({
      consumeWhen: 'on_fire',
      expiresAt: {
        mode: 'phase',
        phase: 'other_night',
      },
    })
    expect(state.abilityUsage[usageKey('witch', 'curse')]).toEqual({
      useCount: 1,
      lastUsedNightSequence: 0,
    })

    const resolved = recordTriggerEvent(state, {
      type: 'nomination_started',
      playerId: 'target',
    })

    expect(getPlayer(resolved, 'target')?.life.projection.trueState).toBe('dead')
    expect(resolved.triggerRegistrations).toHaveLength(0)
  })

  it('allows Witch only once per night and resets on the next night', () => {
    const nightState = createEngineState([
      createPlayer('witch', 'witch', 'evil'),
      createPlayer('a', 'dreamer'),
      createPlayer('b', 'clockmaker'),
    ], 'other_night')

    const first = applyRoleAbility(nightState, 'witch', {
      kind: 'curse',
      targetPlayerId: 'a',
    })
    const secondSameNight = applyRoleAbility(first, 'witch', {
      kind: 'curse',
      targetPlayerId: 'b',
    })

    expect(secondSameNight).toEqual(first)

    const nextNight = setEnginePhase(setEnginePhase(first, 'day'), 'other_night')
    const secondNightUse = applyRoleAbility(nextNight, 'witch', {
      kind: 'curse',
      targetPlayerId: 'b',
    })

    expect(secondNightUse.triggerRegistrations).toHaveLength(1)
    expect(secondNightUse.triggerRegistrations[0]?.trigger).toMatchObject({
      mode: 'event',
      trigger: 'nomination_started',
      playerId: 'b',
    })
    expect(secondNightUse.abilityUsage[usageKey('witch', 'curse')]).toEqual({
      useCount: 2,
      lastUsedNightSequence: 1,
    })
  })

  it('blocks active abilities for dead players by default', () => {
    const deadWitchState = createEngineState([
      {
        ...createPlayer('witch', 'witch', 'evil'),
        life: createDeadLifeState(1),
      },
      createPlayer('target', 'dreamer'),
    ], 'other_night')

    const result = applyRoleAbility(deadWitchState, 'witch', {
      kind: 'curse',
      targetPlayerId: 'target',
    })

    expect(result).toEqual(deadWitchState)
  })

  it('allows a dead player to use an active ability when granted a dead-use override', () => {
    const deadWitchState = addAbilityOverride(
      createEngineState([
        {
          ...createPlayer('witch', 'witch', 'evil'),
          life: createDeadLifeState(1),
        },
        createPlayer('target', 'dreamer'),
      ], 'other_night'),
      {
        id: 'vigormortis-dead-minion',
        playerId: 'witch',
        abilityId: 'curse',
        allowWhileDead: true,
        sourceRoleId: 'vigormortis',
        reason: 'Dead minion keeps ability.',
      },
    )

    const result = applyRoleAbility(deadWitchState, 'witch', {
      kind: 'curse',
      targetPlayerId: 'target',
    })

    expect(result.triggerRegistrations).toHaveLength(1)
    expect(result.triggerRegistrations[0]?.trigger).toMatchObject({
      mode: 'event',
      trigger: 'nomination_started',
      playerId: 'target',
    })
    expect(result.abilityUsage[usageKey('witch', 'curse')]).toEqual({
      useCount: 1,
      lastUsedNightSequence: 0,
    })
  })

  it('suppresses an active ability even if the player would otherwise be allowed to use it', () => {
    const suppressedState = addAbilityOverride(
      createEngineState([
        createPlayer('witch', 'witch', 'evil'),
        createPlayer('target', 'dreamer'),
      ], 'other_night'),
      {
        id: 'ability-suppressed',
        playerId: 'witch',
        abilityId: 'curse',
        suppress: true,
        reason: 'Ability disabled by external effect.',
      },
    )

    const result = applyRoleAbility(suppressedState, 'witch', {
      kind: 'curse',
      targetPlayerId: 'target',
    })

    expect(result).toEqual(suppressedState)
  })

  it('lets a Vigormortis-killed minion keep using their active ability while Vigormortis lives', () => {
    const killedMinionState = applyRoleAbility(
      createEngineState([
        createPlayer('vig', 'vigormortis', 'evil'),
        createPlayer('target', 'dreamer'),
        createPlayer('witch', 'witch', 'evil'),
        createPlayer('town', 'clockmaker'),
      ], 'other_night'),
      'vig',
      {
        kind: 'kill',
        targetPlayerId: 'witch',
      },
    )

    expect(getPlayer(killedMinionState, 'witch')?.life.projection.trueState).toBe('dead')

    const minionActsWhileDead = applyRoleAbility(killedMinionState, 'witch', {
      kind: 'curse',
      targetPlayerId: 'target',
    })

    expect(
      minionActsWhileDead.triggerRegistrations.some(
        (registration) =>
          registration.label === 'Witch curse on target' &&
          registration.trigger.mode === 'event' &&
          registration.trigger.trigger === 'nomination_started' &&
          registration.trigger.playerId === 'target',
      ),
    ).toBe(true)
    expect(minionActsWhileDead.abilityUsage[usageKey('witch', 'curse')]).toEqual({
      useCount: 1,
      lastUsedNightSequence: 0,
    })
  })

  it('removes the Vigormortis dead-use grant and poison when Vigormortis dies', () => {
    const base = applyRoleAbility(
      createEngineState([
        createPlayer('vig', 'vigormortis', 'evil'),
        createPlayer('left_town', 'dreamer'),
        createPlayer('witch', 'witch', 'evil'),
        createPlayer('right_minion', 'assassin', 'evil'),
        createPlayer('right_town', 'clockmaker'),
      ], 'other_night'),
      'vig',
      {
        kind: 'kill',
        targetPlayerId: 'witch',
      },
    )

    expect(hasEffectiveStatusEffect(base, 'left_town', 'poisoned')).toBe(true)
    expect(hasEffectiveStatusEffect(base, 'right_town', 'poisoned')).toBe(false)

    const vigDead = runLethalIntent(
      base,
      createLethalIntent({
        kind: 'execute',
        sourcePlayerId: 'storyteller',
        targetPlayerId: 'vig',
        cause: 'execution',
        phase: 'execution',
        bypasses: ['all_defense'],
      }),
    ).state

    expect(hasEffectiveStatusEffect(vigDead, 'left_town', 'poisoned')).toBe(false)

    const deadMinionBlocked = applyRoleAbility(vigDead, 'witch', {
      kind: 'curse',
      targetPlayerId: 'left_town',
    })

    expect(deadMinionBlocked).toEqual(vigDead)
  })

  it('allows Vigormortis to pin poison to a chosen tied Townsfolk neighbor', () => {
    const state = applyRoleAbility(
      createEngineState([
        createPlayer('left_town', 'dreamer'),
        createPlayer('witch', 'witch', 'evil'),
        createPlayer('right_town', 'clockmaker'),
        createPlayer('vig', 'vigormortis', 'evil'),
      ], 'other_night'),
      'vig',
      {
        kind: 'kill',
        targetPlayerId: 'witch',
        chosenNeighborId: 'right_town',
      },
    )

    expect(hasEffectiveStatusEffect(state, 'right_town', 'poisoned')).toBe(true)
    expect(hasEffectiveStatusEffect(state, 'left_town', 'poisoned')).toBe(false)
  })

  it('notifies the Storyteller when Vigormortis auto-poisons a unique nearest Townsfolk neighbor', () => {
    const state = applyRoleAbility(
      createEngineState([
        createPlayer('vig', 'vigormortis', 'evil'),
        createPlayer('target', 'dreamer'),
        createPlayer('witch', 'witch', 'evil'),
        createPlayer('spacer', 'assassin', 'evil'),
      ], 'other_night'),
      'vig',
      {
        kind: 'kill',
        targetPlayerId: 'witch',
      },
    )

    expect(hasEffectiveStatusEffect(state, 'target', 'poisoned')).toBe(true)
    expect(state.pendingStorytellerChoices).toHaveLength(0)
    expect(state.storytellerNotices).toHaveLength(1)
    expect(state.storytellerNotices[0]).toMatchObject({
      title: 'Nearest neighbor poisoned',
      playerIds: ['witch', 'target'],
      sourcePlayerId: 'vig',
      sourceRoleId: 'vigormortis',
    })
  })

  it('asks the Storyteller to choose when Vigormortis has tied nearest Townsfolk neighbors', () => {
    const tiedState = applyRoleAbility(
      createEngineState([
        createPlayer('left_town', 'dreamer'),
        createPlayer('witch', 'witch', 'evil'),
        createPlayer('right_town', 'clockmaker'),
        createPlayer('vig', 'vigormortis', 'evil'),
      ], 'other_night'),
      'vig',
      {
        kind: 'kill',
        targetPlayerId: 'witch',
      },
    )

    expect(hasEffectiveStatusEffect(tiedState, 'left_town', 'poisoned')).toBe(false)
    expect(hasEffectiveStatusEffect(tiedState, 'right_town', 'poisoned')).toBe(false)
    expect(tiedState.storytellerNotices).toHaveLength(0)
    expect(tiedState.pendingStorytellerChoices).toHaveLength(1)
    expect(tiedState.pendingStorytellerChoices[0]).toMatchObject({
      resolutionMode: 'choice_required',
      kind: 'player_selection',
      candidatePlayerIds: ['left_town', 'right_town'],
    })

    const resolvedState = resolveStorytellerChoice(
      tiedState,
      tiedState.pendingStorytellerChoices[0].id,
      'right_town',
    )

    expect(resolvedState.pendingStorytellerChoices).toHaveLength(0)
    expect(hasEffectiveStatusEffect(resolvedState, 'right_town', 'poisoned')).toBe(true)
    expect(hasEffectiveStatusEffect(resolvedState, 'left_town', 'poisoned')).toBe(false)
  })

  it('prompts the Storyteller to choose a drunk player when Sweetheart dies', () => {
    const state = runLethalIntent(
      createEngineState([
        createPlayer('sweetheart', 'sweetheart'),
        createPlayer('target_a', 'dreamer'),
        createPlayer('target_b', 'clockmaker'),
      ], 'other_night'),
      createLethalIntent({
        kind: 'kill',
        sourcePlayerId: 'imp',
        targetPlayerId: 'sweetheart',
        cause: 'demon_attack',
        phase: 'other_night',
      }),
    ).state

    expect(state.pendingStorytellerChoices).toHaveLength(1)
    expect(state.pendingStorytellerChoices[0]).toMatchObject({
      resolutionMode: 'storyteller_arbitrary',
      kind: 'player_selection',
      sourcePlayerId: 'sweetheart',
      sourceRoleId: 'sweetheart',
      candidatePlayerIds: ['sweetheart', 'target_a', 'target_b'],
    })

    const resolvedState = resolveStorytellerChoice(
      state,
      state.pendingStorytellerChoices[0].id,
      'target_b',
    )

    expect(resolvedState.pendingStorytellerChoices).toHaveLength(0)
    expect(hasStatusEffect(resolvedState, 'target_b', 'drunk')).toBe(true)
    expect(hasStatusEffect(resolvedState, 'target_a', 'drunk')).toBe(false)
  })

  it('lets Fool survive the first death through the role registry, then die on the second', () => {
    const state = createEngineState([
      createPlayer('imp', 'imp', 'evil'),
      createPlayer('fool', 'fool'),
    ])

    const first = runLethalIntent(
      state,
      createLethalIntent({
        kind: 'attack',
        sourcePlayerId: 'imp',
        targetPlayerId: 'fool',
        cause: 'demon_attack',
        phase: 'other_night',
      }),
    )

    expect(first.resolved.outcome).toEqual({
      kind: 'survived',
      reason: 'Fool survives the first time they would die.',
      byModifierIds: ['fool:fool:first-life'],
    })
    expect(getPlayer(first.state, 'fool')?.life.projection.trueState).toBe('alive')
    expect(getPlayer(first.state, 'fool')?.life.deathCount).toBe(0)

    const second = runLethalIntent(
      first.state,
      createLethalIntent({
        kind: 'attack',
        sourcePlayerId: 'imp',
        targetPlayerId: 'fool',
        cause: 'demon_attack',
        phase: 'other_night',
      }),
    )

    expect(second.resolved.outcome).toEqual({
      kind: 'dead',
      cause: 'demon_attack',
    })
    expect(getPlayer(second.state, 'fool')?.life.projection.trueState).toBe('dead')
  })

  it('turns Zombuul into a public death first, then allows a later real death', () => {
    const state = createEngineState([
      createPlayer('zombuul', 'zombuul', 'evil'),
      createPlayer('executioner', 'storyteller'),
    ])

    const first = runLethalIntent(
      state,
      createLethalIntent({
        kind: 'execute',
        sourcePlayerId: 'executioner',
        targetPlayerId: 'zombuul',
        cause: 'execution',
        phase: 'execution',
        reason: 'Zombuul first death',
      }),
    )

    expect(first.resolved.outcome).toEqual({
      kind: 'publicly_dead_but_alive',
      reason: 'Zombuul appears dead the first time they would die, but remains alive.',
      byModifierIds: ['zombuul:zombuul:first-public-death'],
    })
    expect(getPlayer(first.state, 'zombuul')?.life.kind).toBe('undead_hidden')
    expect(appearsDeadToTown(getPlayer(first.state, 'zombuul') as EnginePlayer)).toBe(true)
    expect(countsAsAliveForWin(getPlayer(first.state, 'zombuul') as EnginePlayer)).toBe(true)

    const second = runLethalIntent(
      first.state,
      createLethalIntent({
        kind: 'execute',
        sourcePlayerId: 'executioner',
        targetPlayerId: 'zombuul',
        cause: 'execution',
        phase: 'execution',
      }),
    )

    expect(second.resolved.outcome).toEqual({
      kind: 'dead',
      cause: 'execution',
    })
    expect(getPlayer(second.state, 'zombuul')?.life.projection.trueState).toBe('dead')
  })

  it('prevents Lleech death while the host lives, then allows death after the host dies', () => {
    const state = applyRoleAbility(
      createEngineState([
        createPlayer('lleech', 'lleech', 'evil'),
        createPlayer('host', 'dreamer'),
        createPlayer('executioner', 'storyteller'),
      ]),
      'lleech',
      {
        kind: 'bind_host',
        targetPlayerId: 'host',
      },
    )

    const blocked = runLethalIntent(
      state,
      createLethalIntent({
        kind: 'execute',
        sourcePlayerId: 'executioner',
        targetPlayerId: 'lleech',
        cause: 'execution',
        phase: 'execution',
      }),
    )

    expect(blocked.resolved.outcome).toEqual({
      kind: 'prevented',
      reason: 'The Lleech cannot die while its host lives.',
      byModifierIds: ['lleech:lleech:host-lock'],
    })
    expect(getPlayer(blocked.state, 'lleech')?.life.projection.trueState).toBe('alive')

    const hostDead = runLethalIntent(
      blocked.state,
      createLethalIntent({
        kind: 'execute',
        sourcePlayerId: 'executioner',
        targetPlayerId: 'host',
        cause: 'execution',
        phase: 'execution',
      }),
    )

    const released = runLethalIntent(
      hostDead.state,
      createLethalIntent({
        kind: 'execute',
        sourcePlayerId: 'executioner',
        targetPlayerId: 'lleech',
        cause: 'execution',
        phase: 'execution',
      }),
    )

    expect(released.resolved.outcome).toEqual({
      kind: 'dead',
      cause: 'execution',
    })
    expect(getPlayer(released.state, 'lleech')?.life.projection.trueState).toBe('dead')
  })

  it('allows direct-kill style intents to bypass protection', () => {
    let state = createEngineState([
      createPlayer('assassin', 'assassin', 'evil'),
      createPlayer('tea_lady', 'tea_lady'),
      createPlayer('neighbor', 'dreamer'),
      createPlayer('other_neighbor', 'clockmaker'),
    ])

    state = addModifier(state, {
      id: 'tea-lady-protect',
      kind: 'attack_protection',
      sourcePlayerId: 'tea_lady',
      targetPlayerId: 'neighbor',
      reason: 'Tea Lady protection is active.',
      appliesWhen: ({ state: currentState }) => {
        const teaLady = getPlayer(currentState, 'tea_lady')
        const left = getPlayer(currentState, 'neighbor')
        const right = getPlayer(currentState, 'other_neighbor')
        return (
          teaLady?.alignment === 'good' &&
          left?.alignment === 'good' &&
          right?.alignment === 'good'
        )
      },
    })

    const result = runLethalIntent(
      state,
      createLethalIntent({
        kind: 'attack',
        sourcePlayerId: 'assassin',
        targetPlayerId: 'neighbor',
        cause: 'role_ability',
        phase: 'day',
        bypasses: ['attack_protection'],
      }),
    )

    expect(result.resolved.applicableDefenses).toHaveLength(1)
    expect(result.resolved.applicableDefenses[0]).toMatchObject({
      bypassed: true,
      modifier: { id: 'tea-lady-protect' },
    })
    expect(result.resolved.outcome).toEqual({
      kind: 'dead',
      cause: 'role_ability',
    })
  })

  it('lets Assassin bypass all death prevention through the role registry', () => {
    const state = createEngineState([
      createPlayer('neighbor', 'fool'),
      createPlayer('tea', 'tea_lady'),
      createPlayer('other_neighbor', 'clockmaker'),
      createPlayer('assassin', 'assassin', 'evil'),
    ])

    const result = applyRoleAbility(state, 'assassin', {
      kind: 'assassinate',
      targetPlayerId: 'neighbor',
    })

    expect(getPlayer(result, 'neighbor')?.life.projection.trueState).toBe('dead')
    expect(result.abilityUsage[usageKey('assassin', 'assassinate')]).toEqual({
      useCount: 1,
      lastUsedNightSequence: 0,
    })
    expect(result.lastResolutionTrace?.outcome).toEqual({
      kind: 'dead',
      cause: 'role_ability',
    })
    expect(
      result.lastResolutionTrace?.defenses.map((entry) => ({
        id: entry.modifier.id,
        bypassed: entry.bypassed,
      })),
    ).toEqual([
      {
        id: 'tea_lady:tea:neighbor:attack_protection',
        bypassed: true,
      },
      {
        id: 'fool:neighbor:first-life',
        bypassed: true,
      },
    ])
  })

  it('supports grouped bypass of protection while still allowing survival defenses', () => {
    const state = createEngineState([
      createPlayer('neighbor', 'fool'),
      createPlayer('tea', 'tea_lady'),
      createPlayer('other_neighbor', 'clockmaker'),
      createPlayer('imp', 'imp', 'evil'),
    ])

    const result = runLethalIntent(
      state,
      createLethalIntent({
        kind: 'attack',
        sourcePlayerId: 'imp',
        targetPlayerId: 'neighbor',
        cause: 'demon_attack',
        phase: 'other_night',
        bypasses: ['all_protection'],
      }),
    )

    expect(result.resolved.outcome).toEqual({
      kind: 'survived',
      reason: 'Fool survives the first time they would die.',
      byModifierIds: ['fool:neighbor:first-life'],
    })
    expect(
      result.resolved.applicableDefenses.map((entry) => ({
        id: entry.modifier.id,
        bypassed: entry.bypassed,
      })),
    ).toEqual([
      {
        id: 'tea_lady:tea:neighbor:attack_protection',
        bypassed: true,
      },
      {
        id: 'fool:neighbor:first-life',
        bypassed: false,
      },
    ])
  })

  it('runs aftermath hooks after commit', () => {
    let state = createEngineState([
      createPlayer('imp', 'imp', 'evil'),
      createPlayer('target', 'sweetheart'),
      createPlayer('next', 'dreamer'),
    ])

    state = addAftermathHandler(state, (currentState, event) => {
      if (event.type !== 'player_died' || event.intent.targetPlayerId !== 'target') {
        return currentState
      }

      return addModifier(currentState, {
        id: 'sweetheart-drunk',
        kind: 'survival_charge',
        targetPlayerId: 'next',
        charges: 1,
        reason: 'Placeholder follow-up to prove aftermath hooks run.',
      } satisfies DefensiveModifier)
    })

    const result = runLethalIntent(
      state,
      createLethalIntent({
        kind: 'attack',
        sourcePlayerId: 'imp',
        targetPlayerId: 'target',
        cause: 'demon_attack',
        phase: 'other_night',
      }),
    )

    expect(result.state.activeModifiers.some((modifier) => modifier.id === 'sweetheart-drunk')).toBe(true)
  })

  it('releases a delayed lethal intent when the scheduled phase starts', () => {
    const state = scheduleLethalIntent(
      createEngineState([
        createPlayer('pukka', 'pukka', 'evil'),
        createPlayer('target', 'dreamer'),
      ]),
      {
        intent: createLethalIntent({
          kind: 'kill',
          sourcePlayerId: 'pukka',
          targetPlayerId: 'target',
          cause: 'role_ability',
          phase: 'other_night',
          reason: 'Delayed poison death',
        }),
        scheduledFor: {
          mode: 'phase',
          phase: 'dawn',
        },
      },
    )

    const released = setEnginePhase(state, 'dawn')

    expect(released.scheduledIntents).toHaveLength(0)
    expect(getPlayer(released, 'target')?.life.projection.trueState).toBe('dead')
    expect(
      released.events.some((event) => event.type === 'scheduled_intent_released'),
    ).toBe(true)
  })

  it('releases a trigger-based lethal intent for the matching player only', () => {
    const state = scheduleLethalIntent(
      createEngineState([
        createPlayer('witch', 'witch', 'evil'),
        createPlayer('cursed', 'oracle'),
        createPlayer('safe', 'dreamer'),
      ]),
      {
        intent: createLethalIntent({
          kind: 'kill',
          sourcePlayerId: 'witch',
          targetPlayerId: 'cursed',
          cause: 'curse',
          phase: 'day',
          reason: 'Witch curse resolves on nomination',
        }),
        scheduledFor: {
          mode: 'trigger',
          trigger: 'nomination_started',
          playerId: 'cursed',
        },
      },
    )

    const wrongPlayer = recordTriggerEvent(state, {
      type: 'nomination_started',
      playerId: 'safe',
    })

    expect(getPlayer(wrongPlayer, 'cursed')?.life.projection.trueState).toBe('alive')
    expect(wrongPlayer.scheduledIntents).toHaveLength(1)

    const matched = recordTriggerEvent(wrongPlayer, {
      type: 'nomination_started',
      playerId: 'cursed',
    })

    expect(getPlayer(matched, 'cursed')?.life.projection.trueState).toBe('dead')
    expect(matched.scheduledIntents).toHaveLength(0)
  })

  it('supports publicly dead but mechanically alive outcomes for zombuul-class behavior', () => {
    const result = runLethalIntent(
      createEngineState([
        createPlayer('zombuul', 'zombuul', 'evil'),
        createPlayer('executioner', 'storyteller'),
      ]),
      createLethalIntent({
        kind: 'execute',
        sourcePlayerId: 'executioner',
        targetPlayerId: 'zombuul',
        cause: 'execution',
        phase: 'execution',
        reason: 'Zombuul public death test',
        tags: ['public_death_only'],
      }),
    )

    const zombuul = getPlayer(result.state, 'zombuul')
    expect(result.resolved.outcome).toEqual({
      kind: 'publicly_dead_but_alive',
      reason: 'Zombuul public death test',
      byModifierIds: [],
    })
    expect(zombuul?.life.kind).toBe('undead_hidden')
    expect(appearsDeadToTown(zombuul as EnginePlayer)).toBe(true)
    expect(countsAsAliveForWin(zombuul as EnginePlayer)).toBe(true)
    expect(zombuul?.life.projection.trueState).toBe('alive')
  })

  it('applies timed poison immediately when the start phase is current and expires later', () => {
    const poisoned = setPlayerPoisonedForPhases(
      createEngineState([
        createPlayer('poisoner', 'poisoner', 'evil'),
        createPlayer('target', 'dreamer'),
      ]),
      {
        targetPlayerId: 'target',
        sourcePlayerId: 'poisoner',
        sourceRoleId: 'poisoner',
        reason: 'Poison through dawn',
        startPhase: 'other_night',
        endPhase: 'dawn',
      },
    )

    expect(hasStatusEffect(poisoned, 'target', 'poisoned')).toBe(true)
    expect(poisoned.activeTimedEffects).toHaveLength(1)

    const expired = setEnginePhase(poisoned, 'dawn')
    expect(hasStatusEffect(expired, 'target', 'poisoned')).toBe(false)
  })

  it('applies timed drunk immediately when the start phase is current and expires on a later phase', () => {
    const drunk = setPlayerDrunkForPhases(
      createEngineState([
        createPlayer('courtier', 'courtier'),
        createPlayer('target', 'town_caller'),
      ]),
      {
        targetPlayerId: 'target',
        sourceRoleId: 'courtier',
        reason: 'Drunk through day',
        startPhase: 'other_night',
        endPhase: 'day',
      },
    )

    expect(hasStatusEffect(drunk, 'target', 'drunk')).toBe(true)

    const stillActive = setEnginePhase(drunk, 'dawn')
    expect(hasStatusEffect(stillActive, 'target', 'drunk')).toBe(true)

    const expired = setEnginePhase(stillActive, 'day')
    expect(hasStatusEffect(expired, 'target', 'drunk')).toBe(false)
  })

  it('fires generic non-lethal trigger registrations and sets notes', () => {
    const state = registerTriggerAction(
      createEngineState([
        createPlayer('sweetheart', 'sweetheart'),
        createPlayer('target', 'dreamer'),
      ]),
      {
        once: true,
        label: 'mark target on day end',
        trigger: {
          mode: 'event',
          trigger: 'day_ended',
        },
        action: {
          kind: 'set_note',
          playerId: 'target',
          key: 'markedByTrigger',
          value: 'yes',
        },
      },
    )

    const fired = recordTriggerEvent(state, {
      type: 'day_ended',
    })

    expect(getPlayer(fired, 'target')?.notes?.markedByTrigger).toBe('yes')
    expect(fired.triggerRegistrations).toHaveLength(0)
  })

  it('fires generic non-lethal trigger registrations and applies status effects', () => {
    const state = registerTriggerAction(
      createEngineState([
        createPlayer('sweetheart', 'sweetheart'),
        createPlayer('target', 'dreamer'),
      ]),
      {
        once: true,
        label: 'drunk target on day end',
        trigger: {
          mode: 'event',
          trigger: 'day_ended',
        },
        action: {
          kind: 'apply_status_effect',
          effect: {
            id: 'trigger-drunk',
            type: 'drunk',
            targetPlayerId: 'target',
            sourceRoleId: 'sweetheart',
          },
          expiresAt: {
            mode: 'phase',
            phase: 'dawn',
          },
        },
      },
    )

    const fired = recordTriggerEvent(state, {
      type: 'day_ended',
    })

    expect(hasStatusEffect(fired, 'target', 'drunk')).toBe(true)
  })

  it('expires trigger registrations automatically when their expiry boundary is reached', () => {
    const cursed = applyRoleAbility(
      createEngineState([
        createPlayer('witch', 'witch', 'evil'),
        createPlayer('target', 'dreamer'),
      ], 'other_night'),
      'witch',
      {
        kind: 'curse',
        targetPlayerId: 'target',
      },
    )

    expect(cursed.triggerRegistrations).toHaveLength(1)

    const expired = setEnginePhase(setEnginePhase(cursed, 'day'), 'other_night')

    expect(expired.triggerRegistrations).toHaveLength(0)
    expect(
      expired.events.some((event) => event.type === 'trigger_registration_expired'),
    ).toBe(true)
    expect(getPlayer(expired, 'target')?.life.projection.trueState).toBe('alive')
  })

  it('revives a dead player back to a fully alive public state', () => {
    const deadState = runLethalIntent(
      createEngineState([
        createPlayer('imp', 'imp', 'evil'),
        createPlayer('target', 'dreamer'),
      ]),
      createLethalIntent({
        kind: 'attack',
        sourcePlayerId: 'imp',
        targetPlayerId: 'target',
        cause: 'demon_attack',
        phase: 'other_night',
      }),
    ).state

    const revived = revivePlayer(deadState, {
      targetPlayerId: 'target',
      sourceRoleId: 'professor',
      reason: 'Professor revival',
    })

    const target = getPlayer(revived, 'target')
    expect(target?.life.kind).toBe('alive')
    expect(target?.life.projection.trueState).toBe('alive')
    expect(target?.life.projection.publicState).toBe('alive')
    expect(target?.life.deathCount).toBe(1)
    expect(
      revived.events.some(
        (event) =>
          event.type === 'player_revived' &&
          event.playerId === 'target' &&
          event.sourceRoleId === 'professor',
      ),
    ).toBe(true)
  })

  it('lets Professor revive a dead non-demon once through the role registry', () => {
    const deadState = runLethalIntent(
      createEngineState([
        createPlayer('professor', 'professor'),
        createPlayer('imp', 'imp', 'evil'),
        createPlayer('target', 'dreamer'),
      ]),
      createLethalIntent({
        kind: 'attack',
        sourcePlayerId: 'imp',
        targetPlayerId: 'target',
        cause: 'demon_attack',
        phase: 'other_night',
      }),
    ).state

    const revived = applyRoleAbility(deadState, 'professor', {
      kind: 'revive',
      targetPlayerId: 'target',
    })

    expect(getPlayer(revived, 'target')?.life.projection.trueState).toBe('alive')
    expect(getPlayer(revived, 'target')?.life.projection.publicState).toBe('alive')
    expect(revived.abilityUsage[usageKey('professor', 'revive')]).toEqual({
      useCount: 1,
      lastUsedNightSequence: 0,
    })

    const secondAttempt = applyRoleAbility(revived, 'professor', {
      kind: 'revive',
      targetPlayerId: 'target',
    })

    expect(secondAttempt).toEqual(revived)
  })

  it('does not let Professor revive a demon, but still spends the ability', () => {
    const deadDemonState = runLethalIntent(
      createEngineState([
        createPlayer('professor', 'professor'),
        createPlayer('executioner', 'storyteller'),
        createPlayer('imp', 'imp', 'evil'),
      ]),
      createLethalIntent({
        kind: 'execute',
        sourcePlayerId: 'executioner',
        targetPlayerId: 'imp',
        cause: 'execution',
        phase: 'execution',
        bypasses: ['all_defense'],
      }),
    ).state

    const attempted = applyRoleAbility(deadDemonState, 'professor', {
      kind: 'revive',
      targetPlayerId: 'imp',
    })

    expect(getPlayer(attempted, 'imp')?.life.projection.trueState).toBe('dead')
    expect(attempted.abilityUsage[usageKey('professor', 'revive')]).toEqual({
      useCount: 1,
      lastUsedNightSequence: 0,
    })
    expect(
      attempted.events.some(
        (event) => event.type === 'player_revived' && event.playerId === 'imp',
      ),
    ).toBe(false)
  })

  it('has poisoned Professor fail closed while still spending the ability', () => {
    const deadState = runLethalIntent(
      createEngineState([
        createPlayer('professor', 'professor'),
        createPlayer('imp', 'imp', 'evil'),
        createPlayer('target', 'dreamer'),
      ], 'other_night'),
      createLethalIntent({
        kind: 'attack',
        sourcePlayerId: 'imp',
        targetPlayerId: 'target',
        cause: 'demon_attack',
        phase: 'other_night',
      }),
    ).state

    const poisonedState = setPlayerPoisonedForPhases(deadState, {
      targetPlayerId: 'professor',
      sourcePlayerId: 'imp',
      sourceRoleId: 'poisoner',
      reason: 'Professor is poisoned.',
      startPhase: 'other_night',
      endPhase: 'dawn',
    })

    const attempted = applyRoleAbility(poisonedState, 'professor', {
      kind: 'revive',
      targetPlayerId: 'target',
    })

    expect(getPlayer(attempted, 'target')?.life.projection.trueState).toBe('dead')
    expect(attempted.abilityUsage[usageKey('professor', 'revive')]).toEqual({
      useCount: 1,
      lastUsedNightSequence: 0,
    })
    expect(
      attempted.events.some(
        (event) => event.type === 'player_revived' && event.playerId === 'target',
      ),
    ).toBe(false)
  })

  it('restores a zombuul-style public death back to openly alive', () => {
    const falseDead = runLethalIntent(
      createEngineState([
        createPlayer('zombuul', 'zombuul', 'evil'),
        createPlayer('executioner', 'storyteller'),
      ]),
      createLethalIntent({
        kind: 'execute',
        sourcePlayerId: 'executioner',
        targetPlayerId: 'zombuul',
        cause: 'execution',
        phase: 'execution',
      }),
    ).state

    const revived = revivePlayer(falseDead, {
      targetPlayerId: 'zombuul',
      reason: 'Restored to visible life',
    })

    const zombuul = getPlayer(revived, 'zombuul')
    expect(zombuul?.life.kind).toBe('alive')
    expect(appearsDeadToTown(zombuul as EnginePlayer)).toBe(false)
    expect(countsAsAliveForWin(zombuul as EnginePlayer)).toBe(true)
  })

  it('can clear targeted statuses and modifiers during revival', () => {
    let state = createEngineState([
      createPlayer('target', 'dreamer'),
      createPlayer('source', 'professor'),
    ])

    state = addModifier(state, {
      id: 'target-protection',
      kind: 'attack_protection',
      sourcePlayerId: 'source',
      targetPlayerId: 'target',
      reason: 'Targeted protection to be cleared.',
    })

    state = setPlayerPoisonedForPhases(state, {
      targetPlayerId: 'target',
      sourcePlayerId: 'source',
      sourceRoleId: 'poisoner',
      reason: 'Poisoned before revival cleanup test',
      startPhase: 'other_night',
      endPhase: 'dawn',
    })

    state = runLethalIntent(
      state,
      createLethalIntent({
        kind: 'kill',
        sourcePlayerId: 'source',
        targetPlayerId: 'target',
        cause: 'role_ability',
        phase: 'other_night',
        bypasses: ['all_protection'],
      }),
    ).state

    const revived = revivePlayer(state, {
      targetPlayerId: 'target',
      clearStatusEffects: true,
      clearTargetModifiers: true,
    })

    expect(hasStatusEffect(revived, 'target', 'poisoned')).toBe(false)
    expect(
      revived.activeModifiers.some((modifier) => modifier.targetPlayerId === 'target'),
    ).toBe(false)
    expect(getPlayer(revived, 'target')?.life.projection.trueState).toBe('alive')
  })

  it('applies role-change intents and emits role change events', () => {
    const changed = resolveEngineIntent(
      createEngineState([
        createPlayer('target', 'dreamer'),
        createPlayer('source', 'storyteller'),
      ]),
      createRoleChangeIntent({
        playerId: 'target',
        newRoleId: 'clockmaker',
        reason: 'Transformation test',
      }),
    )

    expect(getPlayer(changed, 'target')?.roleId).toBe('clockmaker')
    expect(
      changed.events.some(
        (event) =>
          event.type === 'player_role_changed' &&
          event.playerId === 'target' &&
          event.previousRoleId === 'dreamer' &&
          event.newRoleId === 'clockmaker',
      ),
    ).toBe(true)
  })

  it('applies alignment-change intents and emits alignment change events', () => {
    const changed = resolveEngineIntent(
      createEngineState([
        createPlayer('target', 'dreamer'),
        createPlayer('source', 'storyteller'),
      ]),
      createAlignmentChangeIntent({
        playerId: 'target',
        newAlignment: 'evil',
        reason: 'Alignment test',
      }),
    )

    expect(getPlayer(changed, 'target')?.alignment).toBe('evil')
    expect(
      changed.events.some(
        (event) =>
          event.type === 'player_alignment_changed' &&
          event.playerId === 'target' &&
          event.previousAlignment === 'good' &&
          event.newAlignment === 'evil',
      ),
    ).toBe(true)
  })

  it('applies role-swap intents and emits role change events for both players', () => {
    const changed = resolveEngineIntent(
      createEngineState([
        createPlayer('first', 'dreamer'),
        createPlayer('second', 'clockmaker'),
      ]),
      createRoleSwapIntent({
        firstPlayerId: 'first',
        secondPlayerId: 'second',
        reason: 'Swap test',
      }),
    )

    expect(getPlayer(changed, 'first')?.roleId).toBe('clockmaker')
    expect(getPlayer(changed, 'second')?.roleId).toBe('dreamer')
    expect(
      changed.events.filter((event) => event.type === 'player_role_changed').length,
    ).toBeGreaterThanOrEqual(2)
  })

  it('lets Snake Charmer swap with a Demon through shared transformation intents', () => {
    const result = applyRoleAbility(
      createEngineState([
        createPlayer('charmer', 'snake_charmer'),
        createPlayer('demon', 'imp', 'evil'),
        createPlayer('observer', 'dreamer'),
      ]),
      'charmer',
      {
        kind: 'charm',
        targetPlayerId: 'demon',
      },
    )

    expect(getPlayer(result, 'charmer')).toMatchObject({
      roleId: 'imp',
      alignment: 'evil',
    })
    expect(getPlayer(result, 'demon')).toMatchObject({
      roleId: 'snake_charmer',
      alignment: 'good',
    })
    expect(hasEffectiveStatusEffect(result, 'demon', 'poisoned')).toBe(true)
    expect(result.pendingInformation).toHaveLength(2)
    expect(result.pendingInformation.map((packet) => packet.playerId)).toEqual([
      'charmer',
      'demon',
    ])
  })

  it('queues and delivers information packets through the common intent path', () => {
    const queued = resolveEngineIntent(
      createEngineState([createPlayer('target', 'dreamer')]),
      createInformationIntent({
        audience: 'player',
        playerId: 'target',
        title: 'Information test',
        summary: 'Show a deterministic packet.',
        fragments: [
          { kind: 'text', text: 'The result is ' },
          { kind: 'number', value: 3 },
          { kind: 'text', text: '.' },
        ],
      }),
    )

    expect(queued.pendingInformation).toHaveLength(1)
    expect(queued.events.some((event) => event.type === 'information_queued')).toBe(true)

    const delivered = deliverInformation(queued, queued.pendingInformation[0].id)

    expect(delivered.pendingInformation).toHaveLength(0)
    expect(
      delivered.events.some((event) => event.type === 'information_delivered'),
    ).toBe(true)
  })

  it('lets Pit Hag transform a player without changing their alignment', () => {
    const result = applyRoleAbility(
      createEngineState([
        createPlayer('pit', 'pit_hag', 'evil'),
        createPlayer('target', 'savant'),
        createPlayer('other', 'imp', 'evil'),
      ]),
      'pit',
      {
        kind: 'transform',
        targetPlayerId: 'target',
        newRoleId: 'clockmaker',
      },
    )

    expect(getPlayer(result, 'target')).toMatchObject({
      roleId: 'clockmaker',
      alignment: 'good',
    })
    expect(result.pendingInformation).toHaveLength(2)
    expect(result.pendingInformation.map((packet) => packet.title)).toEqual([
      'Clockmaker',
      'Your role has changed',
    ])
  })

  it('does not let Pit Hag create a role that is already in play', () => {
    const result = applyRoleAbility(
      createEngineState([
        createPlayer('pit', 'pit_hag', 'evil'),
        createPlayer('target', 'savant'),
        createPlayer('existing', 'clockmaker'),
      ]),
      'pit',
      {
        kind: 'transform',
        targetPlayerId: 'target',
        newRoleId: 'clockmaker',
      },
    )

    expect(getPlayer(result, 'target')?.roleId).toBe('savant')
    expect(result.pendingInformation).toHaveLength(0)
    expect(result.storytellerNotices.some((notice) => notice.title === 'Pit Hag failed')).toBe(
      true,
    )
  })

  it('notifies the Storyteller when Pit Hag creates a Demon', () => {
    const result = applyRoleAbility(
      createEngineState([
        createPlayer('pit', 'pit_hag', 'evil'),
        createPlayer('target', 'artist'),
        createPlayer('imp', 'imp', 'evil'),
      ]),
      'pit',
      {
        kind: 'transform',
        targetPlayerId: 'target',
        newRoleId: 'vortox',
      },
    )

    expect(getPlayer(result, 'target')).toMatchObject({
      roleId: 'vortox',
      alignment: 'good',
    })
    expect(
      result.storytellerNotices.some(
        (notice) => notice.title === 'Pit Hag created a Demon',
      ),
    ).toBe(true)
  })

  it('lets Clockmaker queue a player-facing information packet', () => {
    const result = applyRoleAbility(
      createEngineState([
        createPlayer('clockmaker', 'clockmaker'),
        createPlayer('minion', 'witch', 'evil'),
        createPlayer('town', 'dreamer'),
        createPlayer('demon', 'imp', 'evil'),
      ]),
      'clockmaker',
      {
        kind: 'learn_distance',
      },
    )

    expect(result.pendingInformation).toHaveLength(1)
    expect(result.pendingInformation[0]?.title).toBe('Clockmaker')
    expect(
      result.pendingInformation[0]?.fragments.some((fragment) => fragment.kind === 'number'),
    ).toBe(true)
  })

  it('queues Chef setup info on the first night', () => {
    const result = setEnginePhase(
      createEngineState([
        createPlayer('chef', 'chef'),
        createPlayer('evil_a', 'witch', 'evil'),
        createPlayer('evil_b', 'imp', 'evil'),
        createPlayer('good', 'dreamer'),
      ], 'setup'),
      'first_night',
    )

    expect(result.pendingInformation).toHaveLength(1)
    expect(result.pendingInformation[0]?.title).toBe('Chef')
    expect(
      result.pendingInformation[0]?.fragments.some(
        (fragment) => fragment.kind === 'number' && fragment.value === 1,
      ),
    ).toBe(true)
  })

  it('routes Chef malfunctioning info through a constrained number choice', () => {
    const result = setEnginePhase(
      setPlayerPoisonedForPhases(
        createEngineState([
          createPlayer('chef', 'chef'),
          createPlayer('evil_a', 'witch', 'evil'),
          createPlayer('evil_b', 'imp', 'evil'),
          createPlayer('good', 'dreamer'),
        ], 'setup'),
        {
          targetPlayerId: 'chef',
          sourcePlayerId: 'evil_a',
          sourceRoleId: 'poisoner',
          reason: 'Chef is poisoned.',
          startPhase: 'setup',
          endPhase: 'dawn',
        },
      ),
      'first_night',
    )

    expect(result.pendingStorytellerChoices).toHaveLength(1)
    expect(result.pendingStorytellerChoices[0]?.kind).toBe('number_selection')
  })

  it('queues Empath info on both first and other nights', () => {
    const firstNight = setEnginePhase(
      createEngineState([
        createPlayer('left', 'witch', 'evil'),
        createPlayer('empath', 'empath'),
        createPlayer('right', 'clockmaker'),
      ], 'setup'),
      'first_night',
    )

    const firstNightEmpathPacket = firstNight.pendingInformation.find(
      (packet) => packet.title === 'Empath',
    )
    expect(firstNightEmpathPacket).toBeDefined()
    expect(
      firstNightEmpathPacket?.fragments.some(
        (fragment) => fragment.kind === 'number' && fragment.value === 1,
      ),
    ).toBe(true)

    const otherNight = setEnginePhase(setEnginePhase(firstNight, 'day'), 'other_night')
    expect(otherNight.pendingInformation.some((packet) => packet.title === 'Empath')).toBe(true)
  })

  it('routes Empath malfunctioning info through a constrained number choice', () => {
    const result = setEnginePhase(
      setPlayerDrunkForPhases(
        createEngineState([
          createPlayer('left', 'witch', 'evil'),
          createPlayer('empath', 'empath'),
          createPlayer('right', 'clockmaker'),
        ], 'setup'),
        {
          targetPlayerId: 'empath',
          sourceRoleId: 'courtier',
          reason: 'Empath is drunk.',
          startPhase: 'setup',
          endPhase: 'dawn',
        },
      ),
      'first_night',
    )

    expect(result.pendingStorytellerChoices).toHaveLength(1)
    expect(result.pendingStorytellerChoices[0]?.kind).toBe('number_selection')
  })

  it('queues Clockmaker setup info on the first night as a phase-driven hook', () => {
    const result = setEnginePhase(
      createEngineState([
        createPlayer('clockmaker', 'clockmaker'),
        createPlayer('minion', 'witch', 'evil'),
        createPlayer('town', 'dreamer'),
        createPlayer('demon', 'imp', 'evil'),
      ], 'setup'),
      'first_night',
    )

    expect(result.pendingInformation).toHaveLength(1)
    expect(result.pendingInformation[0]?.title).toBe('Clockmaker')
    expect(result.pendingInformation[0]?.summary).toContain('First night Clockmaker setup')
  })

  it('keeps first-night setup separate from role-entry follow-up', () => {
    const transformed = applyRoleAbility(
      createEngineState([
        createPlayer('pit', 'pit_hag', 'evil'),
        createPlayer('target', 'savant'),
        createPlayer('minion', 'witch', 'evil'),
        createPlayer('demon', 'imp', 'evil'),
      ]),
      'pit',
      {
        kind: 'transform',
        targetPlayerId: 'target',
        newRoleId: 'clockmaker',
      },
    )

    expect(transformed.pendingInformation).toHaveLength(2)
    expect(
      transformed.pendingInformation.some(
        (packet) => packet.summary === 'You just became the Clockmaker. This is the shortest seated distance between any Demon and any Minion.',
      ),
    ).toBe(true)
    expect(
      transformed.pendingInformation.some(
        (packet) => packet.summary === 'First night Clockmaker setup: this is the shortest seated distance between any Demon and any Minion.',
      ),
    ).toBe(false)
  })

  it('queues Oracle info during other nights as a phase-driven hook', () => {
    const result = setEnginePhase(
      createEngineState([
        createPlayer('oracle', 'oracle'),
        {
          ...createPlayer('dead_minion', 'witch', 'evil'),
          life: createDeadLifeState(),
        },
        {
          ...createPlayer('dead_good', 'dreamer'),
          life: createDeadLifeState(),
        },
        createPlayer('imp', 'imp', 'evil'),
      ], 'day'),
      'other_night',
    )

    expect(result.pendingInformation).toHaveLength(1)
    expect(result.pendingInformation[0]?.title).toBe('Oracle')
    expect(result.pendingInformation[0]?.summary).toContain('Other-night Oracle info')
  })

  it('queues Oracle role-entry info separately from its nightly phase hook', () => {
    const result = applyRoleAbility(
      createEngineState([
        createPlayer('pit', 'pit_hag', 'evil'),
        createPlayer('target', 'artist'),
        {
          ...createPlayer('dead_minion', 'witch', 'evil'),
          life: createDeadLifeState(),
        },
        createPlayer('imp', 'imp', 'evil'),
      ], 'other_night'),
      'pit',
      {
        kind: 'transform',
        targetPlayerId: 'target',
        newRoleId: 'oracle',
      },
    )

    expect(getPlayer(result, 'target')).toMatchObject({
      roleId: 'oracle',
      alignment: 'good',
    })
    expect(
      result.pendingInformation.some(
        (packet) =>
          packet.title === 'Oracle' &&
          packet.summary ===
            'You just became the Oracle. This is the current number of dead evil players.',
      ),
    ).toBe(true)
    expect(
      result.pendingInformation.some(
        (packet) =>
          packet.summary ===
          'Other-night Oracle info: this is the current number of dead evil players.',
      ),
    ).toBe(false)
  })

  it('queues Undertaker info during other nights after an execution', () => {
    const withBlock = {
      ...createEngineState([
        createPlayer('undertaker', 'undertaker'),
        createPlayer('target', 'dreamer'),
        createPlayer('imp', 'imp', 'evil'),
      ], 'day'),
      day: {
        ...createEngineState([], 'day').day,
        block: {
          nomineeId: 'target',
          voteCount: 3,
          tied: false,
          nominationId: 'nomination-1',
        },
      },
    }

    const executed = resolveEngineIntent(
      withBlock,
      createDayResolveExecutionIntent({
        reason: 'Resolve execution for Undertaker.',
      }),
    )

    const result = setEnginePhase(executed, 'other_night')

    expect(result.pendingInformation).toHaveLength(1)
    expect(result.pendingInformation[0]?.title).toBe('Undertaker')
    expect(
      result.pendingInformation[0]?.fragments.some(
        (fragment) => fragment.kind === 'role' && fragment.roleId === 'dreamer',
      ),
    ).toBe(true)
  })

  it('routes Undertaker malfunctioning info through a constrained role choice', () => {
    const withBlock = {
      ...createEngineState([
        createPlayer('undertaker', 'undertaker'),
        createPlayer('target', 'dreamer'),
        createPlayer('imp', 'imp', 'evil'),
      ], 'day'),
      day: {
        ...createEngineState([], 'day').day,
        block: {
          nomineeId: 'target',
          voteCount: 3,
          tied: false,
          nominationId: 'nomination-1',
        },
      },
    }

    const executed = resolveEngineIntent(
      withBlock,
      createDayResolveExecutionIntent({
        reason: 'Resolve execution for Undertaker.',
      }),
    )

    const poisoned = setPlayerPoisonedForPhases(executed, {
      targetPlayerId: 'undertaker',
      sourcePlayerId: 'imp',
      sourceRoleId: 'poisoner',
      reason: 'Undertaker is poisoned.',
      startPhase: 'day',
      endPhase: 'dawn',
    })

    const result = setEnginePhase(poisoned, 'other_night')

    expect(result.pendingStorytellerChoices).toHaveLength(1)
    expect(result.pendingStorytellerChoices[0]?.kind).toBe('role_selection')
  })

  it('lets Ravenkeeper inspect a player after dying at night', () => {
    const killed = runLethalIntent(
      createEngineState([
        createPlayer('raven', 'ravenkeeper'),
        createPlayer('imp', 'imp', 'evil'),
        createPlayer('target', 'dreamer'),
      ], 'other_night'),
      createLethalIntent({
        kind: 'attack',
        sourcePlayerId: 'imp',
        targetPlayerId: 'raven',
        cause: 'demon_attack',
        phase: 'other_night',
      }),
    ).state

    expect(
      killed.storytellerNotices.some((notice) => notice.title === 'Ravenkeeper can act'),
    ).toBe(true)

    const result = applyRoleAbility(killed, 'raven', {
      kind: 'inspect_after_night_death',
      targetPlayerId: 'target',
    })

    expect(result.pendingInformation).toHaveLength(1)
    expect(result.pendingInformation[0]?.title).toBe('Ravenkeeper')
    expect(
      result.pendingInformation[0]?.fragments.some(
        (fragment) => fragment.kind === 'role' && fragment.roleId === 'dreamer',
      ),
    ).toBe(true)
  })

  it('routes Ravenkeeper malfunctioning info through a constrained role choice', () => {
    const poisoned = setPlayerPoisonedForPhases(
      createEngineState([
        createPlayer('raven', 'ravenkeeper'),
        createPlayer('imp', 'imp', 'evil'),
        createPlayer('target', 'dreamer'),
      ], 'other_night'),
      {
        targetPlayerId: 'raven',
        sourcePlayerId: 'imp',
        sourceRoleId: 'poisoner',
        reason: 'Ravenkeeper is poisoned.',
        startPhase: 'other_night',
        endPhase: 'dawn',
      },
    )

    const killed = runLethalIntent(
      poisoned,
      createLethalIntent({
        kind: 'attack',
        sourcePlayerId: 'imp',
        targetPlayerId: 'raven',
        cause: 'demon_attack',
        phase: 'other_night',
      }),
    ).state

    const result = applyRoleAbility(killed, 'raven', {
      kind: 'inspect_after_night_death',
      targetPlayerId: 'target',
    })

    expect(result.pendingStorytellerChoices).toHaveLength(1)
    expect(result.pendingStorytellerChoices[0]?.kind).toBe('role_selection')
  })

  it('queues Sage demon-pair info when killed by the Demon', () => {
    const killed = runLethalIntent(
      createEngineState([
        createPlayer('sage', 'sage'),
        createPlayer('imp', 'imp', 'evil'),
        createPlayer('villager', 'dreamer'),
        createPlayer('outsider', 'artist'),
      ], 'other_night'),
      createLethalIntent({
        kind: 'attack',
        sourcePlayerId: 'imp',
        targetPlayerId: 'sage',
        cause: 'demon_attack',
        phase: 'other_night',
      }),
    ).state

    expect(killed.pendingStorytellerChoices).toHaveLength(1)
    expect(killed.pendingStorytellerChoices[0]?.kind).toBe('player_selection')
    expect(killed.pendingStorytellerChoices[0]?.candidatePlayerIds).toContain('imp|villager')

    const resolved = resolveStorytellerChoice(
      killed,
      killed.pendingStorytellerChoices[0].id,
      'imp|villager',
    )

    expect(resolved.pendingInformation).toHaveLength(1)
    expect(resolved.pendingInformation[0]?.title).toBe('Sage')
    expect(
      resolved.pendingInformation[0]?.fragments.filter(
        (fragment) => fragment.kind === 'player',
      ),
    ).toHaveLength(2)
  })

  it('queues Artist questions through a storyteller yes-no choice', () => {
    const asked = applyRoleAbility(
      createEngineState([createPlayer('artist', 'artist')], 'day'),
      'artist',
      {
        kind: 'ask_question',
        question: 'Is the Demon sitting next to a Minion?',
      },
    )

    expect(asked.pendingStorytellerChoices).toHaveLength(1)
    expect(asked.pendingStorytellerChoices[0]?.kind).toBe('boolean_selection')

    const resolved = resolveStorytellerChoice(
      asked,
      asked.pendingStorytellerChoices[0].id,
      'true',
    )

    expect(resolved.pendingInformation).toHaveLength(1)
    expect(resolved.pendingInformation[0]?.title).toBe('Artist')
    expect(resolved.pendingInformation[0]?.summary).toBe(
      'Is the Demon sitting next to a Minion?',
    )
  })

  it('builds a first-night queue from script wake order and pending phase info', () => {
    const state = setEnginePhase(
      createEngineState([
        createPlayer('chef', 'chef'),
        createPlayer('empath', 'empath'),
        createPlayer('fortune', 'fortune_teller'),
        createPlayer('monk', 'monk'),
        createPlayer('imp', 'imp', 'evil'),
      ], 'setup'),
      'first_night',
    )

    const queue = getEngineNightQueue(state, BUILTIN_SCRIPTS['trouble-brewing'])

    expect(queue.map((entry) => entry.roleId)).toEqual([
      'chef',
      'empath',
      'fortune_teller',
    ])
    expect(queue[0]?.hasPendingInformation).toBe(true)
    expect(queue[1]?.hasPendingInformation).toBe(true)
    expect(queue[2]?.availableActionKinds).toEqual(['read_fortune'])
  })

  it('builds an other-night queue with protection before demon and aftermath info after', () => {
    let state = createEngineState([
      createPlayer('undertaker', 'undertaker'),
      createPlayer('monk', 'monk'),
      createPlayer('imp', 'imp', 'evil'),
      createPlayer('executioner', 'storyteller'),
      createPlayer('target', 'dreamer'),
    ], 'day')

    state = {
      ...state,
      day: {
        ...state.day,
        block: {
          nomineeId: 'target',
          voteCount: 3,
          tied: false,
          nominationId: 'nomination-1',
        },
      },
    }

    state = resolveEngineIntent(
      state,
      createDayResolveExecutionIntent({ reason: 'Resolve block' }),
    )
    state = setEnginePhase(state, 'other_night')

    const queue = getEngineNightQueue(state, BUILTIN_SCRIPTS['trouble-brewing'])

    expect(queue.map((entry) => entry.roleId)).toEqual([
      'monk',
      'imp',
      'undertaker',
    ])
    expect(queue[2]?.hasPendingInformation).toBe(true)
  })

  it('adds reactive dead-role work to the night queue only when it is actually unlocked', () => {
    const state = runLethalIntent(
      createEngineState([
        createPlayer('imp', 'imp', 'evil'),
        createPlayer('raven', 'ravenkeeper'),
        createPlayer('undertaker', 'undertaker'),
        createPlayer('target', 'dreamer'),
      ], 'other_night'),
      createLethalIntent({
        kind: 'attack',
        sourcePlayerId: 'imp',
        targetPlayerId: 'raven',
        cause: 'demon_attack',
        phase: 'other_night',
      }),
    ).state

    const queue = getEngineNightQueue(state, BUILTIN_SCRIPTS['trouble-brewing'])

    expect(queue.some((entry) => entry.roleId === 'ravenkeeper')).toBe(true)
    const ravenEntry = queue.find((entry) => entry.roleId === 'ravenkeeper')
    expect(ravenEntry?.availableActionKinds).toEqual(['inspect_after_night_death'])
  })

  it('routes Oracle malfunctioning info through a constrained number choice', () => {
    const result = setEnginePhase(
      setPlayerPoisonedForPhases(
        createEngineState([
          createPlayer('oracle', 'oracle'),
          {
            ...createPlayer('dead_minion', 'witch', 'evil'),
            life: createDeadLifeState(),
          },
          createPlayer('imp', 'imp', 'evil'),
        ], 'day'),
        {
          targetPlayerId: 'oracle',
          sourcePlayerId: 'imp',
          sourceRoleId: 'poisoner',
          reason: 'Oracle is poisoned.',
          startPhase: 'day',
          endPhase: 'dawn',
        },
      ),
      'other_night',
    )

    expect(result.pendingInformation).toHaveLength(0)
    expect(result.pendingStorytellerChoices).toHaveLength(1)
    expect(result.pendingStorytellerChoices[0]).toMatchObject({
      kind: 'number_selection',
      title: 'Choose Oracle result',
    })

    const resolved = resolveStorytellerChoice(
      result,
      result.pendingStorytellerChoices[0].id,
      '3',
    )

    expect(resolved.pendingInformation).toHaveLength(1)
    expect(
      resolved.pendingInformation[0]?.fragments.some(
        (fragment) => fragment.kind === 'number' && fragment.value === 3,
      ),
    ).toBe(true)
  })

  it('queues Flowergirl other-night info from the previous day summary', () => {
    let state = createEngineState([
      createPlayer('flowergirl', 'flowergirl'),
      createPlayer('imp', 'imp', 'evil'),
      createPlayer('villager', 'dreamer'),
    ], 'day')

    state = resolveEngineIntent(
      state,
      createDayStartNominationIntent({
        nominatorId: 'villager',
        nomineeId: 'flowergirl',
      }),
    )

    const nominationId = state.day.currentNominationId
    expect(nominationId).toBeTruthy()

    state = resolveEngineIntent(
      state,
      createDayOpenVoteIntent({ nominationId: nominationId! }),
    )
    state = resolveEngineIntent(
      state,
      createDayCastVoteIntent({ nominationId: nominationId!, voterId: 'imp' }),
    )

    const result = setEnginePhase(state, 'other_night')
    expect(result.pendingInformation.some((packet) => packet.title === 'Flowergirl')).toBe(true)
    expect(
      result.pendingInformation.some((packet) =>
        packet.fragments.some(
          (fragment) => fragment.kind === 'boolean' && fragment.value === true,
        ),
      ),
    ).toBe(true)
  })

  it('queues Town Crier other-night info from the previous day summary', () => {
    const state = resolveEngineIntent(
      createEngineState([
        createPlayer('town_crier', 'town_crier'),
        createPlayer('minion', 'witch', 'evil'),
        createPlayer('villager', 'dreamer'),
      ], 'day'),
      createDayStartNominationIntent({
        nominatorId: 'minion',
        nomineeId: 'villager',
      }),
    )

    const result = setEnginePhase(state, 'other_night')
    expect(result.pendingInformation.some((packet) => packet.title === 'Town Crier')).toBe(true)
    expect(
      result.pendingInformation.some((packet) =>
        packet.fragments.some(
          (fragment) => fragment.kind === 'boolean' && fragment.value === true,
        ),
      ),
    ).toBe(true)
  })

  it('keeps Mathematician Storyteller-driven through a bounded number choice', () => {
    const result = setEnginePhase(
      createEngineState([
        createPlayer('mathematician', 'mathematician'),
        createPlayer('imp', 'imp', 'evil'),
        createPlayer('villager', 'dreamer'),
      ], 'day'),
      'other_night',
    )

    expect(result.pendingStorytellerChoices.some((choice) => choice.title === 'Choose Mathematician result')).toBe(true)
    const choice = result.pendingStorytellerChoices.find(
      (candidate) => candidate.title === 'Choose Mathematician result',
    )
    expect(choice?.kind).toBe('number_selection')
  })

  it('lets Seamstress queue a player-facing alignment comparison packet', () => {
    const result = applyRoleAbility(
      createEngineState([
        createPlayer('seamstress', 'seamstress'),
        createPlayer('good_a', 'dreamer'),
        createPlayer('good_b', 'clockmaker'),
        createPlayer('evil_a', 'witch', 'evil'),
      ]),
      'seamstress',
      {
        kind: 'compare_alignments',
        firstPlayerId: 'good_a',
        secondPlayerId: 'evil_a',
      },
    )

    expect(result.pendingInformation).toHaveLength(1)
    expect(result.pendingInformation[0]?.title).toBe('Seamstress')
    expect(result.pendingInformation[0]?.summary).toContain('different alignment')
  })

  it('routes Seamstress malfunctioning info through a constrained same-or-different choice', () => {
    const result = applyRoleAbility(
      setPlayerDrunkForPhases(
        createEngineState([
          createPlayer('seamstress', 'seamstress'),
          createPlayer('good_a', 'dreamer'),
          createPlayer('evil_a', 'witch', 'evil'),
        ]),
        {
          targetPlayerId: 'seamstress',
          sourceRoleId: 'courtier',
          reason: 'Seamstress is drunk.',
          startPhase: 'other_night',
          endPhase: 'dawn',
        },
      ),
      'seamstress',
      {
        kind: 'compare_alignments',
        firstPlayerId: 'good_a',
        secondPlayerId: 'evil_a',
      },
    )

    expect(result.pendingInformation).toHaveLength(0)
    expect(result.pendingStorytellerChoices).toHaveLength(1)
    expect(result.pendingStorytellerChoices[0]).toMatchObject({
      kind: 'boolean_selection',
      title: 'Choose Seamstress result',
      candidateLabels: {
        true: 'Same alignment',
        false: 'Different alignment',
      },
    })

    const resolved = resolveStorytellerChoice(
      result,
      result.pendingStorytellerChoices[0].id,
      'false',
    )

    expect(resolved.pendingInformation).toHaveLength(1)
    expect(
      resolved.pendingInformation[0]?.fragments.some(
        (fragment) => fragment.kind === 'text' && fragment.text === 'Different alignment',
      ),
    ).toBe(true)
  })

  it('lets Fortune Teller queue a deterministic yes-no packet', () => {
    const result = applyRoleAbility(
      createEngineState([
        createPlayer('fortune', 'fortune_teller'),
        createPlayer('imp', 'imp', 'evil'),
        createPlayer('good', 'dreamer'),
      ]),
      'fortune',
      {
        kind: 'read_fortune',
        firstPlayerId: 'imp',
        secondPlayerId: 'good',
      },
    )

    expect(result.pendingInformation).toHaveLength(1)
    expect(result.pendingInformation[0]?.title).toBe('Fortune Teller')
    expect(
      result.pendingInformation[0]?.fragments.some(
        (fragment) => fragment.kind === 'boolean' && fragment.value === true,
      ),
    ).toBe(true)
  })

  it('routes Fortune Teller malfunctioning info through a constrained yes-no choice', () => {
    const result = applyRoleAbility(
      setPlayerPoisonedForPhases(
        createEngineState([
          createPlayer('fortune', 'fortune_teller'),
          createPlayer('imp', 'imp', 'evil'),
          createPlayer('good', 'dreamer'),
        ]),
        {
          targetPlayerId: 'fortune',
          sourcePlayerId: 'imp',
          sourceRoleId: 'poisoner',
          reason: 'Fortune Teller is poisoned.',
          startPhase: 'other_night',
          endPhase: 'dawn',
        },
      ),
      'fortune',
      {
        kind: 'read_fortune',
        firstPlayerId: 'imp',
        secondPlayerId: 'good',
      },
    )

    expect(result.pendingInformation).toHaveLength(0)
    expect(result.pendingStorytellerChoices).toHaveLength(1)
    expect(result.pendingStorytellerChoices[0]).toMatchObject({
      kind: 'boolean_selection',
      title: 'Choose Fortune Teller result',
    })

    const resolved = resolveStorytellerChoice(
      result,
      result.pendingStorytellerChoices[0].id,
      'false',
    )

    expect(resolved.pendingInformation).toHaveLength(1)
    expect(
      resolved.pendingInformation[0]?.fragments.some(
        (fragment) => fragment.kind === 'boolean' && fragment.value === false,
      ),
    ).toBe(true)
  })

  it('does not let Dreamer choose themself', () => {
    const state = createEngineState([
      createPlayer('dreamer', 'dreamer'),
      createPlayer('other', 'witch', 'evil'),
    ])

    const result = applyRoleAbility(state, 'dreamer', {
      kind: 'dream',
      targetPlayerId: 'dreamer',
    })

    expect(result).toEqual(state)
  })

  it('lets Dreamer queue exactly one structured packet for a valid target', () => {
    const requested = applyRoleAbility(
      createEngineState([
        createPlayer('dreamer', 'dreamer'),
        createPlayer('target', 'clockmaker'),
        createPlayer('evil', 'witch', 'evil'),
      ]),
      'dreamer',
      {
        kind: 'dream',
        targetPlayerId: 'target',
      },
    )

    expect(requested.pendingStorytellerChoices).toHaveLength(1)
    expect(requested.pendingInformation).toHaveLength(0)

    const selectedRoleId = requested.pendingStorytellerChoices[0]?.candidatePlayerIds[0]
    expect(selectedRoleId).toBeDefined()

    const result = resolveStorytellerChoice(
      requested,
      requested.pendingStorytellerChoices[0].id,
      selectedRoleId!,
    )

    expect(result.pendingInformation).toHaveLength(1)
    expect(result.pendingInformation[0]?.title).toBe('Dreamer')
    expect(result.pendingInformation[0]?.summary).toBe(
      'One of these roles matches the chosen player.',
    )
  })

  it('includes exactly two role fragments in the Dreamer packet', () => {
    const requested = applyRoleAbility(
      createEngineState([
        createPlayer('dreamer', 'dreamer'),
        createPlayer('target', 'witch', 'evil'),
        createPlayer('good', 'clockmaker'),
      ]),
      'dreamer',
      {
        kind: 'dream',
        targetPlayerId: 'target',
      },
    )

    const selectedRoleId = requested.pendingStorytellerChoices[0]?.candidatePlayerIds[0]
    expect(selectedRoleId).toBeDefined()

    const result = resolveStorytellerChoice(
      requested,
      requested.pendingStorytellerChoices[0].id,
      selectedRoleId!,
    )

    const packet = result.pendingInformation[0]
    expect(packet).toBeDefined()
    const roleFragments = packet?.fragments.filter((fragment) => fragment.kind === 'role') ?? []

    expect(roleFragments).toHaveLength(2)
    expect(roleFragments.some((fragment) => fragment.roleId === 'witch')).toBe(true)
  })

  it('asks the Storyteller to choose Dreamer false info from opposite-team roles only', () => {
    const result = applyRoleAbility(
      createEngineState([
        createPlayer('dreamer', 'dreamer'),
        createPlayer('target', 'clockmaker'),
        createPlayer('evil', 'witch', 'evil'),
        createPlayer('evil_two', 'imp', 'evil'),
      ]),
      'dreamer',
      {
        kind: 'dream',
        targetPlayerId: 'target',
      },
    )

    expect(result.pendingStorytellerChoices).toHaveLength(1)
    const choice = result.pendingStorytellerChoices[0]
    expect(choice?.kind).toBe('role_selection')
    expect(choice?.candidatePlayerIds).toContain('witch')
    expect(choice?.candidatePlayerIds).toContain('imp')
    expect(choice?.candidatePlayerIds).not.toContain('clockmaker')
  })

  it('routes Dreamer malfunctioning info through constrained good-plus-evil pair choices', () => {
    const result = applyRoleAbility(
      setPlayerPoisonedForPhases(
        createEngineState([
          createPlayer('dreamer', 'dreamer'),
          createPlayer('target', 'clockmaker'),
          createPlayer('evil', 'witch', 'evil'),
        ]),
        {
          targetPlayerId: 'dreamer',
          sourcePlayerId: 'evil',
          sourceRoleId: 'poisoner',
          reason: 'Dreamer is poisoned.',
          startPhase: 'other_night',
          endPhase: 'dawn',
        },
      ),
      'dreamer',
      {
        kind: 'dream',
        targetPlayerId: 'target',
      },
    )

    expect(result.pendingInformation).toHaveLength(0)
    expect(result.pendingStorytellerChoices).toHaveLength(1)
    expect(result.pendingStorytellerChoices[0]?.kind).toBe('role_selection')

    const pairId = result.pendingStorytellerChoices[0]?.candidatePlayerIds[0]
    expect(pairId).toContain('|')

    const resolved = resolveStorytellerChoice(
      result,
      result.pendingStorytellerChoices[0].id,
      pairId!,
    )

    expect(resolved.pendingInformation).toHaveLength(1)
    const roleFragments =
      resolved.pendingInformation[0]?.fragments.filter(
        (fragment) => fragment.kind === 'role',
      ) ?? []
    expect(roleFragments).toHaveLength(2)
  })

  it('queues a constrained Washerwoman role choice on the first night', () => {
    const result = setEnginePhase(
      createEngineState([
        createPlayer('washerwoman', 'washerwoman'),
        createPlayer('town', 'clockmaker'),
        createPlayer('decoy', 'dreamer'),
        createPlayer('evil', 'witch', 'evil'),
      ], 'setup'),
      'first_night',
    )

    expect(result.pendingStorytellerChoices).toHaveLength(1)
    const choice = result.pendingStorytellerChoices[0]
    expect(choice?.kind).toBe('role_selection')
    expect(choice?.candidatePlayerIds).toContain('clockmaker')
    expect(choice?.candidatePlayerIds).toContain('dreamer')
    expect(choice?.candidatePlayerIds).not.toContain('witch')
  })

  it('turns the Washerwoman role choice into a constrained decoy choice and final packet', () => {
    const firstNight = setEnginePhase(
      createEngineState([
        createPlayer('washerwoman', 'washerwoman'),
        createPlayer('town', 'clockmaker'),
        createPlayer('decoy', 'dreamer'),
        createPlayer('evil', 'witch', 'evil'),
      ], 'setup'),
      'first_night',
    )

    const roleChoice = firstNight.pendingStorytellerChoices[0]
    expect(roleChoice).toBeDefined()

    const withDecoyChoice = resolveStorytellerChoice(firstNight, roleChoice!.id, 'clockmaker')
    expect(withDecoyChoice.pendingStorytellerChoices).toHaveLength(1)
    expect(withDecoyChoice.pendingStorytellerChoices[0]?.kind).toBe('player_selection')
    expect(withDecoyChoice.pendingStorytellerChoices[0]?.candidatePlayerIds).not.toContain('washerwoman')
    expect(withDecoyChoice.pendingStorytellerChoices[0]?.candidatePlayerIds).not.toContain('town')

    const final = resolveStorytellerChoice(
      withDecoyChoice,
      withDecoyChoice.pendingStorytellerChoices[0].id,
      'decoy',
    )

    const washerwomanPacket = final.pendingInformation.find(
      (packet) => packet.title === 'Washerwoman',
    )
    expect(washerwomanPacket).toBeDefined()
    expect(washerwomanPacket?.fragments.filter((fragment) => fragment.kind === 'player')).toHaveLength(2)
    expect(washerwomanPacket?.fragments.filter((fragment) => fragment.kind === 'role')).toHaveLength(1)
  })

  it('queues no-target info when Librarian has no Outsiders to show', () => {
    const result = setEnginePhase(
      createEngineState([
        createPlayer('librarian', 'librarian'),
        createPlayer('town', 'clockmaker'),
        createPlayer('evil', 'witch', 'evil'),
      ], 'setup'),
      'first_night',
    )

    expect(result.pendingStorytellerChoices).toHaveLength(0)
    const librarianPacket = result.pendingInformation.find(
      (packet) => packet.title === 'Librarian',
    )
    expect(librarianPacket).toBeDefined()
    expect(librarianPacket?.summary).toBe('There are no Outsiders in play.')
  })

  it('queues Investigator role-entry follow-up through the same constrained flow', () => {
    const transformed = applyRoleAbility(
      createEngineState([
        createPlayer('pit', 'pit_hag', 'evil'),
        createPlayer('target', 'artist'),
        createPlayer('minion', 'witch', 'evil'),
        createPlayer('demon', 'imp', 'evil'),
      ], 'other_night'),
      'pit',
      {
        kind: 'transform',
        targetPlayerId: 'target',
        newRoleId: 'investigator',
      },
    )

    expect(transformed.pendingStorytellerChoices.some((choice) => choice.kind === 'role_selection')).toBe(true)
    const choice = transformed.pendingStorytellerChoices.find((candidate) => candidate.kind === 'role_selection')
    expect(choice?.candidatePlayerIds).toContain('witch')
    expect(choice?.candidatePlayerIds).not.toContain('imp')
  })

  it('resolves mixed participant operations inside a bundle', () => {
    const deadBase = runLethalIntent(
      createEngineState([
        createPlayer('source', 'storyteller'),
        createPlayer('dead_target', 'dreamer'),
        createPlayer('live_target', 'clockmaker'),
      ]),
      createLethalIntent({
        kind: 'kill',
        sourcePlayerId: 'source',
        targetPlayerId: 'dead_target',
        cause: 'role_ability',
        phase: 'other_night',
      }),
    ).state

    const bundle: ResolutionBundle = {
      id: 'bundle-mixed',
      sourceRoleId: 'experimental_role',
      sourcePlayerId: 'source',
      phase: 'other_night',
      participants: [
        {
          id: 'p1',
          playerId: 'dead_target',
          operation: {
            kind: 'revive',
            targetPlayerId: 'dead_target',
            reason: 'Chose life',
          },
        },
        {
          id: 'p2',
          playerId: 'live_target',
          operation: {
            kind: 'lethal_intent',
            intent: createLethalIntent({
              kind: 'kill',
              sourcePlayerId: 'source',
              targetPlayerId: 'live_target',
              cause: 'role_ability',
              phase: 'other_night',
              reason: 'Chose death',
            }),
          },
        },
      ],
    }

    const result = runResolutionBundle(deadBase, bundle).state
    expect(getPlayer(result, 'dead_target')?.life.projection.trueState).toBe('alive')
    expect(getPlayer(result, 'live_target')?.life.projection.trueState).toBe('dead')
    expect(result.events.some((event) => event.type === 'bundle_started')).toBe(true)
    expect(
      result.events.filter((event) => event.type === 'bundle_participant_resolved'),
    ).toHaveLength(2)
    expect(result.events.some((event) => event.type === 'bundle_completed')).toBe(true)
  })

  it('supports post-bundle group follow-ups using current mechanical life state', () => {
    const state = createEngineState([
      createPlayer('source', 'storyteller'),
      createPlayer('a', 'dreamer'),
      createPlayer('b', 'fool'),
      createPlayer('c', 'zombuul', 'evil'),
    ])

    const bundle: ResolutionBundle = {
      id: 'bundle-group-check',
      sourceRoleId: 'experimental_role',
      sourcePlayerId: 'source',
      phase: 'other_night',
      participants: [
        {
          id: 'a',
          playerId: 'a',
          operation: {
            kind: 'none',
          },
        },
        {
          id: 'b',
          playerId: 'b',
          operation: {
            kind: 'lethal_intent',
            intent: createLethalIntent({
              kind: 'kill',
              sourcePlayerId: 'source',
              targetPlayerId: 'b',
              cause: 'role_ability',
              phase: 'other_night',
            }),
          },
        },
        {
          id: 'c',
          playerId: 'c',
          operation: {
            kind: 'lethal_intent',
            intent: createLethalIntent({
              kind: 'kill',
              sourcePlayerId: 'source',
              targetPlayerId: 'c',
              cause: 'role_ability',
              phase: 'other_night',
            }),
          },
        },
      ],
      evaluateFollowUps: (currentState) => {
        const participantIds = ['a', 'b', 'c']
        const allAlive = participantIds.every(
          (playerId) => getPlayer(currentState, playerId)?.life.projection.trueState === 'alive',
        )
        if (!allAlive) {
          return []
        }

        return participantIds.map((playerId) => ({
          kind: 'lethal_intent' as const,
          intent: createLethalIntent({
            kind: 'kill',
            sourcePlayerId: 'source',
            targetPlayerId: playerId,
            cause: 'role_ability',
            phase: 'other_night',
            reason: 'Group clause triggers',
          }),
        }))
      },
    }

    const result = runResolutionBundle(state, bundle).state
    expect(getPlayer(result, 'a')?.life.projection.trueState).toBe('dead')
    expect(getPlayer(result, 'b')?.life.projection.trueState).toBe('dead')
    expect(getPlayer(result, 'c')?.life.projection.trueState).toBe('dead')
    expect(
      result.events.filter((event) => event.type === 'bundle_follow_up_enqueued'),
    ).toHaveLength(3)
  })
})

describe('engine-v2 day flow', () => {
  it('creates a nomination and records the semantic trigger event', () => {
    const state = resolveEngineIntent(
      createEngineState([
        createPlayer('nominator', 'villager'),
        createPlayer('nominee', 'imp', 'evil'),
      ], 'day'),
      createDayStartNominationIntent({
        nominatorId: 'nominator',
        nomineeId: 'nominee',
      }),
    )

    expect(state.day.nominations).toHaveLength(1)
    expect(state.day.currentNominationId).toBe(state.day.nominations[0]?.id ?? null)
    expect(state.events.some((event) => event.type === 'day_nomination_started')).toBe(true)
    expect(
      state.events.some(
        (event) =>
          event.type === 'trigger_recorded' &&
          event.triggerEvent.type === 'nomination_started',
      ),
    ).toBe(true)
  })

  it('spends a dead player ghost vote once and ignores a second attempt', () => {
    let state = resolveEngineIntent(
      createEngineState([
        createPlayer('nominator', 'villager'),
        createPlayer('nominee', 'imp', 'evil'),
        {
          ...createPlayer('ghost', 'dreamer'),
          life: createDeadLifeState(1),
        },
      ], 'day'),
      createDayStartNominationIntent({
        nominatorId: 'nominator',
        nomineeId: 'nominee',
      }),
    )

    const nominationId = state.day.nominations[0]?.id
    expect(nominationId).toBeDefined()

    state = resolveEngineIntent(
      state,
      createDayOpenVoteIntent({
        nominationId: nominationId!,
      }),
    )

    state = resolveEngineIntent(
      state,
      createDayCastVoteIntent({
        nominationId: nominationId!,
        voterId: 'ghost',
      }),
    )
    state = resolveEngineIntent(
      state,
      createDayCastVoteIntent({
        nominationId: nominationId!,
        voterId: 'ghost',
      }),
    )

    expect(state.day.nominations[0]?.ghostVotes).toEqual(['ghost'])
    expect(state.day.ghostVotesSpentByPlayerId.ghost).toBe(true)
    expect(
      state.events.filter(
        (event) =>
          event.type === 'day_vote_cast' &&
          event.nominationId === nominationId &&
          event.voterId === 'ghost',
      ),
    ).toHaveLength(1)
  })

  it('clears the block on a tied top vote and resolves the day as no execution', () => {
    let state = createEngineState([
      createPlayer('n1', 'villager'),
      createPlayer('n2', 'dreamer'),
      createPlayer('a', 'clockmaker'),
      createPlayer('b', 'oracle'),
      createPlayer('c', 'imp', 'evil'),
      createPlayer('d', 'witch', 'evil'),
    ], 'day')

    state = resolveEngineIntent(
      state,
      createDayStartNominationIntent({ nominatorId: 'n1', nomineeId: 'c' }),
    )
    const firstNominationId = state.day.nominations[0]?.id
    expect(firstNominationId).toBeDefined()

    state = resolveEngineIntent(state, createDayOpenVoteIntent({ nominationId: firstNominationId! }))
    state = resolveEngineIntent(
      state,
      createDayCastVoteIntent({ nominationId: firstNominationId!, voterId: 'n1' }),
    )
    state = resolveEngineIntent(
      state,
      createDayCastVoteIntent({ nominationId: firstNominationId!, voterId: 'a' }),
    )
    state = resolveEngineIntent(state, createDayCloseVoteIntent({ nominationId: firstNominationId! }))

    expect(state.day.block).toMatchObject({
      nomineeId: 'c',
      voteCount: 2,
      tied: false,
    })

    state = resolveEngineIntent(
      state,
      createDayStartNominationIntent({ nominatorId: 'n2', nomineeId: 'd' }),
    )
    const secondNominationId = state.day.nominations[1]?.id
    expect(secondNominationId).toBeDefined()

    state = resolveEngineIntent(
      state,
      createDayOpenVoteIntent({ nominationId: secondNominationId! }),
    )
    state = resolveEngineIntent(
      state,
      createDayCastVoteIntent({ nominationId: secondNominationId!, voterId: 'n2' }),
    )
    state = resolveEngineIntent(
      state,
      createDayCastVoteIntent({ nominationId: secondNominationId!, voterId: 'b' }),
    )
    state = resolveEngineIntent(
      state,
      createDayCloseVoteIntent({ nominationId: secondNominationId! }),
    )

    expect(state.day.block).toMatchObject({
      nomineeId: null,
      voteCount: 2,
      tied: true,
      nominationId: null,
    })

    state = resolveEngineIntent(
      state,
      createDayResolveExecutionIntent({ reason: 'Tie on the block.' }),
    )

    expect(state.day.execution).toMatchObject({
      status: 'skipped',
      executedPlayerId: null,
      reason: 'Tie on the block.',
    })
    expect(
      state.events.some(
        (event) =>
          event.type === 'trigger_recorded' && event.triggerEvent.type === 'no_execution',
      ),
    ).toBe(true)
  })

  it('resolves execution through the lethal pipeline and emits onPlayerExecuted semantics', () => {
    let state = resolveEngineIntent(
      createEngineState([
        createPlayer('nominator', 'villager'),
        createPlayer('voter', 'dreamer'),
        createPlayer('nominee', 'imp', 'evil'),
      ], 'day'),
      createDayStartNominationIntent({
        nominatorId: 'nominator',
        nomineeId: 'nominee',
      }),
    )
    const nominationId = state.day.nominations[0]?.id
    expect(nominationId).toBeDefined()

    state = resolveEngineIntent(state, createDayOpenVoteIntent({ nominationId: nominationId! }))
    state = resolveEngineIntent(
      state,
      createDayCastVoteIntent({ nominationId: nominationId!, voterId: 'nominator' }),
    )
    state = resolveEngineIntent(
      state,
      createDayCastVoteIntent({ nominationId: nominationId!, voterId: 'voter' }),
    )
    state = resolveEngineIntent(state, createDayCloseVoteIntent({ nominationId: nominationId! }))
    state = resolveEngineIntent(
      state,
      createDayResolveExecutionIntent({ reason: 'Majority reached.' }),
    )

    expect(getPlayer(state, 'nominee')?.life.projection.trueState).toBe('dead')
    expect(state.day.execution).toMatchObject({
      status: 'resolved',
      executedPlayerId: 'nominee',
      nominationId,
      reason: 'Majority reached.',
    })
    expect(
      state.events.some(
        (event) =>
          event.type === 'trigger_recorded' &&
          event.triggerEvent.type === 'player_executed' &&
          event.triggerEvent.playerId === 'nominee',
      ),
    ).toBe(true)
  })

  it('has Virgin execute a Townsfolk nominator immediately and spend the ability', () => {
    const state = resolveEngineIntent(
      createEngineState([
        createPlayer('virgin', 'virgin'),
        createPlayer('nominator', 'dreamer'),
        createPlayer('observer', 'clockmaker'),
      ], 'day'),
      createDayStartNominationIntent({
        nominatorId: 'nominator',
        nomineeId: 'virgin',
      }),
    )

    expect(getPlayer(state, 'nominator')?.life.projection.trueState).toBe('dead')
    expect(getPlayer(state, 'virgin')?.notes?.virginSpent).toBe(true)
    expect(state.day.execution).toMatchObject({
      status: 'resolved',
      executedPlayerId: 'nominator',
      reason: 'Virgin triggered: a Townsfolk nominated the Virgin.',
    })
    expect(state.day.currentNominationId).toBeNull()
    expect(state.day.nominations[0]?.status).toBe('closed')
    expect(
      state.events.some(
        (event) =>
          event.type === 'trigger_recorded' &&
          event.triggerEvent.type === 'player_executed' &&
          event.triggerEvent.playerId === 'nominator',
      ),
    ).toBe(true)
  })

  it('has Virgin spend without execution when nominated by a non-Townsfolk', () => {
    const state = resolveEngineIntent(
      createEngineState([
        createPlayer('virgin', 'virgin'),
        createPlayer('nominator', 'witch', 'evil'),
        createPlayer('observer', 'clockmaker'),
      ], 'day'),
      createDayStartNominationIntent({
        nominatorId: 'nominator',
        nomineeId: 'virgin',
      }),
    )

    expect(getPlayer(state, 'nominator')?.life.projection.trueState).toBe('alive')
    expect(getPlayer(state, 'virgin')?.notes?.virginSpent).toBe(true)
    expect(state.day.execution.status).toBe('pending')
    expect(state.day.currentNominationId).toBe(state.day.nominations[0]?.id ?? null)
    expect(state.day.nominations[0]?.status).toBe('opened')
  })

  it('has poisoned Virgin spend without executing the nominator', () => {
    const poisonedState = setPlayerPoisonedForPhases(
      createEngineState([
        createPlayer('virgin', 'virgin'),
        createPlayer('nominator', 'dreamer'),
        createPlayer('poisoner', 'poisoner', 'evil'),
      ], 'day'),
      {
        targetPlayerId: 'virgin',
        sourcePlayerId: 'poisoner',
        sourceRoleId: 'poisoner',
        reason: 'Virgin is poisoned.',
        startPhase: 'day',
        endPhase: 'end_of_day',
      },
    )

    const state = resolveEngineIntent(
      poisonedState,
      createDayStartNominationIntent({
        nominatorId: 'nominator',
        nomineeId: 'virgin',
      }),
    )

    expect(getPlayer(state, 'nominator')?.life.projection.trueState).toBe('alive')
    expect(getPlayer(state, 'virgin')?.notes?.virginSpent).toBe(true)
    expect(state.day.execution.status).toBe('pending')
    expect(
      state.events.some(
        (event) =>
          event.type === 'trigger_recorded' &&
          event.triggerEvent.type === 'player_executed' &&
          event.triggerEvent.playerId === 'nominator',
      ),
    ).toBe(false)
  })

  it('does not let Virgin retrigger once the ability is already spent', () => {
    const spentState = setPlayerNote(
      createEngineState([
        createPlayer('virgin', 'virgin'),
        createPlayer('nominator', 'dreamer'),
        createPlayer('observer', 'clockmaker'),
      ], 'day'),
      'virgin',
      'virginSpent',
      true,
    )

    const state = resolveEngineIntent(
      spentState,
      createDayStartNominationIntent({
        nominatorId: 'nominator',
        nomineeId: 'virgin',
      }),
    )

    expect(getPlayer(state, 'nominator')?.life.projection.trueState).toBe('alive')
    expect(state.day.execution.status).toBe('pending')
    expect(state.day.currentNominationId).toBe(state.day.nominations[0]?.id ?? null)
    expect(state.day.nominations[0]?.status).toBe('opened')
  })

  it('has Vortox react to no execution with a semantic storyteller notice', () => {
    const state = resolveEngineIntent(
      createEngineState([
        createPlayer('vortox', 'vortox', 'evil'),
        createPlayer('town', 'dreamer'),
      ], 'day'),
      createDayResolveExecutionIntent({
        reason: 'No nomination beat the block.',
      }),
    )

    expect(state.day.execution).toMatchObject({
      status: 'skipped',
      executedPlayerId: null,
      reason: 'No nomination beat the block.',
    })
    expect(state.pendingStorytellerChoices).toHaveLength(1)
    expect(state.pendingStorytellerChoices[0]).toMatchObject({
      kind: 'boolean_selection',
      sourceRoleId: 'vortox',
      candidatePlayerIds: ['true', 'false'],
    })
  })

  it('suppresses the Vortox no-execution rule while the Vortox is malfunctioning', () => {
    const poisonedState = setPlayerPoisonedForPhases(
      createEngineState([
        createPlayer('vortox', 'vortox', 'evil'),
        createPlayer('town', 'dreamer'),
      ], 'day'),
      {
        targetPlayerId: 'vortox',
        sourcePlayerId: 'town',
        sourceRoleId: 'poisoner',
        reason: 'Vortox is poisoned.',
        startPhase: 'day',
        endPhase: 'end_of_day',
      },
    )

    const state = resolveEngineIntent(
      poisonedState,
      createDayResolveExecutionIntent({
        reason: 'No nomination beat the block.',
      }),
    )

    expect(state.pendingStorytellerChoices.some((choice) => choice.sourceRoleId === 'vortox')).toBe(false)
  })

  it('lets the Storyteller confirm or decline a Vortox outcome proposal', () => {
    const proposed = resolveEngineIntent(
      createEngineState([
        createPlayer('vortox', 'vortox', 'evil'),
        createPlayer('town', 'dreamer'),
      ], 'day'),
      createDayResolveExecutionIntent({
        reason: 'No execution today.',
      }),
    )

    const choiceId = proposed.pendingStorytellerChoices[0]?.id
    expect(choiceId).toBeDefined()

    const declined = resolveStorytellerChoice(proposed, choiceId!, 'false')
    expect(declined.gameOutcome).toMatchObject({
      ended: false,
      winner: null,
    })
    expect(
      declined.events.some((event) => event.type === 'game_outcome_declined'),
    ).toBe(true)

    const confirmed = resolveStorytellerChoice(proposed, choiceId!, 'true')
    expect(confirmed.gameOutcome).toMatchObject({
      ended: true,
      winner: 'demon',
      reason: 'No execution happened while Vortox was in play.',
      sourceRoleId: 'vortox',
    })
    expect(
      confirmed.events.some((event) => event.type === 'game_outcome_resolved'),
    ).toBe(true)
  })

  it('proposes a good win for Mayor when no execution happens with exactly 3 alive-for-win players', () => {
    const proposed = resolveEngineIntent(
      createEngineState([
        createPlayer('mayor', 'mayor'),
        createPlayer('a', 'dreamer'),
        createPlayer('b', 'clockmaker'),
      ], 'day'),
      createDayResolveExecutionIntent({
        reason: 'No execution today.',
      }),
    )

    expect(proposed.pendingStorytellerChoices).toHaveLength(1)
    expect(proposed.pendingStorytellerChoices[0]).toMatchObject({
      kind: 'boolean_selection',
      sourceRoleId: 'mayor',
    })

    const confirmed = resolveStorytellerChoice(
      proposed,
      proposed.pendingStorytellerChoices[0].id,
      'true',
    )

    expect(confirmed.gameOutcome).toMatchObject({
      ended: true,
      winner: 'townsfolk',
      reason:
        'No execution happened with exactly 3 players alive and the Mayor in play.',
      sourceRoleId: 'mayor',
    })
  })

  it('does not propose a Mayor win when the Mayor is poisoned or not alive', () => {
    const poisoned = setPlayerPoisonedForPhases(
      createEngineState([
        createPlayer('mayor', 'mayor'),
        createPlayer('a', 'dreamer'),
        createPlayer('b', 'clockmaker'),
      ], 'day'),
      {
        targetPlayerId: 'mayor',
        sourcePlayerId: 'poisoner',
        sourceRoleId: 'poisoner',
        reason: 'Mayor is poisoned.',
        startPhase: 'day',
        endPhase: 'end_of_day',
      },
    )

    const poisonedResolved = resolveEngineIntent(
      poisoned,
      createDayResolveExecutionIntent({
        reason: 'No execution today.',
      }),
    )

    expect(
      poisonedResolved.pendingStorytellerChoices.some(
        (choice) => choice.sourceRoleId === 'mayor',
      ),
    ).toBe(false)

    const deadMayorState = runLethalIntent(
      createEngineState([
        createPlayer('mayor', 'mayor'),
        createPlayer('a', 'dreamer'),
        createPlayer('b', 'clockmaker'),
        createPlayer('executioner', 'storyteller'),
      ], 'day'),
      createLethalIntent({
        kind: 'execute',
        sourcePlayerId: 'executioner',
        targetPlayerId: 'mayor',
        cause: 'execution',
        phase: 'execution',
        reason: 'Mayor already died.',
        bypasses: ['all_defense'],
      }),
    ).state

    const deadResolved = resolveEngineIntent(
      {
        ...deadMayorState,
        day: {
          ...deadMayorState.day,
          block: {
            nomineeId: null,
            voteCount: 0,
            tied: false,
            nominationId: null,
          },
        },
      },
      createDayResolveExecutionIntent({
        reason: 'No execution today.',
      }),
    )

    expect(
      deadResolved.pendingStorytellerChoices.some(
        (choice) => choice.sourceRoleId === 'mayor',
      ),
    ).toBe(false)
  })

  it('queues Klutz resolution immediately when the Klutz is executed', () => {
    const state = resolveSpecialExecution(
      createEngineState([
        createPlayer('klutz', 'klutz'),
        createPlayer('good', 'dreamer'),
        createPlayer('evil', 'witch', 'evil'),
      ], 'day'),
      {
        executedPlayerId: 'klutz',
        reason: 'Klutz was executed.',
      },
    )

    expect(state.pendingStorytellerChoices).toHaveLength(1)
    expect(state.pendingStorytellerChoices[0]).toMatchObject({
      sourcePlayerId: 'klutz',
      sourceRoleId: 'klutz',
      candidatePlayerIds: ['good', 'evil'],
    })

    const resolved = resolveStorytellerChoice(
      state,
      state.pendingStorytellerChoices[0].id,
      'evil',
    )

    expect(resolved.pendingStorytellerChoices).toHaveLength(1)
    expect(getPlayer(resolved, 'klutz')?.notes?.klutzChoicePending).toBeUndefined()
    expect(getPlayer(resolved, 'klutz')?.notes?.klutzChoiceQueued).toBeUndefined()
    expect(getPlayer(resolved, 'klutz')?.notes?.klutzSelectedTargetId).toBe('evil')
    expect(resolved.pendingStorytellerChoices[0]).toMatchObject({
      kind: 'boolean_selection',
      sourceRoleId: 'klutz',
    })

    const ended = resolveStorytellerChoice(
      resolved,
      resolved.pendingStorytellerChoices[0].id,
      'true',
    )
    expect(ended.gameOutcome).toMatchObject({
      ended: true,
      winner: 'demon',
      reason: 'Klutz publicly chose an evil player.',
      sourceRoleId: 'klutz',
    })
  })

  it('keeps a Witch-cursed nomination open while killing the nominator and queues Klutz follow-up', () => {
    const cursed = applyRoleAbility(
      createEngineState([
        createPlayer('witch', 'witch', 'evil'),
        createPlayer('klutz', 'klutz'),
        createPlayer('nominee', 'dreamer'),
        createPlayer('evil', 'imp', 'evil'),
        createPlayer('good', 'clockmaker'),
      ], 'day'),
      'witch',
      {
        kind: 'curse',
        targetPlayerId: 'klutz',
      },
    )

    const nominated = resolveEngineIntent(
      cursed,
      createDayStartNominationIntent({
        nominatorId: 'klutz',
        nomineeId: 'nominee',
      }),
    )

    const nominationId = nominated.day.nominations[0]?.id
    expect(nominationId).toBeDefined()
    expect(getPlayer(nominated, 'klutz')?.life.projection.trueState).toBe('dead')
    expect(nominated.day.currentNominationId).toBe(nominationId)
    expect(nominated.day.nominations[0]?.status).toBe('opened')
    expect(nominated.pendingStorytellerChoices[0]).toMatchObject({
      sourcePlayerId: 'klutz',
      sourceRoleId: 'klutz',
    })
    expect(nominated.triggerRegistrations).toHaveLength(0)

    const resolvedKlutz = resolveStorytellerChoice(
      nominated,
      nominated.pendingStorytellerChoices[0].id,
      'good',
    )
    expect(resolvedKlutz.pendingStorytellerChoices).toHaveLength(0)
    expect(getPlayer(resolvedKlutz, 'klutz')?.notes?.klutzChoicePending).toBeUndefined()
    expect(getPlayer(resolvedKlutz, 'klutz')?.notes?.klutzChoiceQueued).toBeUndefined()
    expect(getPlayer(resolvedKlutz, 'klutz')?.notes?.klutzSelectedTargetId).toBe('good')

    const locked = resolveEngineIntent(
      resolvedKlutz,
      createDayLockNominationIntent({ nominationId: nominationId! }),
    )
    const opened = resolveEngineIntent(
      locked,
      createDayOpenVoteIntent({ nominationId: nominationId! }),
    )
    const withVotes = resolveEngineIntent(
      resolveEngineIntent(
        opened,
        createDayCastVoteIntent({ nominationId: nominationId!, voterId: 'witch' }),
      ),
      createDayCastVoteIntent({ nominationId: nominationId!, voterId: 'evil' }),
    )
    const closed = resolveEngineIntent(
      withVotes,
      createDayCloseVoteIntent({ nominationId: nominationId! }),
    )
    const executed = resolveEngineIntent(
      closed,
      createDayResolveExecutionIntent({ reason: 'Nomination survives the Witch curse.' }),
    )

    expect(getPlayer(executed, 'nominee')?.life.projection.trueState).toBe('dead')
    expect(executed.day.execution).toMatchObject({
      status: 'resolved',
      executedPlayerId: 'nominee',
      nominationId,
      reason: 'Nomination survives the Witch curse.',
    })
  })

  it('defers Klutz resolution to day start if the Klutz dies at night', () => {
    const nightDeath = runLethalIntent(
      createEngineState([
        createPlayer('imp', 'imp', 'evil'),
        createPlayer('klutz', 'klutz'),
        createPlayer('good', 'dreamer'),
        createPlayer('evil', 'witch', 'evil'),
      ], 'other_night'),
      createLethalIntent({
        kind: 'attack',
        sourcePlayerId: 'imp',
        targetPlayerId: 'klutz',
        cause: 'demon_attack',
        phase: 'other_night',
      }),
    ).state

    expect(getPlayer(nightDeath, 'klutz')?.notes?.klutzChoicePending).toBe(true)
    expect(nightDeath.pendingStorytellerChoices).toHaveLength(0)

    const dayState = startDay(setEnginePhase(nightDeath, 'day'))
    expect(dayState.pendingStorytellerChoices).toHaveLength(1)
    expect(dayState.pendingStorytellerChoices[0]?.sourceRoleId).toBe('klutz')
  })

  it('does not queue Klutz resolution if the Klutz was malfunctioning at death', () => {
    const poisonedState = setPlayerPoisonedForPhases(
      createEngineState([
        createPlayer('klutz', 'klutz'),
        createPlayer('poisoner', 'poisoner', 'evil'),
        createPlayer('good', 'dreamer'),
      ], 'day'),
      {
        targetPlayerId: 'klutz',
        sourcePlayerId: 'poisoner',
        sourceRoleId: 'poisoner',
        reason: 'Klutz is poisoned.',
        startPhase: 'day',
        endPhase: 'end_of_day',
      },
    )

    const state = resolveSpecialExecution(poisonedState, {
      executedPlayerId: 'klutz',
      reason: 'Klutz was executed while poisoned.',
    })

    expect(getPlayer(state, 'klutz')?.notes?.klutzChoicePending).toBeUndefined()
    expect(state.pendingStorytellerChoices).toHaveLength(0)
  })

  it('does not requeue Klutz after the choice has already been resolved', () => {
    const executed = resolveSpecialExecution(
      createEngineState([
        createPlayer('klutz', 'klutz'),
        createPlayer('good', 'dreamer'),
        createPlayer('other', 'clockmaker'),
      ], 'day'),
      {
        executedPlayerId: 'klutz',
        reason: 'Klutz was executed.',
      },
    )

    const resolved = resolveStorytellerChoice(
      executed,
      executed.pendingStorytellerChoices[0].id,
      'good',
    )

    expect(resolved.pendingStorytellerChoices).toHaveLength(0)
    expect(getPlayer(resolved, 'klutz')?.notes?.klutzChoicePending).toBeUndefined()
    expect(getPlayer(resolved, 'klutz')?.notes?.klutzChoiceQueued).toBeUndefined()
    expect(getPlayer(resolved, 'klutz')?.notes?.klutzSelectedTargetId).toBe('good')

    const nextDay = startDay(setEnginePhase(resolved, 'day'))
    expect(nextDay.pendingStorytellerChoices).toHaveLength(0)
  })

  it('queues a Storyteller decision when the Mutant breaks madness', () => {
    const prompted = applyRoleAbility(
      createEngineState([
        createPlayer('mutant', 'mutant'),
        createPlayer('town', 'dreamer'),
        createPlayer('evil', 'witch', 'evil'),
      ], 'day'),
      'mutant',
      {
        kind: 'break_madness',
      },
    )

    expect(prompted.pendingStorytellerChoices).toHaveLength(0)
    expect(prompted.pendingMadnessConsequences).toHaveLength(1)
    expect(prompted.pendingMadnessConsequences[0]).toMatchObject({
      targetPlayerId: 'mutant',
      sourcePlayerId: 'mutant',
      sourceRoleId: 'mutant',
    })

    const declined = resolvePendingMadnessConsequence(
      prompted,
      {
        pendingId: prompted.pendingMadnessConsequences[0].id,
        mode: 'dismiss',
      },
    )
    expect(getPlayer(declined, 'mutant')?.life.projection.trueState).toBe('alive')
    expect(declined.day.execution.status).toBe('pending')
    expect(declined.pendingMadnessConsequences).toHaveLength(0)

    const confirmed = resolvePendingMadnessConsequence(
      prompted,
      {
        pendingId: prompted.pendingMadnessConsequences[0].id,
        mode: 'execute',
      },
    )
    expect(getPlayer(confirmed, 'mutant')?.life.projection.trueState).toBe('dead')
    expect(confirmed.day.execution).toMatchObject({
      status: 'resolved',
      executedPlayerId: 'mutant',
      reason: 'Mutant broke madness.',
    })
  })

  it('suppresses Mutant day pressure while the Mutant is malfunctioning', () => {
    const poisonedState = setPlayerPoisonedForPhases(
      createEngineState([
        createPlayer('mutant', 'mutant'),
        createPlayer('poisoner', 'poisoner', 'evil'),
        createPlayer('town', 'dreamer'),
      ], 'day'),
      {
        targetPlayerId: 'mutant',
        sourcePlayerId: 'poisoner',
        sourceRoleId: 'poisoner',
        reason: 'Mutant is poisoned.',
        startPhase: 'day',
        endPhase: 'end_of_day',
      },
    )

    const state = applyRoleAbility(poisonedState, 'mutant', {
      kind: 'break_madness',
    })

    expect(state.pendingStorytellerChoices).toHaveLength(0)
    expect(state.pendingMadnessConsequences).toHaveLength(0)
    expect(getPlayer(state, 'mutant')?.life.projection.trueState).toBe('alive')
  })

  it('applies Cerenovus madness and queues the player-facing reminder', () => {
    const state = applyRoleAbility(
      createEngineState([
        createPlayer('cerenovus', 'cerenovus', 'evil'),
        createPlayer('target', 'dreamer'),
        createPlayer('other', 'clockmaker'),
      ], 'other_night'),
      'cerenovus',
      {
        kind: 'inflict_madness',
        targetPlayerId: 'target',
        claimRoleId: 'clockmaker',
      },
    )

    expect(state.activeMadnesses).toHaveLength(1)
    expect(state.activeMadnesses[0]).toMatchObject({
      targetPlayerId: 'target',
      claimRoleId: 'clockmaker',
      sourceRoleId: 'cerenovus',
    })
    expect(state.pendingInformation).toHaveLength(1)
    expect(state.pendingInformation[0]).toMatchObject({
      audience: 'player',
      playerId: 'target',
      title: 'Cerenovus',
      sourceRoleId: 'cerenovus',
    })
  })

  it('uses the shared madness break path for Cerenovus targets', () => {
    const cursed = applyRoleAbility(
      createEngineState([
        createPlayer('cerenovus', 'cerenovus', 'evil'),
        createPlayer('target', 'dreamer'),
        createPlayer('other', 'clockmaker'),
      ], 'day'),
      'cerenovus',
      {
        kind: 'inflict_madness',
        targetPlayerId: 'target',
        claimRoleId: 'clockmaker',
      },
    )

    const broken = breakMadness(cursed, {
      playerId: 'target',
      fallbackReason: 'Cerenovus madness was broken.',
      fallbackSourcePlayerId: 'cerenovus',
      fallbackSourceRoleId: 'cerenovus',
    })

    expect(broken.activeMadnesses).toHaveLength(0)
    expect(broken.pendingStorytellerChoices).toHaveLength(0)
    expect(broken.pendingMadnessConsequences).toHaveLength(1)
    expect(broken.pendingMadnessConsequences[0]).toMatchObject({
      targetPlayerId: 'target',
      sourceRoleId: 'cerenovus',
      sourcePlayerId: 'cerenovus',
    })

    const confirmed = resolvePendingMadnessConsequence(
      broken,
      {
        pendingId: broken.pendingMadnessConsequences[0].id,
        mode: 'execute',
      },
    )

    expect(getPlayer(confirmed, 'target')?.life.projection.trueState).toBe('dead')
    expect(confirmed.day.execution).toMatchObject({
      status: 'resolved',
      executedPlayerId: 'target',
      reason: 'Cerenovus madness was broken.',
    })
  })

  it('expires Cerenovus madness at day end if it was not broken', () => {
    const cursed = applyRoleAbility(
      createEngineState([
        createPlayer('cerenovus', 'cerenovus', 'evil'),
        createPlayer('target', 'dreamer'),
        createPlayer('other', 'clockmaker'),
      ], 'day'),
      'cerenovus',
      {
        kind: 'inflict_madness',
        targetPlayerId: 'target',
        claimRoleId: 'clockmaker',
      },
    )

    const ended = recordTriggerEvent(cursed, {
      type: 'day_ended',
    })

    expect(ended.activeMadnesses).toHaveLength(0)
    expect(
      ended.events.some(
        (event) => event.type === 'madness_cleared' && event.madness.targetPlayerId === 'target',
      ),
    ).toBe(true)
  })

  it('allows a pending madness consequence to be resolved later as a quiet kill', () => {
    const cursed = breakMadness(
      applyRoleAbility(
        createEngineState([
          createPlayer('cerenovus', 'cerenovus', 'evil'),
          createPlayer('target', 'dreamer'),
          createPlayer('other', 'clockmaker'),
        ], 'day'),
        'cerenovus',
        {
          kind: 'inflict_madness',
          targetPlayerId: 'target',
          claimRoleId: 'clockmaker',
        },
      ),
      {
        playerId: 'target',
        fallbackReason: 'Cerenovus madness was broken.',
        fallbackSourcePlayerId: 'cerenovus',
        fallbackSourceRoleId: 'cerenovus',
      },
    )

    const nightState = setEnginePhase(cursed, 'other_night')
    const resolved = resolvePendingMadnessConsequence(nightState, {
      pendingId: nightState.pendingMadnessConsequences[0].id,
      mode: 'kill',
    })

    expect(getPlayer(resolved, 'target')?.life.projection.trueState).toBe('dead')
    expect(resolved.pendingMadnessConsequences).toHaveLength(0)
    expect(
      resolved.events.some(
        (event) =>
          event.type === 'player_died' &&
          event.intent.targetPlayerId === 'target' &&
          event.intent.cause === 'storyteller_arbitrary',
      ),
    ).toBe(true)
  })

  it('links Evil Twins and queues reveal information for both players', () => {
    const state = applyRoleAbility(
      createEngineState([
        createPlayer('evilTwin', 'evil_twin', 'evil'),
        createPlayer('goodTwin', 'clockmaker'),
        createPlayer('other', 'dreamer'),
      ], 'day'),
      'evilTwin',
      {
        kind: 'link_twin',
        targetPlayerId: 'goodTwin',
      },
    )

    expect(getPlayer(state, 'evilTwin')?.notes?.evilTwinCounterpartId).toBe('goodTwin')
    expect(getPlayer(state, 'evilTwin')?.notes?.evilTwinIsEvil).toBe(true)
    expect(getPlayer(state, 'goodTwin')?.notes?.evilTwinCounterpartId).toBe('evilTwin')
    expect(getPlayer(state, 'goodTwin')?.notes?.evilTwinIsEvil).toBe(false)
    expect(state.pendingInformation).toHaveLength(2)
  })

  it('proposes an evil win when the Good Twin is executed', () => {
    const linked = applyRoleAbility(
      createEngineState([
        createPlayer('evilTwin', 'evil_twin', 'evil'),
        createPlayer('goodTwin', 'clockmaker'),
        createPlayer('other', 'dreamer'),
      ], 'day'),
      'evilTwin',
      {
        kind: 'link_twin',
        targetPlayerId: 'goodTwin',
      },
    )

    const executed = resolveSpecialExecution(linked, {
      executedPlayerId: 'goodTwin',
      reason: 'Good Twin was executed.',
    })

    expect(executed.pendingStorytellerChoices).toHaveLength(1)
    expect(executed.pendingStorytellerChoices[0]).toMatchObject({
      kind: 'boolean_selection',
      sourceRoleId: 'evil_twin',
    })

    const confirmed = resolveStorytellerChoice(
      executed,
      executed.pendingStorytellerChoices[0].id,
      'true',
    )
    expect(confirmed.gameOutcome).toMatchObject({
      ended: true,
      winner: 'demon',
      sourceRoleId: 'evil_twin',
    })
  })

  it('proposes a good win when the Evil Twin is executed', () => {
    const linked = applyRoleAbility(
      createEngineState([
        createPlayer('evilTwin', 'evil_twin', 'evil'),
        createPlayer('goodTwin', 'clockmaker'),
        createPlayer('other', 'dreamer'),
      ], 'day'),
      'evilTwin',
      {
        kind: 'link_twin',
        targetPlayerId: 'goodTwin',
      },
    )

    const executed = resolveSpecialExecution(linked, {
      executedPlayerId: 'evilTwin',
      reason: 'Evil Twin was executed.',
    })

    expect(executed.pendingStorytellerChoices).toHaveLength(1)

    const confirmed = resolveStorytellerChoice(
      executed,
      executed.pendingStorytellerChoices[0].id,
      'true',
    )
    expect(confirmed.gameOutcome).toMatchObject({
      ended: true,
      winner: 'townsfolk',
      sourceRoleId: 'evil_twin',
    })
  })
})
