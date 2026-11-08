import { useSyncExternalStore } from "react"
import {
  readSharedCalendars,
  subscribeSharedCalendars,
  writeSharedCalendars,
} from "@/lib/sharedCalendars"
import { worstSharedPeople } from "@/dev/worstCase/calendarEvents"

const NONE = []

/**
 * Takvimini paylaşan kişiler (`tyro-shared-calendars`): `[people, setPeople]`. Header paneli, Pano'nun
 * widget'ı ve Takvim sayfası AYNI listeyi okur ve yazar; biri değiştirince ötekiler anında görür.
 * `people` değişmedikçe aynı dizi (`useCalendarEvents` bunu önbellek anahtarı ve efekt bağımlılığı
 * olarak ister); `setPeople` sabit.
 */
export function useSharedPeople() {
  const people = useSyncExternalStore(subscribeSharedCalendars, readSharedCalendars, () => NONE)
  // DEV: `?data=worst` en kötü veri (src/dev/worstCase); üretimde ölü kod.
  const worst = import.meta.env.DEV ? worstSharedPeople() : null
  return [worst ?? people, writeSharedCalendars]
}
