import { useMyCircle } from "@/hooks/useMyCircle"
import { usePeoplePhotos } from "@/hooks/usePeoplePhotos"
import { circleOf } from "@/lib/myCircle"
import { peopleOn } from "./dayMath"

export const KINDS = ["birthday", "anniversary", "joiner"]
const RANK = { team: 0, department: 1, none: 2 }

/**
 * Bir günün kutlananları, türe göre (doğum günü · iş yıl dönümü · aramıza katılan); ekibinden ve
 * departmanından olanlar her grubun başında (`circle`). `offset` bugüne göre gün farkı; kütük
 * yalnız önümüzdeki `windowDays` günü taşır: dışındaki gün için `groups` boş değil `null`
 * (BİLİNMİYOR). Fotoğraflar burada istenir: kanca yalnız panel AÇIKKEN çalışır.
 */
export function useAgendaPeople({ people, peopleKnown, offset, windowDays }) {
  const circle = useMyCircle(peopleKnown)
  const raw = peopleKnown ? peopleOn(people, offset, windowDays) : null
  const tag = (list) =>
    list
      .map((p) => ({ ...p, circle: circleOf(circle, p.mail) }))
      .sort((a, b) => RANK[a.circle ?? "none"] - RANK[b.circle ?? "none"])
  const groups = raw && Object.fromEntries(KINDS.map((k) => [k, tag(raw[k])]))
  const shown = groups ? KINDS.flatMap((k) => groups[k]) : []
  const photos = usePeoplePhotos(shown.map((p) => p.mail))
  const photoOf = (mail) => (mail ? photos.get(mail.trim().toLowerCase()) : undefined)
  return { groups, shown, photoOf }
}
