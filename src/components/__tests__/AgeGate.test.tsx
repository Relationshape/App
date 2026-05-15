// @vitest-environment jsdom
// src/components/__tests__/AgeGate.test.tsx
// PROFILE-06, D-29: AgeGate blocks on first visit, migrates legacy key, fires setSettings.
import { render, screen, act, fireEvent, cleanup, waitFor } from '@testing-library/react'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { MemoryLocalStorage } from '../../../tests/helpers/MemoryLocalStorage'

describe('<AgeGate />', () => {
  afterEach(() => {
    cleanup()
  })

  it('blocks on first mount with no settings.ageConfirmed', async () => {
    vi.resetModules()
    vi.stubGlobal('localStorage', new MemoryLocalStorage())
    const { AgeGate } = await import('../AgeGate')
    const { useStore } = await import('@/lib/storage/store')
    // Ensure store has no ageConfirmed
    useStore.setState({ settings: { theme: 'auto' } })
    await act(async () => {
      render(<AgeGate />)
    })
    expect(screen.queryByTestId('age-gate-dialog')).not.toBeNull()
  })

  it('migrates legacy localStorage rs-age-confirmed=1 to settings.ageConfirmed', async () => {
    vi.resetModules()
    const mem = new MemoryLocalStorage()
    mem.setItem('rs-age-confirmed', '1')
    vi.stubGlobal('localStorage', mem)
    const { AgeGate } = await import('../AgeGate')
    const { useStore } = await import('@/lib/storage/store')
    useStore.setState({ settings: { theme: 'auto' } })
    await act(async () => {
      render(<AgeGate />)
    })
    // After migration: dialog should NOT be shown
    await waitFor(() => {
      expect(screen.queryByTestId('age-gate-dialog')).toBeNull()
    })
    // Legacy key removed
    expect(mem.getItem('rs-age-confirmed')).toBeNull()
    // Store updated
    expect(useStore.getState().settings.ageConfirmed).toBe(true)
  })

  it('clicking Yes 18+ sets settings.ageConfirmed and unmounts the dialog', async () => {
    vi.resetModules()
    vi.stubGlobal('localStorage', new MemoryLocalStorage())
    const { AgeGate } = await import('../AgeGate')
    const { useStore } = await import('@/lib/storage/store')
    useStore.setState({ settings: { theme: 'auto' } })
    await act(async () => {
      render(<AgeGate />)
    })
    expect(screen.queryByTestId('age-gate-dialog')).not.toBeNull()
    await act(async () => {
      fireEvent.click(screen.getByTestId('age-gate-yes'))
    })
    await waitFor(() => {
      expect(screen.queryByTestId('age-gate-dialog')).toBeNull()
    })
    expect(useStore.getState().settings.ageConfirmed).toBe(true)
  })

  it('clicking Under 18 shows the stop view', async () => {
    vi.resetModules()
    vi.stubGlobal('localStorage', new MemoryLocalStorage())
    const { AgeGate } = await import('../AgeGate')
    const { useStore } = await import('@/lib/storage/store')
    useStore.setState({ settings: { theme: 'auto' } })
    await act(async () => {
      render(<AgeGate />)
    })
    await act(async () => {
      fireEvent.click(screen.getByTestId('age-gate-no'))
    })
    await waitFor(() => {
      expect(screen.queryByTestId('age-gate-stop')).not.toBeNull()
    })
  })
})
