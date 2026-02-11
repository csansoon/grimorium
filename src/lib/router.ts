/**
 * Lightweight client-side router using the History API.
 *
 * All paths are relative to Vite's base path (e.g., "/grimoire/").
 * Uses pushState/replaceState — no full page reloads, no anchor elements.
 */

type Listener = () => void;

const listeners = new Set<Listener>();

function getBasePath(): string {
    // Vite sets BASE_URL from the `base` config (e.g., "/grimoire/").
    // Strip trailing slash for consistent prefix matching.
    const base = import.meta.env.BASE_URL || "/";
    return base.endsWith("/") ? base.slice(0, -1) : base;
}

/** Returns the current path relative to the base path. Always starts with '/'. */
function getPath(): string {
    const base = getBasePath();
    const fullPath = window.location.pathname;
    if (base && fullPath.startsWith(base)) {
        const path = fullPath.slice(base.length);
        return path.startsWith("/") ? path : "/" + path;
    }
    return fullPath || "/";
}

/** Navigate to a new path, pushing a history entry. */
function navigate(path: string): void {
    const fullPath = getBasePath() + path;
    window.history.pushState(null, "", fullPath);
    notify();
}

/** Replace the current path without adding a history entry. */
function replace(path: string): void {
    const fullPath = getBasePath() + path;
    window.history.replaceState(null, "", fullPath);
    notify();
}

function subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

function notify(): void {
    for (const listener of listeners) {
        listener();
    }
}

// Listen to browser back/forward
window.addEventListener("popstate", notify);

export const router = { getPath, navigate, replace, subscribe };
