import { useState, useEffect, useCallback } from 'react'

const DISMISS_KEY   = 'gc_pwa_install_dismissed'
const INSTALLED_KEY = 'gc_pwa_installed'
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export type PwaInstallState =
  | 'hidden'        // standalone, already installed, or not applicable
  | 'android'       // Chromium: can show native prompt
  | 'ios'           // iOS Safari: show manual instructions
  | 'ios-other'     // iOS but not Safari: tell user to open in Safari
  | 'dismissed'     // user dismissed within 7 days
  | 'installed'     // appinstalled event fired

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true)
  )
}

function isIosDevice() {
  const ua = navigator.userAgent
  // iPadOS 13+ reports MacIntel with touch points
  return (
    /iphone|ipad|ipod/i.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  ) && !(window as { MSStream?: unknown }).MSStream
}

function isIosSafari() {
  const ua = navigator.userAgent
  // Exclude known non-Safari iOS browsers
  const nonSafari = /CriOS|FxiOS|EdgiOS|FBAN|FBAV|Line|Instagram|Snapchat/i
  return isIosDevice() && /Safari/i.test(ua) && !nonSafari.test(ua)
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

function wasInstalled() {
  try { return localStorage.getItem(INSTALLED_KEY) === '1' } catch { return false }
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showFallbackHint, setShowFallbackHint] = useState(false)

  const [state, setState] = useState<PwaInstallState>(() => {
    if (isStandalone() || wasInstalled()) return 'hidden'
    if (isDismissed()) return 'dismissed'
    if (isIosDevice()) return isIosSafari() ? 'ios' : 'ios-other'
    return 'hidden'
  })

  useEffect(() => {
    // Always listen for beforeinstallprompt so we capture it even while dismissed
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      // Only switch to android state if not dismissed/installed/hidden-for-other-reason
      setState(prev => (prev === 'hidden' || prev === 'dismissed') && !isIosDevice() ? 'android' : prev)
    }
    window.addEventListener('beforeinstallprompt', handler)

    // Track actual install
    const installedHandler = () => {
      try { localStorage.setItem(INSTALLED_KEY, '1') } catch { /* noop */ }
      setDeferredPrompt(null)
      setState('installed')
    }
    window.addEventListener('appinstalled', installedHandler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', installedHandler)
    }
  }, [])

  const install = useCallback(async () => {
    if (!deferredPrompt) {
      // No prompt available — show fallback hint
      setShowFallbackHint(true)
      return
    }
    setShowFallbackHint(false)
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

  const reopen = useCallback(() => {
    if (isStandalone()) return
    setShowFallbackHint(false)
    try { localStorage.removeItem(DISMISS_KEY) } catch { /* noop */ }
    if (deferredPrompt) {
      setState('android')
    } else if (isIosDevice()) {
      setState(isIosSafari() ? 'ios' : 'ios-other')
    } else {
      // No prompt yet — show android card anyway so fallback hint can appear on tap
      setState('android')
    }
  }, [deferredPrompt])

  return { state, install, dismiss, reopen, showFallbackHint }
}
