import { useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { useLocale } from "@/hooks/useLocale"
import { lastQuery, rememberQuery } from "@/lib/filesNav"
import { withScope } from "@/lib/findScope"
import { SearchBox, SourceTrack } from "../files/FilesToolbar"
import { useSlashFocus } from "../files/useSlashFocus"
import { OfficesView } from "./OfficesView"
import { PeopleView } from "./PeopleView"

/**
 * Bul › Kişiler ve Ofisler — dosya kaynaklarıyla aynı yerde aynı kutu ve şerit (Dosyalarım'ın
 * `FilesSearchBar` düzeni), altında kendi görünümü. Aranan metin kapsamlar arasında taşınır
 * (`filesNav` hafızası): "ayşe" yazıp Kişiler'den Tümü'ye geçen aynı aramayı görür.
 */
export function FindVertical({ vertical, now }) {
  const { t } = useLocale()
  const [params, setParams] = useSearchParams()
  const [text, setText] = useState(() => lastQuery())
  // Organizasyonda bir kişiye geçmek aramayı boşaltır: ağaç kutunun altında görünsün.
  const org = params.get("forg")
  const [seenOrg, setSeenOrg] = useState(org)
  if (org !== seenOrg) {
    setSeenOrg(org)
    if (org && text) setText("")
  }
  const inputRef = useRef(null)
  const titleRef = useRef(null)
  useSlashFocus(inputRef)

  const change = (value) => {
    setText(value)
    rememberQuery(value)
  }
  return (
    <div className="@container/files flex min-w-0 flex-col gap-5">
      <div className="flex min-w-0 flex-col gap-3">
        <div role="search" aria-label={t("myfiles.search.label")} className="files-search-row">
          <SearchBox
            value={text}
            onChange={change}
            placeholder={t(`myfiles.search.placeholder.${vertical}`)}
            inputRef={inputRef}
          />
        </div>
        <SourceTrack
          value={vertical}
          onChange={(s) => setParams(withScope(params, s), { replace: true })}
        />
      </div>
      <div
        key={vertical}
        className="min-w-0 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200"
      >
        {vertical === "people" ? (
          <PeopleView text={text} titleRef={titleRef} />
        ) : (
          <OfficesView text={text} now={now} titleRef={titleRef} />
        )}
      </div>
      {/* Etik Hattı hapı sağ alt köşede: son kartın düğmeleri onun altında kalmasın. */}
      <div aria-hidden="true" className="h-16 [@media(pointer:coarse)]:h-20" />
    </div>
  )
}
