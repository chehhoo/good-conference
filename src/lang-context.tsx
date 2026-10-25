import { createContext, useContext, useState } from 'react'
import { useAuth } from './auth-context'

export type Lang = 'zh' | 'en'

interface LangCtx {
  lang: Lang
  setLang: (l: Lang) => void
  t: (zh: string, en: string) => string
  primary: (zh: string | null | undefined, en: string | null | undefined) => string
  secondary: (zh: string | null | undefined, en: string | null | undefined) => string | null
}

const Ctx = createContext<LangCtx | null>(null)

const STORAGE_KEY = 'gc_lang'

export function LangProvider({ children }: { children: React.ReactNode }) {
  const { person } = useAuth()

  const [manualLang, setManualLangState] = useState<Lang | null>(() => {
    const s = localStorage.getItem(STORAGE_KEY)
    return s === 'zh' || s === 'en' ? s : null
  })

  // programCode "2" = Grace Conference → English primary
  const autoLang: Lang = person?.programCode === '2' ? 'en' : 'zh'
  const lang: Lang = manualLang ?? autoLang

  function setLang(l: Lang) {
    setManualLangState(l)
    localStorage.setItem(STORAGE_KEY, l)
  }

  function t(zh: string, en: string) {
    return lang === 'en' ? en : zh
  }

  function primary(zh: string | null | undefined, en: string | null | undefined): string {
    return lang === 'en' ? (en ?? zh ?? '') : (zh ?? en ?? '')
  }

  function secondary(zh: string | null | undefined, en: string | null | undefined): string | null {
    if (lang === 'en') return zh ?? null
    return en ?? null
  }

  return (
    <Ctx.Provider value={{ lang, setLang, t, primary, secondary }}>
      {children}
    </Ctx.Provider>
  )
}

export function useLang() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useLang must be used inside LangProvider')
  return ctx
}
