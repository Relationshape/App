// D-19. Field-level error helper: aria-invalid + aria-describedby wiring.
import { useId } from 'react'
export function useFormError(field: string, error: string | null) {
  const descId = useId()
  return {
    inputProps: {
      'aria-invalid': error ? true : undefined,
      'aria-describedby': error ? descId : undefined,
      name: field,
    } as const,
    errorProps: { id: descId, role: 'alert' as const },
    hasError: Boolean(error),
  }
}
