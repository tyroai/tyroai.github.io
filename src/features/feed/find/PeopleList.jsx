import { usePeoplePhotos } from "@/hooks/usePeoplePhotos"
import { FileGroup } from "../files/FileRow"
import { PersonRow } from "./PersonRow"
import { usePresenceBatch } from "./usePresenceBatch"

/**
 * Kişi satırlarının kabuğu (Dosyalarım'ın liste tarifi, `FileGroup`). Foto ve canlı durum yalnız
 * GÖRÜNEN satırlar için istenir: durum tek istekte, fotolar oturum önbelleğinden.
 * `rows`: `[{ person, field?, phone? }]`; `tagFor(person)`: adın yanındaki etiket.
 */
export function PeopleList({ rows, label, count, query, tagFor, className }) {
  const photos = usePeoplePhotos(rows.map((r) => r.person.address))
  const presence = usePresenceBatch(rows.map((r) => r.person))
  return (
    <FileGroup label={label} count={count} className={className}>
      {rows.map((r) => (
        <PersonRow
          key={r.person.id || r.person.address}
          person={r.person}
          photo={photos.get(r.person.address)}
          presence={presence.get(r.person.id)}
          query={query}
          field={r.field}
          phone={r.phone}
          tag={tagFor?.(r.person)}
        />
      ))}
    </FileGroup>
  )
}
