import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useMsal } from "@azure/msal-react"
import { useLocale } from "@/hooks/useLocale"
import { isMsalConfigured, loginRequest, MOCK_LOGGED_IN_KEY } from "@/lib/msal"
import { notify } from "@/lib/notify"
import { clearSignedOut, isSignedOut, markSignedOut } from "@/lib/silentSso"
import { HANDOFF_MS } from "./loginMotion"

/**
 * "Bağlan" — bilinçli çıkış işareti temizlenir ve Entra'ya yönlendirilir; yönlendirme geçiş
 * bittikten sonra (`HANDOFF_MS`: maskot ortaya gelir, "CONNECTING TO TYRO" dizilir). Yönlendirme
 * başlayamazsa işaret geri konur, kullanıcıya söylenir ve sahne baştan kurulur (`attempt`). MSAL
 * yapılandırılmamışsa (yerel geliştirme) sekmelik sahte oturum.
 */
export function useLoginConnect() {
  const { t } = useLocale()
  const navigate = useNavigate()
  const { instance } = useMsal()
  const [busy, setBusy] = useState(false)
  // Yönlendirme başlayamazsa sahne baştan kurulur (`key`): maskot çökmüş, yazı dizilmiş kalmasın.
  const [attempt, setAttempt] = useState(0)
  const timer = useRef(0)

  useEffect(() => () => window.clearTimeout(timer.current), [])
  // bfcache: Entra'nın hesap seçicisinden geri dönmek sayfayı geçişin sonunda (maskot çökmüş,
  // yazı dizilmiş) geri yükler. Durumu geri sarmak yerine sayfa baştan açılır.
  useEffect(() => {
    const onShow = (event) => {
      if (event.persisted) window.location.reload()
    }
    window.addEventListener("pageshow", onShow)
    return () => window.removeEventListener("pageshow", onShow)
  }, [])

  function connect() {
    if (busy) return
    setBusy(true)
    timer.current = window.setTimeout(() => {
      if (!isMsalConfigured) {
        try {
          window.sessionStorage.setItem(MOCK_LOGGED_IN_KEY, "1")
          window.localStorage.removeItem(MOCK_LOGGED_IN_KEY)
        } catch {
          // Depo kapalıysa (gizli pencere) sahte oturum kurulamaz; Anasayfa girişe geri döndürür.
        }
        navigate("/myspace")
        return
      }
      const wasSignedOut = isSignedOut()
      clearSignedOut()
      instance.loginRedirect(loginRequest).catch((err) => {
        if (wasSignedOut) markSignedOut()
        console.warn("[MSAL] login failed:", err?.errorCode || err?.message || err)
        setBusy(false)
        setAttempt((n) => n + 1)
        notify.error(t("login.error"))
      })
    }, HANDOFF_MS)
  }

  return { busy, connect, attempt }
}
