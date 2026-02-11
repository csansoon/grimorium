import { useContext, useEffect, type ReactNode } from 'react'
import { PlayerFacingContext } from '../context/PlayerFacingContext'

/**
 * Wraps content that is shown directly to a player (e.g., role reveals,
 * information results). When mounted, signals to GameScreen that the
 * current view is player-facing, which hides the Grimoire and History
 * floating buttons to prevent accidental spoilers.
 *
 * Usage: wrap the player-facing return branch in any NightAction component.
 */
export function PlayerFacingScreen({ children }: { children: ReactNode }) {
  const { setPlayerFacing } = useContext(PlayerFacingContext)

  useEffect(() => {
    setPlayerFacing(true)
    return () => setPlayerFacing(false)
  }, [setPlayerFacing])

  return <>{children}</>
}
