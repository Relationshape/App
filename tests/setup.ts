// Vitest setup file. Phase 2 additions:
// - Stub window.matchMedia (required by Sonner <Toaster> in jsdom environment)
// - Stub window.ResizeObserver (required by some Radix UI primitives)

export {}

// matchMedia stub — jsdom doesn't implement this API
// Required by sonner's Toaster component (uses prefers-color-scheme detection)
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string): MediaQueryList => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })
}

// ResizeObserver stub — required by Radix UI Sheet/Dialog primitives in jsdom
if (typeof window !== 'undefined' && typeof window.ResizeObserver === 'undefined') {
  window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

// scrollIntoView stub — jsdom doesn't implement Element.scrollIntoView (RESULT-01 deep-link path)
if (typeof window !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function () {}
}
