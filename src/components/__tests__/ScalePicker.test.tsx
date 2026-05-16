// @vitest-environment jsdom
// Continuous gradient scale bar — tests cover discrete tick clicks + keyboard
// + clear. Pointer drag is covered manually in the browser (jsdom lacks layout).

import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { ScalePicker } from '../ScalePicker'
import type { MutableScaleStep } from '@/lib/data/types'

const SCALE: readonly MutableScaleStep[] = [
  { key: 'no', label: 'No', short: 'No', value: 0, color: '#264653', description: 'No' },
  { key: 'open', label: 'Open', short: 'Open', value: 3, color: '#90be6d', description: 'Open' },
  { key: 'need', label: 'Need', short: 'Need', value: 6, color: '#e63946', description: 'Need' },
]

describe('<ScalePicker />', () => {
  afterEach(() => { cleanup() })

  it('renders one tick button per scale step', () => {
    render(<ScalePicker scale={SCALE} value={null} onChange={() => {}} />)
    // One tick per step; no clear button rendered when value is null.
    SCALE.forEach((s) => {
      expect(screen.getByTestId(`scale-step-${s.key}`)).toBeTruthy()
    })
    expect(screen.queryByTestId('scale-clear')).toBeNull()
  })

  it('clicking a tick fires onChange with that step key + its exact fraction', () => {
    const onChange = vi.fn()
    render(<ScalePicker scale={SCALE} value={null} onChange={onChange} />)
    fireEvent.click(screen.getByTestId('scale-step-open'))
    // 'open' is index 1 of 3 → frac = 1/2 = 0.5
    expect(onChange).toHaveBeenCalledWith('open', 0.5)
  })

  it('ArrowRight nudges +1 (snapped key + fraction)', () => {
    const onChange = vi.fn()
    render(<ScalePicker scale={SCALE} value="no" onChange={onChange} />)
    const root = screen.getByRole('slider')
    fireEvent.keyDown(root, { key: 'ArrowRight' })
    expect(onChange).toHaveBeenCalledWith('open', 0.5)
  })

  it('Home jumps to first step; End jumps to last', () => {
    const onChange = vi.fn()
    render(<ScalePicker scale={SCALE} value="open" onChange={onChange} />)
    const root = screen.getByRole('slider')
    fireEvent.keyDown(root, { key: 'Home' })
    expect(onChange).toHaveBeenCalledWith('no', 0)
    onChange.mockReset()
    fireEvent.keyDown(root, { key: 'End' })
    expect(onChange).toHaveBeenCalledWith('need', 1)
  })

  it('Backspace fires onClear when a value is set', () => {
    const onClear = vi.fn()
    render(<ScalePicker scale={SCALE} value="open" onChange={() => {}} onClear={onClear} />)
    const root = screen.getByRole('slider')
    fireEvent.keyDown(root, { key: 'Backspace' })
    expect(onClear).toHaveBeenCalled()
  })

  it('renders a reset button when a value is set and triggers onClear on click', () => {
    const onClear = vi.fn()
    render(
      <ScalePicker scale={SCALE} value="open" valueFrac={0.5} onChange={() => {}} onClear={onClear} />
    )
    const reset = screen.getByTestId('scale-clear')
    fireEvent.click(reset)
    expect(onClear).toHaveBeenCalled()
  })

  it('renders the marker when valueFrac is provided (continuous position)', () => {
    const { container } = render(
      <ScalePicker scale={SCALE} value="open" valueFrac={0.42} onChange={() => {}} />
    )
    const marker = container.querySelector('.rs-click-scale-marker') as HTMLElement | null
    expect(marker).not.toBeNull()
    // left is set inline from valueFrac
    expect(marker?.style.left).toBe('42%')
  })
})
