import { useMemo } from "react"
import { useMsal } from "@azure/msal-react"
import SharedEditor from "@/features/widgets/shared/SharedEditor"
import { useWidgetData } from "@/hooks/useWidgetData"
import { derivePeopleFromEvents } from "@/lib/derivePeople"
import { fetchCalendarOwners } from "@/lib/sharedStatus"
import { PeopleList } from "./PeopleList"

const OWNERS_TTL = 30 * 60_000
const same = (a, b) => a.address.toLowerCase() === b.address.toLowerCase()

/**
 * Takvim sayfasında "Kişi ekle": Pano'nun paylaşılan takvimler widget'ının düzenleyicisi AYNEN
 * (Outlook'ta seninle paylaşılmış takvimler tek dokunuşla + header takvim panelinin şeridi: toplantı
 * katılımcılarından erişimi denenmiş adaylar, e-postayla ekleme) ve aynı liste (`useSharedPeople`).
 * Ayrı tembel parça: yalnız düzenleyen kişi indirir. Ekleme alanı üstte (odak orada, kaydırma yok),
 * altında eklenmiş kişilerin listesi (`PeopleList`: aç/kapa, ✕; widget'ın küçük çipleri yerine).
 * `rows`: kişiler ve okunma durumları, `events`: kendi etkinliklerim (aday kişiler).
 */
export default function PeopleEditor({
  people,
  rows,
  layers,
  onChange,
  onToggle,
  onRemove,
  events,
}) {
  const { accounts } = useMsal()
  const owners = useWidgetData("calendar-owners", fetchCalendarOwners, OWNERS_TTL)
  const suggestions = useMemo(
    () => (owners.data ?? []).filter((o) => !people.some((p) => same(p, o))),
    [owners.data, people],
  )
  const me = (accounts[0]?.username ?? "").toLowerCase()
  const candidates = useMemo(() => derivePeopleFromEvents(events, me), [events, me])
  const unreachable = useMemo(
    () => rows.filter((r) => r.state === "unreachable").map((r) => r.person),
    [rows],
  )
  return (
    <>
      <SharedEditor
        people={people}
        onChange={onChange}
        candidates={candidates}
        unreachable={unreachable}
        suggestions={suggestions}
        startOpen
        hideList
      />
      <PeopleList people={rows} layers={layers} onToggle={onToggle} onRemove={onRemove} />
    </>
  )
}
