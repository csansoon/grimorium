import { useContext, useEffect, useState, type ReactNode } from 'react'
import { PlayerFacingContext } from '../context/PlayerFacingContext'
import { HandDeviceScreen } from './HandDeviceScreen'

/**
 * Wraps content that is shown directly to a player (e.g., role reveals,
 * information results). When mounted, signals to GameScreen that the
 * current view is player-facing, which hides the Grimoire and History
 * floating buttons to prevent accidental spoilers.
 *
 * When `playerName` is provided, shows a "Hand the device to {player}"
 * interstitial screen first. The narrator must tap "Ready" before the
 * actual content is revealed.
 *
 * Usage: wrap the player-facing return branch in any NightAction component.
 */
export function PlayerFacingScreen({
  children,
  playerName,
}: {
  children: ReactNode
  playerName?: string
}) {
  const { setPlayerFacing } = useContext(PlayerFacingContext)
  const [ready, setReady] = useState(!playerName)

  useEffect(() => {
    setPlayerFacing(true)
    return () => setPlayerFacing(false)
  }, [setPlayerFacing])

  if (!ready && playerName) {
    return <HandDeviceScreen playerName={playerName} onReady={() => setReady(true)} />
  }

  return <>{children}</>
}
