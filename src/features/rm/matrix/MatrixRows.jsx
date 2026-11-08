import { Avatar, ColorDot } from "../common/bits"
import { GroupToggle, TeamMark, TreeLine } from "../common/tree"
import { Cell, RowTotal, SumCell, TotalCell } from "./cells"
import { RowMenu } from "./RowMenu"

const sum = (list) => list.reduce((s, x) => s + (x || 0), 0)

// Etiket düğmesi: dokunmatikte satıra sığmayan yüksekliğe görünmez pay (44 px).
const PICK =
  "relative flex min-w-0 items-center gap-2 rounded-md text-start hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:after:absolute pointer-coarse:after:-inset-y-3 pointer-coarse:after:inset-x-0"

const FOLD = {
  project: ["rm.matrix.foldPeople", "rm.matrix.unfoldPeople"],
  team: ["rm.matrix.foldPeople", "rm.matrix.unfoldPeople"],
  person: ["rm.matrix.foldProjects", "rm.matrix.unfoldProjects"],
}

/**
 * Grup satırı: proje (proje toplamı), ekip (ekibin toplamı ve kapasitesi) ya da kişi (kişinin
 * toplamı ve kapasitesi). Ada basınca proje ya da kişi paneli açılır; ekipte ekibe filtreler.
 * `ctx`: MatrixGrid'in ortak araçları (mod, sütunlar, ipucu, düzenleyici, aç/kapa, seçiciler).
 */
export function GroupRow({ g, ctx }) {
  const { mode, cols, todayIdx, locale, rt, tipOf, capText, hours, flags, edit, collapse } = ctx
  const open = !collapse.closed.has(g.key)
  const byProject = mode === "project"
  const top = byProject ? g.totals : g.cells.map((c) => c.h)
  const pick = {
    project: () => ctx.onProject(g.key),
    person: () => ctx.onPerson(g.key),
    team: () => ctx.onTeam(g.team),
  }[mode]
  return (
    <tr className="bg-foreground/[0.025] hover:bg-foreground/[0.04]">
      <th
        scope="row"
        className="sticky start-0 z-10 border-b border-e border-border/50 bg-[color-mix(in_oklch,var(--background)_96%,var(--foreground))] px-2 py-1 text-start font-semibold"
      >
        <div className="flex items-center gap-1">
          {g.rows.length > 0 ? (
            <GroupToggle
              open={open}
              onClick={() => collapse.toggle(g.key)}
              label={rt(FOLD[mode][open ? 0 : 1], { name: g.label })}
            />
          ) : (
            <span aria-hidden="true" className="w-7 shrink-0" />
          )}
          <button
            type="button"
            onClick={pick}
            aria-pressed={mode === "team" ? ctx.team === g.team : undefined}
            className={`${PICK} max-w-36 @[40rem]/rm:max-w-60`}
          >
            {byProject ? (
              <ColorDot color={g.color} />
            ) : mode === "team" ? (
              <TeamMark
                name={g.label}
                index={g.index}
                className="size-6 rounded-md text-[0.5625rem]"
              />
            ) : (
              <Avatar name={g.avatar ?? g.label} size="sm" />
            )}
            <span className="min-w-0 truncate">{g.label}</span>
          </button>
          {edit && mode !== "team" ? (
            <RowMenu
              pid={byProject ? g.key : null}
              rid={byProject ? null : g.key}
              label={g.label}
            />
          ) : null}
        </div>
        {g.sub && (
          <span className="block truncate ps-8 text-[0.6875rem] font-normal text-foreground/65">
            {g.sub}
          </span>
        )}
      </th>
      {byProject
        ? g.totals.map((h, i) => (
            <SumCell
              key={cols[i].key}
              h={h}
              col={cols[i]}
              i={i}
              today={i === todayIdx}
              locale={locale}
              tip={tipOf(g.label, i, [h > 0 && hours(h)])}
            />
          ))
        : g.cells.map((c, i) => (
            <TotalCell
              key={cols[i].key}
              c={c}
              col={cols[i]}
              i={i}
              today={i === todayIdx}
              locale={locale}
              mark={rt("rm.matrix.closingMark")}
              bare={mode === "team"}
              tip={tipOf(g.label, i, [
                c.h > 0 && capText(c.h, c.cap, "rm.matrix.tipCap"),
                ...flags(c),
              ])}
            />
          ))}
      <RowTotal h={sum(top)} locale={locale} strong />
    </tr>
  )
}

/**
 * Üye satırı: proje bazlıda kişi, kişi bazlıda proje — hücreler yazılabilir; ekip bazlıda kişi —
 * hücre kişinin toplamı ve kapasitesi (yazılmaz, adına basınca kişi paneli).
 */
export function MemberRow({ g, row, last, ctx }) {
  const { mode, cols, todayIdx, locale, rt, tipOf, capText, hours, flags, edit } = ctx
  const byProject = mode === "project"
  const team = mode === "team"
  const pid = byProject ? g.key : team ? null : row.key
  const rid = byProject || team ? row.key : g.key
  const who = `${row.label} · ${g.label}`
  const lead = row.avatar ? (
    <Avatar name={row.avatar} size="sm" />
  ) : row.color !== undefined ? (
    <ColorDot color={row.color} />
  ) : null
  return (
    <tr className="hover:bg-foreground/[0.02]">
      <th
        scope="row"
        className="sticky start-0 z-10 border-b border-e border-border/40 bg-background pe-3 ps-[1.375rem] text-start text-[0.8125rem] font-normal"
      >
        <div className="flex min-h-9 items-center gap-2">
          <TreeLine last={last} />
          {team ? (
            <button type="button" onClick={() => ctx.onPerson(row.key)} className={PICK}>
              {lead}
              <span className="block max-w-28 truncate @[40rem]/rm:max-w-56">{row.label}</span>
            </button>
          ) : (
            <>
              {lead}
              <span className="block max-w-28 truncate @[40rem]/rm:max-w-56">{row.label}</span>
            </>
          )}
          {edit ? <RowMenu pid={pid} rid={rid} label={who} /> : null}
        </div>
      </th>
      {team
        ? row.cells.map((c, i) => (
            <TotalCell
              key={cols[i].key}
              c={c}
              col={cols[i]}
              i={i}
              today={i === todayIdx}
              locale={locale}
              mark={rt("rm.matrix.closingMark")}
              soft
              tip={tipOf(who, i, [c.h > 0 && capText(c.h, c.cap, "rm.matrix.tipCap"), ...flags(c)])}
            />
          ))
        : row.cells.map((c, i) => {
            const col = cols[i]
            const key = `${pid}|${rid}|${col.key}`
            const can = edit?.cells && col.type !== "Tatil"
            return (
              <Cell
                key={col.key}
                c={c}
                col={col}
                i={i}
                today={i === todayIdx}
                over={byProject && c.over}
                locale={locale}
                rt={rt}
                tip={tipOf(who, i, [
                  c.h > 0 && hours(c.h),
                  byProject && c.h > 0 && capText(c.load, c.cap, "rm.matrix.tipLoad"),
                  ...flags(c),
                ])}
                edit={
                  can
                    ? {
                        key,
                        active: edit.editing?.key === key,
                        init: edit.editing?.init,
                        label: `${who} · ${edit.colLabel(col)}`,
                        start: (init) => edit.start(key, init),
                        commit: (v) => edit.save(pid, rid, col, v),
                        cancel: edit.cancel,
                      }
                    : null
                }
              />
            )
          })}
      <RowTotal h={sum(row.cells.map((c) => c.h))} locale={locale} />
    </tr>
  )
}
