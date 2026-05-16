// @vitest-environment jsdom
// src/__tests__/primitives.test.tsx
// SHELL-06: useToast, dialog(), DialogHost, lastSaveError subscriber.
import { render, screen, act, fireEvent, cleanup, waitFor } from '@testing-library/react'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { MemoryLocalStorage } from '../../tests/helpers/MemoryLocalStorage'

/** Seed localStorage so AgeGate + WizardHost don't block the view in tests. */
function makeMemoryLocalStorage(overrideSettings?: Record<string, unknown>) {
  const mem = new MemoryLocalStorage()
  const settings = {
    theme: 'auto',
    ageConfirmed: true,
    wizardSeen: true,
    ...overrideSettings,
  }
  mem.setItem(
    'relationshape.v1',
    JSON.stringify({
      state: {
        profiles: [],
        results: [],
        imports: [],
        settings,
        scale: [],
        lastSaveError: null,
      },
      version: 1,
    }),
  )
  return mem
}

async function mountApp() {
  const mem = makeMemoryLocalStorage()
  vi.stubGlobal('localStorage', mem)
  window.location.hash = '#/'
  const appMod = await import('@/App')
  const AppRoot = appMod.default
  let result: ReturnType<typeof render> | undefined
  await act(async () => {
    result = render(<AppRoot />)
  })
  return result!
}

describe('Primitives: useToast, dialog(), DialogHost (SHELL-06)', () => {
  afterEach(() => {
    cleanup()
  })

  it('useToast.success renders a sonner toast', async () => {
    vi.resetModules()
    await mountApp()

    // Mount a probe that calls useToast
    const { useToast } = await import('@/lib/hooks/useToast')

    function ToastProbe() {
      const { toast } = useToast()
      return (
        <button data-testid="toast-btn" onClick={() => toast.success('hi')}>
          fire
        </button>
      )
    }

    await act(async () => {
      render(<ToastProbe />)
    })

    await act(async () => {
      fireEvent.click(screen.getByTestId('toast-btn'))
    })

    // Sonner renders toasts in a portal; check for [data-sonner-toast] or the message
    await waitFor(() => {
      const found =
        document.querySelector('[data-sonner-toast]') !== null ||
        document.body.textContent?.includes('hi') === true
      expect(found).toBe(true)
    })
  })

  it('dialog({...}) opens a Radix dialog via DialogHost', async () => {
    vi.resetModules()
    await mountApp()

    const { dialog } = await import('@/lib/dialog/dialog')

    let resolved: string | null | undefined = undefined

    function DialogProbe() {
      return (
        <button
          data-testid="dialog-btn"
          onClick={async () => {
            resolved = await dialog<string>({
              title: 'T',
              body: 'B',
              actions: [{ label: 'OK', value: 'ok', kind: 'primary' }],
            })
          }}
        >
          open
        </button>
      )
    }

    await act(async () => {
      render(<DialogProbe />)
    })

    // Open dialog
    await act(async () => {
      fireEvent.click(screen.getByTestId('dialog-btn'))
    })

    // Wait for DialogHost to render
    await waitFor(() => {
      expect(screen.queryByTestId('dialog-host')).not.toBeNull()
    })

    // Click action-0 ("OK")
    await act(async () => {
      fireEvent.click(screen.getByTestId('dialog-action-0'))
    })

    // Promise should have resolved with 'ok'
    await waitFor(() => {
      expect(resolved).toBe('ok')
    })
  })

  it('DialogHost serialises two consecutive dialogs', async () => {
    vi.resetModules()
    await mountApp()

    const { dialog } = await import('@/lib/dialog/dialog')

    function TwoDialogsProbe() {
      return (
        <button
          data-testid="two-dialog-btn"
          onClick={() => {
            // Fire two without awaiting
            void dialog({ title: 'A', body: 'A', actions: [{ label: 'A', value: 'a' }] })
            void dialog({ title: 'B', body: 'B', actions: [{ label: 'B', value: 'b' }] })
          }}
        >
          open two
        </button>
      )
    }

    await act(async () => {
      render(<TwoDialogsProbe />)
    })

    await act(async () => {
      fireEvent.click(screen.getByTestId('two-dialog-btn'))
    })

    await waitFor(() => {
      const hosts = document.querySelectorAll('[data-testid="dialog-host"]')
      expect(hosts.length).toBe(1) // Only one dialog rendered at a time
    })
  })

  it('lastSaveError in store triggers an error toast', async () => {
    vi.resetModules()
    await mountApp()

    const { useStore } = await import('@/lib/storage/store')

    await act(async () => {
      useStore.setState({
        lastSaveError: {
          kind: 'QUOTA_EXCEEDED',
          message: 'quota',
          at: Date.now(),
        },
      })
    })

    // Toast should appear and lastSaveError should be cleared
    await waitFor(() => {
      const toastOrText =
        document.querySelector('[data-sonner-toast]') !== null ||
        document.body.textContent?.includes('quota') === true
      expect(toastOrText).toBe(true)
    })

    await waitFor(() => {
      expect(useStore.getState().lastSaveError).toBeNull()
    })
  })
})
