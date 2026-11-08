import { lazy, Suspense, useEffect, useMemo, useState, useSyncExternalStore } from "react"
import { SegmentedControl } from "@/components/common/SegmentedControl"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useFeedFresh } from "@/hooks/useFeedUnread"
import { useLocale } from "@/hooks/useLocale"
import { usePageAccess } from "@/hooks/usePageAccess"
import { useFocusMode } from "@/lib/focusMode"
import {
  bellCounts,
  markBellSeen,
  parseBellSeen,
  readBellNotice,
  readBellSeenRaw,
  specialKeysOf,
  subscribeBellSeen,
} from "@/lib/bellSeen"
import { SpecialDaysButton } from "../special-days/SpecialDaysButton"
import { SpecialDaysPanel } from "../special-days/SpecialDaysPanel"
import { useSpecialDaysData } from "../special-days/useSpecialDaysData"
import { FeedNotices } from "./FeedNotices"

// Bekleyen soru (otomatik yanıt) satırı yalnız soru varken iner: açılış paketine girmez.
const BellOof = lazy(() => import("./BellOof"))
const none = () => null

function Count({ n }) {
  if (!n) return null
  return (
    <span className="rounded-full bg-foreground/[0.08] px-1.5 text-[0.625rem] font-semibold leading-4 tabular-nums">
      {n > 99 ? "99+" : n}
    </span>
  )
}

/**
 * BİLDİRİM ÇANI — header'ın sağ üstü. İki sekme: Özel günler (takvim yaprağı, günün özeti, yılın
 * özel günleri) ve Keşfet (son ziyaretten beri gelen iş bildirimleri; Keşfet'i açamayan kişide
 * sekme yok, sorgu da atılmaz). Rozet GÖRÜLMEMİŞLERİN sayısı: paneli açınca söner; özel günler
 * yeni günde, Keşfet yeni bildirimde döner (`lib/bellSeen.js`). Sekmedeki sayılar kalemlerin
 * kendisi (bugünün özel günleri, Keşfet'te okunmamışlar): panel açıkken değişmez. Bekleyen soru
 * (otomatik yanıt kurulsun mu · kaldırılsın mı) sekmelerin üstünde, cevaplanana kadar durur
 * (`BellOof`); rozete bir kalem olarak girer.
 * Kurallar: `docs/features/ozel-gunler.md` › Bildirim çanı.
 */
export function BellPopover() {
  // Odak modunda sayı susar (macOS'un Odak filtresi gibi); açınca bildirimler yerinde.
  const quiet = useFocusMode().until != null
  const { t } = useLocale()
  const data = useSpecialDaysData()
  const feedOpen = usePageAccess().feed
  const feed = useFeedFresh()
  const raw = useSyncExternalStore(subscribeBellSeen, readBellSeenRaw, none)
  const notice = useSyncExternalStore(subscribeBellSeen, readBellNotice, none)
  const seen = useMemo(() => parseBellSeen(raw), [raw])
  const specialKeys = useMemo(() => specialKeysOf(data.soon, data.people), [data.soon, data.people])
  const counts = bellCounts({ day: data.todayIso, specialKeys, notice, feed }, seen)
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState("special")

  const onOpenChange = (next) => {
    // Açılışta yenisi olan sekme: yalnız Keşfet'te yeni varsa doğrudan o.
    if (next) setTab(feedOpen && counts.feed > 0 && counts.special === 0 ? "feed" : "special")
    setOpen(next)
  }

  // Açıkken görünen her şey okundu — panel açıkken yüklenen kutlama da.
  useEffect(() => {
    if (open) markBellSeen({ day: data.todayIso, specialKeys, notice, feedItems: feed.items })
  }, [open, data.todayIso, specialKeys, notice, feed.items])

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        {/* Glif sayıya göre: rozet varken çalan çan, yokken sakin çan. Rozetin rengi paletten
            (`--badge`). */}
        <SpecialDaysButton badge={quiet ? 0 : counts.total} data-bell-trigger="" />
      </PopoverTrigger>
      {/* Ölçü tarifi MailPopover.jsx'te yazılı — paneller aynı reçeteyi paylaşır. */}
      <PopoverContent
        align="end"
        sideOffset={8}
        collisionPadding={24}
        className="flex max-h-[min(30rem,calc(100dvh-8rem))] w-[min(23rem,calc(100vw-3rem))] flex-col gap-0 overflow-hidden p-0 sm:max-h-[min(40rem,calc(100dvh-5rem))]"
      >
        {notice && (
          <Suspense fallback={null}>
            <BellOof />
          </Suspense>
        )}
        {feedOpen && (
          <div className="shrink-0 border-b border-border px-3 py-2">
            <SegmentedControl
              fill
              label={t("bell.tabs")}
              value={tab}
              onChange={setTab}
              options={[
                {
                  value: "special",
                  label: t("special.title"),
                  accessory: <Count n={specialKeys.length} />,
                },
                { value: "feed", label: t("nav.feed"), accessory: <Count n={feed.count} /> },
              ]}
            />
          </div>
        )}
        {feedOpen && tab === "feed" ? (
          <FeedNotices feed={feed} onNavigate={() => setOpen(false)} />
        ) : (
          <SpecialDaysPanel {...data} />
        )}
      </PopoverContent>
    </Popover>
  )
}
