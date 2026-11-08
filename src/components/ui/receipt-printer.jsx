/*
 * Receipt printer — EasyUI (easyui.site) › payment-receipt-printer bileşeninden JSX'e uyarlandı.
 *
 * MIT License · Copyright (c) 2026 Suraj Maurya
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software
 * and associated documentation files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions: The above copyright
 * notice and this permission notice shall be included in all copies or substantial portions of
 * the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
 * PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 * Uyarlama: görünüm ve hareket kaynağın aynısı (durum kartı · titreyen yazıcı gövdesi · ağızdan
 * kayan termal kâğıt · barkod · Tekrar yazdır / Kopyala). İkonlar Hugeicons, hareket
 * `motion/react`; kaynağın renk, gölge ve puntoları `receipt-printer.css`te (yazıcıyla birlikte
 * iner). Kâğıdın sabit üç satırı (sipariş no · tarih · ödeme) ve toplam kademeleri dışarıdan
 * verilen satırlar oldu (`meta`, `summary`, `totals`); ekrandaki her metin `labels` ile çevrilir.
 * Kopyala sipariş numarası yerine `copyText`i panoya yazar. Yalnız açık kâğıt (kaynağın varsayılanı).
 * Yazı tipleri ve köşeler sitenin ölçüleri: JetBrains Mono, başlıklarda Geist (yoksa Inter).
 */
import { useCallback, useEffect, useRef, useState } from "react"
import { motion, useReducedMotion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import CheckmarkCircle02Icon from "@hugeicons/core-free-icons/CheckmarkCircle02Icon"
import Copy01Icon from "@hugeicons/core-free-icons/Copy01Icon"
import PrinterIcon from "@hugeicons/core-free-icons/PrinterIcon"
import RotateCcwIcon from "@hugeicons/core-free-icons/RotateCcwIcon"
import Store01Icon from "@hugeicons/core-free-icons/Store01Icon"
import Tick02Icon from "@hugeicons/core-free-icons/Tick02Icon"
import { cn } from "@/lib/utils"
import "./receipt-printer.css"

const SPRING = { type: "spring", stiffness: 380, damping: 30, mass: 0.5 }

const LABELS = {
  region: "Payment Receipt Printer",
  printing: "Printing",
  ready: "Ready",
  idle: "Idle",
  feed: "FEED",
  online: "ONLINE",
  standby: "STANDBY",
  item: "ITEM",
  price: "PRICE",
  replay: "Replay Print",
  replayTitle: "Replay printing animation",
  copy: "Copy Order",
  copyTitle: "Copy order number",
  copied: "Copied",
}

// Termal barkodun çubukları (x, genişlik) — kaynağın deseni.
const BARS = [
  [0, 3],
  [5, 1.5],
  [9, 4],
  [15, 2],
  [19, 1],
  [22, 3],
  [27, 1.5],
  [31, 5],
  [38, 2],
  [42, 1],
  [45, 4],
  [51, 2],
  [55, 1.5],
  [58, 3],
  [63, 5],
  [70, 1.5],
  [73, 3],
  [78, 2],
  [82, 4],
  [88, 1.5],
  [92, 3],
  [97, 1],
  [100, 4],
  [106, 2],
  [110, 3],
  [115, 1.5],
  [118, 5],
  [125, 2],
  [129, 1],
  [132, 4],
  [138, 2],
  [142, 1.5],
  [145, 3],
  [150, 2],
  [154, 4],
  [159, 1],
]

const TEETH_TOP =
  "0,10 5,0 10,10 15,0 20,10 25,0 30,10 35,0 40,10 45,0 50,10 55,0 60,10 65,0 70,10 75,0 80,10 85,0 90,10 95,0 100,10"
const TEETH_BOTTOM =
  "0,0 5,10 10,0 15,10 20,0 25,10 30,0 35,10 40,0 45,10 50,0 55,10 60,0 65,10 70,0 75,10 80,0 85,10 90,0 95,10 100,0"

const ACTION =
  "rp-action flex cursor-pointer items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-40"

function copyToClipboard(text) {
  if (typeof navigator !== "undefined" && navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).catch(() => {})
  } else if (typeof document !== "undefined") {
    const area = document.createElement("textarea")
    area.value = text
    area.style.position = "fixed"
    area.style.left = "-999999px"
    document.body.appendChild(area)
    area.focus()
    area.select()
    try {
      document.execCommand("copy")
    } catch {
      /* pano yok: sessizce geç */
    }
    area.remove()
  }
}

// Kâğıdın tırtıklı kesik kenarı (üst ve alt).
function Edge({ side }) {
  const top = side === "top"
  return (
    <div
      className={cn(
        "absolute inset-x-0 flex h-1.5 overflow-hidden",
        top ? "rp-edge-top top-0" : "rp-edge-bottom bottom-0",
      )}
    >
      <svg
        className="rp-edge h-1.5 w-full"
        preserveAspectRatio="none"
        viewBox="0 0 100 10"
        aria-hidden="true"
      >
        <polygon fill="currentColor" points={top ? TEETH_TOP : TEETH_BOTTOM} />
      </svg>
    </div>
  )
}

/**
 * Animasyonlu fiş yazıcısı: üstte durum kartı, siyah yazıcı gövdesi (yazarken hafifçe titrer),
 * ağzından kayarak çıkan termal kâğıt ve altta Tekrar yazdır / Kopyala. Azaltılmış harekette
 * kâğıt baştan çıkmış çizilir. `meta`: `[{ label, value, icon?, strong? }]` · `items`:
 * `[{ name, price, quantity?, description? }]` · `summary` / `totals`: `[{ label, value }]`
 * (toplam satırları kalın; ilki, özet satırı varsa, üst çizgili).
 */
export function ReceiptPrinter({
  status: controlledStatus,
  merchant,
  merchantSubtext,
  merchantLogo,
  model = "POS-8000",
  meta = [],
  items = [],
  summary = [],
  totals = [],
  barcodeText,
  message,
  stamp,
  copyText = "",
  autoPrint = true,
  printDuration = 2.4,
  showStatusCard = true,
  statusTitle,
  statusSubtitle,
  showActions = true,
  showBarcode = true,
  showCutEffect = true,
  labels: labelsIn,
  lang,
  onPrintStart,
  onPrintComplete,
  onReplay,
  className,
  printerClassName,
  receiptClassName,
}) {
  const labels = { ...LABELS, ...labelsIn }
  const reduce = useReducedMotion()
  const [internal, setInternal] = useState(reduce ? "completed" : autoPrint ? "printing" : "idle")
  const [copied, setCopied] = useState(false)
  const [printKey, setPrintKey] = useState(0)
  const timer = useRef(null)
  const later = useRef([])

  const status = controlledStatus || internal
  const printing = status === "printing"
  const completed = status === "completed" || status === "success"

  const schedule = (fn, ms) => later.current.push(setTimeout(fn, ms))

  const startPrinting = useCallback(() => {
    if (reduce) {
      setInternal("completed")
      onPrintComplete?.()
      return
    }
    setInternal("printing")
    onPrintStart?.()
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      setInternal("completed")
      onPrintComplete?.()
    }, printDuration * 1000)
  }, [reduce, printDuration, onPrintStart, onPrintComplete])

  useEffect(() => {
    if (!autoPrint || reduce) return undefined
    const delay = setTimeout(startPrinting, 400)
    return () => clearTimeout(delay)
  }, [autoPrint, reduce, startPrinting])

  useEffect(() => {
    const pending = later.current
    return () => {
      clearTimeout(timer.current)
      pending.forEach(clearTimeout)
    }
  }, [])

  const replay = () => {
    setPrintKey((k) => k + 1)
    setInternal("idle")
    onReplay?.()
    schedule(startPrinting, 150)
  }

  const copy = () => {
    copyToClipboard(copyText)
    setCopied(true)
    schedule(() => setCopied(false), 2000)
  }

  return (
    <div
      lang={lang}
      className={cn(
        "rp mx-auto flex w-full select-none flex-col items-center",
        className,
      )}
      role="region"
      aria-label={labels.region}
    >
      {/* 1. Durum kartı */}
      {showStatusCard && (
        <motion.div
          initial={reduce ? false : { opacity: 0, y: -10, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={SPRING}
          className="rp-status mb-3 flex w-full items-center justify-between p-3 shadow-md"
          aria-live="polite"
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="rp-check flex size-7 shrink-0 items-center justify-center rounded-full">
              <HugeiconsIcon icon={Tick02Icon} strokeWidth={2.2} className="size-3.5" />
            </div>
            <div className="min-w-0">
              <h4 className="rp-hi truncate text-xs font-semibold">{statusTitle}</h4>
              <p className="rp-mid rp-t10 truncate">{statusSubtitle}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <span
              className={cn(
                "size-2 rounded-full",
                printing ? "rp-dot-busy animate-ping" : completed ? "rp-dot-ok" : "rp-dot-idle",
              )}
            />
            <span className="rp-lo rp-t10 rp-mono">
              {printing ? labels.printing : completed ? labels.ready : labels.idle}
            </span>
          </div>
        </motion.div>
      )}

      {/* 2. Yazıcı gövdesi */}
      <div className="relative flex w-full flex-col items-center">
        <motion.div
          animate={
            printing && !reduce
              ? { x: [0, -0.6, 0.6, -0.4, 0.4, 0], y: [0, -0.2, 0.2, 0] }
              : { x: 0, y: 0 }
          }
          transition={{ repeat: printing ? Infinity : 0, duration: 0.18, ease: "easeInOut" }}
          className={cn("rp-body relative z-20 w-full p-3.5", printerClassName)}
        >
          <div className="rp-bevel absolute inset-x-3 top-0 h-px" />
          <div className="rp-rule mb-2 flex items-center justify-between border-b pb-2">
            <div className="flex items-center gap-2">
              <div className="rp-chip rp-mid flex size-5 items-center justify-center">
                <HugeiconsIcon icon={PrinterIcon} strokeWidth={1.9} className="size-3" />
              </div>
              <span className="rp-hi rp-t11 rp-mono font-medium tracking-tight">{model}</span>
            </div>
            <div className="rp-pill flex items-center gap-1 rounded-full px-2 py-0.5">
              <motion.span
                animate={
                  printing
                    ? { opacity: [0.4, 1, 0.4], scale: [0.9, 1.1, 0.9] }
                    : { opacity: 1, scale: 1 }
                }
                transition={{ repeat: printing ? Infinity : 0, duration: 0.8 }}
                className={cn(
                  "size-1.5 rounded-full",
                  printing ? "rp-led-busy" : completed ? "rp-led-ok" : "rp-led-off",
                )}
              />
              <span className="rp-led-text rp-t9 rp-mono uppercase">
                {printing ? labels.feed : completed ? labels.online : labels.standby}
              </span>
            </div>
          </div>
          {/* Kâğıdın çıktığı ağız */}
          <div className="rp-slot relative flex h-3 w-full items-center justify-center overflow-hidden rounded-full">
            <div className="rp-roller h-px w-3/4" />
          </div>
        </motion.div>

        {/* 3. Ağızdan kayan kâğıt */}
        <div className="relative z-10 -mt-1.5 flex w-full justify-center overflow-hidden pb-4 pt-1">
          <motion.div
            key={printKey}
            initial={reduce ? { y: 0, opacity: 1 } : { y: "-100%", opacity: 0.4 }}
            animate={
              printing || completed || reduce
                ? { y: "0%", opacity: 1 }
                : { y: "-100%", opacity: 0.4 }
            }
            transition={{ duration: reduce ? 0.01 : printDuration, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "rp-paper relative px-5 pb-6 pt-5 text-left rp-mono transition-colors",
              receiptClassName,
            )}
          >
            {showCutEffect && <Edge side="top" />}
            <div className="rp-notch rp-notch-l absolute -left-2 size-3.5 rounded-full" />
            <div className="rp-notch rp-notch-r absolute -right-2 size-3.5 rounded-full" />

            <div className="rp-dash pb-3 text-center">
              <div className="rp-logo mb-1.5 inline-flex size-7 items-center justify-center rounded-full">
                {merchantLogo || (
                  <HugeiconsIcon icon={Store01Icon} strokeWidth={1.9} className="size-3.5" />
                )}
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider">{merchant}</h3>
              {merchantSubtext && (
                <p className="rp-t9 mt-0.5 tracking-tight opacity-60">{merchantSubtext}</p>
              )}
            </div>

            {meta.length > 0 && (
              <div className="rp-dash rp-t10 space-y-1 py-2.5">
                {meta.map((m) => (
                  <div key={m.label} className="flex items-center justify-between gap-3">
                    <span className="shrink-0 opacity-60">{m.label}</span>
                    <span className="flex min-w-0 items-center gap-1 text-end">
                      {m.icon && (
                        <HugeiconsIcon
                          icon={m.icon}
                          strokeWidth={1.9}
                          className="size-2.5 shrink-0 opacity-70"
                        />
                      )}
                      <span className={cn("truncate", m.strong && "font-semibold")}>{m.value}</span>
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="rp-dash space-y-2 py-3">
              <div className="rp-t9 flex justify-between font-bold uppercase opacity-60">
                <span>{labels.item}</span>
                <span>{labels.price}</span>
              </div>
              {items.map((it, i) => (
                <div key={i} className="space-y-0.5">
                  <div className="rp-t10 flex items-baseline justify-between gap-2">
                    <span className="truncate font-medium">
                      {it.quantity && it.quantity > 1 ? `${it.quantity}x ` : ""}
                      {it.name}
                    </span>
                    <span className="shrink-0 font-semibold">{it.price}</span>
                  </div>
                  {it.description && <p className="rp-t9 rp-note opacity-60">{it.description}</p>}
                </div>
              ))}
            </div>

            <div className="rp-dash rp-t10 space-y-1 py-2.5">
              {summary.map((s) => (
                <div key={s.label} className="flex justify-between opacity-70">
                  <span>{s.label}</span>
                  <span>{s.value}</span>
                </div>
              ))}
              {totals.map((s, i) => (
                <div
                  key={s.label}
                  className={cn(
                    "flex items-baseline justify-between text-xs font-bold",
                    i === 0 && summary.length > 0 && "rp-total-rule pt-1",
                  )}
                >
                  <span>{s.label}</span>
                  <span className="text-sm">{s.value}</span>
                </div>
              ))}
            </div>

            {showBarcode && (
              <div className="flex flex-col items-center pb-1 pt-3 text-center">
                <div className="rp-barcode flex h-7 w-full items-center justify-center opacity-80">
                  <svg
                    className="size-full"
                    preserveAspectRatio="none"
                    viewBox="0 0 160 40"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    {BARS.map(([x, w]) => (
                      <rect key={x} x={x} y="0" width={w} height="40" />
                    ))}
                  </svg>
                </div>
                {barcodeText && (
                  <span className="rp-t8 mt-1 rp-mono tracking-widest opacity-60">
                    * {barcodeText} *
                  </span>
                )}
              </div>
            )}

            <div className="rp-t9 pt-2 text-center opacity-70">
              {message && <p className="font-medium">{message}</p>}
              {stamp && <p className="rp-t8 mt-0.5 opacity-50">{stamp}</p>}
            </div>

            {showCutEffect && <Edge side="bottom" />}
          </motion.div>
        </div>
      </div>

      {/* 4. Tekrar yazdır · Kopyala */}
      {showActions && (
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SPRING}
          className="mt-3 flex w-full items-center justify-center gap-2"
        >
          <button
            type="button"
            onClick={replay}
            disabled={printing}
            className={ACTION}
            title={labels.replayTitle}
          >
            <HugeiconsIcon
              icon={RotateCcwIcon}
              strokeWidth={1.9}
              className={cn("size-3.5", printing && "animate-spin")}
            />
            <span>{labels.replay}</span>
          </button>
          {copyText && (
            <button type="button" onClick={copy} className={ACTION} title={labels.copyTitle}>
              {copied ? (
                <>
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={1.9} className="rp-ok size-3.5" />
                  <span className="rp-ok">{labels.copied}</span>
                </>
              ) : (
                <>
                  <HugeiconsIcon icon={Copy01Icon} strokeWidth={1.9} className="rp-action-icon size-3.5" />
                  <span>{labels.copy}</span>
                </>
              )}
            </button>
          )}
        </motion.div>
      )}
    </div>
  )
}
