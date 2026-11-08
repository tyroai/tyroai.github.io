import { HugeiconsIcon } from "@hugeicons/react"
import { TONES } from "@/features/selfservice/request/field/tones"
import { cn } from "@/lib/utils"

// Slaytlar 16:9 tuvalde `cqw` ile ölçeklenir: laptop, projeksiyon, iPad ve yazdırmada aynı oran.

/** Slayt çerçevesi: köşede yumuşak marka ışığı, kaş, başlık, istenirse tek satır alt başlık. */
export function Frame({ eyebrow, title, sub, foot, children }) {
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden p-[4cqw]">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -end-[10cqw] -top-[16cqw] size-[36cqw] rounded-full bg-brand/[0.07] blur-[5cqw] print:hidden"
      />
      <header className="relative">
        <p className="inline-flex items-center gap-[0.7cqw] text-[1.05cqw] font-semibold uppercase tracking-[0.16em] text-brand">
          <span aria-hidden="true" className="size-[0.7cqw] rounded-full bg-brand" />
          {eyebrow}
        </p>
        <h2 className="mt-[0.9cqw] text-[3cqw] font-semibold leading-[1.12] tracking-[-0.025em]">
          {title}
        </h2>
        {sub ? <p className="mt-[0.7cqw] text-[1.4cqw] text-muted-foreground">{sub}</p> : null}
      </header>
      <div className="relative mt-[2.2cqw] min-h-0 flex-1">{children}</div>
      <footer className="relative mt-[1.4cqw] flex items-center justify-between text-[0.95cqw] text-muted-foreground">
        {foot}
      </footer>
    </div>
  )
}

/** Tonlu ikon kutusu (Self Servis'in tonları), slayt ölçüsünde. */
export function SlideIcon({ icon, tone = "brand", className }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-[2.6cqw] shrink-0 place-items-center rounded-[0.7cqw]",
        TONES[tone] ?? TONES.brand,
        className,
      )}
    >
      <HugeiconsIcon icon={icon} className="size-[1.45cqw]" strokeWidth={1.8} />
    </span>
  )
}

/** Büyük sayı kartı: ikon + ad, değer, tek satır açıklama. */
export function Stat({ icon, tone, label, value, sub, warn }) {
  return (
    <div className="flex min-w-0 flex-col rounded-[1.4cqw] bg-foreground/[0.035] p-[1.8cqw] dark:bg-white/[0.05]">
      <span className="flex min-w-0 items-center gap-[0.8cqw]">
        <SlideIcon icon={icon} tone={tone} />
        <span className="truncate text-[1.2cqw] font-medium text-foreground/70">{label}</span>
      </span>
      <span
        className={cn(
          "mt-[1.3cqw] truncate text-[3.8cqw] font-semibold leading-none tabular-nums tracking-[-0.03em]",
          warn && "text-danger-ink",
        )}
      >
        {value}
      </span>
      {sub ? (
        <span className="mt-[0.9cqw] line-clamp-2 text-[1.15cqw] leading-snug text-muted-foreground">
          {sub}
        </span>
      ) : null}
    </div>
  )
}

/**
 * Yatay çubuk satırı: sol etiket (ve alt satır), çubuk, sağda değer. `labelW`: etiket sütunu
 * (proje adı gibi uzun etiketlerde geniş); etiket iki satıra kadar kırılır, kesilmez.
 */
export function BarRow({
  lead,
  label,
  sub,
  value,
  color,
  right,
  track = true,
  tone,
  labelW = "15cqw",
}) {
  return (
    <li
      className="grid items-center gap-[1.2cqw] py-[0.55cqw]"
      style={{ gridTemplateColumns: `minmax(0,${labelW}) 1fr auto` }}
    >
      <span className="flex min-w-0 items-center gap-[0.8cqw]">
        {lead}
        <span className="min-w-0">
          <span className="line-clamp-2 text-[1.3cqw] font-medium leading-tight">{label}</span>
          {sub ? (
            <span className="block truncate text-[1cqw] text-muted-foreground">{sub}</span>
          ) : null}
        </span>
      </span>
      <span
        className={cn(
          "relative h-[1.3cqw] overflow-hidden rounded-full",
          track && "bg-foreground/[0.06]",
        )}
      >
        <span
          className={cn("absolute inset-y-0 start-0 rounded-full", !color && (tone || "bg-brand"))}
          style={{
            width: `${Math.max(0, Math.min(1, value)) * 100}%`,
            ...(color ? { background: color } : null),
          }}
        />
      </span>
      <span className="min-w-[6cqw] text-end text-[1.2cqw] tabular-nums">{right}</span>
    </li>
  )
}

const DOT = {
  danger: "bg-danger",
  warn: "bg-warning",
  ok: "bg-success",
  brand: "bg-brand",
}

/** Ana mesaj satırı: durum noktası + cümle (rakamlar kalın gelir). */
export function Message({ tone, children }) {
  return (
    <li className="flex items-start gap-[1.1cqw] rounded-[1.1cqw] bg-foreground/[0.035] px-[1.5cqw] py-[1.1cqw] text-[1.4cqw] leading-snug dark:bg-white/[0.05]">
      <span
        aria-hidden="true"
        className={cn("mt-[0.55cqw] size-[0.9cqw] shrink-0 rounded-full", DOT[tone] ?? DOT.brand)}
      />
      <span className="min-w-0">{children}</span>
    </li>
  )
}

/** Küçük başlık (slayt içi bölüm). */
export function Label({ children, aside }) {
  return (
    <p className="mb-[0.8cqw] flex items-baseline justify-between gap-[1cqw] text-[1.15cqw] font-semibold uppercase tracking-[0.1em] text-foreground/60">
      <span>{children}</span>
      {aside ? <span className="tabular-nums normal-case tracking-normal">{aside}</span> : null}
    </p>
  )
}
