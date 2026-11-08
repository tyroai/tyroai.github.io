import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import MagicWand01Icon from "@hugeicons/core-free-icons/MagicWand01Icon"
import PlusSignIcon from "@hugeicons/core-free-icons/PlusSignIcon"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { CoachTour } from "@/components/tour/CoachTour"
import { useNewKinds } from "./useNewKinds"
import { BottomSheet } from "@/components/common/BottomSheet"
import { Fab } from "@/components/common/Fab"
import { NarrateChips } from "../narrate/NarrateChips"
import { NarrateField } from "../narrate/NarrateField"
import { useNarrate } from "../narrate/useNarrate"
import { useDraftKinds } from "../request/useDraftKinds"

const EASE_OUT = "cubic-bezier(0.22, 1, 0.36, 1)"
const EASE_IN = "cubic-bezier(0.55, 0, 0.75, 0.2)"
// Simge geçişi: artı 45° dönüp × olur (tek simge).
// Tailwind 4'te rotate/scale ayrı CSS özellikleri: geçiş onları adıyla anar.
const ICON =
  "absolute inset-0 m-auto size-6 transition-[rotate,scale,opacity] duration-300 motion-reduce:transition-none"

/**
 * TELEFONDA YENİ TALEP — ortak yüzen düğme (`Fab`, her sayfada aynı; yeri `fab-dock`), yalnız artı. Basınca üç talep (izin · masraf · iş avansı) düğmenin üstünde
 * sağa yaslı haplar olarak sırayla yükselir (izin düğmeye en yakın), sayfa perdelenir, artı dönüp
 * × olur; perde, Escape ve seçim kapatır. Sayfanın kabı kap sorgulu (`@container`, sabit konumlu
 * çocuğun kabı olur): düğme `body`'ye taşınır. Kapalıyken haplar etkileşimsiz (`inert`).
 * Türkçede hapların en üstünde "Anlat": basınca alt çekmecede yazı kutusu (klavye açılınca çekmece
 * onun üstüne oturur: `BottomSheet`); "Formu aç" ya da Enter formu dolu açar. Masaüstündeki karşılığı `NewRequestWand`.
 */
export function NewRequestFab({ onNew }) {
  const { t } = useLocale()
  const drafts = useDraftKinds()
  const [open, setOpen] = useState(false)
  const [asking, setAsking] = useState(false)
  const fabRef = useRef(null)
  const inputRef = useRef(null)
  const kinds = useNewKinds()
  const canDelegate = kinds.some((k) => k.id === "delegate")
  const nar = useNarrate(null, { delegate: canDelegate })
  const label = t("selfService.new.label")

  // Escape kapatır, odak düğmeye döner; sohbet rıhtımına geçmez.
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key !== "Escape") return
      e.stopPropagation()
      setOpen(false)
      fabRef.current?.focus()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open])

  const pick = (kind) => {
    setOpen(false)
    onNew(kind, fabRef.current)
  }
  const closeAsk = () => {
    setAsking(false)
    nar.setText("")
  }
  const submit = () => {
    const r = nar.result
    if (!r?.kind) return
    closeAsk()
    onNew(r.kind, fabRef.current, { values: r.values, rows: r.rows, head: r.head, text: r.text })
  }
  const last = kinds.length - 1

  return createPortal(
    <div
      role="group"
      aria-label={label}
      // Kap dokunuşu geçirir: kapalı hapların kutusu sağ altta (başparmağın kaydırdığı yerde) sayfanın
      // kaymasını yutuyordu. Dokunuşu yalnız düğme, açıkken haplar ve perde alır.
      className="fab-dock pointer-events-none flex flex-col-reverse items-end gap-3"
    >
      <div
        aria-hidden="true"
        onClick={() => setOpen(false)}
        className={cn(
          "fixed inset-0 -z-10 bg-foreground/25 backdrop-blur-[2px] transition-[opacity,visibility] duration-300 motion-reduce:transition-none",
          open ? "pointer-events-auto visible opacity-100" : "invisible opacity-0",
        )}
      />
      <Fab
        ref={fabRef}
        docked={false}
        data-tour="ss-new"
        aria-expanded={open}
        label={label}
        title={open ? null : label}
        onClick={() => setOpen((v) => !v)}
        className="pointer-events-auto"
      >
        <HugeiconsIcon
          icon={PlusSignIcon}
          aria-hidden="true"
          strokeWidth={2.2}
          className={cn(ICON, open ? "rotate-45" : "rotate-0")}
        />
      </Fab>
      {kinds.map((item, i) => (
        <button
          key={item.id}
          type="button"
          inert={!open}
          aria-hidden={!open || undefined}
          onClick={() => pick(item.id)}
          className={cn(
            open && "pointer-events-auto",
            "inline-flex h-12 items-center gap-2.5 whitespace-nowrap rounded-full bg-brand-fill-deep pe-5 ps-4 text-[0.9375rem] font-semibold text-brand-on-brand shadow-[0_10px_24px_-10px_rgb(0_0_0/0.45)] outline-none ring-1 ring-inset ring-white/15 transition-[transform,opacity] focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-fill-deep motion-reduce:transition-none",
          )}
          style={{
            // Açılış: düğmeden sırayla yükselir; kapanış: ters sırayla düğmeye iner.
            transform: open ? "none" : `translateY(${(i + 1) * 14}px) scale(0.9)`,
            opacity: open ? 1 : 0,
            transformOrigin: "bottom right",
            transitionDuration: open ? "320ms" : "200ms",
            transitionTimingFunction: open ? EASE_OUT : EASE_IN,
            transitionDelay: `${(open ? i : last - i) * 40}ms`,
          }}
        >
          <HugeiconsIcon icon={item.cta} aria-hidden="true" className="size-5" strokeWidth={1.9} />
          {t(`selfService.cta.${item.id}`)}
          {/* Yarım kalan taslak: form onunla açılır. */}
          {drafts.includes(item.id) && (
            <span className="rounded-full bg-white/20 px-1.5 py-px text-[0.6875rem] font-semibold">
              {t("selfService.new.draft")}
            </span>
          )}
        </button>
      ))}
      {nar.enabled && (
        <button
          type="button"
          inert={!open}
          aria-hidden={!open || undefined}
          onClick={() => {
            setOpen(false)
            setAsking(true)
          }}
          className={cn(
            open && "pointer-events-auto",
            "inline-flex h-12 items-center gap-2.5 whitespace-nowrap rounded-full bg-background pe-5 ps-4 text-[0.9375rem] font-semibold text-foreground shadow-[0_10px_24px_-10px_rgb(0_0_0/0.45)] outline-none ring-1 ring-inset ring-black/10 transition-[transform,opacity] focus-visible:ring-2 focus-visible:ring-brand/40 motion-reduce:transition-none dark:ring-white/15",
          )}
          style={{
            transform: open ? "none" : `translateY(${(last + 2) * 14}px) scale(0.9)`,
            opacity: open ? 1 : 0,
            transformOrigin: "bottom right",
            transitionDuration: open ? "320ms" : "200ms",
            transitionTimingFunction: open ? EASE_OUT : EASE_IN,
            transitionDelay: `${open ? (last + 1) * 40 : 0}ms`,
          }}
        >
          <HugeiconsIcon
            icon={MagicWand01Icon}
            aria-hidden="true"
            className="size-5 text-brand-ink"
            strokeWidth={1.9}
          />
          {t("selfService.narrate.button")}
        </button>
      )}
      <BottomSheet
        open={asking}
        onOpenChange={(o) => (o ? setAsking(true) : closeAsk())}
        title={t("selfService.narrate.button")}
        returnFocus={() => fabRef.current}
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          inputRef.current?.focus()
        }}
        footer={
          <button
            type="button"
            disabled={!nar.result?.kind}
            onClick={submit}
            className="inline-flex h-12 w-full items-center justify-center rounded-full bg-brand-fill-deep text-[0.9375rem] font-semibold text-brand-on-brand transition disabled:opacity-40"
          >
            {t("selfService.narrate.open")}
          </button>
        }
      >
        <div className="space-y-3 pb-2">
          <NarrateField
            inputRef={inputRef}
            text={nar.text}
            setText={nar.setText}
            onSubmit={submit}
            examples={[
              t("selfService.narrate.placeholder"),
              t("selfService.narrate.placeholderAdvance"),
              t("selfService.narrate.placeholderExpense"),
              ...(canDelegate ? [t("selfService.narrate.placeholderDelegate")] : []),
            ]}
          />
          {nar.text.trim() && <NarrateChips result={nar.result} showForm />}
          <CoachTour id="narrate" when={asking} />
        </div>
      </BottomSheet>
    </div>,
    document.body,
  )
}
