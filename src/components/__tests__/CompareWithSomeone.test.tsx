// @vitest-environment jsdom
// src/components/__tests__/CompareWithSomeone.test.tsx
// Phase-04 D-03 — empty states + tile rendering + navigation for CompareWithSomeone.
//
// Approach (locked per checker feedback Blocker #2): direct-render the component
// inside <MemoryRouter> with vi.mock on '@/lib/storage/store' supplying fixture
// profiles/results/imports. The Wave 2 component is sufficient to make all tests
// GREEN — no dependency on Wave 3's Result.tsx rewire.

import { render, fireEvent, cleanup } from '@testing-library/react'
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

const P1 = 'profile-1'
const R_CURRENT = 'result-current'
const R_OTHER_1 = 'result-other-1'
const R_OTHER_2 = 'result-other-2'
const IMP_1 = 'imp-1'

// Mutable fixture refs — each test sets these before rendering.
let mockProfiles: unknown[] = []
let mockResults: unknown[] = []
let mockImports: unknown[] = []

vi.mock('../../lib/storage/store', () => ({
  useStore: (sel: (s: { profiles: unknown[]; results: unknown[]; imports: unknown[] }) => unknown) =>
    sel({ profiles: mockProfiles, results: mockResults, imports: mockImports }),
}))

// Spy on useNavigate; replace with a single shared mock fn per test.
const navigateSpy = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => navigateSpy }
})

// Imported AFTER mocks are declared.
import { CompareWithSomeone } from '@/components/CompareWithSomeone'

function aliceProfile() {
  return { id: P1, name: 'Alice', pronouns: '', color: '#7c3aed', emoji: '🌷', notes: '', createdAt: 1 }
}
function ownResult(id: string, subject: string) {
  return { id, profileId: P1, subject, answers: {}, createdAt: 1, updatedAt: 1 }
}
function importFixture(id: string) {
  return { id, name: 'Imported Person', subject: 'Their Map', answers: {}, scale: [], importedAt: 1 }
}

function setStore(opts: { others?: number; imports?: number } = {}) {
  const others = opts.others ?? 0
  const importCount = opts.imports ?? 0
  mockProfiles = [aliceProfile()]
  mockResults = [
    ownResult(R_CURRENT, 'Bob'),
    ...(others >= 1 ? [ownResult(R_OTHER_1, 'Carol')] : []),
    ...(others >= 2 ? [ownResult(R_OTHER_2, 'Dave')] : []),
  ]
  mockImports = importCount >= 1 ? [importFixture(IMP_1)] : []
}

function renderIsolated() {
  return render(
    <MemoryRouter initialEntries={[`/result/${R_CURRENT}`]}>
      <CompareWithSomeone currentResultId={R_CURRENT} />
    </MemoryRouter>,
  )
}

describe('CompareWithSomeone (Phase 04 D-03)', () => {
  beforeEach(() => {
    mockProfiles = []
    mockResults = []
    mockImports = []
    navigateSpy.mockReset()
  })
  afterEach(() => cleanup())

  it('renders only the empty <p> when no other results AND no imports', () => {
    setStore({ others: 0, imports: 0 })
    const { container } = renderIsolated()
    expect(container.querySelector('[data-testid="compare-with-empty"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="compare-with"]')).toBeNull()
  })

  it('omits "Overlay your own maps" section when there are no other own-results', () => {
    setStore({ others: 0, imports: 1 })
    const { container } = renderIsolated()
    expect(container.querySelector('[data-testid="compare-with"]')).not.toBeNull()
    expect(container.querySelector(`[data-testid="compare-with-own-${R_OTHER_1}"]`)).toBeNull()
    expect(container.querySelector(`[data-testid="compare-with-imp-${IMP_1}"]`)).not.toBeNull()
    expect(container.querySelector('[data-testid="compare-with-import-cta"]')).not.toBeNull()
    // No "Overlay your own maps" h3 in the rendered DOM.
    expect(container.textContent).not.toContain('Overlay your own maps')
  })

  it('renders own tiles + imports section + Import… tile when both populated', () => {
    setStore({ others: 2, imports: 1 })
    const { container } = renderIsolated()
    expect(container.querySelector(`[data-testid="compare-with-own-${R_OTHER_1}"]`)).not.toBeNull()
    expect(container.querySelector(`[data-testid="compare-with-own-${R_OTHER_2}"]`)).not.toBeNull()
    expect(container.querySelector(`[data-testid="compare-with-imp-${IMP_1}"]`)).not.toBeNull()
    expect(container.querySelector('[data-testid="compare-with-import-cta"]')).not.toBeNull()
  })

  it('imports section always renders Import… tile even when imports list is empty', () => {
    setStore({ others: 2, imports: 0 })
    const { container } = renderIsolated()
    expect(container.querySelector('[data-testid="compare-with-import-cta"]')).not.toBeNull()
  })

  it('own-result tile title formats as "<profile.name> → <subject>" and sub contains "Updated"', () => {
    setStore({ others: 1, imports: 0 })
    const { container } = renderIsolated()
    const tile = container.querySelector(`[data-testid="compare-with-own-${R_OTHER_1}"]`)!
    expect(tile.querySelector('h3')!.textContent).toBe('Alice → Carol')
    expect(tile.querySelector('p.muted.small')!.textContent).toContain('Updated')
  })

  it('import tile title formats as "<import.name> → <import.subject>"', () => {
    setStore({ others: 0, imports: 1 })
    const { container } = renderIsolated()
    const tile = container.querySelector(`[data-testid="compare-with-imp-${IMP_1}"]`)!
    expect(tile.querySelector('h3')!.textContent).toBe('Imported Person → Their Map')
  })

  it('Import… tile has compare-tile-import class and no sub <p>', () => {
    setStore({ others: 0, imports: 1 })
    const { container } = renderIsolated()
    const cta = container.querySelector('[data-testid="compare-with-import-cta"]')!
    expect(cta.className).toContain('compare-tile')
    expect(cta.className).toContain('compare-tile-import')
    expect(cta.querySelector('p.muted.small')).toBeNull()
  })

  it('clicking an own-result tile calls navigate("/compare?ids=<current>,<other>")', () => {
    setStore({ others: 1, imports: 0 })
    const { container } = renderIsolated()
    fireEvent.click(container.querySelector(`[data-testid="compare-with-own-${R_OTHER_1}"]`)!)
    expect(navigateSpy).toHaveBeenCalledTimes(1)
    expect(navigateSpy).toHaveBeenCalledWith(`/compare?ids=${R_CURRENT},${R_OTHER_1}`)
  })

  it('clicking the Import… tile calls navigate("/import")', () => {
    setStore({ others: 0, imports: 1 })
    const { container } = renderIsolated()
    fireEvent.click(container.querySelector('[data-testid="compare-with-import-cta"]')!)
    expect(navigateSpy).toHaveBeenCalledTimes(1)
    expect(navigateSpy).toHaveBeenCalledWith('/import')
  })
})
