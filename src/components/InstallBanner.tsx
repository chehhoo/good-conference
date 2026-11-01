import { X, Download, Share, Smartphone, CheckCircle2 } from 'lucide-react'
import { usePwaInstall } from '../hooks/usePwaInstall'

// ── Dashboard banner (dismissible, shown when not yet installed) ───────────────

export function InstallBanner() {
  const { state, install, dismiss, showFallbackHint } = usePwaInstall()

  if (state !== 'android' && state !== 'ios' && state !== 'ios-other') return null

  return (
    <div
      className="rounded-2xl p-4 border flex gap-3"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: 'var(--accent-dim)' }}>
        <Download size={18} style={{ color: 'var(--accent)' }} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-bold leading-snug" style={{ color: 'var(--text)' }}>
              安裝應用程式
            </p>
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
              Install App
            </p>
          </div>
          <button onClick={dismiss} className="p-1 rounded-lg shrink-0" style={{ color: 'var(--text-dim)' }} aria-label="關閉">
            <X size={14} />
          </button>
        </div>

        {state === 'android' && (
          <>
            <p className="text-xs mt-1.5 mb-3 leading-relaxed" style={{ color: 'var(--text-dim)' }}>
              將大會應用程式安裝到主螢幕，離線使用、快速開啟。
              <br />
              Add to your home screen for offline access and faster launch.
            </p>
            <button
              onClick={install}
              className="px-4 py-2 rounded-xl text-xs font-bold"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              安裝 Install
            </button>
            {showFallbackHint && (
              <p className="text-xs mt-2" style={{ color: 'var(--text-dim)' }}>
                Chrome 選單 ⋮ → 安裝應用程式 / Install app
              </p>
            )}
          </>
        )}

        {state === 'ios' && (
          <>
            <p className="text-xs mt-1.5 mb-2 leading-relaxed" style={{ color: 'var(--text-dim)' }}>
              在 Safari 中，點選底部分享按鈕，再選「加入主畫面」。
              <br />
              In Safari, tap the Share button below, then "Add to Home Screen".
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold"
                style={{ background: 'var(--surface2)', color: 'var(--text-mid)', border: '1px solid var(--border)' }}>
                <Share size={11} />
                分享 Share
              </div>
              <span className="text-xs" style={{ color: 'var(--text-dim)' }}>→</span>
              <div className="px-2.5 py-1.5 rounded-xl text-xs font-semibold"
                style={{ background: 'var(--surface2)', color: 'var(--text-mid)', border: '1px solid var(--border)' }}>
                加入主畫面 Add to Home Screen
              </div>
            </div>
          </>
        )}

        {state === 'ios-other' && (
          <p className="text-xs mt-1.5 leading-relaxed" style={{ color: 'var(--text-dim)' }}>
            請用 Safari 開啟此頁面以安裝。
            <br />
            Open this page in Safari to install.
          </p>
        )}
      </div>
    </div>
  )
}

// ── Settings card (prominent, shown in MyInfo settings section) ───────────────

export function InstallSettingsCard() {
  const { state, install, reopen, showFallbackHint } = usePwaInstall()

  // Already running as installed PWA or confirmed installed
  if (state === 'hidden') return null

  const isConfirmedInstalled = state === 'installed'

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3"
        style={{ background: 'var(--surface)' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: isConfirmedInstalled ? 'var(--green-dim)' : 'var(--accent-dim)' }}>
          {isConfirmedInstalled
            ? <CheckCircle2 size={16} style={{ color: 'var(--green)' }} />
            : <Smartphone size={16} style={{ color: 'var(--accent)' }} />
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>
            安裝應用程式
          </p>
          <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
            {isConfirmedInstalled
              ? '已安裝 · Installed'
              : state === 'dismissed'
                ? '已略過 · Skipped'
                : 'Install App to Home Screen'}
          </p>
        </div>
        {state !== 'dismissed' && state !== 'installed' && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
            推薦
          </span>
        )}
      </div>

      {/* Body */}
      <div className="px-4 pb-4 pt-2 border-t" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        {state === 'installed' && (
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-dim)' }}>
            已加入主螢幕，可離線使用。
            <br />
            Added to home screen — works offline.
          </p>
        )}

        {state === 'android' && (
          <>
            <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--text-dim)' }}>
              安裝後可離線使用、從主螢幕直接開啟，速度更快。
              <br />
              Offline access, home screen shortcut, and faster launch.
            </p>
            <button
              onClick={install}
              className="w-full py-2.5 rounded-xl text-sm font-bold"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              安裝 Install
            </button>
            {showFallbackHint && (
              <p className="text-xs mt-2 text-center" style={{ color: 'var(--text-dim)' }}>
                Chrome 選單 ⋮ → 安裝應用程式 / Install app
              </p>
            )}
          </>
        )}

        {state === 'ios' && (
          <>
            <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--text-dim)' }}>
              在 Safari 中，點選底部
              <span className="font-bold" style={{ color: 'var(--text)' }}> 分享 </span>
              按鈕，再選
              <span className="font-bold" style={{ color: 'var(--text)' }}> 加入主畫面</span>。
              <br />
              In Safari tap <span className="font-bold" style={{ color: 'var(--text)' }}>Share</span> → <span className="font-bold" style={{ color: 'var(--text)' }}>Add to Home Screen</span>.
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border"
                style={{ background: 'var(--surface2)', color: 'var(--text-mid)', borderColor: 'var(--border)' }}>
                <Share size={12} />
                分享 Share
              </div>
              <span className="text-sm" style={{ color: 'var(--text-dim)' }}>→</span>
              <div className="px-3 py-2 rounded-xl text-xs font-semibold border"
                style={{ background: 'var(--surface2)', color: 'var(--text-mid)', borderColor: 'var(--border)' }}>
                加入主畫面
              </div>
            </div>
          </>
        )}

        {state === 'ios-other' && (
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-dim)' }}>
            請用 Safari 開啟此頁面以安裝到主螢幕。
            <br />
            Open this page in Safari to install to your home screen.
          </p>
        )}

        {state === 'dismissed' && (
          <>
            <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--text-dim)' }}>
              您之前略過了安裝。隨時可以重新安裝到主螢幕。
              <br />
              You skipped the install prompt. You can still add it to your home screen anytime.
            </p>
            <button
              onClick={reopen}
              className="w-full py-2.5 rounded-xl text-sm font-bold border"
              style={{ background: 'transparent', color: 'var(--accent)', borderColor: 'var(--accent)' }}
            >
              重新安裝 Install Now
            </button>
          </>
        )}
      </div>
    </div>
  )
}
