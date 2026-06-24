/** Test helpers for createBrowserRouter (path-based URLs in jsdom). */

/** Convert legacy hash route (#/path?query) or path to a browser-router location. */
export function hashRouteToPath(hashOrPath: string): string {
  if (!hashOrPath || hashOrPath === '#') return '/'
  const stripped = hashOrPath.startsWith('#') ? hashOrPath.slice(1) : hashOrPath
  if (!stripped || stripped === '/') return '/'
  return stripped.startsWith('/') ? stripped : `/${stripped}`
}

/** Set jsdom location before mounting App with createBrowserRouter. */
export function setTestLocation(hashOrPath: string): void {
  window.history.replaceState({}, '', hashRouteToPath(hashOrPath))
}

/** Navigate mid-test after App is mounted (replaces hashchange for browser routing). */
export async function navigateTestLocation(
  hashOrPath: string,
  actFn: (callback: () => void | Promise<void>) => Promise<void>,
): Promise<void> {
  await actFn(() => {
    window.history.pushState({}, '', hashRouteToPath(hashOrPath))
    window.dispatchEvent(new PopStateEvent('popstate'))
  })
}
