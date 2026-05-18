// @vitest-environment jsdom
// src/components/__tests__/WizardHost.test.tsx
// PROFILE-05, D-23: WizardHost shows on first visit, responds to nav, sets wizardSeen on finish.
import { render, screen, act, fireEvent, cleanup, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { MemoryLocalStorage } from '../../../tests/helpers/MemoryLocalStorage'

function Wrapper({ children }: { children: React.ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>
}

describe('<WizardHost />', () => {
  afterEach(() => {
    cleanup()
  })

  it('does not render when ageConfirmed is false', async () => {
    vi.resetModules()
    vi.stubGlobal('localStorage', new MemoryLocalStorage())
    const { WizardHost } = await import('../WizardHost')
    const { useStore } = await import('@/lib/storage/store')
    useStore.setState({ settings: { theme: 'auto' } }) // no ageConfirmed
    await act(async () => {
      render(<WizardHost />, { wrapper: Wrapper })
    })
    expect(screen.queryByTestId('wizard-host')).toBeNull()
  })

  it('renders step 1 when ageConfirmed=true and wizardSeen is unset', async () => {
    vi.resetModules()
    vi.stubGlobal('localStorage', new MemoryLocalStorage())
    const { WizardHost } = await import('../WizardHost')
    const { useStore } = await import('@/lib/storage/store')
    useStore.setState({ settings: { theme: 'auto', ageConfirmed: true } })
    await act(async () => {
      render(<WizardHost />, { wrapper: Wrapper })
    })
    expect(screen.queryByTestId('wizard-host')).not.toBeNull()
    // The step title shows v1.0 wizard_s1_title value
    const titleEl = screen.getByTestId('wizard-step-title')
    expect(titleEl.textContent).toContain('Welcome to Relationshapes')
  })

  it('advances to step 2 on Next click', async () => {
    vi.resetModules()
    vi.stubGlobal('localStorage', new MemoryLocalStorage())
    const { WizardHost } = await import('../WizardHost')
    const { useStore } = await import('@/lib/storage/store')
    useStore.setState({ settings: { theme: 'auto', ageConfirmed: true } })
    await act(async () => {
      render(<WizardHost />, { wrapper: Wrapper })
    })
    // Click Next to advance
    await act(async () => {
      fireEvent.click(screen.getByTestId('wizard-next'))
    })
    const titleEl = screen.getByTestId('wizard-step-title')
    // Step 2: wizard_s2_title = 'Everything stays private 🔒'
    expect(titleEl.textContent).toContain('Everything stays private')
  })

  it('sets settings.wizardSeen=true on Finish', async () => {
    vi.resetModules()
    vi.stubGlobal('localStorage', new MemoryLocalStorage())
    const { WizardHost } = await import('../WizardHost')
    const { useStore } = await import('@/lib/storage/store')
    useStore.setState({ settings: { theme: 'auto', ageConfirmed: true }, profiles: [{ id: 'p1', name: 'Alice', pronouns: '', color: '#7c3aed', emoji: '🌷', notes: '', createdAt: 1 }] })
    await act(async () => {
      render(<WizardHost />, { wrapper: Wrapper })
    })
    // Advance to last step (7 steps, click Next 6 times)
    for (let i = 0; i < 6; i++) {
      await act(async () => {
        fireEvent.click(screen.getByTestId('wizard-next'))
      })
    }
    // Now on last step — button shows finish text; click it
    await act(async () => {
      fireEvent.click(screen.getByTestId('wizard-next'))
    })
    await waitFor(() => {
      expect(useStore.getState().settings.wizardSeen).toBe(true)
    })
  })

  it('ArrowRight key advances the step', async () => {
    vi.resetModules()
    vi.stubGlobal('localStorage', new MemoryLocalStorage())
    const { WizardHost } = await import('../WizardHost')
    const { useStore } = await import('@/lib/storage/store')
    useStore.setState({ settings: { theme: 'auto', ageConfirmed: true } })
    await act(async () => {
      render(<WizardHost />, { wrapper: Wrapper })
    })
    // Fire ArrowRight key on document
    await act(async () => {
      fireEvent.keyDown(window, { key: 'ArrowRight' })
    })
    const titleEl = screen.getByTestId('wizard-step-title')
    // Should now be on step 2
    expect(titleEl.textContent).toContain('Everything stays private')
  })
})
