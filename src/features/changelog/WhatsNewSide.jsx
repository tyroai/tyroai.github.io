import { NavList } from "@/components/common/NavList"
import { useLocale } from "@/hooks/useLocale"
import { monthLabel } from "./changelogList"
import { kindText } from "./entryText"
import { SearchField } from "./WhatsNewToolbar"

const KINDS = ["all", "feature", "improvement", "fix"]

/**
 * Masaüstü sol paneli (iki bölmeli düzen): arama, tür süzgeci (sayılı dikey liste) ve ay dizini
 * (zaman çizgisinde o aya iner, kaydırmayı izler). Telefondaki yapışkan araç çubuğunun yerini
 * alır; durum `useChangelogView`ten gelir, davranış aynı. "Düzeltme" yalnız yöneticide.
 */
export function WhatsNewSide({
  kind,
  onKind,
  counts,
  isAdmin,
  query,
  onQuery,
  inputRef,
  months,
  currentMonth,
  onMonth,
}) {
  const { t, locale } = useLocale()
  const kinds = KINDS.filter((k) => isAdmin || k !== "fix").map((k) => ({
    id: k,
    label: k === "all" ? t("whatsNew.kind.all") : kindText(t, k, true),
    count: counts[k],
  }))
  const monthItems = months.map((m) => ({
    id: `month-${m.key}`,
    label: monthLabel(m.date, locale),
    count: m.count,
  }))
  return (
    <div className="space-y-6">
      <SearchField query={query} onQuery={onQuery} inputRef={inputRef} className="w-full" />
      <NavList
        mode="filter"
        label={t("whatsNew.kindAria")}
        groups={[{ id: "kind", label: t("whatsNew.nav.kind"), items: kinds }]}
        current={kind}
        onSelect={onKind}
      />
      {monthItems.length > 0 ? (
        <NavList
          label={t("whatsNew.nav.months")}
          groups={[{ id: "months", label: t("whatsNew.nav.months"), items: monthItems }]}
          current={currentMonth}
          onSelect={(id) => onMonth(months.find((m) => `month-${m.key}` === id))}
        />
      ) : null}
    </div>
  )
}
