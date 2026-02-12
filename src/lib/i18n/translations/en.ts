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
    title: 'Grimoire',
    subtitle: 'Blood on the Clocktower Narrator Companion',
    continueGame: 'Continue Game',
    newGame: 'New Game',
    startFreshGame: 'Start a fresh game',
    rolesLibrary: 'Roles',
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
    selectVictim: 'Select your victim for tonight.',
    confirmKill: 'Confirm Kill',

    grimoire: 'Grimoire',
    daytimeActions: 'Daytime Actions',
    accusePlayerDescription: 'Accuse a player and put them to vote',
    executionAlreadyHappened: 'An execution has already happened today',
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
    endDayGoToNight: 'End Day → Go to Night',

    executePlayer: 'Execute {player}?',
    yesVsNoNeeded: 'More YES than NO votes needed',
    votesFor: 'For',
    votesAgainst: 'Against',
    abstain: 'Abstain',
    willBeExecuted:
      '{player} will be EXECUTED ({votesFor} yes vs {votesAgainst} no)',
    willNotBeExecuted:
      '{player} will NOT be executed ({votesFor} yes vs {votesAgainst} no)',
    confirmVotes: 'Confirm Votes',
    cancelNomination: 'Cancel Nomination',

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
    narratorSetup: 'Narrator Setup',
    selectTwoPlayers: 'Select 2 players to show',
    selectWhichRoleToShow: 'Select which role to reveal',
    showToPlayer: 'Show to Player',
    oneOfThemIsThe: 'One of them is the...',

    // Handback screen
    handbackToNarrator: 'Hand back to Narrator',
    handbackDescription:
      'Please return the device to the Narrator before continuing.',
    narratorReady: 'Narrator Ready',

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
    stepNarratorSetup: 'Narrator Setup',
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

    // Malfunction Config
    stepConfigureMalfunction: 'Configure Malfunction',
    playerIsMalfunctioning:
      'This player is poisoned/drunk — their ability malfunctions!',
    chooseFalseNumber: 'What number should they see?',
    chooseFalseResult: 'What result should they see?',
    chooseFalseTarget: 'Which player should they be told is the role?',
    chooseFalseRole: 'What role should they see?',
    malfunctionWarning: 'Malfunctioning',

    // Setup Actions
    setupActions: 'Setup Actions',
    setupActionsSubtitle:
      'Configure roles that need narrator setup before the game begins',
    allSetupActionsComplete: 'All setup actions complete',
    continueToRoleRevelation: 'Continue to Role Revelation',

    // Perception Config
    perceptionConfigTitle: 'Configure Perceptions',
    perceptionConfigDescription:
      'Some players can register differently. Decide how they should appear for this ability.',
    howShouldRegister: 'How should {player} register?',
    registerAsGood: 'Good',
    registerAsEvil: 'Evil',
    actualRole: 'Actual: {role}',
    keepDefault: 'Default (no change)',
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
    voteResult: '{player}: {for} for, {against} against. ',
    votePassed: 'The vote passes!',
    voteFailed: 'The vote fails.',
    executed: '{player} has been executed',
    goodWins: 'Good wins! The Demon has been defeated.',
    evilWins: 'Evil wins! The town has fallen.',
    effectAdded: 'Narrator added {effect} to {player}',
    effectUpdated: 'Narrator updated {effect} on {player}',
    effectRemoved: 'Narrator removed {effect} from {player}',
    roleChanged: '{player} became the {role}',
    setupAction: 'Setup: {player} configured as {role}',
  },

  scripts: {
    'trouble-brewing': 'Trouble Brewing',
    custom: 'Custom Game',
    selectScript: 'Choose a Script',
    selectScriptSubtitle: 'Select an edition to determine which roles are available',
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
