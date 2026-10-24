import { useState, useEffect, useCallback } from 'react'

const DISMISS_KEY = 'gc_pwa_install_dismissed'
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export type PwaInstallState =
  | 'hidden'        // standalone, already installed, or not applicable
  | 'android'       // Chromium: can show native prompt
  | 'ios'           // iOS Safari: show manual instructions
  | 'dismissed'     // user dismissed within 7 days

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true)
  )
}

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as { MSStream?: unknown }).MSStream
}

function isDismissed() {
  try {
    const raw = localStorage.getItem(DISMISS_KEY)
    if (!raw) return false
    return Date.now() - Number(raw) < DISMISS_DURATION_MS
  } catch {
    return false
  }
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [state, setState] = useState<PwaInstallState>('hidden')

  useEffect(() => {
    if (isStandalone() || isDismissed()) return

    if (isIos()) {
      setState('ios')
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setState('android')
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const install = useCallback(async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setState('hidden')
    }
    setDeferredPrompt(null)
  }, [deferredPrompt])

  const dismiss = useCallback(() => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())) } catch { /* noop */ }
    setState('dismissed')
  }, [])

  // Re-trigger from Settings: clears dismissal and re-shows appropriate UI
  const reopen = useCallback(() => {
    if (isStandalone()) return
    try { localStorage.removeItem(DISMISS_KEY) } catch { /* noop */ }
    if (deferredPrompt) {
      setState('android')
    } else if (isIos()) {
      setState('ios')
    }
  }, [deferredPrompt])

  return { state, install, dismiss, reopen }
}
