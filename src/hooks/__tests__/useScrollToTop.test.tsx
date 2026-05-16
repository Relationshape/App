// @vitest-environment jsdom
// src/hooks/__tests__/useScrollToTop.test.tsx
// SHELL-05: useScrollToTop scrolls to (0,0) on PUSH navigation, not on POP.
import { render, act, cleanup } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { useScrollToTop } from '../useScrollToTop'

// Probe component that calls useScrollToTop
function ScrollProbe() {
  useScrollToTop()
  return <div data-testid="probe">probe</div>
}

function makeRouter(initialPath = '/') {
  return createMemoryRouter(
    [
      { path: '/', element: <ScrollProbe /> },
      { path: '/other', element: <ScrollProbe /> },
      { path: '/third', element: <ScrollProbe /> },
    ],
    { initialEntries: [initialPath] }
  )
}

describe('useScrollToTop (SHELL-05)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('scrolls to top on PUSH navigation', async () => {
    const scrollSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
    const router = makeRouter('/')

    await act(async () => {
      render(<RouterProvider router={router} />)
    })

    // Clear any initial scroll call
    scrollSpy.mockClear()

    // PUSH navigate to /other
    await act(async () => {
      router.navigate('/other')
    })

    expect(scrollSpy).toHaveBeenCalledWith(0, 0)
  })

  it('does NOT scroll on POP navigation', async () => {
    const scrollSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
    // Start at /other and navigate to /third (PUSH), then go back (POP)
    const router = makeRouter('/other')

    await act(async () => {
      render(<RouterProvider router={router} />)
    })

    // PUSH navigate to /third
    await act(async () => {
      router.navigate('/third')
    })

    // Clear spy to track only the POP
    scrollSpy.mockClear()

    // POP navigation (go back)
    await act(async () => {
      router.navigate(-1)
    })

    expect(scrollSpy).not.toHaveBeenCalledWith(0, 0)
  })
})
