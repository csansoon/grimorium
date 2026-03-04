import { describe, expect, it } from 'vitest'
import { parseImportedScriptJson } from '../scripts/import/parse'
import { resolveImportedScript } from '../scripts/import/resolve'
import { deriveScriptWakeOrderFromRoleIds } from '../scripts'
import { getVisibleWakeEntries } from '../scripts/wakeOrder'
import { createGame, getNextStep } from '../game'

describe('parseImportedScriptJson', () => {
  it('parses botcscripts-style JSON with metadata', () => {
    const payload = parseImportedScriptJson(
      JSON.stringify([
        { id: '_meta', name: 'Catfishing', author: 'Emily' },
        { id: 'investigator' },
        { id: 'chef' },
      ]),
    )

    expect(payload.name).toBe('Catfishing')
    expect(payload.author).toBe('Emily')
    expect(payload.characters.map((character) => character.id)).toEqual([
      'investigator',
      'chef',
    ])
  })

  it('falls back when metadata is missing', () => {
    const payload = parseImportedScriptJson(
      JSON.stringify([{ id: 'investigator' }]),
    )

    expect(payload.name).toBe('Imported Script')
    expect(payload.author).toBeUndefined()
  })

  it('throws for malformed JSON', () => {
    expect(() => parseImportedScriptJson('{')).toThrow()
  })

  it('throws when no characters are present', () => {
    expect(() =>
      parseImportedScriptJson(JSON.stringify([{ id: '_meta', name: 'Empty' }])),
    ).toThrow('Imported script has no characters')
  })
})

describe('resolveImportedScript', () => {
  it('resolves normalized and aliased role ids', () => {
    const result = resolveImportedScript({
      name: 'Test',
      author: 'Tester',
      characters: [
        { id: 'fortune_teller' },
        { id: 'fortuneteller' },
        { id: 'washerwoman' },
      ],
    })

    expect(result.supported).toBe(true)
    if (result.supported) {
      expect(result.resolvedScript.roles).toEqual([
        'fortune_teller',
        'washerwoman',
      ])
    }
  })

  it('rejects imports with unsupported characters', () => {
    const result = resolveImportedScript({
      name: 'Catfishing',
      author: 'Emily',
      characters: [{ id: 'investigator' }, { id: 'godfather' }],
    })

    expect(result.supported).toBe(false)
    if (!result.supported) {
      expect(result.unsupportedCharacters.map((character) => character.inputId)).toEqual([
        'godfather',
      ])
    }
  })
})

describe('deriveScriptWakeOrderFromRoleIds', () => {
  it('derives deterministic wake sheets from canonical role metadata', () => {
    const wakeOrder = deriveScriptWakeOrderFromRoleIds([
      'imp',
      'fortune_teller',
      'washerwoman',
      'monk',
      'undertaker',
    ])
    const visibleFirstNight = getVisibleWakeEntries(wakeOrder.firstNight)
    const visibleOtherNights = getVisibleWakeEntries(wakeOrder.otherNights)

    expect(visibleFirstNight.map((entry) => entry.roleId)).toEqual([
      'washerwoman',
      'fortune_teller',
    ])
    expect(visibleOtherNights.map((entry) => entry.roleId)).toEqual([
      'monk',
      'imp',
      'fortune_teller',
      'undertaker',
    ])
  })

  it('includes conditional wake rows inline in the derived order', () => {
    const wakeOrder = deriveScriptWakeOrderFromRoleIds([
      'baron',
      'scarlet_woman',
      'imp',
      'washerwoman',
      'poisoner',
    ])
    const visibleFirstNight = getVisibleWakeEntries(wakeOrder.firstNight)
    const visibleOtherNights = getVisibleWakeEntries(wakeOrder.otherNights)

    expect(visibleFirstNight.map((entry) => entry.roleId)).toEqual([
      'poisoner',
      'washerwoman',
    ])
    expect(visibleOtherNights.map((entry) => entry.roleId)).toEqual([
      'poisoner',
      'scarlet_woman',
      'imp',
    ])
    expect(visibleOtherNights[1]).toMatchObject({
      roleId: 'scarlet_woman',
      mode: 'reactive',
    })
  })
})

describe('game script snapshot', () => {
  it('uses the saved script snapshot even if the saved script later changes', () => {
    const game = createGame(
      'Snapshot Test',
      'trouble-brewing',
      [
        { name: 'Alice', roleId: 'empath' },
        { name: 'Bob', roleId: 'imp' },
        { name: 'Cara', roleId: 'villager' },
        { name: 'Dane', roleId: 'villager' },
        { name: 'Elle', roleId: 'villager' },
      ],
      {
        id: 'script_test',
        source: 'imported',
        name: 'Snapshot Test',
        icon: 'scrollText',
        author: 'Test',
        roles: ['washerwoman', 'imp', 'empath'],
        enforceDistribution: true,
        wakeOrder: {
          firstNight: [
            { roleId: 'imp' },
            { roleId: 'washerwoman' },
          ],
          otherNights: [
            { roleId: 'empath' },
            { roleId: 'imp' },
          ],
        },
        isOfficial: false,
      },
    )

    const nightGame = {
      ...game,
      history: [
        ...game.history,
        {
          ...game.history[0],
          id: 'night_started',
          type: 'night_started' as const,
          data: { round: 2 },
          stateAfter: {
            ...game.history[0].stateAfter,
            phase: 'night' as const,
            round: 2,
          },
        },
      ],
    }

    const step = getNextStep(nightGame)
    expect(step.type).toBe('night_action')
    if (step.type === 'night_action') {
      expect(step.roleId).toBe('empath')
    }
  })
})
