import { createContext } from 'react'

export type PlayerFacingContextType = {
  setPlayerFacing: (value: boolean) => void
}

export const PlayerFacingContext = createContext<PlayerFacingContextType>({
  setPlayerFacing: () => {},
})
