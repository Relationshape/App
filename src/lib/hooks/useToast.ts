// SHELL-06, D-27. Wraps sonner.toast.
import { toast as sonner } from 'sonner'
export function useToast() {
  return {
    toast: {
      message: (msg: string) => sonner(msg, { duration: 1900 }),
      success: (msg: string) => sonner.success(msg, { duration: 1900 }),
      error: (msg: string) => sonner.error(msg, { duration: 3500 }),
    },
  }
}
