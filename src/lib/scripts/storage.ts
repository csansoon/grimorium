import { SavedScriptDefinition, ScriptWakeEntry, ScriptWakeOrder } from './types'

function normalizeWakeEntries(
  entries: ScriptWakeEntry[] | string[] | undefined,
): ScriptWakeEntry[] {
  if (!entries) return []
  return entries.map((entry) =>
    typeof entry === 'string' ? { roleId: entry as any, mode: 'active' } : entry,
  )
}

function normalizeSavedScript(
  script: SavedScriptDefinition,
): SavedScriptDefinition {
  return {
    ...script,
    wakeOrder: {
      firstNight: normalizeWakeEntries(
        script.wakeOrder?.firstNight as ScriptWakeEntry[] | string[] | undefined,
      ),
      otherNights: normalizeWakeEntries(
        script.wakeOrder?.otherNights as ScriptWakeEntry[] | string[] | undefined,
      ),
    } satisfies ScriptWakeOrder,
  }
}

const STORAGE_KEY = 'grimorium_saved_scripts'

function canUseStorage(): boolean {
  return typeof localStorage !== 'undefined'
}

export function getSavedScripts(): SavedScriptDefinition[] {
  if (!canUseStorage()) return []

  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw) as SavedScriptDefinition[]
    return Array.isArray(parsed) ? parsed.map(normalizeSavedScript) : []
  } catch {
    return []
  }
}

export function getSavedScript(scriptId: string): SavedScriptDefinition | undefined {
  return getSavedScripts().find((script) => script.id === scriptId)
}

export function saveScript(script: SavedScriptDefinition): void {
  if (!canUseStorage()) return

  const scripts = getSavedScripts()
  const existingIndex = scripts.findIndex((item) => item.id === script.id)

  if (existingIndex >= 0) {
    scripts[existingIndex] = script
  } else {
    scripts.push(script)
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(scripts))
}

export function deleteSavedScript(scriptId: string): void {
  if (!canUseStorage()) return

  const nextScripts = getSavedScripts().filter((script) => script.id !== scriptId)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextScripts))
}
