import { Translations } from '../types'

const en: Translations = {
  common: {
    continue: 'Continue',
    confirm: 'Confirm',
    cancel: 'Cancel',
    back: 'Back',
    next: 'Next',
    players: 'Players',
    player: 'Player',
    roles: 'Roles',
    role: 'Role',
    random: 'Random',
    startGame: 'Start Game',
    mainMenu: 'Main Menu',
    history: 'History',
    winCondition: 'Win Condition',
    youAreThe: 'You are the...',
    iUnderstandMyRole: 'I understand my role',
  },

  mainMenu: {
    title: 'Grimorium',
    subtitle: 'Every Storyteller needs a Grimoire.',
    tapToOpen: 'Tap to open',
    continueGame: 'Continue Game',
    newGame: 'New Game',
    startFreshGame: 'Start a fresh game',
    rolesLibrary: 'Roles Library',
    browseAllRoles: 'Browse all role cards',
    previousGames: 'Previous Games',
    completed: 'Completed',
    settingUp: 'Setting up',
    round: 'Round',
    language: 'Language',
  },

  newGame: {
    step1Title: 'New Game',
    step1Subtitle: 'Step 1: Add players',
    addPlayer: 'Add Player',
    playerPlaceholder: 'Player',
    minPlayersWarning: 'Add at least 5 players to continue',
    nextSelectRoles: 'Next: Select Roles',
    loadedFromLastGame: 'From last game',

    step2Title: 'New Game',
    step2Subtitle: 'Step 2: Select roles in play',
    needAtLeastRoles: 'Need at least {count} roles',
    needAtLeastImp: 'Need at least 1 Imp',
    nextAssignRoles: 'Next: Assign Roles',
    suggested: 'Suggested',

    step3Title: 'New Game',
    step3Subtitle: 'Step 3: Assign roles (optional)',
    assignmentInfo:
      'Optionally assign specific roles to players. Unassigned players get random roles from the pool.',
    resetToRandom: 'Reset all to random',
    playerAssignments: 'Player Assignments',
    randomPool: 'Random Pool',
    rolesForPlayers: '{roles} roles for {players} players',
    impNotAssignedWarning:
      "The Imp won't be assigned! Make sure at least one player gets the Imp or leave some players random.",
    rolesRandomlyAssigned: 'Roles will be randomly assigned to players',
    customizeAssignments: 'Customize Assignments',
    tapToAssign: 'Tap a player to assign a specific role',
  },

  game: {
    narratorGiveDevice: 'Give the device to {player} to see their role.',
    narratorWakePlayer: 'Wake {player} ({role}) for their night action.',
    narratorRoleChanged:
      'Give the device to {player} — their role has changed.',
    readyShowToPlayer: 'Ready - Show to Player',
    yourRoleHasChanged: 'Your role has changed!',

    nightComplete: 'Night {round} Complete',
    nightActionsResolved:
      'All night actions have been resolved. Ready to start the day?',
    startDay: 'Start Day',
    choosePlayerToKill: 'Choose a player to kill',
    selectVictim:
      'Select the player they pointed to as their victim for tonight.',
    confirmKill: 'Confirm Kill',

    grimoire: 'Grimoire',
    daytimeActions: 'Daytime Actions',
    accusePlayerDescription: 'Accuse a player and put them to vote',

    nominatesForExecution: '{nominator} nominates {nominee} for execution',
    nominatesVerb: 'nominates',
    forExecution: 'for execution',

    day: 'Day',
    discussionAndNominations: 'Discussion and nominations',
    newNomination: 'New Nomination',
    whoIsNominating: 'Who is nominating?',
    whoAreTheyNominating: 'Who are they nominating?',
    selectNominator: 'Select nominator...',
    selectNominee: 'Select nominee...',
    startNomination: 'Start Nomination',

    executePlayer: 'Vote on {player}',
    votesNeeded: '{count} votes needed',
    votesCount: 'Votes',
    voteThreshold: 'of {threshold} needed',
    voteAction: 'Vote',
    dontVote: "Don't Vote",
    goesOnBlock: '{player} goes on the block!',
    notEnoughVotes: 'Not enough votes',
    tiedNoExecution: 'Tied \u2014 no execution',
    currentBlock: '{player} on the block ({count} votes)',
    needMoreThan: 'Need more than {count} to replace',
    noOneOnBlock: 'No one on the block',
    endDayExecute: 'End Day \u2014 Execute {player}',
    endDayNoExecution: 'End Day \u2014 No Execution',
    confirmVotes: 'Confirm Votes',
    cancelNomination: 'Cancel Nomination',
    nominee: 'Nominee',
    ghostVoteAvailable: 'Ghost vote available',
    ghostVoteSpent: 'Ghost vote spent',
    cannotVote: 'Cannot vote',
    butlerCannotVote: 'Cannot vote unless master votes',
    butlerDeadWarning: 'Master rule does not apply while dead',

    // Slayer
    slayerAction: 'Slayer Shot',
    slayerActionDescription: 'Claim to be the Slayer and shoot a player',
    selectSlayer: 'Select Slayer',
    selectTarget: 'Select Target',
    confirmSlayerShot: 'Confirm Shot',

    goodWins: 'Good Wins!',
    evilWins: 'Evil Wins!',
    townVanquishedDemon: 'The town has vanquished the Demon!',
    demonConqueredTown: 'The Demon has conquered the town!',
    finalRoles: 'Final Roles',
    backToMainMenu: 'Back to Main Menu',

    gameHistory: 'Game History',

    // Shared narrator keys
    narratorSetup: 'Storyteller Setup',
    selectTwoPlayers: 'Select 2 players to show',
    selectWhichRoleToShow: 'Select which role to reveal',
    showToPlayer: 'Show to Player',
    oneOfThemIsThe: 'One of them is the...',

    // Return device interstitial
    returnDeviceToNarrator: 'Return the device to the Storyteller',
    returnDeviceDescription: 'Please hand the device back before continuing.',
    returnDeviceReady: 'Storyteller Ready',

    // Role Revelation
    roleRevelation: 'Role Revelation',
    roleRevelationDescription: 'Tap each player to show them their role',
    tapToReveal: 'Tap to reveal',
    revealed: 'Revealed',
    startFirstNight: 'Start Night 1',
    skipRoleRevelation: 'Skip and reveal roles later',
    revealAllFirst: 'Reveal all roles before continuing',

    // Night Dashboard
    night: 'Night',
    nightDashboard: 'Night Actions',
    nightDashboardDescription: "Process each role's night action in order",
    nextAction: 'Next',
    actionDone: 'Done',
    actionSkipped: 'Skipped',
    actionPending: 'Pending',
    allActionsComplete: 'All night actions have been processed',
    proceedToDay: 'Proceed to Day',

    // Night Steps
    nightSteps: 'Night Steps',
    stepConfigurePerceptions: 'Configure Perceptions',
    stepShowResult: 'Show Result',
    stepShowRole: 'Show Role',
    stepNarratorSetup: 'Storyteller Setup',
    stepChooseVictim: 'Choose Victim',
    stepChoosePlayer: 'Choose Player',
    stepSelectPlayer: 'Select Player',
    stepSelectPlayers: 'Select Players',
    stepAssignRedHerring: 'Assign Red Herring',
    stepSelectAndShow: 'Select & Show',
    stepChooseTarget: 'Choose Target',
    stepShowMinions: 'Show Minions',
    stepSelectBluffs: 'Select Bluffs',
    stepShowBluffs: 'Show Bluffs',
    stepSelectNewImp: 'Select New Imp',
    stepChooseMaster: 'Choose Master',
    stepViewGrimoire: 'View Grimoire',
    stepShowEvilTeam: 'Your Evil Team',
    noEvilTeammates: 'No evil teammates in play',

    // Malfunction Config
    stepConfigureMalfunction: 'Configure Malfunction',
    playerIsMalfunctioning:
      'This player is poisoned or drunk, so their ability yields false information. As the Storyteller, you must select the false information they will receive.',
    chooseFalseNumber: 'What number should they see?',
    chooseFalseResult: 'What result should they see?',
    chooseFalseTarget: 'Which player should they be told is the role?',
    chooseFalseRole: 'What role should they see?',
    malfunctionWarning: 'Malfunctioning',

    // Setup Actions
    setupActions: 'Setup Actions',
    setupActionsSubtitle:
      'Configure roles that need storyteller setup before the game begins',
    allSetupActionsComplete: 'All setup actions complete',
    continueToRoleRevelation: 'Continue to Role Revelation',

    // Perception Config
    perceptionConfigTitle: 'Configure Perceptions',
    perceptionConfigDescription:
      'Some players have abilities that cause them to register falsely. Before showing the result to the player, you must decide how these ambiguous players should be perceived for this specific ability.',
    howShouldRegister: 'How should {player} register?',
    registerAsGood: 'Good',
    registerAsEvil: 'Evil',
    actualRole: 'Actual: {role}',
    keepDefault: 'Default (no change)',
    keepOriginalTeam: '{team} (default)',

    // Dawn Screen
    dawnTitle: 'Dawn',
    dawnNoDeaths: 'No one died last night',
    dawnDeathAnnouncement: '{player} is dead',
    continueToDay: 'Continue to Day',

    // Night Summary (on Day Phase)
    nightSummary: 'Night {round} Summary',
    noDeathsLastNight: 'No one died',

    // Night Dashboard review
    actionSummary: 'Action Summary',
    noActionRecorded: 'No action recorded',

    // Role Revelation narrator hint
    roleRevelationNarratorHint:
      'Only you can see this screen. Tap a player, then hand the device to them to reveal their role.',

    // Nomination tracking
    alreadyNominated: 'Already nominated today',
    alreadyBeenNominated: 'Already been nominated today',

    // Hand device interstitial
    handDeviceTo: 'Hand the device to {player}',
    tapWhenReady: 'Tap when ready to show',

    // Audience indicators
    audienceNarrator: 'Storyteller',
    audiencePlayerChoice: 'Wake player',
    audiencePlayerReveal: 'Show to player',
    storytellerDecision: 'This is your decision as Storyteller',
    wakePlayerPrompt: 'Wake {player} and ask them to choose',

    // Groups
    otherPlayers: 'Other Players',
  },

  teams: {
    townsfolk: {
      name: 'Townsfolk',
      winCondition: 'Execute the Demon to win!',
    },
    outsider: {
      name: 'Outsider',
      winCondition:
        'Execute the Demon to win! But beware, your ability may hinder the town.',
    },
    minion: {
      name: 'Minion',
      winCondition:
        'Help your Demon survive! Evil wins when evil players equal or outnumber the good.',
    },
    demon: {
      name: 'Demon',
      winCondition:
        'Evil wins when evil players equal or outnumber the good. Stay hidden and eliminate the town!',
    },
  },

  ui: {
    effects: 'Effects',
    seeRoleCard: 'See Role Card',
    editEffects: 'Edit Effects',
    editEffectConfig: 'Edit Effect',
    currentEffects: 'Current Effects',
    addEffect: 'Add Effect',
    noEffects: 'No effects',
    close: 'Close',
    narrator: 'Narrator',
    unknown: 'Unknown',
    unknownPlayer: '[Unknown Player]',
    unknownRole: '[Unknown Role]',
    unknownRoleId: 'Unknown role: {roleId}',
  },

  history: {
    noEventsYet: 'No events yet',
    gameStarted: 'Game started',
    nightBegins: 'Night {round} begins',
    sunRises: 'The sun rises...',
    diedInNight: '{player} has died in the night',
    dayBegins: 'Day {round} begins',
    learnedRole: '{player} learned they are the {role}',
    noActionTonight: '{role} has no action tonight',
    nominates: '{nominator} nominates {nominee}',
    voteResult: '{player}: {votes} votes ({threshold} needed). ',
    votePassed: '{player} goes on the block!',
    voteFailed: 'Not enough votes.',
    voteTied: 'Tied with {player} \u2014 block cleared.',
    executed: '{player} has been executed',
    goodWins: 'Good wins! The Demon has been defeated.',
    evilWins: 'Evil wins! The town has fallen.',
    effectAdded: 'Storyteller added {effect} to {player}',
    effectUpdated: 'Storyteller updated {effect} on {player}',
    effectRemoved: 'Storyteller removed {effect} from {player}',
    roleChanged: '{player} became the {role}',
    setupAction: 'Setup: {player} configured as {role}',
  },

  scripts: {
    'trouble-brewing': 'Trouble Brewing',
    custom: 'Custom Game',
    selectScript: 'Choose a Script',
    selectScriptSubtitle:
      'Select an edition to determine which roles are available',
    enforceDistribution: 'Standard role distribution',
    freeformSelection: 'Any roles, any distribution',
    // Generator presets
    generateRoles: 'Generate Roles',
    simple: 'Simple',
    simpleDescription: 'Straightforward roles, easy to learn',
    interesting: 'Interesting',
    interestingDescription: 'A balanced mix of complexity',
    chaotic: 'Chaotic',
    chaoticDescription: 'Maximum deception and surprises',
    chaos: 'Chaos',
    selectThisPool: 'Select',
    regenerate: 'Regenerate',
    orPickManually: 'or pick manually',
    generate: 'Generate',
    manual: 'Manual',
    useThisPool: 'Use This Pool',
    presetApplied: '{preset} applied',
    rolesSelected: '{count} roles selected',
  },
}

export default en
