import { useEffect } from "react"
import { useLocale } from "@/hooks/useLocale"
import { getPermission, showNotification } from "@/lib/notify/browserNotify"
import { startTimer, useFocusTimer } from "@/lib/focusTimer"
import { notify } from "@/lib/notify"

// Bu kadar yeni bir bitiş hâlâ haber değeri taşır (sayfa geç yüklendiyse de).
const FRESH_MS = 2 * 60000
const SEEN = "tyro-focus-timer-seen"

/** Her bitiş bu sekmede bir kez duyurulur (yenilemede tekrar etmez). */
function firstTime(doneAt) {
  try {
    if (Number(sessionStorage.getItem(SEEN)) >= doneAt) return false
    sessionStorage.setItem(SEEN, String(doneAt))
  } catch {
    // Depo kapalı: yine de bir kez (bu çizimde).
  }
  return true
}

/**
 * Odak sayacı bitince haber — hangi sayfada olursan ol (header'daki kapıdan; sayaç çalışırken
 * ve bittikten sonra bağlı): uygulama içi bildirim ("Yeniden başlat"lı); sekme arka plandaysa ve
 * izin önceden verilmişse işletim sistemi bildirimi de (izin burada istenmez). Kod geç indiyse
 * de son iki dakikada biten sayaç duyurulur.
 */
export default function FocusTimerAlarm() {
  const { t } = useLocale()
  const { doneAt, minutes } = useFocusTimer()
  useEffect(() => {
    if (!doneAt || Date.now() - doneAt > FRESH_MS || !firstTime(doneAt)) return
    const title = t("widgets.focusTimer.doneTitle")
    const body = t("widgets.focusTimer.doneBody", { m: minutes })
    notify.success(title, {
      description: body,
      duration: 12000,
      action: { label: t("widgets.focusTimer.again"), onClick: () => startTimer(minutes) },
    })
    if (document.hidden && getPermission() === "granted")
      showNotification({ title, body, tag: "tyro-focus-timer", urgent: true })
  }, [doneAt, minutes, t])
  return null
}
