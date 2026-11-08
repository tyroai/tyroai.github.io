import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { prioList, statusList } from "@/features/rm/lib/edit/project"
import { cn } from "@/lib/utils"
import { catLabel } from "@/features/rm/lib/format"
import { fullName } from "@/features/rm/lib/peopleDirectory"
import { useRmText } from "../../data/useRmText"
import { ColorDot } from "../../common/bits"
import { useRm } from "../../shell/RmContext"
import { TodoEditor } from "./TodoEditor"

const NONE = "__none"
const FIELD = "h-10 sm:h-10 sm:text-sm pointer-coarse:h-11 sm:pointer-coarse:h-11"
// Select tetiğinin boyu kendi data-size kuralında: aynı varyantla ezilir.
const SELECT = "w-full text-sm data-[size=default]:h-10 pointer-coarse:data-[size=default]:h-11"

function Field({ id, label, required, error, hint, className, children }) {
  return (
    <div className={cn("grid content-start gap-1.5", className)}>
      <label htmlFor={id} id={`${id}-label`} className="text-[0.8125rem] font-medium">
        {label}
        {required ? <span className="text-danger-ink"> *</span> : null}
      </label>
      {children}
      {error ? (
        <p id={`${id}-err`} className="text-xs text-danger-ink">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

/** PMO proje yöneticisi seçenekleri: PMO ekibi, diğer kaynaklar, müdürler (şartname pmSel). */
function pmGroups(st, plan, current) {
  const pmo = st.resources.filter((r) => plan.teams.group(r.team) === "pmo")
  const other = st.resources.filter((r) => plan.teams.group(r.team) !== "pmo")
  // Müdürlerin bir kısmı "Yönetim" ekibinde kaynak da: aynı ad iki kez listelenmez.
  const resNames = new Set(st.resources.map((r) => r.name))
  const mgrs = (st.mgrs || []).filter((m) => m?.name && !resNames.has(m.name))
  const names = new Set([...resNames, ...mgrs.map((m) => m.name)])
  return { pmo, other, mgrs, extra: current && !names.has(current) ? current : null }
}

/** Proje formunun alanları: kimlik, kategoriler, takvim, sahipler, açıklama, yapılacak işler. */
export function ProjectFields({ form }) {
  const { rt, locale } = useRmText()
  const { data, people: dir } = useRm()
  const st = data.st
  const { f, set, setCode, toggleCat, errors, shown } = form
  const err = (k) => (shown && errors[k] ? rt(`rm.pform.err.${errors[k]}`) : null)
  const aria = (id, k) => ({
    id,
    "aria-invalid": err(k) ? true : undefined,
    "aria-describedby": err(k) ? `${id}-err` : undefined,
  })
  const countries = st.lk?.countries?.length ? st.lk.countries : [{ code: "TR", name: "Türkiye" }]
  const cName = (c) => (locale === "tr" ? c.name : c.en || c.name) || c.code
  const pm = pmGroups(st, data.plan, f.pm)
  const prios = prioList(st)

  return (
    <div className="grid gap-x-4 gap-y-4 @[40rem]/edit:grid-cols-2">
      <Field id="rm-pf-name" label={rt("rm.pform.name")} required error={err("name")}>
        <Input
          {...aria("rm-pf-name", "name")}
          value={f.name}
          onChange={(e) => set("name", e.target.value)}
          className={FIELD}
          autoComplete="off"
        />
      </Field>
      <Field id="rm-pf-code" label={rt("rm.pform.code")} required error={err("code")}>
        <Input
          {...aria("rm-pf-code", "code")}
          value={f.code}
          maxLength={6}
          onChange={(e) => setCode(e.target.value)}
          className={cn(FIELD, "uppercase tabular-nums")}
          autoComplete="off"
        />
      </Field>
      <Field
        id="rm-pf-cats"
        label={rt("rm.pform.cats")}
        hint={rt("rm.pform.catsHint")}
        className="@[40rem]/edit:col-span-2"
      >
        <div role="group" aria-labelledby="rm-pf-cats-label" className="flex flex-wrap gap-1.5">
          {(st.pcats || []).map((c) => {
            const on = f.cats.includes(c.name)
            return (
              <button
                key={c.name}
                type="button"
                aria-pressed={on}
                onClick={() => toggleCat(c.name)}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[0.8125rem] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:h-11",
                  on
                    ? "border-foreground/30 bg-foreground/[0.06] font-medium dark:bg-white/[0.08]"
                    : "border-border/80 text-foreground/80 hover:border-foreground/25",
                )}
              >
                <ColorDot color={c.color} />
                {catLabel(c.name)}
                {on && f.cats[0] === c.name && f.cats.length > 1 ? (
                  <span className="text-[0.6875rem] text-muted-foreground">
                    {rt("rm.pform.colorSource")}
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>
      </Field>
      <Field id="rm-pf-start" label={rt("rm.dates.start")} required error={err("start")}>
        <Input
          {...aria("rm-pf-start", "start")}
          type="date"
          value={f.start}
          onChange={(e) => set("start", e.target.value)}
          className={cn(FIELD, "tabular-nums")}
        />
      </Field>
      <Field id="rm-pf-end" label={rt("rm.dates.end")} required error={err("end")}>
        <Input
          {...aria("rm-pf-end", "end")}
          type="date"
          value={f.end}
          onChange={(e) => set("end", e.target.value)}
          className={cn(FIELD, "tabular-nums")}
        />
      </Field>
      <Field id="rm-pf-prio" label={rt("rm.pform.prio")}>
        <div role="radiogroup" aria-labelledby="rm-pf-prio-label" className="flex gap-1.5">
          {prios.map((x) => (
            <button
              key={x}
              type="button"
              role="radio"
              aria-checked={f.prio === x}
              onClick={() => set("prio", x)}
              className={cn(
                "h-10 min-w-12 flex-1 rounded-lg border text-[0.8125rem] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:h-11",
                f.prio === x
                  ? "border-transparent bg-foreground text-background"
                  : "border-border/80 hover:border-foreground/25",
              )}
            >
              {x}
            </button>
          ))}
        </div>
      </Field>
      <Field id="rm-pf-status" label={rt("rm.col.status")}>
        <Select value={f.status || NONE} onValueChange={(v) => set("status", v === NONE ? "" : v)}>
          <SelectTrigger id="rm-pf-status" className={SELECT}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusList(st).map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field id="rm-pf-country" label={rt("rm.set.country")}>
        <Select value={f.country} onValueChange={(v) => set("country", v)}>
          <SelectTrigger id="rm-pf-country" className={SELECT}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {countries.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.code} · {cName(c)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field id="rm-pf-sponsor" label={rt("rm.panel.sponsor")}>
        <Input
          id="rm-pf-sponsor"
          value={f.sponsor}
          onChange={(e) => set("sponsor", e.target.value)}
          className={FIELD}
        />
      </Field>
      <Field id="rm-pf-pm" label={rt("rm.pform.pm")} hint={rt("rm.pform.pmHint")}>
        <Select value={f.pm || NONE} onValueChange={(v) => set("pm", v === NONE ? "" : v)}>
          <SelectTrigger id="rm-pf-pm" className={SELECT}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>{rt("rm.pform.none")}</SelectItem>
            {pm.extra ? <SelectItem value={pm.extra}>{pm.extra}</SelectItem> : null}
            {[
              ["pmo", pm.pmo],
              ["other", pm.other],
              ["mgrs", pm.mgrs],
            ].map(([k, list]) =>
              list.length ? (
                <SelectGroup key={k}>
                  <SelectLabel>{rt(`rm.pform.pmGroup.${k}`)}</SelectLabel>
                  {list.map((r) => (
                    <SelectItem key={`${k}-${r.id}`} value={r.name}>
                      {fullName(dir, r.name)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ) : null,
            )}
          </SelectContent>
        </Select>
      </Field>
      <Field id="rm-pf-desc" label={rt("rm.pform.desc")} className="@[40rem]/edit:col-span-2">
        <Textarea
          id="rm-pf-desc"
          value={f.desc}
          onChange={(e) => set("desc", e.target.value)}
          rows={3}
          className="min-h-20 sm:text-sm"
        />
      </Field>
      <div className="grid gap-1.5 @[40rem]/edit:col-span-2">
        <span id="rm-pf-todo" className="text-[0.8125rem] font-medium">
          {rt("rm.panel.todo")}
        </span>
        <TodoEditor items={f.todo} todo={form.todo} labelId="rm-pf-todo" />
      </div>
    </div>
  )
}
