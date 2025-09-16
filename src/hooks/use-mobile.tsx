import * as React from 'react'

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const getNow = React.useCallback(() => {
    if (typeof window === 'undefined') return undefined as boolean | undefined
    try {
      const q1 = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`).matches
      const q2 = window.matchMedia('(pointer: coarse) and (hover: none)').matches
      return q1 || q2
    } catch {
      return window.innerWidth < MOBILE_BREAKPOINT
    }
  }, [])

  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(getNow())

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    const mqs = [
      window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`),
      window.matchMedia('(pointer: coarse) and (hover: none)'),
    ]
    const onChange = () => setIsMobile(getNow())
    mqs.forEach((mql) => {
      if ('addEventListener' in mql) {
        mql.addEventListener('change', onChange)
      } else if ('addListener' in mql) {
        // Safari fallback
        // @ts-ignore
        mql.addListener(onChange)
      }
    })
    setIsMobile(getNow())
    return () => {
      mqs.forEach((mql) => {
        if ('removeEventListener' in mql) {
          mql.removeEventListener('change', onChange)
        } else if ('removeListener' in mql) {
          // @ts-ignore
          mql.removeListener(onChange)
        }
      })
    }
  }, [getNow])

  return !!isMobile
}
