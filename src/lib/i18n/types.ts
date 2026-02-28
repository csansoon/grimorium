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
    dawnDiedInTheNight: string
    continueToDay: string

    // Night Summary (on Day Phase)
    nightSummary: string
    noDeathsLastNight: string

    // Death Revelation
    deathRevealTitle: string
    deathRevealSubtitle: string
    deathRevealDead: string
    deathRevealNextDeath: string
    deathRevealContinue: string


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

  // How To Play
  howToPlay: {
    title: string
    // Part 1: Game Rules
    part1Title: string
    p1_nutshellTitle: string
    p1_nutshell1: string
    p1_nutshell2: string
    p1_nutshell3: string
    p1_nutshell4: string
    p1_nutshell5: string
    p1_teamsTitle: string
    p1_teamTownsfolk: string
    p1_teamTownsfolkExample: string
    p1_teamOutsider: string
    p1_teamOutsiderExample: string
    p1_teamMinion: string
    p1_teamMinionExample: string
    p1_teamDemon: string
    p1_teamDemonExample: string
    p1_roundTitle: string
    p1_roundNight: string
    p1_roundDay: string
    p1_roundNominate: string
    p1_roundWinGood: string
    p1_roundWinEvil: string
    p1_roundWinConditions: string
    p1_roundNightLabel: string
    p1_roundDayLabel: string
    p1_roundNominateLabel: string
    p1_conceptsTitle: string
    p1_conceptPoison: string
    p1_conceptDrunk: string
    p1_conceptDead: string
    p1_conceptStoryteller: string

    // Part 2: App Walkthrough
    part2Title: string
    p2_createTitle: string
    p2_create1: string
    p2_create2: string
    p2_create3: string
    p2_create4: string
    p2_createTip: string
    p2_setupTitle: string
    p2_setup1: string
    p2_setup2: string
    p2_revealTitle: string
    p2_reveal1: string
    p2_reveal2: string
    p2_reveal3: string
    p2_revealWarning: string
    p2_nightTitle: string
    p2_night1: string
    p2_night2: string
    p2_night3: string
    p2_night4: string
    p2_night5: string
    p2_nightTip: string
    p2_dayTitle: string
    p2_day1: string
    p2_day2: string
    p2_day3: string
    p2_day4: string
    p2_voteTitle: string
    p2_vote1: string
    p2_vote2: string
    p2_vote3: string
    p2_vote4: string
    p2_endTitle: string
    p2_end1: string
    p2_end2: string
    p2_end3: string
    p2_end4: string
    p2_end5: string
    p2_grimTitle: string
    p2_grim1: string
    p2_grim2: string
    p2_grim3: string
    p2_historyTitle: string
    p2_history1: string
    p2_history2: string
    p2_history3: string

    // Part 3: Players
    part3Title: string
    p3_tip1Title: string
    p3_tip1Desc: string
    p3_tip2Title: string
    p3_tip2Desc: string
    p3_tip3Title: string
    p3_tip3Desc: string
    p3_tip4Title: string
    p3_tip4Desc: string

    // Part 4: Storytellers
    part4Title: string
    p4_firstTitle: string
    p4_first1: string
    p4_first2: string
    p4_first3: string
    p4_first4: string
    p4_duringTitle: string
    p4_during1: string
    p4_during2: string
    p4_during3: string
    p4_during4: string
    p4_pitfallsTitle: string
    p4_pitfalls1: string
    p4_pitfalls2: string
    p4_pitfalls3: string
    p4_pitfalls4: string
  }
}
