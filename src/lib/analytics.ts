/**
 * Lightweight Google Analytics 4 wrapper.
 *
 * - Skips events when gtag isn't loaded (e.g. ad-blockers)
 * - Skips events for known bot user-agents to reduce noise
 */

// Bot detection — matches common crawlers and headless browsers
const BOT_PATTERN =
  /bot|crawler|spider|crawling|googlebot|bingbot|yandexbot|duckduckbot|slurp|baiduspider|facebookexternalhit|linkedinbot|twitterbot|applebot|semrushbot|ahrefsbot|mj12bot|dotbot|petalbot|bytespider|headlesschrome|phantomjs|prerender/i

function isBot(): boolean {
  if (typeof navigator === 'undefined') return true
  return BOT_PATTERN.test(navigator.userAgent)
}

// Typed reference to the global gtag function
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

/**
 * Send a custom GA4 event. Silently no-ops if gtag is missing or if the
 * visitor looks like a bot.
 */
export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>,
): void {
  if (isBot()) return
  if (typeof window === 'undefined' || !window.gtag) return

  window.gtag('event', eventName, params)
}
