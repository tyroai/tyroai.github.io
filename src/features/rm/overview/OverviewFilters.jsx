import { useMemo } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import Flag02Icon from "@hugeicons/core-free-icons/Flag02Icon"
import Folder01Icon from "@hugeicons/core-free-icons/Folder01Icon"
import GlobalIcon from "@hugeicons/core-free-icons/GlobalIcon"
import Task01Icon from "@hugeicons/core-free-icons/Task01Icon"
import UserGroupIcon from "@hugeicons/core-free-icons/UserGroupIcon"
import { InfoTip } from "@/components/common/InfoTip"
import { SegmentedControl } from "@/components/common/SegmentedControl"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { catLabel, num } from "@/features/rm/lib/format"
import { ovCount, OV_PERIODS } from "@/features/rm/lib/overviewFilter"
import { cn } from "@/lib/utils"
import { useRmText } from "../data/useRmText"
import { ColorDot } from "../common/bits"
import { useRm } from "../shell/RmContext"

const ICONS = {
  teams: UserGroupIcon,
  cats: Folder01Icon,
  prios: Flag02Icon,
  statuses: Task01Icon,
  countries: GlobalIcon,
}

/** Çok seçimli filtre hapı: seçilince marka tonunda dolar, yanında × belirir. */
function MultiChip({ k, label, options, value, onChange }) {
  const { rt, locale } = useRmText()
  const active = value.length > 0
  const first = options.find((o) => o.value === value[0])
  const shown = active
    ? `${first?.label ?? value[0]}${value.length > 1 ? ` +${value.length - 1}` : ""}`
    : label
  return (
    <span
      className={cn(
        // Çerçeve halka (ring): yer kaplamaz, dokunma hedefi tam 44 px kalır.
        "inline-flex h-9 max-w-full shrink-0 items-stretch overflow-hidden rounded-full text-[0.8125rem] ring-1 ring-inset transition-colors pointer-coarse:h-11",
        active
          ? "bg-brand/[0.08] font-medium ring-brand/40"
          : "bg-card ring-border hover:ring-foreground/25",
      )}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={active ? rt("rm.of.chipActive", { label, value: shown }) : label}
            className="inline-flex min-w-0 items-center gap-1.5 ps-3 pe-2.5 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40"
          >
            <HugeiconsIcon
              icon={ICONS[k]}
              className={cn("size-3.5 shrink-0", active ? "text-brand" : "text-foreground/60")}
              strokeWidth={1.9}
            />
            <span className="max-w-40 truncate">{shown}</span>
            <HugeiconsIcon
              icon={ArrowDown01Icon}
              className="size-3 shrink-0 opacity-60"
              strokeWidth={2}
            />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="max-h-80 w-64 overflow-y-auto p-1.5"
          onEscapeKeyDown={(e) => e.stopPropagation()}
        >
          {options.map((o) => (
            <DropdownMenuCheckboxItem
              key={o.value}
              checked={value.includes(o.value)}
              // Menü açık kalsın: birden çok değer seçilir.
              onSelect={(e) => e.preventDefault()}
              onCheckedChange={(on) =>
                onChange(on ? [...value, o.value] : value.filter((v) => v !== o.value))
              }
              className="gap-2 pointer-coarse:min-h-11"
            >
              {o.color !== undefined && <ColorDot color={o.color} />}
              <span className="min-w-0 flex-1 truncate">{o.label}</span>
              <span className="text-xs tabular-nums text-muted-foreground">{num(o.n, locale)}</span>
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {active && (
        <button
          type="button"
          onClick={() => onChange([])}
          aria-label={rt("rm.of.clearOne", { label })}
          className="grid w-8 place-items-center border-s border-brand/25 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40 pointer-coarse:w-10"
        >
          <HugeiconsIcon icon={Cancel01Icon} className="size-3" strokeWidth={2.2} />
        </button>
      )}
    </span>
  )
}

/**
 * Genel Bakış filtresi: dönem (3 · 6 · 12 ay) ve çok seçimli ekip, kategori, öncelik, durum,
 * ülke. Her seçenekte kaç proje (ekipte kaç kişi) olduğu yazar.
 */
export function OverviewFilters({ ov }) {
  const { rt, locale } = useRmText()
  const { data, derived, phone } = useRm()
  const f = ov.filter
  const st = data.st
  const options = useMemo(() => {
    const count = (pick) => {
      const m = new Map()
      for (const r of derived.rows) for (const v of [pick(r)].flat()) m.set(v, (m.get(v) || 0) + 1)
      return m
    }
    const byTeam = new Map()
    for (const r of st.resources) byTeam.set(r.team, (byTeam.get(r.team) || 0) + 1)
    const cats = count((r) => r.cats)
    const prios = count((r) => r.prio)
    const statuses = count((r) => r.status)
    const countries = count((r) => r.country)
    const cName = new Map((st.lk?.countries || []).map((c) => [c.code, c.name]))
    const cColor = new Map((st.pcats || []).map((c) => [c.name, c.color || null]))
    return {
      teams: ov.options.teams.map((t) => ({ value: t, label: t, n: byTeam.get(t) || 0 })),
      cats: ov.options.cats.map((c) => ({
        value: c,
        label: catLabel(c),
        color: cColor.get(c) ?? null,
        n: cats.get(c) || 0,
      })),
      prios: ov.options.prios.map((p) => ({ value: p, label: p, n: prios.get(p) || 0 })),
      statuses: ov.options.statuses.map((s) => ({ value: s, label: s, n: statuses.get(s) || 0 })),
      countries: ov.options.countries.map((c) => ({
        value: c,
        label: cName.get(c) ? `${cName.get(c)} (${c})` : c,
        n: countries.get(c) || 0,
      })),
    }
  }, [derived.rows, st, ov.options])
  const projectFilter = f.cats.length + f.prios.length + f.statuses.length + f.countries.length > 0

  const period = (
    <SegmentedControl
      label={rt("rm.capacity.period")}
      value={f.period}
      onChange={(p) => ov.setFilter({ period: p === "6" ? null : p })}
      options={OV_PERIODS.map((p) => ({ value: p, label: rt(`rm.capacity.period.${p}`) }))}
    />
  )
  const chips = (
    <>
      {Object.keys(ICONS).map((k) => (
        <MultiChip
          key={k}
          k={k}
          label={rt(`rm.of.${k}`)}
          options={options[k]}
          value={f[k]}
          onChange={(v) => ov.setFilter({ [k]: v })}
        />
      ))}
      {ovCount(f) > 0 && (
        <button
          type="button"
          onClick={ov.clear}
          className="h-9 shrink-0 rounded-full px-3 text-[0.8125rem] text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:h-11"
        >
          {rt("rm.of.clear")}
        </button>
      )}
    </>
  )
  const result = (
    <span className="ms-auto inline-flex shrink-0 items-center gap-1 text-xs tabular-nums text-muted-foreground">
      {rt("rm.of.result", { p: num(ov.rows.length, locale), n: num(ov.people.length, locale) })}
      {projectFilter && <InfoTip text={rt("rm.of.peopleNote")} />}
    </span>
  )
  // Telefonda iki satır: dönem ve sonuç; altında yana kayan haplar (gövde alanı kartlara).
  if (phone) {
    return (
      <div role="group" aria-label={rt("rm.of.label")} className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          {period}
          {result}
        </div>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 py-0.5 no-scrollbar">{chips}</div>
      </div>
    )
  }
  return (
    <div role="group" aria-label={rt("rm.of.label")} className="flex flex-wrap items-center gap-2">
      {period}
      <span aria-hidden="true" className="mx-1 h-5 w-px bg-border" />
      {chips}
      {result}
    </div>
  )
}
