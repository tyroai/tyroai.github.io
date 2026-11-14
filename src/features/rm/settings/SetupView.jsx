import { kindOf } from "@/lib/rm/metrics"
import Folder01Icon from "@hugeicons/core-free-icons/Folder01Icon"
import ListViewIcon from "@hugeicons/core-free-icons/ListViewIcon"
import UserGroupIcon from "@hugeicons/core-free-icons/UserGroupIcon"
import { catLabel } from "@/features/rm/lib/format"
import { useRmText } from "../data/useRmText"
import { RmCard } from "../common/RmCard"
import { useRm } from "../shell/RmContext"
import { Table } from "./RefTable"
import { TR } from "./table"

/** Kurulum tabloları: ekipler (kapasite grubu), kategoriler, unvanlar, öncelik, durum, ülke. */
export function SetupView() {
  const { rt } = useRmText()
  const { data, edit, openEditor } = useRm()
  const editAction = (editor) =>
    edit ? { label: rt("rm.pform.edit"), onClick: () => openEditor(editor) } : null
  const { st, plan } = data
  const lk = st.lk || {}
  const count = (team) => st.resources.filter((r) => r.team === team).length
  const groupOf = (t) => {
    // Birleşik ekip (AI): kaynak ekiplerin adı değil kapasite grupları yazılır.
    if (t.alias) {
      const list = t.of.map((n) => {
        const r = st.resources.find((x) => x.baseTeam === n)
        const g = r ? kindOf(plan, r) : (lk.teams || []).find((x) => x.name === n)?.grp || "cons"
        return rt(`rm.set.grp.${g}`)
      })
      return rt("rm.set.grp.alias", { list: [...new Set(list)].join(" + ") })
    }
    const r = st.resources.find((x) => (x.baseTeam ?? x.team) === t.name)
    const kind = r ? kindOf(plan, r) : t.grp
    return rt(`rm.set.grp.${kind}`)
  }
  return (
    <div className="grid gap-4 @[64rem]/rm:grid-cols-2">
      <RmCard
        icon={UserGroupIcon}
        tone="brand"
        title={rt("rm.set.teams")}
        sub={edit ? undefined : rt("rm.set.readOnly")}
        action={editAction({ kind: "list", list: "teams" })}
      >
        <Table
          caption={rt("rm.set.teams")}
          head={[rt("rm.capacity.team"), rt("rm.set.group"), rt("rm.set.people")]}
          rows={(lk.teams || [])
            .filter((t) => !t.hidden)
            .map((t) => (
              <tr key={t.name} className={TR}>
                <th scope="row" className="text-start font-normal">
                  <span
                    aria-hidden="true"
                    className="me-2 inline-block size-2.5 rounded-full"
                    style={{ background: t.color }}
                  />
                  {t.name}
                </th>
                <td>{groupOf(t)}</td>
                <td className="tabular-nums">{count(t.name)}</td>
              </tr>
            ))}
        />
      </RmCard>
      <RmCard
        icon={Folder01Icon}
        tone="violet"
        title={rt("rm.set.cats")}
        sub={rt("rm.set.catsSub")}
        action={editAction({ kind: "cats" })}
      >
        <Table
          caption={rt("rm.set.cats")}
          head={[rt("rm.projects.category"), rt("rm.set.teams")]}
          rows={(st.pcats || []).map((c) => (
            <tr key={c.name} className={TR}>
              <th scope="row" className="text-start font-normal">
                <span
                  aria-hidden="true"
                  className="me-2 inline-block size-2.5 rounded-full"
                  style={{ background: c.color }}
                />
                {catLabel(c.name)}
              </th>
              <td className="text-muted-foreground">
                {(c.teams || []).join(", ") || rt("rm.set.allTeams")}
              </td>
            </tr>
          ))}
        />
      </RmCard>
      <RmCard icon={ListViewIcon} tone="slate" title={rt("rm.set.lists")}>
        <dl className="grid gap-4 text-sm">
          {[
            ["titles", (lk.titles || []).map((t) => [t.name, t.lvl])],
            ["prios", (lk.prios || []).map((x) => [x.name])],
            ["statuses", (lk.statuses || []).map((x) => [x.name])],
            ["countries", (lk.countries || []).map((x) => [x.name, x.code])],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="flex items-baseline justify-between gap-2 text-[0.6875rem] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                {rt(`rm.set.l.${k}`)}
                {edit ? (
                  <button
                    type="button"
                    onClick={() => openEditor({ kind: "list", list: k })}
                    aria-label={`${rt(`rm.set.l.${k}`)}: ${rt("rm.pform.edit")}`}
                    className="relative rounded-md text-xs font-normal normal-case tracking-normal text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:after:absolute pointer-coarse:after:-inset-3"
                  >
                    {rt("rm.pform.edit")}
                  </button>
                ) : null}
              </dt>
              {/* Hap dizisi: uzun liste (ülkeler) yazı duvarı olmasın, göz tek tek tarasın. */}
              <dd className="mt-1.5 flex flex-wrap gap-1.5">
                {v.length
                  ? v.map(([name, tag]) => (
                      <span
                        key={`${name}${tag ?? ""}`}
                        className="inline-flex h-7 items-center gap-1.5 rounded-full bg-foreground/[0.05] px-2.5 text-xs text-foreground/85 dark:bg-white/[0.07]"
                      >
                        {tag ? (
                          <span className="text-[0.6875rem] font-semibold text-foreground/60">
                            {tag}
                          </span>
                        ) : null}
                        {name}
                      </span>
                    ))
                  : "—"}
              </dd>
            </div>
          ))}
        </dl>
      </RmCard>
    </div>
  )
}
