import { useSyncExternalStore } from "react"
import { getPeopleFilter, subscribePeopleFilter } from "@/lib/findScope"

/** Kişiler'in etkin filtresi (departman ya da ofis; `lib/findScope.js`), yoksa `null`. */
export const usePeopleFilter = () => useSyncExternalStore(subscribePeopleFilter, getPeopleFilter)
