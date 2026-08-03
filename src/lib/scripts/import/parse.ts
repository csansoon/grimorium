import { ImportedScriptPayload } from './types'

type RawScriptEntry = {
  id?: unknown
  name?: unknown
  author?: unknown
}

export function parseImportedScriptJson(input: string): ImportedScriptPayload {
  const parsed = JSON.parse(input) as unknown

  if (!Array.isArray(parsed)) {
    throw new Error('Imported script JSON must be an array')
  }

  const entries = parsed as RawScriptEntry[]
  const meta = entries.find((entry) => entry.id === '_meta')
  const characters = entries.filter(
    (entry) => typeof entry.id === 'string' && entry.id !== '_meta',
  )

  if (characters.length === 0) {
    throw new Error('Imported script has no characters')
  }

  return {
    name:
      typeof meta?.name === 'string' && meta.name.trim().length > 0
        ? meta.name.trim()
        : 'Imported Script',
    author:
      typeof meta?.author === 'string' && meta.author.trim().length > 0
        ? meta.author.trim()
        : undefined,
    characters: characters.map((entry) => ({ id: entry.id as string })),
  }
}

