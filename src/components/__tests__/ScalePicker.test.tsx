// @vitest-environment jsdom
// src/components/__tests__/ScalePicker.test.tsx
// QUEST-04, D-20. Bespoke snap-dots ScalePicker.

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

  it('renders one button per scale step', () => {
    render(<ScalePicker scale={SCALE} value={null} onChange={() => {}} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBe(SCALE.length)
  })

  it('clicking a step fires onChange with that step key', () => {
    const onChange = vi.fn()
    render(<ScalePicker scale={SCALE} value={null} onChange={onChange} />)
    fireEvent.click(screen.getByTestId('scale-step-open'))
    expect(onChange).toHaveBeenCalledWith('open')
  })

  it('ArrowRight nudges +1', () => {
    const onChange = vi.fn()
    render(<ScalePicker scale={SCALE} value="no" onChange={onChange} />)
    const root = screen.getByRole('slider')
    fireEvent.keyDown(root, { key: 'ArrowRight' })
    expect(onChange).toHaveBeenCalledWith('open')
  })

  it('Home jumps to first step; End jumps to last', () => {
    const onChange = vi.fn()
    render(<ScalePicker scale={SCALE} value="open" onChange={onChange} />)
    const root = screen.getByRole('slider')
    fireEvent.keyDown(root, { key: 'Home' })
    expect(onChange).toHaveBeenCalledWith('no')
    onChange.mockReset()
    fireEvent.keyDown(root, { key: 'End' })
    expect(onChange).toHaveBeenCalledWith('need')
  })

  it('Backspace fires onClear when a value is set', () => {
    const onClear = vi.fn()
    render(<ScalePicker scale={SCALE} value="open" onChange={() => {}} onClear={onClear} />)
    const root = screen.getByRole('slider')
    fireEvent.keyDown(root, { key: 'Backspace' })
    expect(onClear).toHaveBeenCalled()
  })
})
