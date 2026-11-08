import { HugeiconsIcon } from "@hugeicons/react"
import { TEAM_ALIASES } from "@/features/rm/lib/teamAliases"
import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon"
import ArrowUp01Icon from "@hugeicons/core-free-icons/ArrowUp01Icon"
import Delete02Icon from "@hugeicons/core-free-icons/Delete02Icon"
import LockIcon from "@hugeicons/core-free-icons/LockIcon"
import { Input } from "@/components/ui/input"
import { LEVELS, TEAM_GROUPS } from "@/features/rm/lib/edit/setup"
import { cn } from "@/lib/utils"
import { useRmText } from "../../data/useRmText"
import { CELL } from "../ui"

const ICON =
  "grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:opacity-30 pointer-coarse:size-11"
const NATIVE =
  "h-9 rounded-md border border-input bg-input/20 px-2 text-sm dark:bg-input/30 pointer-coarse:h-11"

/** Türe göre ek alanlar: ekipte grup ve renk, unvanda seviye, ülkede İngilizce ad ve saat dilimi. */
export function ExtraFields({ kind, x, onSet, label }) {
  const { rt } = useRmText()
  if (kind === "teams") {
    return (
      <>
        <select
          value={x.grp || "cons"}
          onChange={(e) => onSet("grp", e.target.value)}
          aria-label={`${label}: ${rt("rm.set.group")}`}
          className={NATIVE}
        >
          {TEAM_GROUPS.map((g) => (
            <option key={g} value={g}>
              {rt(`rm.set.grp.${g}`)}
            </option>
          ))}
        </select>
        <input
          type="color"
          value={x.color || "#9CC3E6"}
          onChange={(e) => onSet("color", e.target.value)}
          aria-label={`${label}: ${rt("rm.setup.color")}`}
          className="h-9 w-12 shrink-0 cursor-pointer rounded-md border border-input bg-transparent p-1 pointer-coarse:h-11"
        />
      </>
    )
  }
  if (kind === "titles") {
    return (
      <select
        value={x.lvl || "L1"}
        onChange={(e) => onSet("lvl", e.target.value)}
        aria-label={`${label}: ${rt("rm.setup.level")}`}
        className={NATIVE}
      >
        {LEVELS.map((l) => (
          <option key={l} value={l}>
            {l}
          </option>
        ))}
      </select>
    )
  }
  if (kind === "countries") {
    return (
      <>
        <Input
          value={x.en || ""}
          onChange={(e) => onSet("en", e.target.value)}
          aria-label={`${label}: ${rt("rm.setup.nameEn")}`}
          placeholder={rt("rm.setup.nameEn")}
          className={cn(CELL, "min-w-28")}
        />
        <Input
          value={x.tz || ""}
          list="rm-setup-tz"
          onChange={(e) => onSet("tz", e.target.value.trim())}
          aria-label={`${label}: ${rt("rm.setup.tz")}`}
          placeholder="Europe/Istanbul"
          className={cn(CELL, "min-w-36")}
        />
      </>
    )
  }
  return null
}

/** Kurulum listesinin satırı: ad, ek alanlar, kullanım, sıra ve sil. Sistem kaydı kilitli. */
export function ListRow({ kind, x, first, last, used, locked, error, d }) {
  const { rt } = useRmText()
  const label = kind === "countries" ? x.code || "—" : x.name || "—"
  // Birleşen ekibin kaynağı görünen adla: "AI · Danışman" (kayıttaki ad değişmez).
  const alias = kind === "teams" ? TEAM_ALIASES[x.orig ?? x.name] : null
  const g = x.grp || "cons"
  return (
    <li
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-xl px-2 py-1.5",
        error ? "bg-danger/[0.06] ring-1 ring-inset ring-danger/30" : "hover:bg-foreground/[0.02]",
      )}
    >
      {kind === "countries" ? (
        <Input
          value={x.code}
          maxLength={2}
          disabled={x.orig != null}
          onChange={(e) => d.set(x.k, "code", e.target.value.toUpperCase())}
          aria-label={rt("rm.setup.code")}
          className={cn(CELL, "w-16 uppercase")}
        />
      ) : null}
      <Input
        value={alias ? `${alias} · ${rt(`rm.set.grp.${g}`)}` : x.name || ""}
        disabled={locked}
        onChange={(e) => d.set(x.k, "name", e.target.value)}
        aria-label={`${label}: ${rt("rm.setup.name")}`}
        aria-invalid={error ? true : undefined}
        className={cn(CELL, "min-w-36 flex-1")}
      />
      <ExtraFields kind={kind} x={x} label={label} onSet={(f, v) => d.set(x.k, f, v)} />
      {locked ? (
        <span title={rt("rm.setup.locked")} className="text-muted-foreground">
          <HugeiconsIcon icon={LockIcon} className="size-4" strokeWidth={1.8} />
          <span className="sr-only">{rt("rm.setup.locked")}</span>
        </span>
      ) : null}
      <span className="min-w-20 text-xs tabular-nums text-foreground/65">
        {used ? rt("rm.setup.used", { n: used }) : rt("rm.setup.unused")}
      </span>
      <div className="ms-auto flex items-center">
        <button
          type="button"
          className={ICON}
          disabled={first}
          onClick={() => d.move(x.k, -1)}
          aria-label={rt("rm.todo.up")}
        >
          <HugeiconsIcon icon={ArrowUp01Icon} className="size-4" strokeWidth={2} />
        </button>
        <button
          type="button"
          className={ICON}
          disabled={last}
          onClick={() => d.move(x.k, 1)}
          aria-label={rt("rm.setup.down")}
        >
          <HugeiconsIcon icon={ArrowDown01Icon} className="size-4" strokeWidth={2} />
        </button>
        <button
          type="button"
          className={cn(ICON, "hover:bg-danger/10 hover:text-danger-ink")}
          disabled={locked}
          onClick={() => d.remove(x.k)}
          aria-label={rt("rm.setup.removeOf", { n: label })}
          title={locked ? rt("rm.setup.locked") : rt("rm.todo.remove")}
        >
          <HugeiconsIcon icon={Delete02Icon} className="size-4" strokeWidth={1.8} />
        </button>
      </div>
      {error ? (
        <p className="w-full px-1 text-xs text-danger-ink">{rt(`rm.setup.err.${error}`)}</p>
      ) : null}
    </li>
  )
}
