import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useLocale } from "@/hooks/useLocale"
import { useIsMobile } from "@/hooks/use-mobile"
import { useToastAvoid } from "@/hooks/useToastAvoid"
import { useVisualViewport } from "@/hooks/useVisualViewport"
import { cn } from "@/lib/utils"
import { DockBarContext } from "./dockBar"
import { useDockModal } from "./useDockModal"

// Sohbetin turu panel ya da sayfa açılınca iner: rıhtım her sayfada çizili, tur motoru ilk pakete
// girmesin. Parça inmezse tur sessizce düşer, panel bozulmaz.
const Tour = lazy(() =>
  import("@/components/tour/Tour")
    .then((m) => ({ default: m.Tour }))
    .catch(() => ({ default: () => null })),
)

/**
 * The chat as a column beside the page instead of a page of its own.
 *
 * It exists because the two things people want at once — the page in front of
 * them and the assistant they're asking about it — used to be mutually
 * exclusive: asking a question navigated to /chat and took the page away.
 *
 * Deliberately a LAYOUT COLUMN, not an overlay: an overlay would cover the
 * very content the question is about. The page shrinks instead. Below the lg
 * breakpoint there isn't width for two columns, so it does become a sheet —
 * see `isMobile`.
 *
 * This component only draws the frame. The chat itself is passed in as
 * `children` and lives at ONE place in the tree for the whole session (see
 * PersistentChat): re-parenting it would remount it and kill the SSE
 * connection a streaming answer is arriving on.
 */

const STORAGE_KEY = "tyro-chatdock-width"
const MIN_WIDTH = 340
const MAX_WIDTH = 760
const DEFAULT_WIDTH = 420
// What "expand" snaps to — wide enough to read a long answer without hiding
// the page entirely.
const WIDE_WIDTH = 640

function readWidth() {
  if (typeof window === "undefined") return DEFAULT_WIDTH
  const raw = Number(window.localStorage.getItem(STORAGE_KEY))
  if (!Number.isFinite(raw) || raw <= 0) return DEFAULT_WIDTH
  return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, raw))
}

/**
 * `mode` is what keeps the chat in ONE DOM position:
 *   page   — on /chat, fills the content area, no frame of its own
 *   dock   — the resizable right column
 *   hidden — collapsed, still mounted
 * Switching between them is a class change, never a re-parent.
 */
export function ChatDock({ mode = "hidden", onClose, onExpandToPage, children }) {
  const open = mode === "dock"
  const isPage = mode === "page"
  const { t } = useLocale()
  const isMobile = useIsMobile()
  // Telefonda sayfanın GÖRÜNEN yüksekliği: tarayıcı çubuğu ve klavye burada
  // sayılır, `100dvh` ikincisini saymaz. Sabit konumlu bir sayfa panelinin
  // yüksekliğini buna bağlamak, klavye açılınca bestecinin klavyenin altında
  // kalmasını engelliyor — kancanın var oluş sebebi de bu (bkz.
  // useVisualViewport). Masaüstünde okunmaz: panel orada bir kolon.
  const { height: viewportHeight, offsetTop: viewportTop, keyboardUp } = useVisualViewport()
  const [width, setWidth] = useState(readWidth)
  const dragging = useRef(false)
  // Panel açıkken sağ alttaki bildirimler panelin soluna geçer (bestecisini örtmesin).
  const asideRef = useRef(null)
  useToastAvoid(asideRef, "right")
  // Telefonda panel sayfayı örtüyor: Geri kapatır, odak panelde, arkası `inert`.
  const backdropRef = useRef(null)
  useDockModal(open && isMobile, asideRef, backdropRef, onClose)
  // Masaüstünde panel KLAVYEYLE gizlenince odak paneldeyse (ya da gizlenen düğmeyle sayfaya
  // düştüyse) header'daki açma düğmesine döner; kişi yerini kaybetmesin. Fareyle kapatana dönmez:
  // Radix ipucu odakla açılıyor, header'da gereksiz balon belirirdi. Tam sayfaya geçişte sohbet
  // ekranda kalır.
  const viaKeyboard = useRef(false)
  useEffect(() => {
    if (!open) return undefined
    const key = () => (viaKeyboard.current = true)
    const pointer = () => (viaKeyboard.current = false)
    window.addEventListener("keydown", key, true)
    window.addEventListener("pointerdown", pointer, true)
    return () => {
      window.removeEventListener("keydown", key, true)
      window.removeEventListener("pointerdown", pointer, true)
    }
  }, [open])
  const wasOpen = useRef(open)
  useEffect(() => {
    const closed = wasOpen.current && mode === "hidden"
    wasOpen.current = open
    if (!closed || isMobile || !viaKeyboard.current) return
    const el = document.activeElement
    if (!el || el === document.body || asideRef.current?.contains(el))
      document.querySelector("[data-dock-toggle]")?.focus()
  }, [open, mode, isMobile])

  // Never wider than 60% of the window: the point is to keep the page
  // readable, and a restored width from a big monitor would swallow a laptop.
  const [maxAllowed, setMaxAllowed] = useState(MAX_WIDTH)
  useEffect(() => {
    function measure() {
      setMaxAllowed(Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, window.innerWidth * 0.6)))
    }
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [])

  const effectiveWidth = Math.min(width, maxAllowed)

  useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem(STORAGE_KEY, String(width))
  }, [width])

  // Escape closes — standard for a transient surface, and the only way out
  // for keyboard users on the sheet variant. Üstteki pencere ya da panel Esc'i
  // tükettiyse (Radix `preventDefault` eder) rıhtım kapanmaz: tek basış ikisini birden kapatırdı.
  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === "Escape" && !e.defaultPrevented) onClose?.()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  const startDrag = useCallback(
    (e) => {
      e.preventDefault()
      dragging.current = true
      const startX = e.clientX ?? e.touches?.[0]?.clientX ?? 0
      const startWidth = effectiveWidth
      // Pointer capture on the window rather than the handle: the cursor
      // routinely outruns a 6px target mid-drag.
      function onMove(ev) {
        if (!dragging.current) return
        const x = ev.clientX ?? ev.touches?.[0]?.clientX ?? 0
        // Dragging left grows the panel, since it is anchored right.
        const next = startWidth + (startX - x)
        setWidth(Math.min(maxAllowed, Math.max(MIN_WIDTH, next)))
      }
      function onUp() {
        dragging.current = false
        document.body.style.removeProperty("cursor")
        document.body.style.removeProperty("user-select")
        window.removeEventListener("pointermove", onMove)
        window.removeEventListener("pointerup", onUp)
      }
      // Without these the drag selects page text and the cursor flickers
      // back to default whenever it leaves the handle.
      document.body.style.cursor = "col-resize"
      document.body.style.userSelect = "none"
      window.addEventListener("pointermove", onMove)
      window.addEventListener("pointerup", onUp)
    },
    [effectiveWidth, maxAllowed],
  )

  const isWide = effectiveWidth >= WIDE_WIDTH - 1
  // Pencere düğmeleri sohbetin araç çubuğunda (`dockBar`): panelin ayrı başlık satırı yok.
  const bar = useMemo(
    () =>
      open
        ? {
            wide: isWide,
            canWiden: !isMobile,
            onWiden: () => setWidth(isWide ? DEFAULT_WIDTH : WIDE_WIDTH),
            onExpand: onExpandToPage,
            onClose,
          }
        : null,
    [open, isWide, isMobile, onExpandToPage, onClose],
  )

  return (
    <>
      {/* Sheet backdrop — only in the mobile variant, where the dock covers
          the page and needs a way out by tapping away. */}
      {open && isMobile && (
        <div
          ref={backdropRef}
          aria-hidden="true"
          data-scrim=""
          onClick={onClose}
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-[2px]"
        />
      )}

      <aside
        ref={asideRef}
        aria-label={t("chatDock.title")}
        aria-hidden={mode === "hidden"}
        tabIndex={open && isMobile ? -1 : undefined}
        data-state={mode}
        // Klavye durumu CSS'e de veriliyor: bestecinin KENDİ `pwa:pb-5` payı
        // ChatScreen'de duruyor ve o bileşen bu kancayı okumuyor — okusa her
        // klavye karesinde bütün sohbeti yeniden çizerdi. Tek bir öznitelik
        // + index.css'teki tek kural, yeniden çizim olmadan aynı işi yapıyor.
        data-keyboard={keyboardUp ? "up" : undefined}
        style={
          open
            ? isMobile
              ? // Panel GÖRÜNEN görüntü alanına çakılır: hem üst kenarı hem
                // yüksekliği ondan gelir.
                //
                // Yüksekliğin sebebi: `inset-y-0` sabit bir öğede DÜZEN
                // görüntü alanını ölçer, telefonda o alan görünenden yüksek
                // olduğu için panelin altı tarayıcı çubuğunun arkasında
                // kalıyordu.
                //
                // ⚠️ `top` de ŞART, ve yüksekliği tek başına vermek eksikti.
                // Klavye açılınca iOS odaklanılan alanı göstermek için DÜZEN
                // görüntü alanını kaydırıyor (`offsetTop > 0`); sabit konumlu
                // öğe düzen koordinatında durduğu için görünen alanın ÜSTÜNDE
                // kalıyor. Panel ekranın tepesine tırmanıyor, güvenli alan
                // dolgusu da onunla birlikte ekran dışına çıkıyor ve besteci
                // durum çubuğunun altına giriyor — saat, yazılan metnin
                // üstüne biniyordu. `offsetTop` kadar aşağı almak paneli
                // yeniden görünen alanın tam üstüne oturtuyor.
                //
                // 0 gelirse (visualViewport'u olmayan eski WebView) hiç
                // yazmıyoruz, sınıflardaki dvh + top-0 devralıyor.
                //
                // ⚠️ Klavye açıkken ALT güvenli alan payı bırakılmaz. Sınıftaki
                // `pb-[env(safe-area-inset-bottom)]` ana ekran göstergesini
                // açıkta tutmak için var; klavye açıkken gösterge zaten yok,
                // o şeridi klavye kaplıyor. Payı yine ayırmak besteciyle
                // klavye arasında ölü bir bant bırakıyordu (~34px, üstüne
                // bestecinin kendi `pwa:pb-5`i). Üst pay ise DURUR: panelin
                // tepesi görünen alanın tepesine, yani durum çubuğunun
                // altına oturuyor.
                viewportHeight
                ? {
                    top: viewportTop,
                    height: viewportHeight,
                    ...(keyboardUp ? { paddingBottom: 0 } : null),
                  }
                : undefined
              : { width: effectiveWidth }
            : undefined
        }
        className={cn(
          "relative flex min-h-0 flex-col overflow-hidden bg-background outline-none",
          isPage ? "min-w-0 flex-1" : "shrink-0 transition-[width,transform] duration-200 ease-out",
          !open && !isPage && "pointer-events-none w-0 border-l-0",
          open && "border-l border-border",
          // Mobile: a right-anchored sheet over the page instead of a column.
          //
          // `top-0` + `h-[100dvh]`, `inset-y-0` DEĞİL: ikincisi düzen görüntü
          // alanını ölçüyor ve telefonda panelin altı tarayıcı çubuğunun
          // arkasında kalıyordu. Yükseklik ayrıca satır içi stille görünen
          // alana bağlanır (yukarı bakın); dvh onun yedeği.
          //
          // Güvenli alan dolgusu: kurulu PWA'da uygulama durum çubuğunun ve
          // ana ekran göstergesinin ALTINA kadar çiziliyor. `SidebarInset`
          // bunu kendi dolgusuyla telafi ediyor ama SABİT konumlu bir öğe o
          // dolgunun dışında kalır — panelin başlığı (kapat/tam ekran
          // düğmeleri dahil) durum çubuğunun altında kalıyordu, yani
          // dokunulamıyordu. Dolgu `aside`'da, `inset` yerine: arka plan tüm
          // yüzeyi boyamaya devam ediyor, yalnızca İÇERİK içeri çekiliyor.
          isMobile &&
            open &&
            "fixed top-0 right-0 z-50 h-[100dvh] w-[min(92vw,26rem)] shadow-2xl " +
              "pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]",
          // `!isPage` ŞART: /chat'te mod "page"tir ve `open` yalnızca "dock"
          // için true olur, yani bu kural sayfa modunda da eşleşiyordu ve
          // mobilde sohbeti `fixed … w-0` ile sıfır genişliğe düşürüyordu —
          // besteci, mikrofon ve gönder düğmesi 222px dışarıda kalıyordu
          // (ölçüldü). Masaüstünde `isMobile` false olduğu için hiç
          // görülmedi.
          isMobile && !open && !isPage && "fixed inset-y-0 right-0 z-50 w-0",
        )}
      >
        {/* Resize handle. Hidden on mobile, where the sheet is a fixed width and there is no
            second column to trade space with. */}
        {open && !isMobile && (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label={t("chatDock.resize")}
            onPointerDown={startDrag}
            onDoubleClick={() => setWidth(isWide ? DEFAULT_WIDTH : WIDE_WIDTH)}
            className={cn(
              "group absolute inset-y-0 left-0 z-20 w-1.5 -translate-x-1/2 cursor-col-resize",
              "before:absolute before:inset-y-0 before:left-1/2 before:w-px before:-translate-x-1/2",
              "before:bg-transparent before:transition hover:before:bg-brand/60",
            )}
          />
        )}

        {/* The chat lives here in every mode — hidden rather than unmounted so
            a streaming answer survives closing the dock. */}
        <div className={cn("flex min-h-0 flex-1 flex-col", !open && !isPage && "hidden")}>
          {/* Sağlayıcı her modda yerinde: değeri değişir, ağaç değişmez (sohbet yeniden kurulmaz). */}
          <DockBarContext.Provider value={bar}>{children}</DockBarContext.Provider>
        </div>
      </aside>
      {/* Sohbetin turu: ilk açılışta (sayfa ya da panel); `?tour=1` yalnız /chat sayfasında. */}
      {mode !== "hidden" && (
        <Suspense fallback={null}>
          <Tour id="chat" page={isPage} />
        </Suspense>
      )}
    </>
  )
}
