import { describe, expect, it, vi } from 'vitest'
import { returnToMainMenu } from './lib/navigation'

describe('returnToMainMenu', () => {
  it('navigates home without clearing the active game', () => {
    const navigate = vi.fn()
    const removeItem = vi.fn()
    vi.stubGlobal('localStorage', { removeItem })

    returnToMainMenu(navigate)

    expect(navigate).toHaveBeenCalledWith('/')
    expect(removeItem).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })
})
