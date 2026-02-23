import { createContext, useContext } from 'react'

export type PlayerFacingContextType = {
  setPlayerFacing: (value: boolean) => void
}

export const PlayerFacingContext = createContext<PlayerFacingContextType>({
  setPlayerFacing: () => {},
})

/**
 * Context provided by PlayerFacingScreen to its children.
 * Allows children to request a "return device to Storyteller" interstitial
 * before the actual completion callback fires.
 *
 * Default behavior (when no PlayerFacingScreen wraps): call callback immediately.
 */
export type HandbackContextType = {
  requestHandback: (callback: () => void) => void
}

export const HandbackContext = createContext<HandbackContextType>({
  requestHandback: (cb) => cb(),
})

export function useHandback() {
  return useContext(HandbackContext)
}
