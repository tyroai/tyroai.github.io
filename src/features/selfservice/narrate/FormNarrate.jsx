import { useRef, useState } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import MagicWand01Icon from "@hugeicons/core-free-icons/MagicWand01Icon"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { CoachTour } from "@/components/tour/CoachTour"
import { countText } from "../kinds"
import { NarrateChips } from "./NarrateChips"
import { NarrateField } from "./NarrateField"
import { useNarrate } from "./useNarrate"

const KINDS = ["leave", "advance", "expense"]
// Alt şeritte düğmenin yalnız simgeye döndüğü kap genişlikleri. Ölçüldü (TR): ⓘ 48 + Anlat 93 +
// boşluklar 16 + birincil düğme — Devam 104, Gözden geçir 147, TYRO'ya gönder 166 — yani etiketli
// hâl en az 261 · 304 · 323 px ister; eşikler (312 · 336) pay bırakır. Sınıflar sabit yazılır
// (Tailwind dinamik adı üretmez).
const NARROW = {
  short: {
    box: "@max-[19.5rem]/foot:w-12 @max-[19.5rem]/foot:px-0",
    label: "@max-[19.5rem]/foot:sr-only",
  },
  long: {
    box: "@max-[21rem]/foot:w-12 @max-[21rem]/foot:px-0",
    label: "@max-[21rem]/foot:sr-only",
  },
}
const PLACEHOLDER = {
  advance: "selfService.narrate.placeholderAdvance",
  expense: "selfService.narrate.placeholderExpense",
}

/** Telefonda Anlat kutusunun arkası: bulanık, hafif donuk; çekmecenin de üstünde, kutunun altında. */
function Veil({ show }) {
  const calm = useReducedMotion()
  return createPortal(
    <AnimatePresence>
      {show && (
        <motion.div
          key="veil"
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: calm ? 0 : 0.2 }}
          className="pointer-events-auto fixed inset-0 z-50 bg-background/40 backdrop-blur-[6px]"
        />
      )}
    </AnimatePresence>,
    document.body,
  )
}

/**
 * Açık formun "Anlat"ı (izin, avans, masraf; Türkçe): basınca altında yazı kutusu ve "anladığım"
 * çipleri; Enter yalnız anlaşılan alanları doldurur, öteki alanlara dokunmaz (masrafta kalemleri
 * ekler, tek ve boş kalemin yerine geçer; başlık okunduysa ve açıklama boşsa onu da yazar).
 * Doldurunca kutu açık kalır: "n alan dolduruldu · Geri al" / "n kalem eklendi · Geri al" (geri al
 * yalnız o değişikliği geri koyar).
 * `placement`: "header" masaüstünde pencerenin başlığı (kutu aşağı açılır); "footer" telefonda alt
 * şerit (`RequestFooter`: ⓘ · Anlat · birincil; kutu yukarı açılır, her zaman aşağıda). Alt şeritte
 * düğme dar kapta (`@container/foot`) yalnız simge: `compact` hep (Geri yanında yer yok), `long`
 * birincil düğmenin adı uzunsa ("TYRO'ya gönder") daha geniş kapta bile; ad ekran okuyucuda kalır.
 * Telefonda kutu açıkken formun arkası bulanık ve hafif donuk (`Veil`): dikkat Anlat'ta kalsın;
 * bulanığa dokunmak kutuyu kapatır, altındaki düğmelere basmaz.
 */
export function FormNarrate({ kind, form, placement = "header", compact = false, long = false }) {
  const { t, locale } = useLocale()
  const foot = placement === "footer"
  const nar = useNarrate(kind)
  const [open, setOpen] = useState(false)
  const [done, setDone] = useState(null)
  const inputRef = useRef(null)
  if (!nar.enabled || !KINDS.includes(kind)) return null

  const apply = () => {
    const r = nar.result
    if (!r?.parts.length) return
    if (kind === "expense") {
      const res = form.expense.appendRows(r.rows)
      // Kişinin yazdığı açıklamanın üstüne yazılmaz.
      const title = r.head?.title && !String(form.head.title ?? "").trim() ? r.head.title : null
      if (title) form.setHead({ title })
      if (res.ids.length || title)
        setDone({ n: res.ids.length || 1, rows: res.ids.length ? res.prev : null, title })
    } else {
      const keys = Object.keys(r.values)
      setDone({ n: r.parts.length, prev: Object.fromEntries(keys.map((k) => [k, form.values[k]])) })
      form.patch(r.values)
    }
    nar.setText("")
  }
  const undo = () => {
    if (done?.title) form.setHead({ title: null })
    if (done?.rows) form.expense.restoreRows(done.rows)
    else if (done?.prev) form.patch(done.prev)
    setDone(null)
    inputRef.current?.focus()
  }
  const typing = nar.text.trim() !== ""

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (o) return
        setDone(null)
        nar.setText("")
      }}
    >
      {foot && <Veil show={open} />}
      <PopoverTrigger asChild>
        <button
          type="button"
          data-tour="req-narrate"
          className={cn(
            "inline-flex shrink-0 items-center rounded-full bg-brand/[0.08] font-semibold text-brand-ink transition hover:bg-brand/[0.13] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 data-[state=open]:bg-brand/[0.15]",
            foot
              ? "h-12 justify-center gap-2 text-[0.875rem]"
              : "relative me-1 h-8 gap-1.5 px-3 text-[0.8125rem] pointer-coarse:after:absolute pointer-coarse:after:-inset-1.5",
            foot && (compact ? "w-12 px-0" : cn("px-4", long ? NARROW.long.box : NARROW.short.box)),
          )}
        >
          <HugeiconsIcon
            icon={MagicWand01Icon}
            aria-hidden="true"
            className={foot ? "size-[1.125rem]" : "size-4"}
            strokeWidth={1.9}
          />
          <span
            className={cn(
              foot && (compact ? "sr-only" : long ? NARROW.long.label : NARROW.short.label),
            )}
          >
            {t("selfService.narrate.button")}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        side={foot ? "top" : "bottom"}
        align={foot ? "start" : "end"}
        sideOffset={foot ? 12 : 8}
        collisionPadding={12}
        aria-label={t("selfService.narrate.button")}
        // Sohbet rıhtımı Escape'i pencerede dinliyor: kutuyu kapatan Escape formu kapatmasın.
        onEscapeKeyDown={(e) => e.stopPropagation()}
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          inputRef.current?.focus()
        }}
        className="w-[min(26rem,calc(100vw-1.5rem))] gap-0 rounded-2xl p-2"
      >
        <NarrateField
          inputRef={inputRef}
          text={nar.text}
          setText={(v) => {
            nar.setText(v)
            if (v) setDone(null)
          }}
          onSubmit={apply}
          canSubmit={Boolean(nar.result?.parts.length)}
          submitLabel={t("selfService.narrate.apply")}
          placeholder={PLACEHOLDER[kind] ? t(PLACEHOLDER[kind]) : undefined}
        />
        {typing && <NarrateChips result={nar.result} className="px-1.5 pb-1 pt-2.5" />}
        <CoachTour id="narrate" when={open} />
        {!typing && done && (
          <p
            aria-live="polite"
            className="flex items-center gap-3 px-1.5 pb-1 pt-2.5 text-[0.8125rem] text-success-ink"
          >
            {countText(
              t,
              locale,
              done.rows ? "selfService.narrate.lines" : "selfService.advance.filled",
              done.n,
            )}
            <button
              type="button"
              onClick={undo}
              className="font-semibold text-brand-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              {t("selfService.leave.undo")}
            </button>
          </p>
        )}
      </PopoverContent>
    </Popover>
  )
}
