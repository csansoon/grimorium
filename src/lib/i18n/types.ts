export type Language = 'en' | 'es'

export type Translations = {
  // Common
  common: {
    continue: string
    confirm: string
    cancel: string
    back: string
    next: string
    players: string
    player: string
    roles: string
    role: string
    random: string
    startGame: string
    mainMenu: string
    history: string
    winCondition: string
    youAreThe: string
    iUnderstandMyRole: string
  }

  // Main Menu
  mainMenu: {
    title: string
    subtitle: string
    tapToOpen: string
    continueGame: string
    newGame: string
    startFreshGame: string
    rolesLibrary: string
    browseAllRoles: string
    previousGames: string
    completed: string
    settingUp: string
    round: string
    language: string
  }

  // New Game Flow
  newGame: {
    step1Title: string
    step1Subtitle: string
    addPlayer: string
    playerPlaceholder: string
    minPlayersWarning: string
    nextSelectRoles: string
    loadedFromLastGame: string

    step2Title: string
    step2Subtitle: string
    needAtLeastRoles: string
    needAtLeastImp: string
    nextAssignRoles: string
    suggested: string

    step3Title: string
    step3Subtitle: string
    assignmentInfo: string
    resetToRandom: string
    playerAssignments: string
    randomPool: string
    rolesForPlayers: string
    impNotAssignedWarning: string
    rolesRandomlyAssigned: string
    customizeAssignments: string
    tapToAssign: string
  }

  // Game Phases
  game: {
    // Narrator prompts
    narratorGiveDevice: string
    narratorWakePlayer: string
    narratorRoleChanged: string
    readyShowToPlayer: string
    yourRoleHasChanged: string

    // Night
    nightComplete: string
    nightActionsResolved: string
    startDay: string
    choosePlayerToKill: string
    selectVictim: string
    confirmKill: string

    // Grimoire
    grimoire: string
    daytimeActions: string
    accusePlayerDescription: string

    nominatesForExecution: string
    nominatesVerb: string
    forExecution: string

    // Day
    day: string
    discussionAndNominations: string
    newNomination: string
    whoIsNominating: string
    whoAreTheyNominating: string
    selectNominator: string
    selectNominee: string
    startNomination: string


    // Voting
    executePlayer: string
    votesNeeded: string
    votesCount: string
    voteThreshold: string
    voteAction: string
    dontVote: string
    goesOnBlock: string
    notEnoughVotes: string
    tiedNoExecution: string
    currentBlock: string
    needMoreThan: string
    noOneOnBlock: string
    endDayExecute: string
    endDayNoExecution: string
    confirmVotes: string
    cancelNomination: string
    nominee: string
    ghostVoteAvailable: string
    ghostVoteSpent: string
    cannotVote: string
    butlerCannotVote: string
    butlerDeadWarning: string

    // Slayer
    slayerAction: string
    slayerActionDescription: string
    selectSlayer: string
    selectTarget: string
    confirmSlayerShot: string

    // Game Over
    goodWins: string
    evilWins: string
    townVanquishedDemon: string
    demonConqueredTown: string
    finalRoles: string
    backToMainMenu: string

    // History
    gameHistory: string

    // Shared narrator keys
    narratorSetup: string
    selectTwoPlayers: string
    selectWhichRoleToShow: string
    showToPlayer: string
    oneOfThemIsThe: string

    // Return device interstitial
    returnDeviceToNarrator: string
    returnDeviceDescription: string
    returnDeviceReady: string

    // Role Revelation
    roleRevelation: string
    roleRevelationDescription: string
    tapToReveal: string
    revealed: string
    startFirstNight: string
    skipRoleRevelation: string
    revealAllFirst: string

    // Night Dashboard
    night: string
    nightDashboard: string
    nightDashboardDescription: string
    nextAction: string
    actionDone: string
    actionSkipped: string
    actionPending: string
    allActionsComplete: string
    proceedToDay: string

    // Night Steps
    nightSteps: string
    stepConfigurePerceptions: string
    stepShowResult: string
    stepShowRole: string
    stepNarratorSetup: string
    stepChooseVictim: string
    stepChoosePlayer: string
    stepSelectPlayer: string
    stepSelectPlayers: string
    stepAssignRedHerring: string
    stepSelectAndShow: string
    stepChooseTarget: string
    stepShowMinions: string
    stepSelectBluffs: string
    stepShowBluffs: string
    stepSelectNewImp: string
    stepChooseMaster: string
    stepViewGrimoire: string
    stepShowEvilTeam: string
    noEvilTeammates: string

    // Malfunction Config
    stepConfigureMalfunction: string
    playerIsMalfunctioning: string
    chooseFalseNumber: string
    chooseFalseResult: string
    chooseFalseTarget: string
    chooseFalseRole: string
    malfunctionWarning: string

    // Setup Actions
    setupActions: string
    setupActionsSubtitle: string
    allSetupActionsComplete: string
    continueToRoleRevelation: string

    // Perception Config
    perceptionConfigTitle: string
    perceptionConfigDescription: string
    howShouldRegister: string
    registerAsGood: string
    registerAsEvil: string
    actualRole: string
    keepDefault: string
    keepOriginalTeam: string

    // Dawn Screen
    dawnTitle: string
    dawnNoDeaths: string
    dawnDeathAnnouncement: string
    continueToDay: string

    // Night Summary (on Day Phase)
    nightSummary: string
    noDeathsLastNight: string


    // Night Dashboard review
    actionSummary: string
    noActionRecorded: string

    // Role Revelation narrator hint
    roleRevelationNarratorHint: string

    // Nomination tracking
    alreadyNominated: string
    alreadyBeenNominated: string

    // Hand device interstitial
    handDeviceTo: string
    tapWhenReady: string

    // Audience indicators
    audienceNarrator: string
    audiencePlayerChoice: string
    audiencePlayerReveal: string
    storytellerDecision: string
    wakePlayerPrompt: string

    // Groups
    otherPlayers: string
  }

  // Teams
  teams: {
    townsfolk: {
      name: string
      winCondition: string
    }
    outsider: {
      name: string
      winCondition: string
    }
    minion: {
      name: string
      winCondition: string
    }
    demon: {
      name: string
      winCondition: string
    }
  }

  // UI
  ui: {
    effects: string
    seeRoleCard: string
    editEffects: string
    editEffectConfig: string
    currentEffects: string
    addEffect: string
    noEffects: string
    close: string
    narrator: string
    unknown: string
    unknownPlayer: string
    unknownRole: string
    unknownRoleId: string
  }

  // History messages
  history: {
    noEventsYet: string
    gameStarted: string
    nightBegins: string
    sunRises: string
    diedInNight: string
    dayBegins: string
    learnedRole: string
    noActionTonight: string
    nominates: string
    voteResult: string
    votePassed: string
    voteFailed: string
    voteTied: string
    executed: string
    goodWins: string
    evilWins: string
    effectAdded: string
    effectUpdated: string
    effectRemoved: string
    roleChanged: string
    setupAction: string
  }

  // Scripts
  scripts: {
    'trouble-brewing': string
    custom: string
    selectScript: string
    selectScriptSubtitle: string
    enforceDistribution: string
    freeformSelection: string
    // Generator presets
    generateRoles: string
    simple: string
    simpleDescription: string
    interesting: string
    interestingDescription: string
    chaotic: string
    chaoticDescription: string
    chaos: string
    selectThisPool: string
    regenerate: string
    orPickManually: string
    generate: string
    manual: string
    useThisPool: string
    presetApplied: string
    rolesSelected: string
  }
}
