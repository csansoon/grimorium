import { getRole } from './roles'

export type RoleAssignmentInput = {
  /** Ordered list of player names */
  players: string[]
  /** Full pool of selected role IDs (may be larger than players) */
  selectedRoles: string[]
  /** Manual assignments: playerName -> roleId (null = random) */
  manualAssignments: Record<string, string | null>
}

export type PlayerRoleAssignment = {
  name: string
  roleId: string
}

/**
 * Resolves final role assignments for all players.
 *
 * 1. Applies all manual assignments first.
 * 2. Ensures at least one demon role is included in the random pool
 *    (pre-assigns it to a random unassigned player if needed).
 * 3. Shuffles remaining roles and assigns them to unassigned players.
 */
export function resolveRoleAssignments(
  input: RoleAssignmentInput,
): PlayerRoleAssignment[] {
  const { players, selectedRoles, manualAssignments } = input
  const finalAssignments: PlayerRoleAssignment[] = []
  const remainingRoles: string[] = [...selectedRoles]

  // Step 1: Apply manual assignments and remove those roles from the pool
  for (const [playerName, roleId] of Object.entries(manualAssignments)) {
    if (roleId) {
      finalAssignments.push({ name: playerName, roleId })
      const index = remainingRoles.indexOf(roleId)
      if (index !== -1) {
        remainingRoles.splice(index, 1)
      }
    }
  }

  const unassignedPlayers = players.filter((name) => !manualAssignments[name])

  // Step 2: Ensure at least one demon role is assigned when randomizing
  const hasDemonAssigned = finalAssignments.some((a) => {
    const role = getRole(a.roleId)
    return role?.team === 'demon'
  })

  if (!hasDemonAssigned && unassignedPlayers.length > 0) {
    const demonIndex = remainingRoles.findIndex((roleId) => {
      const role = getRole(roleId)
      return role?.team === 'demon'
    })

    if (demonIndex !== -1) {
      const [demonRoleId] = remainingRoles.splice(demonIndex, 1)
      const randomPlayerIdx = Math.floor(
        Math.random() * unassignedPlayers.length,
      )
      const [randomPlayer] = unassignedPlayers.splice(randomPlayerIdx, 1)
      finalAssignments.push({
        name: randomPlayer,
        roleId: demonRoleId,
      })
    }
  }

  // Step 3: Shuffle remaining roles and assign to remaining players
  const shuffled = [...remainingRoles].sort(() => Math.random() - 0.5)

  for (const playerName of unassignedPlayers) {
    const roleId = shuffled.pop()
    if (roleId) {
      finalAssignments.push({ name: playerName, roleId })
    }
  }

  return finalAssignments
}
