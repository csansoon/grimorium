import { useSyncExternalStore, useCallback } from 'react'
import { router } from '../lib/router'

/**
 * React hook for the client-side router.
 *
 * Returns the current path (relative to base) and imperative navigation
 * functions that update the URL without full page reloads.
 */
export function useRouter() {
  const path = useSyncExternalStore(router.subscribe, router.getPath)

  const navigate = useCallback((to: string) => router.navigate(to), [])
  const replace = useCallback((to: string) => router.replace(to), [])

  return { path, navigate, replace }
}
