import { useEffect, useRef } from "react";

/**
 * Intercepts the browser/phone back button for SPA navigation.
 *
 * - When `onBack` is a function, pressing browser back calls it instead of leaving the page.
 * - When `onBack` is `null`, native browser back behavior is allowed (for the home screen).
 *
 * Only one instance of this hook should be active (non-null) at a time.
 * The hook uses a sentinel history entry to intercept the popstate event.
 */
export function useBackButton(onBack: (() => void) | null): void {
    const handlerRef = useRef(onBack);
    handlerRef.current = onBack;

    const isActive = onBack !== null;

    useEffect(() => {
        if (!isActive) return;

        // Push a sentinel history entry to intercept the back button,
        // but only if one isn't already on top (avoids stacking sentinels
        // when transitioning between two active hook instances)
        if (
            !(window.history.state as Record<string, unknown> | null)
                ?.__grimoire
        ) {
            window.history.pushState({ __grimoire: true }, "");
        }

        const handlePopState = () => {
            if (handlerRef.current) {
                handlerRef.current();
                // Re-push sentinel so the next back press is also intercepted
                window.history.pushState({ __grimoire: true }, "");
            }
        };

        window.addEventListener("popstate", handlePopState);
        return () => {
            window.removeEventListener("popstate", handlePopState);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isActive]);
}
