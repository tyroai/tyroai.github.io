import { useMemo, useState } from "react"
import { useToday } from "@/hooks/useToday"
import { formFields } from "@/lib/requestForm"
import { cn } from "@/lib/utils"
import { ImpactCard } from "./leave/ImpactCard"
import { LeaveFields } from "./leave/LeaveFields"
import { RangeCalendar } from "./leave/RangeCalendar"
import { useLeaveImpact } from "./leave/useLeaveImpact"

/**
 * İzin talebi: solda tür, iki uç (hangisini seçtiğini gösterir) ve satır içi aralık takvimi;
 * sağda canlı etki kartı (iş günü, bakiye, köprü, çakışma, ekip, toplantı). Form ≥ 44rem'de iki
 * sütun (kabın sorgusu; dikey tablette takvim tek ay), dar ekranda alt alta; sol sütun genişse
 * tür ve iki uç tek satırda. Alanlar şablondaki üç alan: tür · başlangıç · bitiş.
 * `leaves`: kişinin izin kayıtları (çakışma, bekleyen, takvim katmanı); `teamEnabled`: Ekibim'i
 * görebilen kişi — yalnız ona "ekibinden kimler izinde" satırı ve takvimde ekip işareti.
 * `step` (telefonun adım akışı): yok → iki bölüm birlikte; "dates" → yalnız tür, uçlar ve
 * takvim; "summary" → yalnız etki kartı, tam genişlik. Durum (etkin uç, köprü geri alma) adımlar
 * arasında korunur: bileşen aynı kalır, yalnız bölüm çizilmez.
 */
export function LeaveForm({ form, idBase, balance, leaves, teamEnabled, step = null }) {
  const today = useToday()
  const fields = useMemo(
    () => Object.fromEntries(formFields("leaveRequest").main.map((f) => [f.name, f])),
    [],
  )
  const { values, errors } = form
  const [active, setActive] = useState("start")
  // Köprü günü eklenince önceki aralık saklanır: "Geri al" ona döner.
  const [undo, setUndo] = useState(null)
  const impact = useLeaveImpact({ values, leaves, balance, teamEnabled, today })

  const pickRange = (next) => {
    setUndo(null)
    form.setRange(next.start, next.end)
    setActive(next.active)
  }
  const setRange = (start, end, bridge = false) => {
    setUndo(bridge ? { start: values.start, end: values.end } : null)
    form.setRange(start, end)
    setActive("start")
  }
  const undoBridge = () => {
    if (undo) form.setRange(undo.start, undo.end)
    setUndo(null)
  }

  const dates = step !== "summary"
  const summary = step !== "dates"
  const both = dates && summary
  return (
    <div
      className={cn(
        "grid gap-6",
        both && "@[44rem]/form:grid-cols-[minmax(0,1fr)_21rem] @[44rem]/form:items-start",
      )}
    >
      {dates && (
        <div className="@container/fields min-w-0 space-y-5 shorter:space-y-4">
          <LeaveFields
            idBase={idBase}
            fields={fields}
            values={values}
            errors={errors}
            onKind={(v) => form.setSlot("kind", v)}
            active={active}
            onActive={setActive}
          />
          {/* Takvim kendi yüzeyinde: girişlerle karışmasın, göz alanları ve takvimi ayrı görsün. */}
          <div
            data-tour="req-calendar"
            className="rounded-[1.125rem] border border-black/[0.06] bg-foreground/[0.02] p-3 dark:border-white/[0.08] dark:bg-white/[0.025] @[36rem]/fields:p-4"
          >
            <RangeCalendar
              start={values.start ?? null}
              end={values.end ?? null}
              active={active}
              own={impact.own}
              team={impact.teamDays}
              today={today}
              onChange={pickRange}
            />
          </div>
        </div>
      )}
      {summary && (
        <div
          data-tour="req-impact"
          className={cn("min-w-0", both && "@[44rem]/form:sticky @[44rem]/form:top-0")}
        >
          <ImpactCard
            impact={impact}
            values={values}
            onRange={setRange}
            undo={undo}
            onUndo={undoBridge}
          />
        </div>
      )}
    </div>
  )
}
