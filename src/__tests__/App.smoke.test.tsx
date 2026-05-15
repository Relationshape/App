// @vitest-environment jsdom
// src/__tests__/App.smoke.test.tsx
// FOUND-06: <App /> renders without crashing in jsdom.
// Per-file environment directive is the supported path in Vitest 4 (environmentMatchGlobs
// was removed in 4.0 — see 01-RESEARCH.md Pitfall 4).
import { render, cleanup } from '@testing-library/react'
import { describe, it, expect, afterEach } from 'vitest'
import App from '@/App'

describe('<App /> smoke (FOUND-06)', () => {
  // vitest.config.ts sets globals: false, so RTL does not auto-register cleanup.
  afterEach(() => {
    cleanup()
  })

  it('renders without crashing', () => {
    const { container } = render(<App />)
    expect(container).toBeTruthy()
  })
})
