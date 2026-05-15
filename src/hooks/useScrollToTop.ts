// SHELL-05, D-13. Replaces v1.0 inline window.scrollTo(0,0) at public/legacy/js/app.js:891.
import { useEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

export function useScrollToTop(): void {
  const { pathname, search } = useLocation()
  const navType = useNavigationType()
  useEffect(() => {
    if (navType === 'POP') return
    if (typeof window === 'undefined') return
    window.scrollTo(0, 0)
  }, [pathname, search, navType])
}
