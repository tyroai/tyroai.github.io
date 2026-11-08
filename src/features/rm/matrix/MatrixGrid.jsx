import { Fragment } from "react"
import { num, pct } from "@/features/rm/lib/format"
import { colTitle } from "@/features/rm/lib/matrix"
import { cn } from "@/lib/utils"
import { useRmText } from "../data/useRmText"
import { CellTip } from "../common/tree"
import { useCellTip } from "../common/useTree"
import { onGridKey } from "./gridKeys"
import { MatrixHead } from "./MatrixHead"
import { GroupRow, MemberRow } from "./MatrixRows"
import { useCrosshair } from "./useCrosshair"

const CORNER = {
  project: "rm.matrix.colProject",
  team: "rm.matrix.colTeam",
  person: "rm.matrix.colPerson",
}

/**
 * Matris tablosu: katlı yapışkan başlık, yapışkan ilk sütun ve sağda Σ. Grup (proje, ekip ya da
 * kişi) aç/kapa; hücreler ısı tonunda, üstüne gelince satır ve sütun vurgulanır, ipucu tek balonda.
 * `edit` (düzenleyici): { cells, editing, start, save, cancel, colLabel } — hücreye yazma, ⋮ menüleri.
 * `team`: seçili ekip filtresi (ekip bazlıda ekibin adına basınca açılıp kapanır, `onTeam`).
 */
export function MatrixGrid({
  mode,
  zoom,
  cols,
  groups,
  caption,
  today,
  collapse,
  full,
  onProject,
  onPerson,
  onTeam,
  team,
  edit,
}) {
  const { rt, locale } = useRmText()
  const { tip, bind } = useCellTip()
  const { scope, styleRef, onMouseOver: crossOver, onMouseLeave: crossLeave } = useCrosshair()
  const todayIdx = cols.findIndex((c) => today >= c.from && today <= c.to)
  const n1 = (h) => num(h, locale, 1)
  const hours = (h) => rt("rm.unit.hours", { n: n1(h) })
  const share = (h, cap) => (cap ? pct(h / cap, locale) : "—")
  const flags = (c) =>
    [
      c.manual && rt("rm.matrix.manual"),
      c.closing && rt("rm.matrix.closing"),
      c.countryHoliday === "Tatil" && rt("rm.matrix.countryHoliday"),
      c.afterEnd && rt("rm.matrix.afterEnd"),
    ].filter(Boolean)
  // Boş hücre balon açmaz: yalnız saati ya da işareti olan.
  const tipOf = (title, i, parts) => {
    const list = parts.filter(Boolean)
    return list.length
      ? { title, sub: [colTitle(cols[i], zoom, locale, rt), ...list].join(" · ") }
      : null
  }
  const capText = (h, cap, key) => rt(key, { h: n1(h), c: n1(cap), p: share(h, cap) })
  const ctx = {
    mode,
    cols,
    todayIdx,
    locale,
    rt,
    tipOf,
    capText,
    hours,
    flags,
    edit,
    collapse,
    team,
    onProject,
    onPerson,
    onTeam,
  }

  return (
    <div
      className={cn(
        "min-w-0 scroll-ps-72 scroll-pe-16 scroll-pt-28 overflow-auto rounded-2xl border border-border/60 [scrollbar-width:thin]",
        // Sayfa esnek sütun: kaydırma kabı kendiliğinden sıfıra büzülür; telefonda en az yükseklik.
        full ? "min-h-0 flex-1" : "max-h-[70dvh] min-h-[min(26rem,62dvh)]",
      )}
      onMouseOver={(e) => {
        bind.onMouseOver(e)
        crossOver(e)
      }}
      onMouseLeave={(e) => {
        bind.onMouseLeave(e)
        crossLeave(e)
      }}
      onScroll={bind.onScroll}
    >
      <style ref={styleRef} />
      <table
        data-mx={scope}
        className="w-max min-w-full border-separate border-spacing-0 text-sm"
        aria-readonly={edit ? undefined : "true"}
        onKeyDown={edit?.cells ? onGridKey : undefined}
      >
        <caption className="sr-only">{caption}</caption>
        <MatrixHead cols={cols} zoom={zoom} todayIdx={todayIdx} corner={rt(CORNER[mode])} />
        <tbody>
          {groups.map((g) => (
            <Fragment key={g.key}>
              <GroupRow g={g} ctx={ctx} />
              {!collapse.closed.has(g.key) &&
                g.rows.map((row, k) => (
                  <MemberRow
                    key={row.key}
                    g={g}
                    row={row}
                    last={k === g.rows.length - 1}
                    ctx={ctx}
                  />
                ))}
            </Fragment>
          ))}
        </tbody>
      </table>
      <CellTip tip={tip} />
    </div>
  )
}
