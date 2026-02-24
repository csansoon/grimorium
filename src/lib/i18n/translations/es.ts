import { Translations } from '../types'

const es: Translations = {
  common: {
    continue: 'Continuar',
    confirm: 'Confirmar',
    cancel: 'Cancelar',
    back: 'Volver',
    next: 'Siguiente',
    players: 'Jugadores',
    player: 'Jugador',
    roles: 'Roles',
    role: 'Rol',
    random: 'Aleatorio',
    startGame: 'Iniciar Partida',
    mainMenu: 'Menú Principal',
    history: 'Historial',
    winCondition: 'Condición de Victoria',
    youAreThe: 'Eres el/la...',
    iUnderstandMyRole: 'Entiendo mi rol',
  },

  mainMenu: {
    title: 'El Grimorio',
    subtitle: 'Compañero del Cuentacuentos de Blood on the Clocktower',
    tapToOpen: 'Toca para abrir',
    continueGame: 'Continuar Partida',
    newGame: 'Nueva Partida',
    startFreshGame: 'Comenzar una nueva partida',
    rolesLibrary: 'Biblioteca de Roles',
    browseAllRoles: 'Explorar todas las cartas de rol',
    previousGames: 'Partidas Anteriores',
    completed: 'Completada',
    settingUp: 'Configurando',
    round: 'Ronda',
    language: 'Idioma',
  },

  newGame: {
    step1Title: 'Nueva Partida',
    step1Subtitle: 'Paso 1: Añadir jugadores',
    addPlayer: 'Añadir Jugador',
    playerPlaceholder: 'Jugador',
    minPlayersWarning: 'Añade al menos 5 jugadores para continuar',
    nextSelectRoles: 'Siguiente: Seleccionar Roles',
    loadedFromLastGame: 'De la última partida',

    step2Title: 'Nueva Partida',
    step2Subtitle: 'Paso 2: Seleccionar roles en juego',
    needAtLeastRoles: 'Se necesitan al menos {count} roles',
    needAtLeastImp: 'Se necesita al menos 1 Imp',
    nextAssignRoles: 'Siguiente: Asignar Roles',
    suggested: 'Sugerido',

    step3Title: 'Nueva Partida',
    step3Subtitle: 'Paso 3: Asignar roles (opcional)',
    assignmentInfo:
      'Opcionalmente asigna roles específicos a jugadores. Los jugadores sin asignar reciben roles aleatorios.',
    resetToRandom: 'Restablecer todo a aleatorio',
    playerAssignments: 'Asignaciones de Jugadores',
    randomPool: 'Pool Aleatorio',
    rolesForPlayers: '{roles} roles para {players} jugadores',
    impNotAssignedWarning:
      '¡El Imp no será asignado! Asegúrate de que al menos un jugador reciba el Imp o deja algunos jugadores en aleatorio.',
    rolesRandomlyAssigned: 'Los roles se asignarán aleatoriamente',
    customizeAssignments: 'Personalizar Asignaciones',
    tapToAssign: 'Toca un jugador para asignar un rol específico',
  },

  game: {
    narratorGiveDevice: 'Dale el dispositivo a {player} para que vea su rol.',
    narratorWakePlayer:
      'Despierta a {player} ({role}) para su acción nocturna.',
    narratorRoleChanged: 'Dale el dispositivo a {player} — su rol ha cambiado.',
    readyShowToPlayer: 'Listo - Mostrar al Jugador',
    yourRoleHasChanged: '¡Tu rol ha cambiado!',

    nightComplete: 'Noche {round} Completa',
    nightActionsResolved:
      'Todas las acciones nocturnas han sido resueltas. ¿Listos para comenzar el día?',
    startDay: 'Comenzar Día',
    choosePlayerToKill: 'Elige un jugador para matar',
    selectVictim: 'Selecciona tu víctima para esta noche.',
    confirmKill: 'Confirmar Asesinato',

    grimoire: 'Grimorio',
    daytimeActions: 'Acciones de Día',
    accusePlayerDescription: 'Acusa a un jugador y ponlo a votación',

    nominatesForExecution: '{nominator} nomina a {nominee} para ejecución',
    nominatesVerb: 'nomina a',
    forExecution: 'para ejecución',

    day: 'Día',
    discussionAndNominations: 'Discusión y nominaciones',
    newNomination: 'Nueva Nominación',
    whoIsNominating: '¿Quién está nominando?',
    whoAreTheyNominating: '¿A quién están nominando?',
    selectNominator: 'Seleccionar nominador...',
    selectNominee: 'Seleccionar nominado...',
    startNomination: 'Iniciar Nominación',


    executePlayer: 'Votar sobre {player}',
    votesNeeded: '{count} votos necesarios',
    votesCount: 'Votos',
    voteThreshold: 'de {threshold} necesarios',
    voteAction: 'Votar',
    dontVote: 'No Votar',
    goesOnBlock: '¡{player} está en la cuerda floja!',
    notEnoughVotes: 'No hay suficientes votos',
    tiedNoExecution: 'Empate \u2014 sin ejecución',
    currentBlock: '{player} en la cuerda floja ({count} votos)',
    needMoreThan: 'Se necesitan más de {count} para reemplazar',
    noOneOnBlock: 'Nadie en la cuerda floja',
    endDayExecute: 'Terminar Día \u2014 Ejecutar a {player}',
    endDayNoExecution: 'Terminar Día \u2014 Sin Ejecución',
    confirmVotes: 'Confirmar Votos',
    cancelNomination: 'Cancelar Nominación',

    // Slayer
    slayerAction: 'Disparo del Matador',
    slayerActionDescription: 'Proclama ser el Matador y dispara a un jugador',
    selectSlayer: 'Seleccionar Matador',
    selectTarget: 'Seleccionar Objetivo',
    confirmSlayerShot: 'Confirmar Disparo',

    goodWins: '¡Gana el Bien!',
    evilWins: '¡Gana el Mal!',
    townVanquishedDemon: '¡El pueblo ha vencido al Demonio!',
    demonConqueredTown: '¡El Demonio ha conquistado el pueblo!',
    finalRoles: 'Roles Finales',
    backToMainMenu: 'Volver al Menú Principal',

    gameHistory: 'Historial de Partida',

    // Shared narrator keys
    narratorSetup: 'Configuración del Cuentacuentos',
    selectTwoPlayers: 'Selecciona 2 jugadores para mostrar',
    selectWhichRoleToShow: 'Selecciona qué rol revelar',
    showToPlayer: 'Mostrar al Jugador',
    oneOfThemIsThe: 'Uno de ellos es el/la...',

    // Return device interstitial
    returnDeviceToNarrator: 'Devuelve el dispositivo al Cuentacuentos',
    returnDeviceDescription:
      'Por favor, devuelve el dispositivo antes de continuar.',
    returnDeviceReady: 'Cuentacuentos Listo',

    // Role Revelation
    roleRevelation: 'Revelación de Roles',
    roleRevelationDescription: 'Toca cada jugador para mostrarle su rol',
    tapToReveal: 'Toca para revelar',
    revealed: 'Revelado',
    startFirstNight: 'Comenzar Noche 1',
    skipRoleRevelation: 'Omitir y revelar roles después',
    revealAllFirst: 'Revela todos los roles antes de continuar',

    // Night Dashboard
    night: 'Noche',
    nightDashboard: 'Acciones Nocturnas',
    nightDashboardDescription:
      'Procesa la acción nocturna de cada rol en orden',
    nextAction: 'Siguiente',
    actionDone: 'Hecho',
    actionSkipped: 'Omitido',
    actionPending: 'Pendiente',
    allActionsComplete: 'Todas las acciones nocturnas han sido procesadas',
    proceedToDay: 'Proceder al Día',

    // Night Steps
    nightSteps: 'Pasos Nocturnos',
    stepConfigurePerceptions: 'Configurar Percepciones',
    stepShowResult: 'Mostrar Resultado',
    stepShowRole: 'Mostrar Rol',
    stepNarratorSetup: 'Configuración del Cuentacuentos',
    stepChooseVictim: 'Elegir Víctima',
    stepChoosePlayer: 'Elegir Jugador',
    stepSelectPlayer: 'Seleccionar Jugador',
    stepSelectPlayers: 'Seleccionar Jugadores',
    stepAssignRedHerring: 'Asignar Pista Falsa',
    stepSelectAndShow: 'Seleccionar y Mostrar',
    stepChooseTarget: 'Elegir Objetivo',
    stepShowMinions: 'Mostrar Secuaces',
    stepSelectBluffs: 'Seleccionar Faroles',
    stepShowBluffs: 'Mostrar Faroles',
    stepSelectNewImp: 'Seleccionar Nuevo Imp',
    stepChooseMaster: 'Elegir Amo',
    stepViewGrimoire: 'Ver Grimorio',
    stepShowEvilTeam: 'Tu Equipo Malvado',
    noEvilTeammates: 'No hay compañeros malvados en juego',

    // Malfunction Config
    stepConfigureMalfunction: 'Configurar Mal Funcionamiento',
    playerIsMalfunctioning:
      '¡Este jugador está envenenado/borracho — su habilidad falla!',
    chooseFalseNumber: '¿Qué número debería ver?',
    chooseFalseResult: '¿Qué resultado debería ver?',
    chooseFalseTarget: '¿A qué jugador le dirán que es el rol?',
    chooseFalseRole: '¿Qué rol debería ver?',
    malfunctionWarning: 'Mal Funcionamiento',

    // Setup Actions
    setupActions: 'Acciones de Configuración',
    setupActionsSubtitle:
      'Configura los roles que necesitan preparación del cuentacuentos antes de comenzar',
    allSetupActionsComplete: 'Todas las acciones de configuración completadas',
    continueToRoleRevelation: 'Continuar a Revelación de Roles',

    // Perception Config
    perceptionConfigTitle: 'Configurar Percepciones',
    perceptionConfigDescription:
      'Algunos jugadores pueden registrarse de forma diferente. Decide cómo deben aparecer para esta habilidad.',
    howShouldRegister: '¿Cómo debe registrarse {player}?',
    registerAsGood: 'Bueno',
    registerAsEvil: 'Malvado',
    actualRole: 'Real: {role}',
    keepDefault: 'Por defecto (sin cambio)',
    keepOriginalTeam: '{team} (por defecto)',

    // Dawn Screen
    dawnTitle: 'Amanecer',
    dawnNoDeaths: 'Nadie murió anoche',
    dawnDeathAnnouncement: '{player} está muerto/a',
    continueToDay: 'Continuar al Día',

    // Night Summary (on Day Phase)
    nightSummary: 'Resumen de Noche {round}',
    noDeathsLastNight: 'Nadie murió',


    // Night Dashboard review
    actionSummary: 'Resumen de Acción',
    noActionRecorded: 'Sin acción registrada',

    // Role Revelation narrator hint
    roleRevelationNarratorHint:
      'Solo tú puedes ver esta pantalla. Toca un jugador, luego entrégale el dispositivo para revelar su rol.',

    // Nomination tracking
    alreadyNominated: 'Ya nominó hoy',
    alreadyBeenNominated: 'Ya fue nominado/a hoy',

    // Hand device interstitial
    handDeviceTo: 'Entrega el dispositivo a {player}',
    tapWhenReady: 'Toca cuando estés listo para mostrar',

    // Audience indicators
    audienceNarrator: 'Cuentacuentos',
    audiencePlayerChoice: 'Despertar jugador',
    audiencePlayerReveal: 'Mostrar al jugador',
    storytellerDecision: 'Esta es tu decisión como Cuentacuentos',
    wakePlayerPrompt: 'Despierta a {player} y pídele que elija',

    // Groups
    otherPlayers: 'Otros Jugadores',
  },

  teams: {
    townsfolk: {
      name: 'Aldeano',
      winCondition: '¡Ejecuta al Demonio para ganar!',
    },
    outsider: {
      name: 'Forastero',
      winCondition:
        '¡Ejecuta al Demonio para ganar! Pero cuidado, tu habilidad puede perjudicar al pueblo.',
    },
    minion: {
      name: 'Secuaz',
      winCondition:
        '¡Ayuda a tu Demonio a sobrevivir! El mal gana cuando los jugadores malvados igualan o superan a los buenos.',
    },
    demon: {
      name: 'Demonio',
      winCondition:
        'El mal gana cuando los jugadores malvados igualan o superan a los buenos. ¡Permanece oculto y elimina al pueblo!',
    },
  },

  ui: {
    effects: 'Efectos',
    seeRoleCard: 'Ver Carta de Rol',
    editEffects: 'Editar Efectos',
    editEffectConfig: 'Editar Efecto',
    currentEffects: 'Efectos Actuales',
    addEffect: 'Añadir Efecto',
    noEffects: 'Sin efectos',
    close: 'Cerrar',
    narrator: 'Cuentacuentos',
    unknown: 'Desconocido',
    unknownPlayer: '[Jugador Desconocido]',
    unknownRole: '[Rol Desconocido]',
    unknownRoleId: 'Rol desconocido: {roleId}',
  },

  history: {
    noEventsYet: 'Aún no hay eventos',
    gameStarted: 'Partida iniciada',
    nightBegins: 'Noche {round} comienza',
    sunRises: 'El sol sale...',
    diedInNight: '{player} ha muerto en la noche',
    dayBegins: 'Día {round} comienza',
    learnedRole: '{player} descubrió que es el/la {role}',
    noActionTonight: '{role} no tiene acción esta noche',
    nominates: '{nominator} nomina a {nominee}',
    voteResult: '{player}: {votes} votos ({threshold} necesarios). ',
    votePassed: '¡{player} está en la cuerda floja!',
    voteFailed: 'No hay suficientes votos.',
    voteTied: 'Empate con {player} \u2014 nadie en la cuerda floja.',
    executed: '{player} ha sido ejecutado/a',
    goodWins: '¡El Bien gana! El Demonio ha sido derrotado.',
    evilWins: '¡El Mal gana! El pueblo ha caído.',
    effectAdded: 'El Cuentacuentos añadió {effect} a {player}',
    effectUpdated: 'El Cuentacuentos actualizó {effect} en {player}',
    effectRemoved: 'El Cuentacuentos eliminó {effect} de {player}',
    roleChanged: '{player} se convirtió en el/la {role}',
    setupAction: 'Configuración: {player} configurado como {role}',
  },

  scripts: {
    'trouble-brewing': 'Problemas en el Pueblo',
    custom: 'Partida Personalizada',
    selectScript: 'Elige un Guión',
    selectScriptSubtitle:
      'Selecciona una edición para determinar los roles disponibles',
    enforceDistribution: 'Distribución estándar de roles',
    freeformSelection: 'Cualquier rol, cualquier distribución',
    // Generator presets
    generateRoles: 'Generar Roles',
    simple: 'Simple',
    simpleDescription: 'Roles sencillos, fáciles de aprender',
    interesting: 'Interesante',
    interestingDescription: 'Una mezcla equilibrada de complejidad',
    chaotic: 'Caótico',
    chaoticDescription: 'Máximo engaño y sorpresas',
    chaos: 'Caos',
    selectThisPool: 'Seleccionar',
    regenerate: 'Regenerar',
    orPickManually: 'o elige manualmente',
    generate: 'Generar',
    manual: 'Manual',
    useThisPool: 'Usar Este Pool',
    presetApplied: '{preset} aplicado',
    rolesSelected: '{count} roles seleccionados',
  },
}

export default es
