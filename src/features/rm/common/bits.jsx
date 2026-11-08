import { PersonAvatar } from "@/components/common/PersonAvatar"
import { fullName } from "@/features/rm/lib/peopleDirectory"
import { usePeoplePhotos } from "@/hooks/usePeoplePhotos"
import { cn } from "@/lib/utils"
import { useRmText } from "../data/useRmText"
import { useRm } from "../shell/RmContext"

/**
 * Kişi avatarı (toplantı kartındaki gibi): Graph'ta eşleşen kişinin fotoğrafı, yoksa ad-soyad
 * baş harfleri. `over`: kapasite üstü (ince kırmızı halka).
 */
export function Avatar({ name, size = "md", over = false, className }) {
  const { people } = useRm()
  const hit = people?.get(name)
  const photos = usePeoplePhotos(hit?.address ? [hit.address] : [])
  return (
    <PersonAvatar
      name={fullName(people, name)}
      photo={hit?.address ? photos.get(hit.address) : undefined}
      className={cn(
        "rounded-full",
        size === "sm"
          ? "size-6"
          : size === "lg"
            ? "size-11 [&>span]:text-sm"
            : "size-8 [&>span]:text-[0.6875rem]",
        over && "ring-2 ring-danger/70 ring-offset-1 ring-offset-background",
        className,
      )}
    />
  )
}

/** Üst üste avatarlar ve "+n". */
export function AvatarStack({ names, max = 4, overSet }) {
  const shown = names.slice(0, max)
  return (
    <span className="flex items-center -space-x-1.5 rtl:space-x-reverse">
      {shown.map((n) => (
        <Avatar
          key={n}
          name={n}
          size="sm"
          over={overSet?.has(n)}
          className="ring-2 ring-background"
        />
      ))}
      {names.length > max && (
        <span className="ms-2.5 text-xs tabular-nums text-muted-foreground">
          +{names.length - max}
        </span>
      )}
    </span>
  )
}

const SIGNAL_TONE = {
  overdue: "bg-danger/10 text-danger-ink",
  late: "bg-warning/14 text-warning-ink",
  unstaffed: "bg-warning/14 text-warning-ink",
  endingSoon: "bg-foreground/[0.06] text-foreground/75",
  startingSoon: "bg-brand-soft text-brand-on-soft",
}

/** Hesaplanan dikkat sinyali; yalnız dikkat isteyen renk alır. */
export function SignalChip({ signal, className }) {
  const { rt } = useRmText()
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center rounded-full px-2 text-[0.6875rem] font-medium whitespace-nowrap",
        SIGNAL_TONE[signal] ?? SIGNAL_TONE.endingSoon,
        className,
      )}
    >
      {rt(`rm.signal.${signal}`)}
    </span>
  )
}

/** Proje kimliği (panel başı): kategori renginde yumuşak kutu, içinde kod. */
export function ProjectBadge({ code, color }) {
  return (
    <span
      aria-hidden="true"
      className="grid size-11 place-items-center rounded-xl text-[0.6875rem] font-bold tracking-tight text-foreground/80"
      style={{
        background: `color-mix(in oklab, ${color || "var(--muted-foreground)"} 24%, transparent)`,
      }}
    >
      {String(code || "").slice(0, 4)}
    </span>
  )
}

/** Kategori rengi: küçük nokta (proje kimliği). */
export function ColorDot({ color, className }) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-block size-2.5 shrink-0 rounded-full", className)}
      style={{ background: color || "var(--muted-foreground)" }}
    />
  )
}

/** İnce ilerleme çubuğu (süre ya da işler). */
export function Meter({ value, tone = "brand", label }) {
  const pct = Math.max(0, Math.min(1, value || 0)) * 100
  return (
    <span
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      className="block h-1.5 w-full overflow-hidden rounded-full bg-foreground/[0.07]"
    >
      <span
        className={cn(
          "block h-full rounded-full",
          tone === "danger"
            ? "bg-danger"
            : tone === "warn"
              ? "bg-warning"
              : tone === "ok"
                ? "bg-success"
                : "bg-brand",
        )}
        style={{ width: `${pct}%` }}
      />
    </span>
  )
}
