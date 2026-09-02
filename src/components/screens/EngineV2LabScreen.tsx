import { useMemo, useState } from 'react'
import { BackButton, Button, Icon } from '../atoms'
import {
  breakMadness,
  createTimedStatusEffect,
  createAliveLifeState,
  applyRoleAbility,
  createEngineState,
  createDayCastVoteIntent,
  createDayCloseVoteIntent,
  createDayLockNominationIntent,
  createDayOpenVoteIntent,
  createDayResolveExecutionIntent,
  createDayStartNominationIntent,
  createInformationIntent,
  createLethalIntent,
  deliverInformation,
  getPlayer,
  getResolvedRoleTeam,
  hasEffectiveStatusEffect,
  recordTriggerEvent,
  resolveEngineIntent,
  resolvePendingMadnessConsequence,
  resolveStorytellerChoice,
  runLethalIntent,
  scheduleLethalIntent,
  setEnginePhase,
  setPlayerDrunkForPhases,
  setPlayerPoisonedForPhases,
  registerTriggerAction,
  appearsDeadToTown,
  countsAsAliveForWin,
  type EngineEvent,
  type EngineState,
} from '../../lib/engine-v2'

type Props = {
  onBack: () => void
}

type LabPreset = {
  id: string
  name: string
  description: string
  build: () => EngineState
}

function buildInitialState(): EngineState {
  return createEngineState([
    {
      id: 'demon',
      name: 'Demon',
      roleId: 'imp',
      alignment: 'evil',
      life: createAliveLifeState(),
    },
    {
      id: 'monk',
      name: 'Monk',
      roleId: 'monk',
      alignment: 'good',
      life: createAliveLifeState(),
    },
    {
      id: 'witch',
      name: 'Witch',
      roleId: 'witch',
      alignment: 'evil',
      life: createAliveLifeState(),
    },
    {
      id: 'teaLady',
      name: 'Tea Lady',
      roleId: 'tea_lady',
      alignment: 'good',
      life: createAliveLifeState(),
    },
    {
      id: 'target',
      name: 'Target',
      roleId: 'dreamer',
      alignment: 'good',
      life: createAliveLifeState(),
    },
    {
      id: 'host',
      name: 'Host',
      roleId: 'monk',
      alignment: 'good',
      life: createAliveLifeState(),
    },
  ])
}

function buildMonkVsAttackPreset(): EngineState {
  return applyRoleAbility(buildInitialState(), 'monk', {
    kind: 'protect',
    targetPlayerId: 'target',
  })
}

function buildWitchCursePreset(): EngineState {
  return applyRoleAbility(buildInitialState(), 'witch', {
    kind: 'curse',
    targetPlayerId: 'target',
  })
}

function buildTeaLadyProtectionPreset(): EngineState {
  return createEngineState([
    {
      id: 'outsider',
      name: 'Left Neighbor',
      roleId: 'dreamer',
      alignment: 'good',
      life: createAliveLifeState(),
    },
    {
      id: 'teaLady',
      name: 'Tea Lady',
      roleId: 'tea_lady',
      alignment: 'good',
      life: createAliveLifeState(),
    },
    {
      id: 'target',
      name: 'Right Neighbor',
      roleId: 'monk',
      alignment: 'good',
      life: createAliveLifeState(),
    },
    {
      id: 'demon',
      name: 'Demon',
      roleId: 'imp',
      alignment: 'evil',
      life: createAliveLifeState(),
    },
    {
      id: 'witch',
      name: 'Witch',
      roleId: 'witch',
      alignment: 'evil',
      life: createAliveLifeState(),
    },
  ])
}

function buildPublicDeathPreset(): EngineState {
  return runLethalIntent(
    buildInitialState(),
    createLethalIntent({
      kind: 'execute',
      sourcePlayerId: 'demon',
      targetPlayerId: 'target',
      cause: 'execution',
      phase: 'execution',
      reason: 'Public death state test',
      tags: ['public_death_only'],
    }),
  ).state
}

function buildVigormortisTiePreset(): EngineState {
  return createEngineState([
    {
      id: 'leftTown',
      name: 'Left Town',
      roleId: 'dreamer',
      alignment: 'good',
      life: createAliveLifeState(),
    },
    {
      id: 'witch',
      name: 'Dead Minion Target',
      roleId: 'witch',
      alignment: 'evil',
      life: createAliveLifeState(),
    },
    {
      id: 'rightTown',
      name: 'Right Town',
      roleId: 'clockmaker',
      alignment: 'good',
      life: createAliveLifeState(),
    },
    {
      id: 'vig',
      name: 'Vigormortis',
      roleId: 'vigormortis',
      alignment: 'evil',
      life: createAliveLifeState(),
    },
  ])
}

function buildSweetheartPreset(): EngineState {
  return createEngineState([
    {
      id: 'imp',
      name: 'Imp',
      roleId: 'imp',
      alignment: 'evil',
      life: createAliveLifeState(),
    },
    {
      id: 'sweetheart',
      name: 'Sweetheart',
      roleId: 'sweetheart',
      alignment: 'good',
      life: createAliveLifeState(),
    },
    {
      id: 'targetA',
      name: 'Target A',
      roleId: 'dreamer',
      alignment: 'good',
      life: createAliveLifeState(),
    },
    {
      id: 'targetB',
      name: 'Target B',
      roleId: 'clockmaker',
      alignment: 'good',
      life: createAliveLifeState(),
    },
  ])
}

function buildSnakeCharmerPreset(): EngineState {
  return createEngineState([
    {
      id: 'charmer',
      name: 'Snake Charmer',
      roleId: 'snake_charmer',
      alignment: 'good',
      life: createAliveLifeState(),
    },
    {
      id: 'demon',
      name: 'Imp',
      roleId: 'imp',
      alignment: 'evil',
      life: createAliveLifeState(),
    },
    {
      id: 'observer',
      name: 'Observer',
      roleId: 'dreamer',
      alignment: 'good',
      life: createAliveLifeState(),
    },
  ])
}

function buildPitHagPreset(): EngineState {
  return createEngineState([
    {
      id: 'pit',
      name: 'Pit Hag',
      roleId: 'pit_hag',
      alignment: 'evil',
      life: createAliveLifeState(),
    },
    {
      id: 'target',
      name: 'Target',
      roleId: 'savant',
      alignment: 'good',
      life: createAliveLifeState(),
    },
    {
      id: 'minion',
      name: 'Witch',
      roleId: 'witch',
      alignment: 'evil',
      life: createAliveLifeState(),
    },
    {
      id: 'demon',
      name: 'Imp',
      roleId: 'imp',
      alignment: 'evil',
      life: createAliveLifeState(),
    },
  ])
}

function buildChefPreset(): EngineState {
  return createEngineState([
    {
      id: 'chef',
      name: 'Chef',
      roleId: 'chef',
      alignment: 'good',
      life: createAliveLifeState(),
    },
    {
      id: 'evilA',
      name: 'Evil A',
      roleId: 'witch',
      alignment: 'evil',
      life: createAliveLifeState(),
    },
    {
      id: 'evilB',
      name: 'Evil B',
      roleId: 'imp',
      alignment: 'evil',
      life: createAliveLifeState(),
    },
    {
      id: 'goodA',
      name: 'Good A',
      roleId: 'dreamer',
      alignment: 'good',
      life: createAliveLifeState(),
    },
  ], 'setup')
}

function buildEmpathPreset(): EngineState {
  return createEngineState([
    {
      id: 'left',
      name: 'Left Neighbor',
      roleId: 'witch',
      alignment: 'evil',
      life: createAliveLifeState(),
    },
    {
      id: 'empath',
      name: 'Empath',
      roleId: 'empath',
      alignment: 'good',
      life: createAliveLifeState(),
    },
    {
      id: 'right',
      name: 'Right Neighbor',
      roleId: 'clockmaker',
      alignment: 'good',
      life: createAliveLifeState(),
    },
  ], 'setup')
}

function buildOraclePreset(): EngineState {
  return createEngineState([
    {
      id: 'oracle',
      name: 'Oracle',
      roleId: 'oracle',
      alignment: 'good',
      life: createAliveLifeState(),
    },
    {
      id: 'deadMinion',
      name: 'Dead Witch',
      roleId: 'witch',
      alignment: 'evil',
      life: { ...createAliveLifeState(), projection: { ...createAliveLifeState().projection, trueState: 'dead', publicState: 'dead', countsAsAliveForWin: false, canWake: false, canNominate: false, canVote: false }, kind: 'dead', deathCount: 1 },
    },
    {
      id: 'deadGood',
      name: 'Dead Dreamer',
      roleId: 'dreamer',
      alignment: 'good',
      life: { ...createAliveLifeState(), projection: { ...createAliveLifeState().projection, trueState: 'dead', publicState: 'dead', countsAsAliveForWin: false, canWake: false, canNominate: false, canVote: false }, kind: 'dead', deathCount: 1 },
    },
    {
      id: 'imp',
      name: 'Imp',
      roleId: 'imp',
      alignment: 'evil',
      life: createAliveLifeState(),
    },
  ], 'other_night')
}

function buildFlowergirlPreset(): EngineState {
  const dayState = createEngineState([
    {
      id: 'flowergirl',
      name: 'Flowergirl',
      roleId: 'flowergirl',
      alignment: 'good',
      life: createAliveLifeState(),
    },
    {
      id: 'imp',
      name: 'Imp',
      roleId: 'imp',
      alignment: 'evil',
      life: createAliveLifeState(),
    },
    {
      id: 'villager',
      name: 'Villager',
      roleId: 'dreamer',
      alignment: 'good',
      life: createAliveLifeState(),
    },
  ], 'day')

  return recordTriggerEvent(dayState, {
    type: 'day_ended',
    data: {
      votedPlayerIds: ['imp'],
    },
  })
}

function buildTownCrierPreset(): EngineState {
  const dayState = createEngineState([
    {
      id: 'townCrier',
      name: 'Town Crier',
      roleId: 'town_crier',
      alignment: 'good',
      life: createAliveLifeState(),
    },
    {
      id: 'minion',
      name: 'Witch',
      roleId: 'witch',
      alignment: 'evil',
      life: createAliveLifeState(),
    },
    {
      id: 'villager',
      name: 'Villager',
      roleId: 'dreamer',
      alignment: 'good',
      life: createAliveLifeState(),
    },
  ], 'day')

  return recordTriggerEvent(dayState, {
    type: 'day_ended',
    data: {
      nominatorIds: ['minion'],
    },
  })
}

function buildMathematicianPreset(): EngineState {
  return createEngineState([
    {
      id: 'mathematician',
      name: 'Mathematician',
      roleId: 'mathematician',
      alignment: 'good',
      life: createAliveLifeState(),
    },
    {
      id: 'imp',
      name: 'Imp',
      roleId: 'imp',
      alignment: 'evil',
      life: createAliveLifeState(),
    },
    {
      id: 'villager',
      name: 'Villager',
      roleId: 'dreamer',
      alignment: 'good',
      life: createAliveLifeState(),
    },
  ], 'other_night')
}

function buildSeamstressPreset(): EngineState {
  return createEngineState([
    {
      id: 'seamstress',
      name: 'Seamstress',
      roleId: 'seamstress',
      alignment: 'good',
      life: createAliveLifeState(),
    },
    {
      id: 'goodA',
      name: 'Good A',
      roleId: 'dreamer',
      alignment: 'good',
      life: createAliveLifeState(),
    },
    {
      id: 'goodB',
      name: 'Good B',
      roleId: 'clockmaker',
      alignment: 'good',
      life: createAliveLifeState(),
    },
    {
      id: 'evilA',
      name: 'Evil A',
      roleId: 'witch',
      alignment: 'evil',
      life: createAliveLifeState(),
    },
  ])
}

function buildDreamerPreset(): EngineState {
  return createEngineState([
    {
      id: 'dreamer',
      name: 'Dreamer',
      roleId: 'dreamer',
      alignment: 'good',
      life: createAliveLifeState(),
    },
    {
      id: 'targetGood',
      name: 'Target Good',
      roleId: 'clockmaker',
      alignment: 'good',
      life: createAliveLifeState(),
    },
    {
      id: 'targetEvil',
      name: 'Target Evil',
      roleId: 'witch',
      alignment: 'evil',
      life: createAliveLifeState(),
    },
  ])
}

function buildFortuneTellerPreset(): EngineState {
  return createEngineState([
    {
      id: 'fortune',
      name: 'Fortune Teller',
      roleId: 'fortune_teller',
      alignment: 'good',
      life: createAliveLifeState(),
    },
    {
      id: 'targetGood',
      name: 'Target Good',
      roleId: 'clockmaker',
      alignment: 'good',
      life: createAliveLifeState(),
    },
    {
      id: 'targetEvil',
      name: 'Target Evil',
      roleId: 'imp',
      alignment: 'evil',
      life: createAliveLifeState(),
    },
  ])
}

function buildWasherwomanPreset(): EngineState {
  return createEngineState([
    {
      id: 'washerwoman',
      name: 'Washerwoman',
      roleId: 'washerwoman',
      alignment: 'good',
      life: createAliveLifeState(),
    },
    {
      id: 'town',
      name: 'Clockmaker',
      roleId: 'clockmaker',
      alignment: 'good',
      life: createAliveLifeState(),
    },
    {
      id: 'decoy',
      name: 'Dreamer',
      roleId: 'dreamer',
      alignment: 'good',
      life: createAliveLifeState(),
    },
    {
      id: 'evil',
      name: 'Witch',
      roleId: 'witch',
      alignment: 'evil',
      life: createAliveLifeState(),
    },
  ], 'setup')
}

function buildUndertakerPreset(): EngineState {
  const executed = runLethalIntent(
    createEngineState([
      {
        id: 'undertaker',
        name: 'Undertaker',
        roleId: 'undertaker',
        alignment: 'good',
        life: createAliveLifeState(),
      },
      {
        id: 'executioner',
        name: 'Executioner',
        roleId: 'storyteller',
        alignment: 'good',
        life: createAliveLifeState(),
      },
      {
        id: 'target',
        name: 'Executed Dreamer',
        roleId: 'dreamer',
        alignment: 'good',
        life: createAliveLifeState(),
      },
      {
        id: 'imp',
        name: 'Imp',
        roleId: 'imp',
        alignment: 'evil',
        life: createAliveLifeState(),
      },
    ], 'execution'),
    createLethalIntent({
      kind: 'execute',
      sourcePlayerId: 'executioner',
      targetPlayerId: 'target',
      cause: 'execution',
      phase: 'execution',
      reason: 'Undertaker preset execution',
    }),
  ).state

  return recordTriggerEvent(setEnginePhase(executed, 'day'), {
    type: 'day_ended',
    data: {
      executedPlayerId: 'target',
    },
  })
}

function buildRavenkeeperPreset(): EngineState {
  return runLethalIntent(
    createEngineState([
      {
        id: 'raven',
        name: 'Ravenkeeper',
        roleId: 'ravenkeeper',
        alignment: 'good',
        life: createAliveLifeState(),
      },
      {
        id: 'imp',
        name: 'Imp',
        roleId: 'imp',
        alignment: 'evil',
        life: createAliveLifeState(),
      },
      {
        id: 'target',
        name: 'Dreamer',
        roleId: 'dreamer',
        alignment: 'good',
        life: createAliveLifeState(),
      },
    ], 'other_night'),
    createLethalIntent({
      kind: 'attack',
      sourcePlayerId: 'imp',
      targetPlayerId: 'raven',
      cause: 'demon_attack',
      phase: 'other_night',
      reason: 'Ravenkeeper preset death',
    }),
  ).state
}

function buildSagePreset(): EngineState {
  return runLethalIntent(
    createEngineState([
      {
        id: 'sage',
        name: 'Sage',
        roleId: 'sage',
        alignment: 'good',
        life: createAliveLifeState(),
      },
      {
        id: 'imp',
        name: 'Imp',
        roleId: 'imp',
        alignment: 'evil',
        life: createAliveLifeState(),
      },
      {
        id: 'villager',
        name: 'Villager',
        roleId: 'dreamer',
        alignment: 'good',
        life: createAliveLifeState(),
      },
      {
        id: 'outsider',
        name: 'Artist',
        roleId: 'artist',
        alignment: 'good',
        life: createAliveLifeState(),
      },
    ], 'other_night'),
    createLethalIntent({
      kind: 'attack',
      sourcePlayerId: 'imp',
      targetPlayerId: 'sage',
      cause: 'demon_attack',
      phase: 'other_night',
      reason: 'Sage preset death',
    }),
  ).state
}

function buildArtistPreset(): EngineState {
  return createEngineState([
    {
      id: 'artist',
      name: 'Artist',
      roleId: 'artist',
      alignment: 'good',
      life: createAliveLifeState(),
    },
    {
      id: 'imp',
      name: 'Imp',
      roleId: 'imp',
      alignment: 'evil',
      life: createAliveLifeState(),
    },
    {
      id: 'villager',
      name: 'Villager',
      roleId: 'dreamer',
      alignment: 'good',
      life: createAliveLifeState(),
    },
  ], 'day')
}

function buildVirginDayPreset(): EngineState {
  return createEngineState([
    {
      id: 'virgin',
      name: 'Virgin',
      roleId: 'virgin',
      alignment: 'good',
      life: createAliveLifeState(),
    },
    {
      id: 'townsfolkNominator',
      name: 'Good Townsfolk',
      roleId: 'clockmaker',
      alignment: 'good',
      life: createAliveLifeState(),
    },
    {
      id: 'outsider',
      name: 'Outsider',
      roleId: 'klutz',
      alignment: 'good',
      life: createAliveLifeState(),
    },
    {
      id: 'witch',
      name: 'Witch',
      roleId: 'witch',
      alignment: 'evil',
      life: createAliveLifeState(),
    },
    {
      id: 'imp',
      name: 'Imp',
      roleId: 'imp',
      alignment: 'evil',
      life: createAliveLifeState(),
    },
  ], 'day')
}

function buildWitchKlutzDayPreset(): EngineState {
  return applyRoleAbility(
    createEngineState([
      {
        id: 'witch',
        name: 'Witch',
        roleId: 'witch',
        alignment: 'evil',
        life: createAliveLifeState(),
      },
      {
        id: 'klutz',
        name: 'Klutz',
        roleId: 'klutz',
        alignment: 'good',
        life: createAliveLifeState(),
      },
      {
        id: 'nominee',
        name: 'Nominee',
        roleId: 'dreamer',
        alignment: 'good',
        life: createAliveLifeState(),
      },
      {
        id: 'evilTwin',
        name: 'Evil Player',
        roleId: 'imp',
        alignment: 'evil',
        life: createAliveLifeState(),
      },
      {
        id: 'bystander',
        name: 'Bystander',
        roleId: 'clockmaker',
        alignment: 'good',
        life: createAliveLifeState(),
      },
    ], 'day'),
    'witch',
    {
      kind: 'curse',
      targetPlayerId: 'klutz',
    },
  )
}

function buildMutantPreset(): EngineState {
  return createEngineState([
    {
      id: 'mutant',
      name: 'Mutant',
      roleId: 'mutant',
      alignment: 'good',
      life: createAliveLifeState(),
    },
    {
      id: 'town',
      name: 'Townsfolk',
      roleId: 'clockmaker',
      alignment: 'good',
      life: createAliveLifeState(),
    },
    {
      id: 'evil',
      name: 'Minion',
      roleId: 'witch',
      alignment: 'evil',
      life: createAliveLifeState(),
    },
  ], 'day')
}

function buildEvilTwinPreset(): EngineState {
  return createEngineState([
    {
      id: 'evilTwin',
      name: 'Evil Twin',
      roleId: 'evil_twin',
      alignment: 'evil',
      life: createAliveLifeState(),
    },
    {
      id: 'goodTwin',
      name: 'Good Twin',
      roleId: 'clockmaker',
      alignment: 'good',
      life: createAliveLifeState(),
    },
    {
      id: 'bystander',
      name: 'Bystander',
      roleId: 'dreamer',
      alignment: 'good',
      life: createAliveLifeState(),
    },
    {
      id: 'demon',
      name: 'Imp',
      roleId: 'imp',
      alignment: 'evil',
      life: createAliveLifeState(),
    },
  ], 'day')
}

function buildCerenovusPreset(): EngineState {
  return createEngineState([
    {
      id: 'cerenovus',
      name: 'Cerenovus',
      roleId: 'cerenovus',
      alignment: 'evil',
      life: createAliveLifeState(),
    },
    {
      id: 'target',
      name: 'Target',
      roleId: 'dreamer',
      alignment: 'good',
      life: createAliveLifeState(),
    },
    {
      id: 'bystander',
      name: 'Bystander',
      roleId: 'clockmaker',
      alignment: 'good',
      life: createAliveLifeState(),
    },
    {
      id: 'demon',
      name: 'Imp',
      roleId: 'imp',
      alignment: 'evil',
      life: createAliveLifeState(),
    },
  ], 'day')
}

const LAB_PRESETS: LabPreset[] = [
  {
    id: 'baseline',
    name: 'Baseline',
    description: 'Fresh state with no effects applied.',
    build: buildInitialState,
  },
  {
    id: 'monk_attack',
    name: 'Monk vs Attack',
    description: 'Target starts protected so the next attack should be prevented.',
    build: buildMonkVsAttackPreset,
  },
  {
    id: 'witch_curse',
    name: 'Witch Delayed Death',
    description: 'Curse is already registered. Fire the nomination trigger next.',
    build: buildWitchCursePreset,
  },
  {
    id: 'tea_lady',
    name: 'Tea Lady Protection',
    description: 'Tea Lady sits between two good alive neighbors with protection active.',
    build: buildTeaLadyProtectionPreset,
  },
  {
    id: 'public_death',
    name: 'Public Death / Hidden Alive',
    description: 'Target already looks dead publicly but still counts alive internally.',
    build: buildPublicDeathPreset,
  },
  {
    id: 'vigormortis_tie',
    name: 'Vigormortis Tie',
    description: 'Kill the minion, then inspect the Storyteller tie-break for poison.',
    build: buildVigormortisTiePreset,
  },
  {
    id: 'sweetheart',
    name: 'Sweetheart Death',
    description: 'Kill Sweetheart, then inspect the arbitrary Storyteller drunk prompt.',
    build: buildSweetheartPreset,
  },
  {
    id: 'snake_charmer',
    name: 'Snake Charmer Swap',
    description: 'Charm the Demon to swap role, alignment, poison, and queue reveal packets.',
    build: buildSnakeCharmerPreset,
  },
  {
    id: 'pit_hag',
    name: 'Pit Hag Transform',
    description: 'Transform a player into an out-of-play role and inspect the follow-up notices.',
    build: buildPitHagPreset,
  },
  {
    id: 'chef',
    name: 'Chef',
    description: 'Chef learns the number of adjacent evil pairs, or a constrained false number if malfunctioning.',
    build: buildChefPreset,
  },
  {
    id: 'empath',
    name: 'Empath',
    description: 'Empath learns the number of evil alive neighbors, or a constrained false number if malfunctioning.',
    build: buildEmpathPreset,
  },
  {
    id: 'oracle',
    name: 'Oracle Info',
    description: 'Oracle learns the number of dead evil players during other nights.',
    build: buildOraclePreset,
  },
  {
    id: 'seamstress',
    name: 'Seamstress Compare',
    description: 'Seamstress compares the alignments of two chosen players.',
    build: buildSeamstressPreset,
  },
  {
    id: 'dreamer',
    name: 'Dreamer Inspect',
    description: 'Dreamer chooses a player and sees one good role and one evil role, one correct.',
    build: buildDreamerPreset,
  },
  {
    id: 'flowergirl',
    name: 'Flowergirl',
    description: 'Flowergirl checks whether the Demon voted during the previous day.',
    build: buildFlowergirlPreset,
  },
  {
    id: 'town_crier',
    name: 'Town Crier',
    description: 'Town Crier checks whether a Minion nominated during the previous day.',
    build: buildTownCrierPreset,
  },
  {
    id: 'mathematician',
    name: 'Mathematician',
    description: 'Mathematician stays Storyteller-driven through a bounded number choice.',
    build: buildMathematicianPreset,
  },
  {
    id: 'fortune_teller',
    name: 'Fortune Teller',
    description: 'Fortune Teller chooses two players and gets a yes-no result, or a constrained malfunction choice.',
    build: buildFortuneTellerPreset,
  },
  {
    id: 'washerwoman',
    name: 'Washerwoman Signal',
    description: 'Choose a valid Townsfolk role, then choose the decoy player to show alongside the real holder.',
    build: buildWasherwomanPreset,
  },
  {
    id: 'undertaker',
    name: 'Undertaker',
    description: 'An execution already happened. Advance to other night or learn the executed role directly.',
    build: buildUndertakerPreset,
  },
  {
    id: 'ravenkeeper',
    name: 'Ravenkeeper',
    description: 'Ravenkeeper already died at night and can inspect a player while dead.',
    build: buildRavenkeeperPreset,
  },
  {
    id: 'sage',
    name: 'Sage',
    description: 'Sage was just killed by the Demon and should receive a Demon pair prompt.',
    build: buildSagePreset,
  },
  {
    id: 'artist',
    name: 'Artist',
    description: 'Artist asks a one-time yes-no question and receives a Storyteller answer.',
    build: buildArtistPreset,
  },
  {
    id: 'virgin_day',
    name: 'Virgin Day Flow',
    description: 'Use the day pipeline below to nominate the Virgin with a Townsfolk and watch the special execution fire immediately.',
    build: buildVirginDayPreset,
  },
  {
    id: 'witch_klutz_day',
    name: 'Witch + Klutz Day Flow',
    description: 'Klutz starts cursed. Use the day pipeline to nominate, kill the nominator, then resolve the Klutz follow-up choice.',
    build: buildWitchKlutzDayPreset,
  },
  {
    id: 'mutant',
    name: 'Mutant Day Pressure',
    description: 'Use the Mutant action to queue a Storyteller execution choice after madness is broken.',
    build: buildMutantPreset,
  },
  {
    id: 'evil_twin',
    name: 'Evil Twin Link',
    description: 'Link the twins, deliver their reveal packets, then execute either twin to test the outcome proposal.',
    build: buildEvilTwinPreset,
  },
  {
    id: 'cerenovus',
    name: 'Cerenovus Madness',
    description: 'Apply madness to a player, inspect the active pressure, then break it and resolve the execution choice.',
    build: buildCerenovusPreset,
  },
]

function formatEvent(event: EngineEvent): string {
  switch (event.type) {
    case 'intent_created':
      return `Intent created: ${event.intent.kind} -> ${event.intent.targetPlayerId}`
    case 'intent_resolved':
      return `Resolved: ${event.outcome.kind}`
    case 'player_died':
      return `Death committed: ${event.intent.targetPlayerId}`
    case 'death_prevented':
      return `Death prevented: ${event.outcome.reason}`
    case 'death_survived':
      return `Death survived: ${event.outcome.reason}`
    case 'public_death_recorded':
      return `Public death only: ${event.intent.targetPlayerId}`
    case 'intent_scheduled':
      return `Scheduled lethal: ${event.scheduledIntent.intent.targetPlayerId}`
    case 'scheduled_intent_released':
      return `Released lethal: ${event.scheduledIntent.intent.targetPlayerId}`
    case 'phase_changed':
      return `Phase -> ${event.phase}`
    case 'trigger_recorded':
      return `Trigger -> ${event.triggerEvent.type}${event.triggerEvent.playerId ? ` (${event.triggerEvent.playerId})` : ''}`
    case 'status_effect_scheduled':
      return `Scheduled ${event.scheduledEffect.effect.type}: ${event.scheduledEffect.effect.targetPlayerId}`
    case 'status_effect_applied':
      return `Applied ${event.effect.type}: ${event.effect.targetPlayerId}`
    case 'status_effect_expired':
      return `Expired ${event.effect.type}: ${event.effect.targetPlayerId}`
    case 'trigger_registration_added':
      return `Registered trigger: ${event.registration.label ?? event.registration.id}`
    case 'trigger_registration_fired':
      return `Trigger fired: ${event.registration.label ?? event.registration.id}`
    case 'trigger_registration_expired':
      return `Trigger expired: ${event.registration.label ?? event.registration.id}`
    case 'day_nomination_started':
      return `Nomination started: ${event.nomination.nominatorId} -> ${event.nomination.nomineeId}`
    case 'day_nomination_locked':
      return `Nomination locked: ${event.nominationId}`
    case 'day_vote_opened':
      return `Vote opened: ${event.nominationId}`
    case 'day_vote_cast':
      return `Vote cast: ${event.voterId}${event.ghostVote ? ' (ghost)' : ''}`
    case 'day_vote_closed':
      return `Vote closed: ${event.totalVotes} total`
    case 'day_block_updated':
      return event.block.tied
        ? `Block tied at ${event.block.voteCount}`
        : `Block set: ${event.block.nomineeId ?? 'none'} (${event.block.voteCount})`
    case 'day_execution_resolved':
      return `Execution resolved: ${event.executedPlayerId}`
    case 'day_execution_skipped':
      return 'Execution skipped'
    case 'game_outcome_resolved':
      return `Game ended: ${event.winner} (${event.sourceRoleId ?? 'core'})`
    case 'game_outcome_declined':
      return `Outcome declined: ${event.winner} (${event.sourceRoleId ?? 'core'})`
    case 'player_note_set':
      return `Note set: ${event.playerId}.${event.key}`
    case 'player_note_cleared':
      return `Note cleared: ${event.playerId}.${event.key}`
    case 'madness_applied':
      return `Madness applied: ${event.madness.targetPlayerId}${event.madness.claimRoleId ? ` as ${event.madness.claimRoleId}` : ''}`
    case 'madness_cleared':
      return `Madness cleared: ${event.madness.targetPlayerId}`
    case 'madness_broken':
      return `Madness broken: ${event.madness.targetPlayerId}`
    case 'pending_madness_consequence_added':
      return `Pending madness consequence: ${event.consequence.targetPlayerId}`
    case 'pending_madness_consequence_cleared':
      return `Pending madness cleared: ${event.consequence.targetPlayerId}`
    case 'ability_use_recorded':
      return `Ability used: ${event.playerId}.${event.abilityId} (${event.useCount})`
    case 'ability_override_added':
      return `Ability override added: ${event.override.playerId}.${event.override.abilityId ?? 'all'}`
    case 'ability_override_removed':
      return `Ability override removed: ${event.override.playerId}.${event.override.abilityId ?? 'all'}`
    case 'bundle_started':
      return `Bundle started: ${event.label ?? event.bundleId}`
    case 'bundle_participant_resolved':
      return `Bundle participant: ${event.playerId} (${event.operation})`
    case 'bundle_follow_up_enqueued':
      return `Bundle follow-up: ${event.followUp}${event.targetPlayerId ? ` (${event.targetPlayerId})` : ''}`
    case 'bundle_completed':
      return `Bundle completed: ${event.bundleId}`
    case 'storyteller_notice_added':
      return `ST notice: ${event.notice.title}`
    case 'storyteller_notice_dismissed':
      return `ST notice cleared: ${event.notice.title}`
    case 'storyteller_choice_requested':
      return `ST choice required: ${event.choice.title}`
    case 'storyteller_choice_resolved':
      return `ST choice resolved: ${event.selectedPlayerId}`
    case 'player_role_changed':
      return `Role changed: ${event.playerId} ${event.previousRoleId} -> ${event.newRoleId}`
    case 'player_alignment_changed':
      return `Alignment changed: ${event.playerId} ${event.previousAlignment} -> ${event.newAlignment}`
    case 'information_queued':
      return `Info queued: ${event.packet.title}${event.packet.playerId ? ` (${event.packet.playerId})` : ''}`
    case 'information_delivered':
      return `Info delivered: ${event.packet.title}${event.packet.playerId ? ` (${event.packet.playerId})` : ''}`
  }

  return event.type
}

function formatInformationPacket(
  state: EngineState,
  packet: EngineState['pendingInformation'][number],
): string {
  return packet.fragments
    .map((fragment) => {
      switch (fragment.kind) {
        case 'text':
          return fragment.text
        case 'role':
          return fragment.roleId
        case 'alignment':
          return fragment.alignment
        case 'player':
          return getPlayer(state, fragment.playerId)?.name ?? fragment.playerId
        case 'number':
          return String(fragment.value)
        case 'boolean':
          return fragment.value ? 'yes' : 'no'
      }
    })
    .join('')
}

function formatTriggerSchedule(
  schedule: EngineState['triggerRegistrations'][number]['trigger']
    | NonNullable<EngineState['triggerRegistrations'][number]['expiresAt']>,
): string {
  if (schedule.mode === 'phase') {
    return `phase:${schedule.phase}`
  }

  return `event:${schedule.trigger}${schedule.playerId ? ` (${schedule.playerId})` : ''}`
}

function formatTimedEffectBoundary(
  boundary: EngineState['scheduledEffects'][number]['expiresAt'] | undefined,
): string {
  if (!boundary) {
    return 'manual'
  }

  if (boundary.mode === 'phase') {
    return `phase:${boundary.phase}`
  }

  return `event:${boundary.trigger}${boundary.playerId ? ` (${boundary.playerId})` : ''}`
}

export function EngineV2LabScreen({ onBack }: Props) {
  const [state, setState] = useState<EngineState>(() => buildInitialState())
  const [activePresetId, setActivePresetId] = useState<string>('baseline')
  const [selectedNominatorId, setSelectedNominatorId] = useState<string>('demon')
  const [selectedNomineeId, setSelectedNomineeId] = useState<string>('target')

  const players = useMemo(() => state.players, [state.players])
  const recentEvents = state.events.slice(-12).reverse()

  const target = getPlayer(state, 'target')
  const activePreset = LAB_PRESETS.find((preset) => preset.id === activePresetId) ?? LAB_PRESETS[0]
  const alivePublicPlayers = useMemo(
    () => players.filter((player) => player.life.projection.publicState === 'alive'),
    [players],
  )
  const latestNomination =
    state.day.nominations[state.day.nominations.length - 1] ?? null
  const currentNomination =
    state.day.nominations.find(
      (nomination) => nomination.id === state.day.currentNominationId,
    ) ?? latestNomination
  const effectiveNominatorId = alivePublicPlayers.some(
    (player) => player.id === selectedNominatorId,
  )
    ? selectedNominatorId
    : alivePublicPlayers[0]?.id ?? ''
  const effectiveNomineeId =
    alivePublicPlayers.some(
      (player) => player.id === selectedNomineeId && player.id !== effectiveNominatorId,
    )
      ? selectedNomineeId
      : alivePublicPlayers.find((player) => player.id !== effectiveNominatorId)?.id ?? ''
  const voteEligiblePlayers = players.filter((player) => {
    if (currentNomination?.votes.includes(player.id)) {
      return false
    }
    if (currentNomination?.ghostVotes.includes(player.id)) {
      return false
    }
    return (
      player.life.projection.publicState === 'alive' ||
      !state.day.ghostVotesSpentByPlayerId[player.id]
    )
  })
  const spentGhostVoters = Object.entries(state.day.ghostVotesSpentByPlayerId)
    .filter(([, spent]) => spent)
    .map(([playerId]) => playerId)

  return (
    <div className='min-h-app bg-gradient-to-b from-grimoire-purple via-grimoire-dark to-grimoire-darker text-parchment-200'>
      <div className='sticky top-0 z-10 bg-grimoire-dark/95 backdrop-blur-sm border-b border-mystic-gold/20 px-4 py-3'>
        <div className='max-w-3xl mx-auto flex items-center gap-3'>
          <BackButton onClick={onBack} />
          <div className='flex-1'>
            <h1 className='font-tarot text-lg text-parchment-100 tracking-wider uppercase'>
              Engine V2 Lab
            </h1>
            <p className='text-xs text-parchment-500'>
              Timed effects, triggered lethals, and public-vs-true life state
            </p>
          </div>
        </div>
      </div>

      <div className='max-w-3xl mx-auto p-4 space-y-4'>
        <section className='rounded-2xl border border-white/10 bg-white/[0.04] p-4 space-y-3'>
          <div className='flex items-center gap-2'>
            <Icon name='scrollText' size='sm' className='text-indigo-300' />
            <h2 className='font-tarot text-sm uppercase tracking-wider text-parchment-100'>
              Preset Scenarios
            </h2>
          </div>
          <div className='grid gap-3 sm:grid-cols-2'>
            {LAB_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type='button'
                onClick={() => {
                  setState(preset.build())
                  setActivePresetId(preset.id)
                  setSelectedNominatorId('')
                  setSelectedNomineeId('')
                }}
                className={`rounded-xl border p-3 text-left transition-colors ${
                  activePresetId === preset.id
                    ? 'border-mystic-gold/50 bg-mystic-gold/10'
                    : 'border-white/10 bg-black/20 hover:border-mystic-gold/30'
                }`}
              >
                <div className='text-sm font-semibold text-parchment-100'>{preset.name}</div>
                <div className='mt-1 text-xs text-parchment-400'>{preset.description}</div>
              </button>
            ))}
          </div>
          <div className='rounded-xl border border-mystic-gold/15 bg-mystic-gold/5 p-3 text-xs text-parchment-400'>
            Loaded preset: <span className='text-parchment-100'>{activePreset.name}</span>
            {' · '}
            {activePreset.description}
          </div>
        </section>

        <section className='rounded-2xl border border-white/10 bg-white/[0.04] p-4 space-y-4'>
          <div className='flex items-center gap-2'>
            <Icon name='scale' size='sm' className='text-red-300' />
            <h2 className='font-tarot text-sm uppercase tracking-wider text-parchment-100'>
              Day Pipeline
            </h2>
          </div>

          <div className='rounded-xl border border-mystic-gold/15 bg-mystic-gold/5 p-3 text-xs text-parchment-400'>
            Use this section to drive nominations, votes, ties, and executions through the real engine-v2 day reducers.
          </div>

          <div className='grid gap-4 lg:grid-cols-2'>
            <div className='space-y-3'>
              <div>
                <div className='mb-2 text-xs uppercase tracking-[0.18em] text-parchment-500'>
                  Nominator
                </div>
                <div className='grid gap-2 sm:grid-cols-2'>
                  {alivePublicPlayers.map((player) => (
                    <button
                      key={`nominator-${player.id}`}
                      type='button'
                      onClick={() => setSelectedNominatorId(player.id)}
                      className={`rounded-xl border px-3 py-2 text-left text-sm transition-colors ${
                        effectiveNominatorId === player.id
                          ? 'border-red-300/50 bg-red-300/10 text-parchment-100'
                          : 'border-white/10 bg-black/20 text-parchment-300 hover:border-red-300/30'
                      }`}
                    >
                      <div className='font-semibold'>{player.name}</div>
                      <div className='text-xs uppercase tracking-[0.16em] text-parchment-500'>
                        {player.roleId}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className='mb-2 text-xs uppercase tracking-[0.18em] text-parchment-500'>
                  Nominee
                </div>
                <div className='grid gap-2 sm:grid-cols-2'>
                  {alivePublicPlayers
                    .filter((player) => player.id !== effectiveNominatorId)
                    .map((player) => (
                      <button
                        key={`nominee-${player.id}`}
                        type='button'
                        onClick={() => setSelectedNomineeId(player.id)}
                        className={`rounded-xl border px-3 py-2 text-left text-sm transition-colors ${
                          effectiveNomineeId === player.id
                            ? 'border-amber-300/50 bg-amber-300/10 text-parchment-100'
                            : 'border-white/10 bg-black/20 text-parchment-300 hover:border-amber-300/30'
                        }`}
                      >
                        <div className='font-semibold'>{player.name}</div>
                        <div className='text-xs uppercase tracking-[0.16em] text-parchment-500'>
                          {player.roleId}
                        </div>
                      </button>
                    ))}
                </div>
              </div>

              <div className='grid gap-2 sm:grid-cols-2'>
                <Button
                  variant='evil'
                  size='sm'
                  onClick={() =>
                    setState((current) =>
                      resolveEngineIntent(
                        current,
                        createDayStartNominationIntent({
                          nominatorId: effectiveNominatorId,
                          nomineeId: effectiveNomineeId,
                        }),
                      ),
                    )
                  }
                  disabled={!effectiveNominatorId || !effectiveNomineeId || state.phase !== 'day'}
                >
                  Start Nomination
                </Button>

                <Button
                  variant='outline'
                  size='sm'
                  onClick={() =>
                    setState((current) =>
                      currentNomination
                        ? resolveEngineIntent(
                            current,
                            createDayLockNominationIntent({
                              nominationId: currentNomination.id,
                            }),
                          )
                        : current,
                    )
                  }
                  disabled={!currentNomination || currentNomination.status !== 'opened'}
                >
                  Lock Nomination
                </Button>

                <Button
                  variant='outline'
                  size='sm'
                  onClick={() =>
                    setState((current) =>
                      currentNomination
                        ? resolveEngineIntent(
                            current,
                            createDayOpenVoteIntent({
                              nominationId: currentNomination.id,
                            }),
                          )
                        : current,
                    )
                  }
                  disabled={!currentNomination || currentNomination.status !== 'opened' || state.day.votingOpen}
                >
                  Open Vote
                </Button>

                <Button
                  variant='outline'
                  size='sm'
                  onClick={() =>
                    setState((current) =>
                      currentNomination
                        ? resolveEngineIntent(
                            current,
                            createDayCloseVoteIntent({
                              nominationId: currentNomination.id,
                            }),
                          )
                        : current,
                    )
                  }
                  disabled={!currentNomination || currentNomination.status !== 'opened' || !state.day.votingOpen}
                >
                  Close Vote
                </Button>

                <Button
                  variant='gold'
                  size='sm'
                  onClick={() =>
                    setState((current) =>
                      resolveEngineIntent(
                        current,
                        createDayResolveExecutionIntent({
                          reason: 'Lab day resolution',
                        }),
                      ),
                    )
                  }
                  disabled={state.phase !== 'day' && state.phase !== 'execution'}
                >
                  Resolve Execution
                </Button>

                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => setState((current) => setEnginePhase(current, 'day'))}
                >
                  Force Day Phase
                </Button>
              </div>
            </div>

            <div className='space-y-3'>
              <div className='rounded-xl border border-white/10 bg-black/20 p-3 space-y-2 text-xs text-parchment-300'>
                <div className='text-xs uppercase tracking-[0.18em] text-parchment-500'>
                  Day State
                </div>
                <div>
                  Current nomination:{' '}
                  <span className='text-parchment-100'>
                    {currentNomination
                      ? `${getPlayer(state, currentNomination.nominatorId)?.name ?? currentNomination.nominatorId} -> ${getPlayer(state, currentNomination.nomineeId)?.name ?? currentNomination.nomineeId}`
                      : 'none'}
                  </span>
                </div>
                <div>
                  Voting open:{' '}
                  <span className='text-parchment-100'>{state.day.votingOpen ? 'yes' : 'no'}</span>
                </div>
                <div>
                  Block:{' '}
                  <span className='text-parchment-100'>
                    {state.day.block.nomineeId
                      ? `${getPlayer(state, state.day.block.nomineeId)?.name ?? state.day.block.nomineeId} (${state.day.block.voteCount})`
                      : state.day.block.tied
                        ? `tie at ${state.day.block.voteCount}`
                        : 'none'}
                  </span>
                </div>
                <div>
                  Execution:{' '}
                  <span className='text-parchment-100'>
                    {state.day.execution.status}
                    {state.day.execution.executedPlayerId
                      ? ` · ${getPlayer(state, state.day.execution.executedPlayerId)?.name ?? state.day.execution.executedPlayerId}`
                      : ''}
                  </span>
                </div>
                <div>
                  Ghost votes spent:{' '}
                  <span className='text-parchment-100'>
                    {spentGhostVoters.length > 0
                      ? spentGhostVoters
                          .map((playerId) => getPlayer(state, playerId)?.name ?? playerId)
                          .join(', ')
                      : 'none'}
                  </span>
                </div>
              </div>

              <div className='rounded-xl border border-white/10 bg-black/20 p-3 space-y-3'>
                <div className='text-xs uppercase tracking-[0.18em] text-parchment-500'>
                  Cast Votes
                </div>
                {currentNomination && state.day.votingOpen ? (
                  <div className='grid gap-2 sm:grid-cols-2'>
                    {voteEligiblePlayers.map((player) => (
                      <Button
                        key={`vote-${player.id}`}
                        variant='night'
                        size='sm'
                        onClick={() =>
                          setState((current) =>
                            resolveEngineIntent(
                              current,
                              createDayCastVoteIntent({
                                nominationId: currentNomination.id,
                                voterId: player.id,
                              }),
                            ),
                          )
                        }
                      >
                        Vote: {player.name}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className='text-xs text-parchment-500'>
                    Open a vote on an active nomination to cast votes here.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className='space-y-3'>
            <div className='text-xs uppercase tracking-[0.18em] text-parchment-500'>
              Nomination History
            </div>
            {state.day.nominations.length > 0 ? (
              <div className='space-y-2'>
                {state.day.nominations.map((nomination) => (
                  <div
                    key={nomination.id}
                    className='rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-parchment-300'
                  >
                    <div className='font-semibold text-parchment-100'>
                      {getPlayer(state, nomination.nominatorId)?.name ?? nomination.nominatorId}
                      {' -> '}
                      {getPlayer(state, nomination.nomineeId)?.name ?? nomination.nomineeId}
                    </div>
                    <div className='mt-1'>
                      Status: {nomination.status} · Votes: {nomination.votes.length} · Ghost votes: {nomination.ghostVotes.length}
                    </div>
                    <div className='mt-1 text-parchment-500'>
                      Voters: {[...nomination.votes, ...nomination.ghostVotes]
                        .map((playerId) => getPlayer(state, playerId)?.name ?? playerId)
                        .join(', ') || 'none'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='rounded-lg border border-dashed border-white/10 px-3 py-6 text-center text-xs text-parchment-500'>
                No nominations recorded yet.
              </div>
            )}
          </div>
        </section>

        <section className='rounded-2xl border border-mystic-gold/20 bg-white/[0.04] p-4 space-y-3'>
          <div className='flex items-center gap-2'>
            <Icon name='sparkles' size='sm' className='text-mystic-gold' />
            <h2 className='font-tarot text-sm uppercase tracking-wider text-parchment-100'>
              Scenario State
            </h2>
          </div>
          <div className='grid gap-3 sm:grid-cols-2'>
            {players.map((player) => (
              <div
                key={player.id}
                className='rounded-xl border border-white/10 bg-black/20 p-3 space-y-1'
              >
                <div className='flex items-center justify-between gap-2'>
                  <div>
                    <div className='text-sm font-semibold text-parchment-100'>{player.name}</div>
                    <div className='text-xs text-parchment-500 uppercase tracking-[0.18em]'>
                      {player.roleId}
                    </div>
                    <div className='mt-1 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.16em]'>
                      <span className='rounded-full border border-mystic-gold/25 bg-mystic-gold/10 px-2 py-0.5 text-mystic-gold'>
                        Role team: {getResolvedRoleTeam(player.roleId) ?? 'unknown'}
                      </span>
                      <span
                        className={`rounded-full border px-2 py-0.5 ${
                          player.alignment === 'evil'
                            ? 'border-red-400/30 bg-red-500/10 text-red-300'
                            : 'border-blue-400/30 bg-blue-500/10 text-blue-200'
                        }`}
                      >
                        Alignment: {player.alignment}
                      </span>
                    </div>
                  </div>
                </div>
                <div className='text-xs text-parchment-300'>
                  True: {player.life.projection.trueState} · Public: {player.life.projection.publicState}
                </div>
                <div className='text-xs text-parchment-300'>
                  Counts alive: {countsAsAliveForWin(player) ? 'yes' : 'no'} · Wake: {player.life.projection.canWake ? 'yes' : 'no'}
                </div>
                <div className='text-xs text-parchment-400'>
                  Poisoned: {hasEffectiveStatusEffect(state, player.id, 'poisoned') ? 'yes' : 'no'} · Drunk: {hasEffectiveStatusEffect(state, player.id, 'drunk') ? 'yes' : 'no'}
                </div>
                <div className='text-xs text-parchment-500'>
                  Publicly dead: {appearsDeadToTown(player) ? 'yes' : 'no'}
                </div>
                {player.notes && (
                  <div className='text-xs text-parchment-500'>
                    Notes: {Object.entries(player.notes).map(([key, value]) => `${key}=${String(value)}`).join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className='rounded-2xl border border-white/10 bg-white/[0.04] p-4 space-y-4'>
          <div className='flex items-center gap-2'>
            <Icon name='scrollText' size='sm' className='text-cyan-300' />
            <h2 className='font-tarot text-sm uppercase tracking-wider text-parchment-100'>
              Trigger And Expiry State
            </h2>
          </div>

          <div className='grid gap-4 lg:grid-cols-2'>
            <div className='space-y-3'>
              <div className='text-xs uppercase tracking-[0.18em] text-parchment-500'>
                Active Trigger Registrations
              </div>
              {state.triggerRegistrations.length > 0 ? (
                <div className='space-y-2'>
                  {state.triggerRegistrations.map((registration) => (
                    <div
                      key={registration.id}
                      className='rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-parchment-300'
                    >
                      <div className='font-semibold text-parchment-100'>
                        {registration.label ?? registration.id}
                      </div>
                      <div className='mt-1'>
                        Fires on:{' '}
                        <span className='text-parchment-100'>
                          {formatTriggerSchedule(registration.trigger)}
                        </span>
                      </div>
                      <div className='mt-1'>
                        Consumes:{' '}
                        <span className='text-parchment-100'>
                          {registration.consumeWhen ?? (registration.once === false ? 'manual' : 'once')}
                        </span>
                      </div>
                      <div className='mt-1'>
                        Expires:{' '}
                        <span className='text-parchment-100'>
                          {registration.expiresAt
                            ? formatTriggerSchedule(registration.expiresAt)
                            : 'never'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='rounded-lg border border-dashed border-white/10 px-3 py-6 text-center text-xs text-parchment-500'>
                  No trigger registrations are active.
                </div>
              )}
            </div>

            <div className='space-y-3'>
              <div className='text-xs uppercase tracking-[0.18em] text-parchment-500'>
                Timed Effects
              </div>
              {state.activeTimedEffects.length > 0 || state.statusEffects.length > 0 ? (
                <div className='space-y-2'>
                  {state.activeTimedEffects.map((scheduledEffect) => (
                    <div
                      key={scheduledEffect.id}
                      className='rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-parchment-300'
                    >
                      <div className='font-semibold text-parchment-100'>
                        {scheduledEffect.effect.type} on{' '}
                        {getPlayer(state, scheduledEffect.effect.targetPlayerId)?.name ??
                          scheduledEffect.effect.targetPlayerId}
                      </div>
                      <div className='mt-1'>
                        Source:{' '}
                        <span className='text-parchment-100'>
                          {scheduledEffect.effect.sourceRoleId ?? scheduledEffect.effect.sourcePlayerId ?? 'unknown'}
                        </span>
                      </div>
                      <div className='mt-1'>
                        Expires:{' '}
                        <span className='text-parchment-100'>
                          {formatTimedEffectBoundary(scheduledEffect.expiresAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                  {state.statusEffects
                    .filter(
                      (effect) =>
                        !state.activeTimedEffects.some(
                          (scheduledEffect) => scheduledEffect.effect.id === effect.id,
                        ),
                    )
                    .map((effect) => (
                      <div
                        key={effect.id}
                        className='rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-parchment-300'
                      >
                        <div className='font-semibold text-parchment-100'>
                          {effect.type} on {getPlayer(state, effect.targetPlayerId)?.name ?? effect.targetPlayerId}
                        </div>
                        <div className='mt-1 text-parchment-500'>No expiry metadata attached.</div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className='rounded-lg border border-dashed border-white/10 px-3 py-6 text-center text-xs text-parchment-500'>
                  No timed effects are active.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className='rounded-2xl border border-white/10 bg-white/[0.04] p-4 space-y-3'>
          <div className='flex items-center gap-2'>
            <Icon name='sparkles' size='sm' className='text-amber-300' />
            <h2 className='font-tarot text-sm uppercase tracking-wider text-parchment-100'>
              Storyteller Prompts
            </h2>
          </div>
          <div className='space-y-3'>
            {state.storytellerNotices.map((notice) => (
              <div
                key={notice.id}
                className='rounded-xl border border-amber-300/30 bg-amber-300/10 p-3'
              >
                <div className='text-sm font-semibold text-parchment-100'>{notice.title}</div>
                <div className='mt-1 text-xs text-parchment-300'>{notice.message}</div>
              </div>
            ))}
            {state.pendingStorytellerChoices.map((choice) => (
              <div
                key={choice.id}
                className='rounded-xl border border-red-300/30 bg-red-300/10 p-3 space-y-3'
              >
                <div className='text-sm font-semibold text-parchment-100'>{choice.title}</div>
                <div className='text-xs text-parchment-300'>{choice.message}</div>
                {choice.kind === 'player_selection' ? (
                  <div className='grid gap-2 sm:grid-cols-2'>
                    {choice.candidatePlayerIds.map((playerId) => {
                      const player = getPlayer(state, playerId)
                      return (
                        <Button
                          key={playerId}
                          variant='night'
                          size='sm'
                          onClick={() =>
                            setState((current) =>
                              resolveStorytellerChoice(current, choice.id, playerId),
                            )
                          }
                        >
                          {choice.candidateLabels?.[playerId] ?? player?.name ?? playerId}
                        </Button>
                      )
                    })}
                  </div>
                ) : choice.kind === 'role_selection' ? (
                  <div className='grid gap-2 sm:grid-cols-2'>
                    {choice.candidatePlayerIds.map((roleId) => (
                      <Button
                        key={roleId}
                        variant='night'
                        size='sm'
                        onClick={() =>
                          setState((current) =>
                            resolveStorytellerChoice(current, choice.id, roleId),
                          )
                        }
                      >
                        {choice.candidateLabels?.[roleId] ?? roleId}
                      </Button>
                    ))}
                  </div>
                ) : choice.kind === 'boolean_selection' || choice.kind === 'number_selection' ? (
                  <div className='grid gap-2 sm:grid-cols-2'>
                    {choice.candidatePlayerIds.map((valueId) => (
                      <Button
                        key={valueId}
                        variant='night'
                        size='sm'
                        onClick={() =>
                          setState((current) =>
                            resolveStorytellerChoice(current, choice.id, valueId),
                          )
                        }
                      >
                        {choice.candidateLabels?.[valueId] ?? valueId}
                      </Button>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
            {state.storytellerNotices.length === 0 &&
            state.pendingStorytellerChoices.length === 0 ? (
              <div className='rounded-lg border border-dashed border-white/10 px-3 py-6 text-center text-xs text-parchment-500'>
                No Storyteller prompts waiting.
              </div>
            ) : null}
          </div>
        </section>

        <section className='rounded-2xl border border-white/10 bg-white/[0.04] p-4 space-y-3'>
          <div className='flex items-center gap-2'>
            <Icon
              name={state.gameOutcome.ended ? 'trophy' : 'sparkles'}
              size='sm'
              className={state.gameOutcome.ended ? 'text-emerald-300' : 'text-parchment-400'}
            />
            <h2 className='font-tarot text-sm uppercase tracking-wider text-parchment-100'>
              Game Outcome
            </h2>
          </div>
          {state.gameOutcome.ended ? (
            <div className='rounded-xl border border-emerald-300/30 bg-emerald-300/10 p-4 space-y-2'>
              <div className='text-sm font-semibold text-parchment-100'>
                {state.gameOutcome.title ?? 'Game ended'}
              </div>
              <div className='text-xs uppercase tracking-[0.18em] text-emerald-200'>
                Winner: {state.gameOutcome.winner}
              </div>
              {state.gameOutcome.reason ? (
                <div className='text-xs text-parchment-300'>{state.gameOutcome.reason}</div>
              ) : null}
              {(state.gameOutcome.sourceRoleId || state.gameOutcome.sourcePlayerId) ? (
                <div className='text-xs text-parchment-500'>
                  Source: {state.gameOutcome.sourceRoleId ?? 'unknown role'}
                  {state.gameOutcome.sourcePlayerId
                    ? ` · ${getPlayer(state, state.gameOutcome.sourcePlayerId)?.name ?? state.gameOutcome.sourcePlayerId}`
                    : ''}
                </div>
              ) : null}
            </div>
          ) : (
            <div className='rounded-lg border border-dashed border-white/10 px-3 py-6 text-center text-xs text-parchment-500'>
              No confirmed winner. Special win conditions can still be proposed to the Storyteller.
            </div>
          )}
        </section>

        <section className='rounded-2xl border border-white/10 bg-white/[0.04] p-4 space-y-3'>
          <div className='flex items-center gap-2'>
            <Icon name='moon' size='sm' className='text-indigo-300' />
            <h2 className='font-tarot text-sm uppercase tracking-wider text-parchment-100'>
              Actions
            </h2>
          </div>
          <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
            <Button
              variant='night'
              size='sm'
              onClick={() =>
                setState((current) =>
                  runLethalIntent(
                    current,
                    createLethalIntent({
                      kind: 'attack',
                      sourcePlayerId: 'demon',
                      targetPlayerId: 'target',
                      cause: 'demon_attack',
                      phase: current.phase,
                      reason: 'Direct demon attack',
                    }),
                  ).state,
                )
              }
            >
              Direct Attack
            </Button>

            <Button
              variant='night'
              size='sm'
              onClick={() =>
                setState((current) =>
                  applyRoleAbility(current, 'monk', {
                    kind: 'protect',
                    targetPlayerId: 'target',
                  }),
                )
              }
            >
              Monk Protect Target
            </Button>

            <Button
              variant='evil'
              size='sm'
              onClick={() =>
                setState((current) =>
                  applyRoleAbility(current, 'witch', {
                    kind: 'curse',
                    targetPlayerId: 'target',
                  }),
                )
              }
            >
              Witch Curse Target
            </Button>

            <Button
              variant='evil'
              size='sm'
              onClick={() =>
                setState((current) =>
                  applyRoleAbility(current, 'cerenovus', {
                    kind: 'inflict_madness',
                    targetPlayerId: 'target',
                    claimRoleId: 'clockmaker',
                  }),
                )
              }
            >
              Cerenovus Curse Target
            </Button>

            <Button
              variant='evil'
              size='sm'
              onClick={() =>
                setState((current) =>
                  applyRoleAbility(current, 'evilTwin', {
                    kind: 'link_twin',
                    targetPlayerId: 'goodTwin',
                  }),
                )
              }
            >
              Link Evil Twins
            </Button>

            <Button
              variant='secondary'
              size='sm'
              onClick={() =>
                setState((current) =>
                  applyRoleAbility(current, 'mutant', {
                    kind: 'break_madness',
                  }),
                )
              }
            >
              Mutant Broke Madness
            </Button>

            <Button
              variant='secondary'
              size='sm'
              onClick={() =>
                setState((current) =>
                  breakMadness(current, {
                    playerId: 'target',
                    fallbackReason: 'Storyteller marked a madness break.',
                    fallbackSourceRoleId: 'cerenovus',
                    fallbackSourcePlayerId: 'cerenovus',
                  }),
                )
              }
            >
              Break Target Madness
            </Button>

            <Button
              variant='secondary'
              size='sm'
              onClick={() =>
                setState((current) =>
                  scheduleLethalIntent(current, {
                    intent: createLethalIntent({
                      kind: 'kill',
                      sourcePlayerId: 'demon',
                      targetPlayerId: 'target',
                      cause: 'role_ability',
                      phase: current.phase,
                      reason: 'Pukka-style delayed death',
                    }),
                    scheduledFor: {
                      mode: 'phase',
                      phase: 'dawn',
                    },
                  }),
                )
              }
            >
              Schedule Dawn Kill
            </Button>

            <Button
              variant='secondary'
              size='sm'
              onClick={() =>
                setState((current) =>
                  scheduleLethalIntent(current, {
                    intent: createLethalIntent({
                      kind: 'kill',
                      sourcePlayerId: 'demon',
                      targetPlayerId: 'target',
                      cause: 'curse',
                      phase: current.phase,
                      reason: 'Witch-style curse',
                    }),
                    scheduledFor: {
                      mode: 'trigger',
                      trigger: 'nomination_started',
                      playerId: 'target',
                    },
                  }),
                )
              }
            >
              Schedule Curse
            </Button>

            <Button
              variant='secondary'
              size='sm'
              onClick={() =>
                setState((current) =>
                  registerTriggerAction(current, {
                    label: 'Sweetheart-style note on day end',
                    once: true,
                    trigger: {
                      mode: 'event',
                      trigger: 'day_ended',
                    },
                    action: {
                      kind: 'set_note',
                      playerId: 'target',
                      key: 'markedByTrigger',
                      value: 'day_end_followup',
                    },
                  }),
                )
              }
            >
              Register Note Trigger
            </Button>

            <Button
              variant='secondary'
              size='sm'
              onClick={() =>
                setState((current) =>
                  registerTriggerAction(current, {
                    label: 'Triggered drunk effect',
                    once: true,
                    trigger: {
                      mode: 'event',
                      trigger: 'day_ended',
                    },
                    action: {
                      kind: 'apply_status_effect',
                      effect: createTimedStatusEffect({
                        type: 'drunk',
                        targetPlayerId: 'target',
                        sourceRoleId: 'sweetheart',
                        reason: 'Triggered drunk registration',
                      }),
                      expiresAt: {
                        mode: 'phase',
                        phase: 'dawn',
                      },
                    },
                  }),
                )
              }
            >
              Register Drunk Trigger
            </Button>

            <Button
              variant='gold'
              size='sm'
              onClick={() =>
                setState((current) =>
                  setPlayerPoisonedForPhases(current, {
                    targetPlayerId: 'target',
                    sourcePlayerId: 'demon',
                    sourceRoleId: 'poisoner',
                    reason: 'Timed poison test',
                    startPhase: current.phase,
                    endPhase: 'dawn',
                  }),
                )
              }
            >
              Timed Poison
            </Button>

            <Button
              variant='gold'
              size='sm'
              onClick={() =>
                setState((current) =>
                  setPlayerDrunkForPhases(current, {
                    targetPlayerId: 'target',
                    sourceRoleId: 'courtier',
                    reason: 'Timed drunk test',
                    startPhase: current.phase,
                    endPhase: 'day',
                  }),
                )
              }
            >
              Timed Drunk
            </Button>

            <Button
              variant='evil'
              size='sm'
              onClick={() =>
                setState((current) =>
                  runLethalIntent(
                    current,
                    createLethalIntent({
                      kind: 'execute',
                      sourcePlayerId: 'demon',
                      targetPlayerId: 'target',
                      cause: 'execution',
                      phase: 'execution',
                      reason: 'Public death state test',
                      tags: ['public_death_only'],
                    }),
                  ).state,
                )
              }
            >
              Public Death Only
            </Button>

            <Button
              variant='gold'
              size='sm'
              onClick={() =>
                setState((current) =>
                  resolveEngineIntent(
                    current,
                    createDayResolveExecutionIntent({
                      reason: 'Lab executed the Evil Twin.',
                    }),
                  ),
                )
              }
            >
              Resolve Current Block
            </Button>

            <Button
              variant='evil'
              size='sm'
              onClick={() =>
                setState((current) =>
                  applyRoleAbility(current, 'vig', {
                    kind: 'kill',
                    targetPlayerId: 'witch',
                  }),
                )
              }
            >
              Vigormortis Kill Minion
            </Button>

            <Button
              variant='evil'
              size='sm'
              onClick={() =>
                setState((current) =>
                  runLethalIntent(
                    current,
                    createLethalIntent({
                      kind: 'kill',
                      sourcePlayerId: 'imp',
                      targetPlayerId: 'sweetheart',
                      cause: 'demon_attack',
                      phase: current.phase,
                      reason: 'Sweetheart death prompt test',
                    }),
                  ).state,
                )
              }
            >
              Kill Sweetheart
            </Button>

            <Button
              variant='night'
              size='sm'
              onClick={() =>
                setState((current) =>
                  applyRoleAbility(current, 'charmer', {
                    kind: 'charm',
                    targetPlayerId: 'demon',
                  }),
                )
              }
            >
              Snake Charmer Swap
            </Button>

            <Button
              variant='evil'
              size='sm'
              onClick={() =>
                setState((current) =>
                  applyRoleAbility(current, 'pit', {
                    kind: 'transform',
                    targetPlayerId: 'target',
                    newRoleId: 'clockmaker',
                  }),
                )
              }
            >
              Pit Hag to Clockmaker
            </Button>

            <Button
              variant='evil'
              size='sm'
              onClick={() =>
                setState((current) =>
                  applyRoleAbility(current, 'pit', {
                    kind: 'transform',
                    targetPlayerId: 'target',
                    newRoleId: 'vortox',
                  }),
                )
              }
            >
              Pit Hag to Demon
            </Button>

            <Button
              variant='night'
              size='sm'
              onClick={() =>
                setState((current) =>
                  applyRoleAbility(current, 'target', {
                    kind: 'learn_distance',
                  }),
                )
              }
            >
              Clockmaker Learn
            </Button>

            <Button
              variant='night'
              size='sm'
              onClick={() =>
                setState((current) =>
                  applyRoleAbility(current, 'chef', {
                    kind: 'learn_evil_pairs',
                  }),
                )
              }
            >
              Chef Learn
            </Button>

            <Button
              variant='night'
              size='sm'
              onClick={() =>
                setState((current) =>
                  applyRoleAbility(current, 'empath', {
                    kind: 'learn_evil_neighbors',
                  }),
                )
              }
            >
              Empath Learn
            </Button>

            <Button
              variant='night'
              size='sm'
              onClick={() =>
                setState((current) =>
                  applyRoleAbility(current, 'oracle', {
                    kind: 'learn_dead_evil_count',
                  }),
                )
              }
            >
              Oracle Learn
            </Button>

            <Button
              variant='night'
              size='sm'
              onClick={() =>
                setState((current) =>
                  applyRoleAbility(current, 'flowergirl', {
                    kind: 'learn_demon_voted',
                  }),
                )
              }
            >
              Flowergirl Learn
            </Button>

            <Button
              variant='night'
              size='sm'
              onClick={() =>
                setState((current) =>
                  applyRoleAbility(current, 'townCrier', {
                    kind: 'learn_minion_nominated',
                  }),
                )
              }
            >
              Town Crier Learn
            </Button>

            <Button
              variant='night'
              size='sm'
              onClick={() =>
                setState((current) =>
                  applyRoleAbility(current, 'mathematician', {
                    kind: 'learn_abnormal_count',
                  }),
                )
              }
            >
              Mathematician Learn
            </Button>

            <Button
              variant='night'
              size='sm'
              onClick={() =>
                setState((current) =>
                  applyRoleAbility(current, 'seamstress', {
                    kind: 'compare_alignments',
                    firstPlayerId: 'goodA',
                    secondPlayerId: 'evilA',
                  }),
                )
              }
            >
              Seamstress Compare
            </Button>

            <Button
              variant='night'
              size='sm'
              onClick={() =>
                setState((current) =>
                  applyRoleAbility(current, 'dreamer', {
                    kind: 'dream',
                    targetPlayerId: 'targetGood',
                  }),
                )
              }
            >
              Dream Good Target
            </Button>

            <Button
              variant='night'
              size='sm'
              onClick={() =>
                setState((current) =>
                  applyRoleAbility(current, 'dreamer', {
                    kind: 'dream',
                    targetPlayerId: 'targetEvil',
                  }),
                )
              }
            >
              Dream Evil Target
            </Button>

            <Button
              variant='night'
              size='sm'
              onClick={() =>
                setState((current) =>
                  applyRoleAbility(current, 'fortune', {
                    kind: 'read_fortune',
                    firstPlayerId: 'targetGood',
                    secondPlayerId: 'targetEvil',
                  }),
                )
              }
            >
              Fortune Teller Read
            </Button>

            <Button
              variant='night'
              size='sm'
              onClick={() =>
                setState((current) =>
                  applyRoleAbility(current, 'undertaker', {
                    kind: 'learn_executed_role',
                  }),
                )
              }
            >
              Undertaker Learn
            </Button>

            <Button
              variant='night'
              size='sm'
              onClick={() =>
                setState((current) =>
                  applyRoleAbility(current, 'raven', {
                    kind: 'inspect_after_night_death',
                    targetPlayerId: 'target',
                  }),
                )
              }
            >
              Ravenkeeper Inspect
            </Button>

            <Button
              variant='night'
              size='sm'
              onClick={() =>
                setState((current) =>
                  applyRoleAbility(current, 'artist', {
                    kind: 'ask_question',
                    question: 'Is the Demon sitting next to a Minion?',
                  }),
                )
              }
            >
              Artist Ask
            </Button>

            <Button
              variant='night'
              size='sm'
              onClick={() => setState((current) => setEnginePhase(current, 'first_night'))}
            >
              Start First Night
            </Button>

            <Button
              variant='secondary'
              size='sm'
              onClick={() =>
                setState((current) =>
                  resolveEngineIntent(
                    current,
                    createInformationIntent({
                      audience: 'player',
                      playerId: 'target',
                      title: 'Demo information',
                      summary: 'Manual information packet for lab testing.',
                      fragments: [
                        { kind: 'text', text: 'Show ' },
                        { kind: 'number', value: 2 },
                        { kind: 'text', text: ' to ' },
                        { kind: 'player', playerId: 'target' },
                        { kind: 'text', text: '.' },
                      ],
                    }),
                  ),
                )
              }
            >
              Queue Demo Info
            </Button>

            <Button
              variant='outline'
              size='sm'
              onClick={() => setState((current) => setEnginePhase(current, 'dawn'))}
            >
              Advance To Dawn
            </Button>

            <Button
              variant='outline'
              size='sm'
              onClick={() => setState((current) => setEnginePhase(current, 'day'))}
            >
              Advance To Day
            </Button>

            <Button
              variant='outline'
              size='sm'
              onClick={() =>
                setState((current) =>
                  recordTriggerEvent(current, {
                    type: 'nomination_started',
                    playerId: 'target',
                  }),
                )
              }
            >
              Fire Nomination Trigger
            </Button>

            <Button
              variant='outline'
              size='sm'
              onClick={() =>
                setState((current) =>
                  recordTriggerEvent(current, {
                    type: 'day_ended',
                  }),
                )
              }
            >
              Fire Day-End Trigger
            </Button>

            <Button
              variant='ghost'
              size='sm'
              onClick={() => {
                setState(buildInitialState())
                setActivePresetId('baseline')
              }}
            >
              Reset Lab
            </Button>
          </div>

          <div className='rounded-xl border border-mystic-gold/15 bg-mystic-gold/5 p-3 text-xs text-parchment-400'>
            Current phase: <span className='text-parchment-100 uppercase tracking-[0.18em]'>{state.phase}</span>
            {' · '}
            Scheduled lethals: <span className='text-parchment-100'>{state.scheduledIntents.length}</span>
            {' · '}
            Scheduled effects: <span className='text-parchment-100'>{state.scheduledEffects.length}</span>
            {' · '}
            Active timed effects: <span className='text-parchment-100'>{state.activeTimedEffects.length}</span>
            {' · '}
            Trigger registrations: <span className='text-parchment-100'>{state.triggerRegistrations.length}</span>
            {' · '}
            Madness: <span className='text-parchment-100'>{state.activeMadnesses.length}</span>
            {' · '}
            Pending madness: <span className='text-parchment-100'>{state.pendingMadnessConsequences.length}</span>
            {' · '}
            ST notices: <span className='text-parchment-100'>{state.storytellerNotices.length}</span>
            {' · '}
            ST choices: <span className='text-parchment-100'>{state.pendingStorytellerChoices.length}</span>
            {' · '}
            Info packets: <span className='text-parchment-100'>{state.pendingInformation.length}</span>
            {' · '}
            Game ended: <span className='text-parchment-100'>{state.gameOutcome.ended ? 'yes' : 'no'}</span>
            {target && (
              <>
                {' · '}
                Target status: <span className='text-parchment-100'>{target.life.kind}</span>
              </>
            )}
          </div>
        </section>

        <section className='rounded-2xl border border-white/10 bg-white/[0.04] p-4 space-y-3'>
          <div className='flex items-center gap-2'>
            <Icon name='drama' size='sm' className='text-amber-300' />
            <h2 className='font-tarot text-sm uppercase tracking-wider text-parchment-100'>
              Active Madness
            </h2>
          </div>
          {state.activeMadnesses.length === 0 ? (
            <div className='rounded-lg border border-dashed border-white/10 px-3 py-6 text-center text-xs text-parchment-500'>
              No active madness pressure.
            </div>
          ) : (
            <div className='space-y-3'>
              {state.activeMadnesses.map((madness) => (
                <div
                  key={madness.id}
                  className='rounded-xl border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-parchment-200'
                >
                  <div className='font-semibold text-parchment-100'>
                    {getPlayer(state, madness.targetPlayerId)?.name ?? madness.targetPlayerId}
                  </div>
                  <div className='mt-1 text-xs text-parchment-400'>
                    Claim: {madness.claimRoleId ?? 'unspecified'} · Source: {madness.sourceRoleId ?? 'unknown'}
                  </div>
                  <div className='mt-2 text-xs text-parchment-300'>{madness.reason}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className='rounded-2xl border border-white/10 bg-white/[0.04] p-4 space-y-3'>
          <div className='flex items-center gap-2'>
            <Icon name='sparkles' size='sm' className='text-red-300' />
            <h2 className='font-tarot text-sm uppercase tracking-wider text-parchment-100'>
              Pending Madness Consequences
            </h2>
          </div>
          {state.pendingMadnessConsequences.length === 0 ? (
            <div className='rounded-lg border border-dashed border-white/10 px-3 py-6 text-center text-xs text-parchment-500'>
              No deferred madness consequences waiting.
            </div>
          ) : (
            <div className='space-y-3'>
              {state.pendingMadnessConsequences.map((consequence) => {
                const player = getPlayer(state, consequence.targetPlayerId)
                return (
                  <div
                    key={consequence.id}
                    className='rounded-xl border border-red-300/20 bg-red-300/10 p-3 space-y-3'
                  >
                    <div>
                      <div className='text-sm font-semibold text-parchment-100'>
                        {player?.name ?? consequence.targetPlayerId}
                      </div>
                      <div className='mt-1 text-xs text-parchment-400'>
                        Claim: {consequence.claimRoleId ?? 'unspecified'} · Source: {consequence.sourceRoleId ?? 'unknown'} · Created in: {consequence.createdDuringPhase}
                      </div>
                      <div className='mt-2 text-xs text-parchment-300'>{consequence.reason}</div>
                    </div>
                    <div className='grid gap-2 sm:grid-cols-3'>
                      {state.phase === 'day' ? (
                        <Button
                          variant='night'
                          size='sm'
                          onClick={() =>
                            setState((current) =>
                              resolvePendingMadnessConsequence(current, {
                                pendingId: consequence.id,
                                mode: 'execute',
                              }),
                            )
                          }
                        >
                          Execute Now
                        </Button>
                      ) : null}
                      <Button
                        variant='evil'
                        size='sm'
                        onClick={() =>
                          setState((current) =>
                            resolvePendingMadnessConsequence(current, {
                              pendingId: consequence.id,
                              mode: 'kill',
                            }),
                          )
                        }
                      >
                        Kill Now
                      </Button>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() =>
                          setState((current) =>
                            resolvePendingMadnessConsequence(current, {
                              pendingId: consequence.id,
                              mode: 'dismiss',
                            }),
                          )
                        }
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <section className='rounded-2xl border border-white/10 bg-white/[0.04] p-4 space-y-3'>
          <div className='flex items-center gap-2'>
            <Icon name='eye' size='sm' className='text-emerald-300' />
            <h2 className='font-tarot text-sm uppercase tracking-wider text-parchment-100'>
              Information Queue
            </h2>
          </div>
          <div className='space-y-3'>
            {state.pendingInformation.map((packet) => (
              <div
                key={packet.id}
                className='rounded-xl border border-emerald-300/20 bg-emerald-300/10 p-3 space-y-3'
              >
                <div className='flex items-start justify-between gap-3'>
                  <div>
                    <div className='text-sm font-semibold text-parchment-100'>
                      {packet.title}
                    </div>
                    <div className='mt-1 text-xs text-parchment-400'>
                      Audience: {packet.audience}
                      {packet.playerId
                        ? ` · ${getPlayer(state, packet.playerId)?.name ?? packet.playerId}`
                        : ''}
                    </div>
                  </div>
                  <Button
                    variant='night'
                    size='sm'
                    onClick={() =>
                      setState((current) => deliverInformation(current, packet.id))
                    }
                  >
                    Mark Delivered
                  </Button>
                </div>
                {packet.summary ? (
                  <div className='text-xs text-parchment-300'>{packet.summary}</div>
                ) : null}
                <div className='rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-parchment-200'>
                  {formatInformationPacket(state, packet)}
                </div>
              </div>
            ))}
            {state.pendingInformation.length === 0 ? (
              <div className='rounded-lg border border-dashed border-white/10 px-3 py-6 text-center text-xs text-parchment-500'>
                No player-facing information is queued.
              </div>
            ) : null}
          </div>
        </section>

        <section className='rounded-2xl border border-white/10 bg-white/[0.04] p-4 space-y-3'>
          <div className='flex items-center gap-2'>
            <Icon name='eye' size='sm' className='text-indigo-300' />
            <h2 className='font-tarot text-sm uppercase tracking-wider text-parchment-100'>
              Resolution Inspector
            </h2>
          </div>
          {state.lastResolutionTrace ? (
            <div className='space-y-3'>
              <div className='rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-parchment-200'>
                Intent: {state.lastResolutionTrace.intent.kind} {'->'} {state.lastResolutionTrace.intent.targetPlayerId}
              </div>
              <div className='rounded-xl border border-white/10 bg-black/20 p-3'>
                <div className='mb-2 text-xs uppercase tracking-[0.18em] text-parchment-500'>Defenses</div>
                {state.lastResolutionTrace.defenses.length > 0 ? (
                  <div className='space-y-2 text-xs text-parchment-300'>
                    {state.lastResolutionTrace.defenses.map((defense) => (
                      <div key={defense.modifier.id} className='flex items-center justify-between gap-3 rounded-lg border border-white/8 px-3 py-2'>
                        <span>{defense.modifier.kind}</span>
                        <span className={defense.bypassed ? 'text-red-300' : 'text-emerald-300'}>
                          {defense.bypassed ? 'Bypassed' : 'Applied'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='text-xs text-parchment-500'>No defenses collected.</div>
                )}
              </div>
              <div className='rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-parchment-200'>
                Outcome: {state.lastResolutionTrace.outcome.kind}
              </div>
              <div className='rounded-xl border border-white/10 bg-black/20 p-3'>
                <div className='mb-2 text-xs uppercase tracking-[0.18em] text-parchment-500'>Commit</div>
                <div className='space-y-2 text-xs text-parchment-300'>
                  {state.lastResolutionTrace.committedEvents.map((event, index) => (
                    <div key={`commit-${index}`} className='rounded-lg border border-white/8 px-3 py-2'>
                      {formatEvent(event)}
                    </div>
                  ))}
                </div>
              </div>
              <div className='rounded-xl border border-white/10 bg-black/20 p-3'>
                <div className='mb-2 text-xs uppercase tracking-[0.18em] text-parchment-500'>Aftermath</div>
                {state.lastResolutionTrace.aftermathEvents.length > 0 ? (
                  <div className='space-y-2 text-xs text-parchment-300'>
                    {state.lastResolutionTrace.aftermathEvents.map((event, index) => (
                      <div key={`after-${index}`} className='rounded-lg border border-white/8 px-3 py-2'>
                        {formatEvent(event)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='text-xs text-parchment-500'>No aftermath events emitted.</div>
                )}
              </div>
            </div>
          ) : (
            <div className='rounded-lg border border-dashed border-white/10 px-3 py-6 text-center text-xs text-parchment-500'>
              Run a lethal action to inspect its resolution path.
            </div>
          )}
        </section>

        <section className='rounded-2xl border border-white/10 bg-white/[0.04] p-4 space-y-3'>
          <div className='flex items-center gap-2'>
            <Icon name='scrollText' size='sm' className='text-mystic-gold' />
            <h2 className='font-tarot text-sm uppercase tracking-wider text-parchment-100'>
              Event Log
            </h2>
          </div>
          <div className='space-y-2'>
            {recentEvents.length > 0 ? (
              recentEvents.map((event, index) => (
                <div
                  key={`${event.type}-${index}`}
                  className='rounded-lg border border-white/8 bg-black/20 px-3 py-2 text-xs text-parchment-300'
                >
                  {formatEvent(event)}
                </div>
              ))
            ) : (
              <div className='rounded-lg border border-dashed border-white/10 px-3 py-6 text-center text-xs text-parchment-500'>
                No events yet.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
