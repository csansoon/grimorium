import { useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { PlayerFacingContext, HandbackContext } from '../context/PlayerFacingContext'
import { HandDeviceScreen } from './HandDeviceScreen'
import { ReturnDeviceScreen } from './ReturnDeviceScreen'

/**
 * Wraps content that is shown directly to a player (e.g., role reveals,
 * information results). When mounted, signals to GameScreen that the
 * current view is player-facing, which hides the Grimoire and History
 * floating buttons to prevent accidental spoilers.
 *
 * When `playerName` is provided, manages the full device hand-off lifecycle:
 *   1. Shows a "Hand the device to {player}" interstitial (HandDeviceScreen)
 *   2. Renders the actual player-facing content (children)
 *   3. When a child calls `requestHandback(callback)`, shows a
 *      "Return device to Storyteller" interstitial (ReturnDeviceScreen)
 *   4. Fires the stored callback only after the Storyteller confirms
 *
 * Children access `requestHandback` via the `useHandback()` hook.
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
  const [done, setDone] = useState(false)
  const pendingCallback = useRef<(() => void) | null>(null)

  useEffect(() => {
    setPlayerFacing(true)
    return () => setPlayerFacing(false)
  }, [setPlayerFacing])

  const requestHandback = useCallback(
    (callback: () => void) => {
      if (playerName) {
        pendingCallback.current = callback
        setDone(true)
      } else {
        callback()
      }
    },
    [playerName],
  )

  const handbackCtx = useMemo(
    () => ({ requestHandback }),
    [requestHandback],
  )

  const handleHandbackReady = useCallback(() => {
    pendingCallback.current?.()
    pendingCallback.current = null
  }, [])

  // State 1: Hand device to player
  if (!ready && playerName) {
    return <HandDeviceScreen playerName={playerName} onReady={() => setReady(true)} />
  }

  // State 3: Return device to storyteller
  if (done) {
    return <ReturnDeviceScreen onReady={handleHandbackReady} />
  }

  // State 2: Show player-facing content
  return (
    <HandbackContext.Provider value={handbackCtx}>
      {children}
    </HandbackContext.Provider>
  )
}
