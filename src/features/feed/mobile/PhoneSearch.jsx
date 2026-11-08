import { useEffect, useRef } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import SearchList01Icon from "@hugeicons/core-free-icons/SearchList01Icon"
import { SearchField } from "@/components/common/SearchField"
import { useLocale } from "@/hooks/useLocale"
import { FeedChips } from "./FeedChips"
import "./feedMobile.css"

/**
 * Telefonun araması: sekme satırının sonunda "listede ara" simgesi (Bul sekmesinin simgesi rehber, büyüteç yalnız aramada); basınca sekmelerin altında tam genişlikte
 * alan ve "Vazgeç" açılır (iOS). Kanal çipleri yalnız arama açıkken (kapsam seçici gibi) görünür;
 * akışın üstü boş kalır, hikâyeler ve gönderiler doğrudan sekmelerin altında.
 */
export function PhoneSearchButton({ onOpen, label }) {
  const { t } = useLocale()
  const name = label ?? t("feed.searchAria")
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={name}
      title={name}
      className="feed-phone-search-btn"
    >
      <HugeiconsIcon icon={SearchList01Icon} className="size-5" strokeWidth={1.9} />
    </button>
  )
}

/** Açık arama: alan + Vazgeç; Popüler'de altında kanal çipleri. `focus`: dokunuşla açıldıysa klavye gelir. */
export function PhoneSearchBar({ agenda, focus, query, onQuery, onClose, chips }) {
  const { t } = useLocale()
  const input = useRef(null)
  useEffect(() => {
    if (focus) input.current?.focus()
  }, [focus])

  return (
    <div className="feed-phone-search">
      <div className="flex items-center gap-1.5">
        <SearchField
          value={query}
          onChange={onQuery}
          placeholder={t("feed.searchPlaceholder")}
          label={t("feed.searchAria")}
          inputRef={input}
          className="min-w-0 flex-1"
          inputProps={{
            // Esc: önce yazıyı siler, boşsa aramayı kapatır (iOS'taki Vazgeç gibi).
            onKeyDown: (e) => {
              if (e.key !== "Escape") return
              e.preventDefault()
              if (query) onQuery("")
              else onClose()
            },
          }}
        />
        <button type="button" onClick={onClose} className="feed-phone-cancel">
          {t("feed.search.cancel")}
        </button>
      </div>
      {agenda && <FeedChips {...chips} className="-ms-4 ps-4" />}
    </div>
  )
}
