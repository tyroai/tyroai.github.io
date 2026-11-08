import { useLayoutEffect, useRef, useState } from "react"
import { useLocale } from "@/hooks/useLocale"
import { ReviewReceipt } from "./ReviewReceipt"

// Fiş bundan fazla küçülmez (kâğıdın 10 px'lik yazısı ~7 px): çok kalemli masrafta bölme kendi içinde kayar.
const MIN_SCALE = 0.7

function scrollParent(el) {
  for (let n = el?.parentElement; n; n = n.parentElement) {
    const y = getComputedStyle(n).overflowY
    if (y === "auto" || y === "scroll") return n
  }
  return null
}

const px = (v) => parseFloat(v) || 0

/**
 * Gözden geçirmenin sol bölmesi: "Önizleme" kaşı ve masrafın fişi (`ReviewReceipt`). Bölme
 * pencerenin görünen yüksekliğine SIĞAR — imzala & gönder önizlemesinin kuralı: fiş kendi
 * ölçüsünden küçültülür (`scale`, en az `MIN_SCALE`), yer tuttuğu yükseklik de küçülen boyuna
 * iner; sağdaki özet kayarken bölme yapışık kalır (`sticky`). En küçük ölçekte de sığmıyorsa bölme
 * kendi içinde kayar. Ölçüler `ResizeObserver` ile: pencere büyüyüp küçülünce, tam ekrana alınınca.
 */
export function ReceiptPane({ form, owners }) {
  const { t } = useLocale()
  const pane = useRef(null)
  const label = useRef(null)
  const content = useRef(null)
  const [fit, setFit] = useState({ scale: 1, height: null, view: null })

  useLayoutEffect(() => {
    const box = pane.current
    const inner = content.current
    const port = scrollParent(box)
    if (!box || !inner || !port || typeof ResizeObserver === "undefined") return undefined
    const measure = () => {
      const ps = getComputedStyle(port)
      const bs = getComputedStyle(box)
      const view = port.clientHeight - px(ps.paddingTop) - px(ps.paddingBottom)
      const chrome =
        px(bs.paddingTop) +
        px(bs.paddingBottom) +
        (label.current?.offsetHeight ?? 0) +
        px(bs.rowGap)
      const natural = inner.offsetHeight
      if (!natural || view <= 0) return
      const scale = Math.max(MIN_SCALE, Math.min(1, (view - chrome) / natural))
      setFit((f) =>
        Math.abs(f.scale - scale) < 0.002 && f.view === view
          ? f
          : { scale, height: Math.ceil(natural * scale), view },
      )
    }
    const ro = new ResizeObserver(measure)
    ro.observe(port)
    ro.observe(inner)
    return () => ro.disconnect()
  }, [])

  return (
    <div
      ref={pane}
      className="req-review-receipt sticky top-0 hidden min-w-0 flex-col gap-3 overflow-y-auto overscroll-contain rounded-[1.375rem] bg-muted/45 px-4 pb-5 pt-3.5"
      style={fit.view ? { maxHeight: fit.view } : undefined}
    >
      <p
        ref={label}
        className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
      >
        {t("chat.sign.preview")}
      </p>
      <div className="shrink-0" style={fit.height ? { height: fit.height } : undefined}>
        <div
          ref={content}
          className="origin-top"
          style={fit.scale < 1 ? { transform: `scale(${fit.scale})` } : undefined}
        >
          <ReviewReceipt form={form} owners={owners} />
        </div>
      </div>
    </div>
  )
}
