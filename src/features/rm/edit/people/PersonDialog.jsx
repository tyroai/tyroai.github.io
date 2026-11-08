import { useMemo, useRef, useState, useSyncExternalStore } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Delete02Icon from "@hugeicons/core-free-icons/Delete02Icon"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { makeTeamIndex } from "@/lib/rm/engine/teams"
import {
  addPerson,
  deletePerson,
  hoursErrors,
  nameError,
  updatePerson,
} from "@/features/rm/lib/edit/people"
import { teamOptions } from "@/features/rm/lib/teamAliases"
import { num } from "@/features/rm/lib/format"
import { fullName, peopleState, subscribePeople } from "@/features/rm/lib/peopleDirectory"
import { cn } from "@/lib/utils"
import { useRmEdit } from "../../data/useRmEdit"
import { useRmText } from "../../data/useRmText"
import { useRm } from "../../shell/RmContext"
import { EditWindow } from "../EditWindow"
import { FIELD, Labeled } from "../matrix/fields"
import { BTN } from "../ui"

const SELECT = "w-full text-sm data-[size=default]:h-10 pointer-coarse:data-[size=default]:h-11"
const asText = (v) => (v == null ? "" : String(v))

/**
 * Kişi ekle ya da düzenle (şartname Kaynaklar + v5.3 kişiye özel saatler). Ekip seçimi asıl
 * ekiplerden (görünümde birleşen "AI" değil): kapasite kuralı ona bağlı. Boş saat = varsayılan.
 */
export default function PersonDialog({ rid = null, onClose }) {
  const { rt, locale } = useRmText()
  const { data, params, people } = useRm()
  const { commit, editError } = useRmEdit()
  const raw = data.raw
  const r0 = rid ? raw.resources.find((x) => x.id === rid) : null
  const teams = useMemo(() => makeTeamIndex(raw), [raw])
  // Birleşen ekipler (AI Danışman + AI Yazılım) tek "AI" seçeneği; asıl ekip kapasite grubundan.
  const teamOpts = useMemo(() => teamOptions(teams.list.map((t) => t.name)), [teams])
  const S0 = raw.settings || {}
  // Ad ve yönetici Graph'taki ad soyadla açılır: kaydedince kısa ad her yerde tam ada geçer.
  const [f, setF] = useState(() => ({
    name: r0 ? fullName(people, r0.name) : "",
    team: r0?.team ?? teams.list[0]?.name ?? "FI",
    role: r0?.role ?? "Uzman",
    manager: r0?.manager ? fullName(people, r0.manager) : "",
    closing: !!r0?.closing,
    dh: asText(r0?.dh),
    sup: asText(r0?.sup),
    dev: asText(r0?.dev),
  }))
  const [shown, setShown] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const [confirmDel, setConfirmDel] = useState(false)
  const bodyRef = useRef(null)
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }))
  const full = teams.isFullDay({ team: f.team })
  const nErr = nameError(raw, f.name, rid)
  const hErr = hoursErrors(raw, { team: f.team }, f)
  const valid = !nErr && !Object.keys(hErr).length
  const titles = (raw.lk?.titles || []).map((x) => x.name).filter(Boolean)
  // Öneriler Graph'taki kişilerden (IT ağacı); yöneticide plandaki yöneticiler de.
  const dir = useSyncExternalStore(subscribePeople, peopleState)
  const graphNames = useMemo(
    () =>
      [...new Set(dir.people.map((p) => p.name).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b, "tr"),
      ),
    [dir],
  )
  const managers = [
    ...new Set(
      [
        ...(raw.mgrs || []).map((m) => fullName(people, m.name)),
        ...raw.resources.map((x) => x.manager && fullName(people, x.manager)),
        ...graphNames,
      ].filter(Boolean),
    ),
  ]
  const dh = f.dh === "" ? +S0.dayHours : +f.dh
  const cap = full
    ? dh
    : Math.max(0, dh - (f.sup === "" ? +S0.support : +f.sup) - (f.dev === "" ? +S0.dev : +f.dev))
  // Varsayılana eşit değer kişiye özel tutulmaz (şartname: nv === def → null).
  const own = (v, def) => (v === "" || +v === +def ? null : Math.round(+v))

  async function run(fn, label, after) {
    setBusy(true)
    setErr(null)
    try {
      await commit(fn, label)
      after?.()
      onClose()
    } catch (e) {
      setErr(editError(e))
      setBusy(false)
    }
  }

  function onSave(e) {
    e.preventDefault()
    if (!valid) {
      setShown(true)
      requestAnimationFrame(() => bodyRef.current?.querySelector("[aria-invalid=true]")?.focus())
      return
    }
    const patch = {
      name: f.name.trim(),
      team: f.team,
      role: f.role,
      manager: f.manager.trim(),
      closing: full ? false : f.closing,
      dh: own(f.dh, S0.dayHours),
      sup: full ? null : own(f.sup, S0.support),
      dev: full ? null : own(f.dev, S0.dev),
    }
    if (rid) run((S) => updatePerson(S, rid, patch), rt("rm.people.saved", { n: patch.name }))
    else
      run(
        (S) => {
          const id = addPerson(S, patch)
          updatePerson(S, id, patch)
        },
        rt("rm.people.added", { n: patch.name }),
      )
  }

  const footer = confirmDel ? (
    <div className="flex flex-wrap items-center gap-3">
      <p role="alert" className="min-w-0 flex-1 text-[0.8125rem] text-danger-ink">
        {err}
      </p>
      <Button
        variant="outline"
        className={BTN}
        onClick={() => setConfirmDel(false)}
        disabled={busy}
      >
        {rt("rm.action.cancel")}
      </Button>
      <Button
        variant="destructive"
        className={BTN}
        disabled={busy}
        onClick={() =>
          run(
            (S) => deletePerson(S, rid),
            rt("rm.people.deleted", { n: r0.name }),
            () => params.update({ person: null }),
          )
        }
      >
        {rt("rm.pform.deleteDo")}
      </Button>
    </div>
  ) : (
    <div className="flex flex-wrap items-center gap-3">
      {rid && (
        <Button
          variant="ghost"
          className={cn(BTN, "text-danger-ink hover:bg-danger/10 hover:text-danger-ink")}
          onClick={() => setConfirmDel(true)}
          disabled={busy}
        >
          <HugeiconsIcon icon={Delete02Icon} className="size-4" strokeWidth={1.8} />
          {rt("rm.people.delete")}
        </Button>
      )}
      <p role="alert" className="min-w-0 flex-1 text-[0.8125rem] text-danger-ink">
        {err}
      </p>
      <Button variant="outline" className={BTN} onClick={onClose} disabled={busy}>
        {rt("rm.action.cancel")}
      </Button>
      <Button type="submit" form="rm-person" className={BTN} disabled={busy}>
        {rt(rid ? "rm.edit.save" : "rm.people.add")}
      </Button>
    </div>
  )

  const projectsOf = rid
    ? data.st.projects.filter((p) => (p.team || []).some((x) => x.rid === rid)).length
    : 0
  const hourField = (k, label, def) => (
    <Labeled id={`rm-person-${k}`} label={label}>
      <Input
        id={`rm-person-${k}`}
        type="number"
        inputMode="numeric"
        min={0}
        max={k === "dh" ? 16 : 12}
        value={f[k]}
        placeholder={String(def)}
        aria-invalid={shown && hErr[k] ? true : undefined}
        onChange={(e) => set(k, e.target.value.trim())}
        className={FIELD}
      />
      {shown && hErr[k] ? (
        <p className="text-xs text-danger-ink">{rt(`rm.people.err.${hErr[k]}`)}</p>
      ) : null}
    </Labeled>
  )

  return (
    <EditWindow
      open
      onOpenChange={(o) => !o && !busy && onClose()}
      title={rt(
        confirmDel ? "rm.people.deleteTitle" : rid ? "rm.people.editTitle" : "rm.people.newTitle",
      )}
      context={r0?.name}
      bodyRef={bodyRef}
      initialFocus="#rm-person-name"
      footer={footer}
    >
      {confirmDel ? (
        <div className="grid gap-2">
          <p className="text-sm font-semibold">{r0.name}</p>
          <p className="text-[0.8125rem] text-muted-foreground">
            {rt("rm.people.deleteBody", { n: projectsOf })}
          </p>
        </div>
      ) : (
        <form
          id="rm-person"
          noValidate
          onSubmit={onSave}
          className="grid gap-4 @[36rem]/edit:grid-cols-2"
        >
          <Labeled id="rm-person-name" label={`${rt("rm.people.name")} *`}>
            <Input
              id="rm-person-name"
              list="rm-person-names"
              value={f.name}
              aria-invalid={shown && nErr ? true : undefined}
              onChange={(e) => set("name", e.target.value)}
              className={FIELD}
              autoComplete="off"
            />
            <datalist id="rm-person-names">
              {graphNames.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
            {shown && nErr ? (
              <p className="text-xs text-danger-ink">{rt(`rm.people.err.${nErr}`)}</p>
            ) : null}
          </Labeled>
          <Labeled id="rm-person-team" label={rt("rm.capacity.team")}>
            <Select
              value={(teamOpts.find((o) => o.names.includes(f.team)) ?? teamOpts[0])?.label}
              onValueChange={(label) => {
                const o = teamOpts.find((x) => x.label === label)
                if (o) set("team", o.names.includes(f.team) ? f.team : o.names[0])
              }}
            >
              <SelectTrigger id="rm-person-team" className={SELECT}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {teamOpts.map((o) => (
                  <SelectItem key={o.label} value={o.label}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Labeled>
          {(teamOpts.find((o) => o.names.includes(f.team))?.names.length ?? 0) > 1 && (
            <Labeled id="rm-person-grp" label={rt("rm.set.group")}>
              <Select value={f.team} onValueChange={(v) => set("team", v)}>
                <SelectTrigger id="rm-person-grp" className={SELECT}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {teamOpts
                    .find((o) => o.names.includes(f.team))
                    .names.map((n) => {
                      const g = teams.group(n)
                      return (
                        <SelectItem key={n} value={n}>
                          {rt(`rm.set.grp.${g}`)}
                        </SelectItem>
                      )
                    })}
                </SelectContent>
              </Select>
            </Labeled>
          )}
          <Labeled id="rm-person-role" label={rt("rm.people.role")}>
            <Select
              value={f.role || "__none"}
              onValueChange={(v) => set("role", v === "__none" ? "" : v)}
            >
              <SelectTrigger id="rm-person-role" className={SELECT}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[
                  ...new Set([...(titles.length ? titles : ["Uzman"]), f.role].filter(Boolean)),
                ].map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Labeled>
          <Labeled id="rm-person-mgr" label={rt("rm.people.manager")}>
            <Input
              id="rm-person-mgr"
              list="rm-person-mgrs"
              value={f.manager}
              onChange={(e) => set("manager", e.target.value)}
              className={FIELD}
              autoComplete="off"
            />
            <datalist id="rm-person-mgrs">
              {managers.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </Labeled>
          <div className="grid gap-3 rounded-2xl bg-foreground/[0.035] p-4 @[36rem]/edit:col-span-2 dark:bg-white/[0.05]">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-sm font-semibold">{rt("rm.people.hours")}</span>
              <span className="text-[0.8125rem] tabular-nums">
                {rt("rm.people.cap", { h: num(cap, locale) })}
              </span>
            </div>
            <p className="text-xs text-foreground/65">
              {rt(full ? "rm.people.fullHint" : "rm.people.consHint")}
            </p>
            <div className="grid gap-3 @[36rem]/edit:grid-cols-3">
              {hourField("dh", rt("rm.people.dh"), S0.dayHours)}
              {!full && hourField("sup", rt("rm.people.sup"), S0.support)}
              {!full && hourField("dev", rt("rm.people.dev"), S0.dev)}
            </div>
            {!full && (
              <label className="flex min-h-11 items-center gap-2 text-[0.8125rem]">
                <Checkbox checked={f.closing} onCheckedChange={(v) => set("closing", v === true)} />
                {rt("rm.people.closing", { n: S0.closingDays })}
              </label>
            )}
          </div>
        </form>
      )}
    </EditWindow>
  )
}
