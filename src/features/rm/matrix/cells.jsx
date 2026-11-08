import { num } from "@/features/rm/lib/format"
import { cn } from "@/lib/utils"

// Isı: saatin kişinin o sütundaki kapasitesine oranı. `over`: kişi bütün projeleriyle aşımda
// (proje bazlıda kişinin toplam satırı yok): zemin ısıda kalır, rakam kırmızı — tablo kızarmaz.
function memberTone(c, over) {
  if (!c.h) return null
  const x = c.cap ? c.h / c.cap : 1
  const heat = x >= 0.75 ? "bg-brand/[0.16]" : x >= 0.4 ? "bg-brand/[0.1]" : "bg-brand/[0.05]"
  return over ? `${heat} font-semibold text-danger-ink` : heat
}

function totalTone(c) {
  if (!c.h || !c.cap) return null
  const x = c.h / c.cap
  if (x > 1.0001) return "bg-danger/12 font-semibold text-danger-ink"
  if (x >= 0.85) return "bg-warning/16 text-warning-ink"
  return "bg-brand/[0.07]"
}

const BASE = "relative h-9 min-w-11 border-b border-border/40 px-1 text-center text-xs tabular-nums"

/** Düzenleyicide hücre: tıklayınca ya da rakama basınca yerinde sayı alanı (şartname v5.8). */
function CellEditor({ edit, cur }) {
  if (edit.active) {
    return (
      <input
        type="number"
        min={0}
        max={24}
        inputMode="numeric"
        autoFocus
        defaultValue={edit.init ?? (cur || "")}
        aria-label={edit.label}
        onFocus={(e) => edit.init == null && e.target.select()}
        onKeyDown={(e) => {
          if (e.key === "Enter") edit.commit(e.currentTarget.value)
          else if (e.key === "Escape") edit.cancel()
        }}
        onBlur={(e) => edit.commit(e.currentTarget.value)}
        className="absolute inset-0.5 z-10 w-[calc(100%-0.25rem)] rounded-md border border-brand/60 bg-background text-center text-xs tabular-nums outline-none ring-2 ring-brand/25 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
      />
    )
  }
  return (
    <button
      type="button"
      data-cell={edit.key}
      aria-label={edit.label}
      onClick={() => edit.start(null)}
      onKeyDown={(e) => {
        if (/^[0-9]$/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault()
          edit.start(e.key)
        }
      }}
      className="absolute inset-0 rounded-sm hover:bg-brand-soft/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/50"
    />
  )
}

/** Proje × kişi hücresi: saat, ısı tonu, gün görünümünde durum işaretleri; ipucu `tip` (boşsa yok). */
export function Cell({ c, col, i, today, over, locale, rt, tip, edit }) {
  const holiday = col.type === "Tatil"
  const tone = memberTone(c, over)
  return (
    <td
      data-col={i}
      data-tip={tip?.title}
      data-tip-sub={tip?.sub}
      className={cn(
        BASE,
        tone,
        !tone && holiday && "bg-foreground/[0.05]",
        !tone && !holiday && today && "bg-brand/[0.035]",
        c.countryHoliday === "Tatil" &&
          "bg-[repeating-linear-gradient(135deg,transparent_0_4px,var(--border)_4px_5px)]",
        c.afterEnd && "outline-1 -outline-offset-2 outline-dashed outline-warning",
      )}
    >
      {c.h > 0 ? (
        num(c.h, locale, 1)
      ) : c.closing ? (
        <span className="text-muted-foreground">{rt("rm.matrix.closingMark")}</span>
      ) : (
        ""
      )}
      {c.manual && (
        <span
          aria-hidden="true"
          className="absolute right-1 top-1 size-1.5 rounded-full bg-brand"
        />
      )}
      {edit ? <CellEditor edit={edit} cur={c.h} /> : null}
    </td>
  )
}

/**
 * Kişi ya da ekip toplamı: kapasiteye göre ısı; aşan sütun "9/5" biçiminde. `soft`: üye satırı
 * (ince yazı). `bare`: yalnız saat (ekip toplamında kapasite uzun; ton ve ipucu söyler).
 */
export function TotalCell({ c, col, i, today, locale, mark, tip, soft, bare }) {
  const tone = totalTone(c)
  return (
    <td
      data-col={i}
      data-tip={tip?.title}
      data-tip-sub={tip?.sub}
      className={cn(
        BASE,
        soft ? "text-foreground/85" : "font-semibold",
        tone,
        !tone && col.type === "Tatil" && "bg-foreground/[0.05]",
        !tone && today && "bg-brand/[0.035]",
      )}
    >
      {c.h > 0
        ? c.h > c.cap + 1e-9 && !bare
          ? `${num(c.h, locale, 1)}/${num(c.cap, locale, 1)}`
          : num(c.h, locale, 1)
        : c.closing
          ? mark
          : ""}
    </td>
  )
}

/** Proje toplamı (proje bazlı grup satırı): kalın, tonsuz. */
export function SumCell({ h, col, i, today, locale, tip }) {
  return (
    <td
      data-col={i}
      data-tip={tip?.title}
      data-tip-sub={tip?.sub}
      className={cn(
        BASE,
        "font-semibold text-foreground/85",
        col.type === "Tatil" && "bg-foreground/[0.05]",
        today && col.type !== "Tatil" && "bg-brand/[0.035]",
      )}
    >
      {h > 0 ? num(h, locale, 1) : ""}
    </td>
  )
}

/** Satırın pencere toplamı (sağda yapışkan Σ sütunu). */
export function RowTotal({ h, locale, strong }) {
  return (
    <td
      className={cn(
        "sticky end-0 z-[5] h-9 min-w-16 border-b border-s border-border/40 bg-background px-2 text-end text-xs tabular-nums",
        strong ? "font-semibold" : "text-foreground/75",
      )}
    >
      {h > 0 ? num(h, locale, 1) : ""}
    </td>
  )
}
