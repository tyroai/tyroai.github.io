import { useCallback, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowLeft01Icon from "@hugeicons/core-free-icons/ArrowLeft01Icon"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import FullScreenIcon from "@hugeicons/core-free-icons/FullScreenIcon"
import PrinterIcon from "@hugeicons/core-free-icons/PrinterIcon"
import { Button } from "@/components/ui/button"
import { catLabel, monthLabel, stamp } from "@/features/rm/lib/format"
import { deckData } from "@/features/rm/lib/deck"
import { OV_LISTS, ovParams } from "@/features/rm/lib/overviewFilter"
import { cn } from "@/lib/utils"
import { useRmText } from "../data/useRmText"
import { useRm } from "../shell/RmContext"
import { useOverview } from "../overview/useOverview"
import { SLIDES } from "./slideList"
import { ExportButton } from "../common/ExportButton"

// Yazdır: uygulama gizlenir, slaytlar A4 yatay sayfalara dökülür (açık tema, damgalı alt bilgi).
const PRINT_CSS = `
.rm-print{display:none}
@media print{
  @page{size:A4 landscape;margin:8mm}
  body>*:not(.rm-print){display:none!important}
  .rm-print{display:block!important;color-scheme:light}
  .rm-print-page{break-after:page;width:100%;aspect-ratio:16/9;container-type:inline-size}
}`

/**
 * Toplantı modu: tam ekran, 16:9, klavyeyle (← → Boşluk, Esc, F) ve düğmelerle gezilir. Genel
 * Bakış'ın filtresini taşır (ekip, kategori…): sunum o dilimi anlatır, kapakta yazar.
 */
export default function PresentMode() {
  const { rt, locale } = useRmText()
  const { data, params, edit, people, today } = useRm()
  const stageRef = useRef(null)
  const ov = useOverview()
  const n = SLIDES.length
  const i = Math.min(n - 1, Math.max(0, Number(params.get("s", "1")) - 1 || 0))
  const go = useCallback((k) => params.update({ s: Math.min(n, Math.max(1, k + 1)) }), [params, n])
  // Kapatınca Genel Bakış aynı filtreyle açılır.
  const back = JSON.stringify(ovParams(ov.filter))
  const close = useCallback(() => params.go("genel", JSON.parse(back)), [params, back])
  const m0 = ov.grid.months[0]
  const p = ov.filter.period
  const filterNote = OV_LISTS.filter((k) => ov.filter[k].length)
    .map((k) => {
      const vals = k === "cats" ? ov.filter[k].map(catLabel) : ov.filter[k]
      return `${rt(`rm.of.${k}`)}: ${vals.join(", ")}`
    })
    .join(" · ")
  const ctx = {
    ov,
    deck: deckData(ov, data.st, data.plan, today),
    rt,
    locale,
    people,
    today,
    periodLabel: rt(`rm.capacity.period.${p}`),
    filterNote: filterNote ? `${rt(`rm.capacity.period.${p}`)} · ${filterNote}` : "",
    monthName: m0 ? monthLabel(m0.y, m0.m, locale, { long: true }) : "",
  }
  const meta = data.meta
  const foot = (k) => (
    <>
      <span>
        {rt(edit ? "rm.stamp.edit" : "rm.stamp.view", {
          time: stamp(meta?.modifiedOn, locale),
          who: meta?.modifiedBy || "—",
        })}
      </span>
      <span className="tabular-nums">
        tyroRM · {k + 1} / {n}
      </span>
    </>
  )

  useEffect(() => {
    const onKey = (e) => {
      if (e.defaultPrevented || e.altKey || e.metaKey || e.ctrlKey) return
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") go(i + 1)
      else if (e.key === "ArrowLeft" || e.key === "PageUp") go(i - 1)
      else if (e.key === "Home") go(0)
      else if (e.key === "End") go(n - 1)
      else if (e.key === "Escape" && !document.fullscreenElement) close()
      else if (e.key === "f" || e.key === "F") toggleFull()
      else return
      e.preventDefault()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [i, n, go, close])

  useEffect(() => {
    stageRef.current?.focus({ preventScroll: true })
  }, [])

  // Kâğıt açık temada basılır: koyu temadaysa yazdırma süresince açığa geçer.
  useEffect(() => {
    const root = document.documentElement
    let had = false
    const before = () => {
      had = root.classList.contains("dark")
      if (had) root.classList.remove("dark")
    }
    const after = () => {
      if (had) root.classList.add("dark")
    }
    window.addEventListener("beforeprint", before)
    window.addEventListener("afterprint", after)
    return () => {
      window.removeEventListener("beforeprint", before)
      window.removeEventListener("afterprint", after)
    }
  }, [])

  const Comp = SLIDES[i].Comp
  return (
    <>
      <style>{PRINT_CSS}</style>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={rt("rm.nav.present")}
        className="fixed inset-0 z-[60] flex flex-col bg-muted/60 backdrop-blur-sm dark:bg-black/70"
      >
        <div className="flex items-center gap-2 px-4 pt-3">
          <span className="text-sm font-semibold">
            tyro<span className="text-brand">RM</span>
          </span>
          <span className="truncate text-sm text-muted-foreground">· {rt(SLIDES[i].label)}</span>
          <span className="ms-auto flex items-center gap-1">
            <ExportButton variant="ghost" />
            <Button variant="ghost" size="sm" onClick={() => window.print()} className="gap-1.5">
              <HugeiconsIcon icon={PrinterIcon} className="size-4" strokeWidth={1.8} />
              <span className="hidden sm:inline">{rt("rm.present.print")}</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFull}
              aria-label={rt("rm.present.full")}
            >
              <HugeiconsIcon icon={FullScreenIcon} className="size-4" strokeWidth={1.8} />
            </Button>
            <Button variant="ghost" size="icon" onClick={close} aria-label={rt("rm.action.close")}>
              <HugeiconsIcon icon={Cancel01Icon} className="size-4" strokeWidth={2} />
            </Button>
          </span>
        </div>
        <div className="flex min-h-0 flex-1 items-center justify-center p-4">
          <div
            ref={stageRef}
            tabIndex={-1}
            aria-live="polite"
            aria-roledescription={rt("rm.present.slide")}
            aria-label={rt("rm.present.position", { i: i + 1, n, title: rt(SLIDES[i].label) })}
            className="@container/slide aspect-video w-[min(100%,calc((100dvh-9rem)*16/9))] overflow-hidden rounded-[1.25rem] bg-background shadow-xl outline-none motion-safe:animate-in motion-safe:fade-in-0"
            key={i}
          >
            <Comp ctx={ctx} foot={foot(i)} />
          </div>
        </div>
        <div className="flex items-center justify-center gap-3 pb-4">
          <Button variant="outline" size="sm" onClick={() => go(i - 1)} disabled={i === 0}>
            <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4 rtl:rotate-180" />
            {rt("rm.present.prev")}
          </Button>
          <div className="hidden gap-1.5 sm:flex" role="group" aria-label={rt("rm.present.thumbs")}>
            {SLIDES.map((s, k) => (
              <button
                key={s.key}
                type="button"
                onClick={() => go(k)}
                aria-current={k === i ? "step" : undefined}
                aria-label={rt(s.label)}
                className={cn(
                  "h-2 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
                  k === i ? "w-6 bg-brand" : "w-2 bg-foreground/25 hover:bg-foreground/40",
                )}
              />
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={() => go(i + 1)} disabled={i === n - 1}>
            {rt("rm.present.next")}
            <HugeiconsIcon icon={ArrowRight01Icon} className="size-4 rtl:rotate-180" />
          </Button>
        </div>
      </div>
      {createPortal(
        <div className="rm-print bg-white text-black" aria-hidden="true">
          {SLIDES.map((s, k) => (
            <div key={s.key} className="rm-print-page">
              <s.Comp ctx={ctx} foot={foot(k)} />
            </div>
          ))}
        </div>,
        document.body,
      )}
    </>
  )
}

function toggleFull() {
  if (document.fullscreenElement) document.exitFullscreen?.()
  else document.documentElement.requestFullscreen?.().catch(() => {})
}
