import { beforeEach, describe, expect, it } from 'vitest'
import definition from '.'
import {
  addEffectTo,
  makePlayer,
  makeState,
  resetPlayerCounter,
} from '../../../__tests__/helpers'

beforeEach(() => resetPlayerCounter())

describe('ArtistQuestion effect', () => {
  const dayAction = definition.dayActions![0]

  it('is available when the player is alive and has the artist_question effect', () => {
    const artist = addEffectTo(
      makePlayer({ id: 'artist', roleId: 'artist' }),
      'artist_question',
    )
    const state = makeState({ phase: 'day', players: [artist] })
    expect(dayAction.condition(artist, state)).toBe(true)
  })

  it('is not available when the player is dead', () => {
    let artist = addEffectTo(
      makePlayer({ id: 'artist', roleId: 'artist' }),
      'artist_question',
    )
    artist = addEffectTo(artist, 'dead')
    const state = makeState({ phase: 'day', players: [artist] })
    expect(dayAction.condition(artist, state)).toBe(false)
  })

  it('exposes a UI component for the day action', () => {
    expect(dayAction.ActionComponent).toBeDefined()
  })
})
