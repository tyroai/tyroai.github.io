import { SharedCalendarBar } from "@/components/common/SharedCalendarBar"
import { useLocale } from "@/hooks/useLocale"
import { SuggestionList } from "./SuggestionList"

/**
 * Takvimleri düzenle: Outlook'ta seninle paylaşılmış takvimler (öneri, tek dokunuş) ve takvim
 * panelinin şeridi — liste, toplantı katılımcılarından erişimi denenmiş adaylar, e-posta ile ekleme.
 * `hideList`: şeridin kişi çipleri çizilmez (Takvim sayfası listeyi kendisi gösterir).
 */
export default function SharedEditor({
  people,
  onChange,
  candidates,
  unreachable,
  suggestions,
  startOpen = false,
  hideList = false,
}) {
  const { t } = useLocale()
  return (
    <div className="flex flex-col gap-2 pb-3">
      {suggestions.length > 0 && (
        <div className="px-4 pt-1">
          <SuggestionList
            suggestions={suggestions}
            onAdd={(p) => onChange([...people, p])}
            label={t("widgets.shared.suggestHead")}
          />
        </div>
      )}
      <SharedCalendarBar
        people={people}
        candidates={candidates}
        unreachable={unreachable}
        onChange={onChange}
        startOpen={startOpen}
        hideList={hideList}
      />
    </div>
  )
}
