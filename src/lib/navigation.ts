/** Return to the menu without discarding the active-game resume pointer. */
export function returnToMainMenu(navigate: (path: string) => void) {
  navigate('/')
}
