import { WebHaptics } from 'web-haptics'

const HAPTICS_ENABLED_KEY = 'grimorium:haptics:enabled'

type HapticPreset = 'success' | 'nudge' | 'error' | 'buzz'

let haptics: WebHaptics | null = null

function canUseBrowserApis() {
  return typeof window !== 'undefined' && typeof navigator !== 'undefined'
}

function getClientHaptics() {
  if (!canUseBrowserApis()) return null
  if (!haptics) {
    haptics = new WebHaptics()
  }
  return haptics
}

function prefersReducedMotion() {
  if (!canUseBrowserApis() || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function isHapticsEnabled() {
  if (!canUseBrowserApis()) return false

  const stored = window.localStorage.getItem(HAPTICS_ENABLED_KEY)
  if (stored === 'false') return false

  return !prefersReducedMotion()
}

export function setHapticsEnabled(enabled: boolean) {
  if (!canUseBrowserApis()) return
  window.localStorage.setItem(HAPTICS_ENABLED_KEY, String(enabled))
}

export function triggerHaptic(preset: HapticPreset = 'nudge') {
  if (!isHapticsEnabled()) return

  const client = getClientHaptics()
  if (!client) return

  void client.trigger(preset)
}
