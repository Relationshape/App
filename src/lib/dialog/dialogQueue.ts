// SHELL-06, D-28. Imperative dialog({...}) shim. Replaces public/legacy/js/app.js:379-476.
import * as React from 'react'
import { create } from 'zustand'

export interface DialogAction<T> {
  label: string
  kind?: 'primary' | 'ghost' | 'danger'
  value: T
}

export interface DialogRequest<T = unknown> {
  id: string
  title?: string
  body: React.ReactNode | ((close: (v: T) => void) => React.ReactNode)
  actions: DialogAction<T>[]
  dismissable?: boolean
  resolve: (v: T | null) => void
}

interface DialogQueueState {
  queue: DialogRequest[]
  push: (req: DialogRequest) => void
  shift: (id: string) => void
}

export const useDialogQueue = create<DialogQueueState>((set) => ({
  queue: [],
  push: (req) => set((s) => ({ queue: [...s.queue, req] })),
  shift: (id) => set((s) => ({ queue: s.queue.filter((r) => r.id !== id) })),
}))

export function dialog<T>(opts: Omit<DialogRequest<T>, 'id' | 'resolve'>): Promise<T | null> {
  return new Promise((resolve) => {
    const id =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `dlg-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
    useDialogQueue.getState().push({ ...opts, id, resolve } as DialogRequest)
  })
}
