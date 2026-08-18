import { useEffect } from 'react'

const CONF = import.meta.env.VITE_CONFERENCE_NAME ?? '中國福音大會 2026'

export function usePageTitle(zh: string, en: string) {
  useEffect(() => {
    document.title = `${zh} · ${CONF}`
    return () => { document.title = CONF }
  }, [zh, en])
}
