import { useEffect, useMemo, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import File01Icon from "@hugeicons/core-free-icons/File01Icon"
import { useLocale } from "@/hooks/useLocale"
import { isPortraitForm } from "@/features/chat/lib/signedForm"
import { cn } from "@/lib/utils"

// Önizlemede kâğıt kenar boşluğu: form kâğıdın kenarına yapışıp kırpılmış görünmesin (gönderilen
// PDF'e dokunmaz, yalnız bu çerçevede). Dik formda (izin) daha dar: form bütünüyle sığsın diye
// küçültülüyor ve her piksel boşluk yazıyı biraz daha küçültürdü.
const pageCss = (portrait) =>
  `<style>body{padding:${portrait ? "32px 40px" : "48px 60px"}!important;box-sizing:border-box}</style>`

// Formun doğal ölçüsü (A4 yatay 273 mm / dik 186 mm + pay); ölçülemezse bu varsayılır.
const LANDSCAPE = { w: 1160, h: 890 }
const PORTRAIT = { w: 790, h: 830 }

/**
 * İMZALA & GÖNDER penceresinin sol yarısı: gidecek formun kâğıt görünümü (`html`, PDF'e
 * çevrilecek hâliyle). Dik form (izin) BÜTÜNÜYLE sığar — genişliğe ve yüksekliğe göre küçültülür,
 * kaydırma yok (istek üzerine). Yatay formda (masraf) kâğıt genişliğe sığar, uzunsa kendi içinde kayar.
 * İmza atılınca yeni hâl çizilir ve kâğıt imza satırına kaydırılır — kişi imzanın nereye
 * geleceğini görür.
 *
 * Çerçeve betik çalıştırmaz (`sandbox` yalnız `allow-same-origin`: ölçü ve kaydırma için);
 * içindeki Yazdır düğmesi ve ekran süsleri kâğıt görünümünde zaten yok.
 */
export function FormPreview({ html, focusSign = false, className }) {
  const { t } = useLocale()
  const stage = useRef(null)
  const frame = useRef(null)
  const [box, setBox] = useState({ w: 0, h: 0 })
  const portrait = isPortraitForm(html)
  const base = portrait ? PORTRAIT : LANDSCAPE
  const [doc, setDoc] = useState(base)
  const page = useMemo(() => {
    const css = pageCss(isPortraitForm(html))
    return html.includes("</head>") ? html.replace("</head>", () => `${css}</head>`) : css + html
  }, [html])

  useEffect(() => {
    const el = stage.current
    if (!el || typeof ResizeObserver === "undefined") return undefined
    const ro = new ResizeObserver(([e]) =>
      setBox({ w: e.contentRect.width, h: e.contentRect.height }),
    )
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const onLoad = () => {
    const d = frame.current?.contentDocument
    if (!d) return
    const root = d.documentElement
    // Dik formda yükseklik İÇERİĞİN boyu: belgenin kaydırma boyu çerçevenin kendi boyundan küçük
    // olamaz ve sığdırma hesabını kendi kendine besleyip büyütürdü.
    const h = portrait ? Math.ceil(d.body.getBoundingClientRect().height) : root.scrollHeight
    setDoc({ w: Math.max(base.w, root.scrollWidth), h: h || base.h })
    const slot = focusSign && d.querySelector(".tyro-sign, .tyro-slot")
    if (slot) {
      const view = frame.current.clientHeight
      const top = slot.getBoundingClientRect().top + (d.scrollingElement?.scrollTop ?? 0)
      if (d.scrollingElement) d.scrollingElement.scrollTop = Math.max(0, top - view / 2)
    }
  }

  const fit = portrait && box.h ? Math.min(box.w / doc.w, box.h / doc.h) : box.w / doc.w
  const scale = box.w ? fit : 0
  const paperH = scale ? Math.min(box.h, doc.h * scale) : 0
  // Dik form yüksekliğe göre küçülünce kâğıt sütundan dar kalır: ortalanır.
  const paperW = portrait && scale ? doc.w * scale : null

  return (
    <div className={cn("min-h-0 min-w-0 flex-col gap-2.5 bg-muted/45 p-4", className)}>
      <p className="flex shrink-0 items-center gap-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        <HugeiconsIcon icon={File01Icon} className="size-3.5" strokeWidth={1.9} />
        {t("chat.sign.preview")}
      </p>
      <div ref={stage} className="relative min-h-0 flex-1">
        {scale > 0 && (
          <div
            className="absolute inset-x-0 top-0 overflow-hidden rounded-md bg-white shadow-[0_1px_2px_rgb(0_0_0/0.06),0_8px_24px_-8px_rgb(0_0_0/0.18)] ring-1 ring-black/5"
            // Kâğıt yerleşimi itmez (mutlak): pencere küçülünce sütun da daralsın, kâğıt eski enine takılmasın.
            style={
              paperW
                ? { height: paperH, width: paperW, left: (box.w - paperW) / 2, right: "auto" }
                : { height: paperH }
            }
          >
            <iframe
              ref={frame}
              title={t("chat.sign.preview")}
              srcDoc={page}
              sandbox="allow-same-origin"
              onLoad={onLoad}
              className="block origin-top-left border-0 bg-white"
              style={{ width: doc.w, height: paperH / scale, transform: `scale(${scale})` }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
