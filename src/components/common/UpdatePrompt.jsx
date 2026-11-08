import { useCallback, useEffect, useRef, useState } from "react"
import { useLocation } from "react-router-dom"
import { useRegisterSW } from "virtual:pwa-register/react"
import { toast } from "sonner"
import { useLocale } from "@/hooks/useLocale"
import { useReleaseNotes } from "./update/useReleaseNotes"

/**
 * Yeni sürüm hazır — servis çalışanını kaydeder, yeni sürümü yoklar ve kullanıcının kendi
 * basacağı kartı açar (`UpdateCard`). Diyalog değil toast: güncelleme acil değil, akan bir
 * cevabın önüne modal konmaz. Sabit `id`: ikinci bir sürüm kartı yerinde tazeler.
 * Gerekçeler ve tarihçe: `docs/deployment.md` › PWA.
 */
const TOAST_ID = "tyro-update-ready"
// Kart nadiren açılır ve yetki kancası taşır: giriş ekranının paketine girmez.
// - Açılıştan biraz sonra boşta ÖNCEDEN yüklenir: her yayın eski parçaları siliyor ve kartın
//   parçasının adı her derlemede değişiyor. Yeni sürüm çıktığında açık sekme kendi (artık silinmiş)
//   kart dosyasını isteyince parça hatası olup sayfa kendiliğinden yenileniyordu — kartın "ne zaman
//   yenileyeceğine sen karar ver" sözü bozuluyor, yarım form gidiyordu. Yüklenmiş modül sekme
//   açık kaldıkça bellekte durur.
// - Bildirim kart yüklendikten SONRA açılır: sonner boyu açılışta ölçüp üzerine gelince o boya
//   kilitliyor; boş ölçülen kart 0 boya inip aşağı kaçıyor, fare çıkınca geri geliyordu (titreme).
let cardLoad = null
function loadUpdateCard() {
  cardLoad ??= import("./update/UpdateCard")
    .then((m) => m.UpdateCard)
    .catch((err) => {
      cardLoad = null
      throw err
    })
  return cardLoad
}
const WARM_MS = 4000

/**
 * Sayfa sunucudaki en yeni sürümü zaten çalıştırıyor mu? Art arda yayınlarda bekleyen servis
 * çalışanı geride kalır: "Yenile" onu devreye alır, sayfa ise HTML'i ağdan alıp en yeni sürümle
 * açılır. Tarayıcı sonra daha yeni çalışanı bulunca kart ikinci kez "Yenile" istiyordu — boşuna.
 */
function runsLatest(release) {
  const own = import.meta.env.TYRO_BUILD?.sha
  return Boolean(own && release?.sha?.startsWith(own))
}

// Tarayıcı `sw.js`'i yalnız gerçek navigasyonda yokluyor; SPA'da hiç kıpırdamayan sekme
// günün sürümünü bu zemin yoklamasıyla öğrenir.
const IDLE_CHECK_MS = 60 * 60 * 1000
// Hareket (rota, tıklama, tuş, sekmeye dönüş) de yoklar; her harekette istek olmasın diye fren.
const ACTIVITY_COOLDOWN_MS = 2 * 60 * 1000
// "Devral"dan sonra `controlling` olayı gelmezse sayfayı biz yenileriz (sağlıklı yolda ~100 ms).
const RELOAD_FALLBACK_MS = 3000
// "Sonra" kartı kalıcı kapatmaz: bu süre sonra yeniden sorar.
const SNOOZE_MS = 2 * 60 * 60 * 1000

export function UpdatePrompt() {
  const { t } = useLocale()
  const location = useLocation()
  // Kayıt state'te: yoklama efekti onu beklemeli; bileşen /login ile kabuk arasında yeniden mount olur.
  const [registration, setRegistration] = useState(null)
  const lastCheckRef = useRef(0)
  const snoozeRef = useRef(0)

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, reg) {
      if (reg) setRegistration(reg)
    },
  })
  const release = useReleaseNotes(needRefresh)

  useEffect(() => {
    if (!registration) return undefined

    const check = (force = false) => {
      if (navigator.onLine === false) return
      const now = Date.now()
      if (!force && now - lastCheckRef.current < ACTIVITY_COOLDOWN_MS) return
      lastCheckRef.current = now
      registration.update().catch(() => {})
    }

    // `pointerdown` (click değil: sürükleme ve uzun basma da harekettir); pasif ve yakalama
    // fazında — hiçbir şeyi engellemez, olayı durduran bileşen olsa da bize ulaşır.
    const onActivity = () => check()
    const onVisible = () => {
      if (document.visibilityState === "visible") check()
    }
    document.addEventListener("pointerdown", onActivity, { capture: true, passive: true })
    document.addEventListener("keydown", onActivity, { capture: true, passive: true })
    document.addEventListener("visibilitychange", onVisible)
    const id = setInterval(() => check(true), IDLE_CHECK_MS)

    return () => {
      document.removeEventListener("pointerdown", onActivity, { capture: true })
      document.removeEventListener("keydown", onActivity, { capture: true })
      document.removeEventListener("visibilitychange", onVisible)
      clearInterval(id)
    }
  }, [registration])

  // Rota değişimi de yoklar; aynı frenden geçer.
  useEffect(() => {
    if (!registration || navigator.onLine === false) return
    const now = Date.now()
    if (now - lastCheckRef.current < ACTIVITY_COOLDOWN_MS) return
    lastCheckRef.current = now
    registration.update().catch(() => {})
  }, [registration, location.pathname])

  useEffect(() => () => clearTimeout(snoozeRef.current), [])

  const apply = useCallback(() => {
    // `updateServiceWorker` yalnız "devral" mesajını gönderir; sayfayı `controlling` olayı
    // yeniler. Olay gelmezse (bekleyen çalışan yok, başka sekme devraldı) biz yenileriz:
    // navigasyon ağdan okunduğu için yenileme bugünün HTML'ini getirir.
    updateServiceWorker(true)
    window.setTimeout(() => window.location.reload(), RELOAD_FALLBACK_MS)
  }, [updateServiceWorker])

  const later = useCallback(() => {
    toast.dismiss(TOAST_ID)
    // `needRefresh` sıfırlanmazsa efekt kartı hemen yeniden açar.
    setNeedRefresh(false)
    clearTimeout(snoozeRef.current)
    snoozeRef.current = window.setTimeout(() => setNeedRefresh(true), SNOOZE_MS)
  }, [setNeedRefresh])

  useEffect(() => {
    const idle = window.requestIdleCallback ?? ((fn) => window.setTimeout(fn, 0))
    const warm = window.setTimeout(
      () => idle(() => void loadUpdateCard().catch(() => {}), { timeout: 10_000 }),
      WARM_MS,
    )
    return () => window.clearTimeout(warm)
  }, [])

  useEffect(() => {
    // Notlar okunana dek beklenir (tek istek): kart ancak sayfa gerçekten eskiyse açılır.
    if (!needRefresh || release === undefined) return undefined
    if (runsLatest(release)) {
      // Bekleyen çalışan sekmeler kapanınca kendiliğinden devreye girer. İşaret sıfırlanır ki
      // sonraki yayında kart yeniden sorabilsin.
      setNeedRefresh(false)
      return undefined
    }
    let alive = true
    // Alt-ortada: sürüm duyurusu sağ alttaki iş bildirimlerinden ayrı durur. Çakışırlarsa
    // (dar ekran) bildirim yığını kartın üstüne çıkar — `UpdateCard` kaçınma alanı.
    const position = "bottom-center"
    loadUpdateCard()
      .then((UpdateCard) => {
        if (!alive) return
        toast.custom(() => <UpdateCard release={release} onApply={apply} onLater={later} />, {
          id: TOAST_ID,
          duration: Infinity,
          position,
          className: "update-toast",
        })
      })
      .catch(() => {
        if (!alive) return
        // Kart yine de inemezse (önceden yüklenemeden yayın gelmiş) sayfa yenilenmez: sade
        // bildirim aynı iki seçimi sunar.
        toast(t("update.title"), {
          id: TOAST_ID,
          description: t("update.safe"),
          duration: Infinity,
          position,
          action: { label: t("update.action"), onClick: apply },
          cancel: { label: t("update.later"), onClick: later },
        })
      })
    return () => {
      alive = false
    }
  }, [needRefresh, release, apply, later, t, setNeedRefresh])

  return null
}
