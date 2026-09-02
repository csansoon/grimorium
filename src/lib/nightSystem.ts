export const SYSTEM_DEMON_CREATION_DEATHS_ACTION =
  'system_demon_creation_deaths' as const

export const DEMON_CREATION_ARBITRARY_DEATH_CAUSE =
  'demon_creation_arbitrary_death' as const

export function isDemonCreationArbitraryDeathCause(
  cause: unknown,
): boolean {
  return cause === DEMON_CREATION_ARBITRARY_DEATH_CAUSE
}
