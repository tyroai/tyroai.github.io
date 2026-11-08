import { useMemo } from "react"
import UserAdd01Icon from "@hugeicons/core-free-icons/UserAdd01Icon"
import { useCelebrations } from "@/hooks/useCelebrations"
import { useLocale } from "@/hooks/useLocale"
import { deriveHighlights, peopleRows } from "@/lib/feed"
import { FEED } from "@/lib/feedPolicy"
import { STATUS } from "@/lib/graph"
import { CelebrationPeople, CelebrationSkeleton, FeedPeople } from "./FeedRail"
import { FeedStateCard } from "./timeline/FeedStateCard"

/**
 * Tebrik kartlarının verisi ve çizimi: hikâye şeridinin "Tümü" listesi ve (darda) sağ ray.
 *
 * Her kart kendi en hızlı kaynağından okur: yeni katılanlar akıştaki İK duyurusundan (zaten
 * yüklü, anında; duyuruyu açar), doğum günleri ve iş yıl dönümleri İK kütüğünden (tek kaynak,
 * beklemeye değer). Kütük okunamazsa (herkeste yetki yok) doğum günü postadan türeyen yedeğe
 * düşer; yıl dönümünün yedeği yok, kütük yoksa hiç çizilmez. İkisi aynı kişiyi iki kez
 * listelemesin diye kütük postanın yerine geçer, yanına eklenmez.
 *
 * @returns {{ celebrations: object, people: import("react").ReactNode, empty: import("react").ReactNode }}
 *   `empty`: hiç kart çizilmediyse tek bir boş durum kartı (yüklenirken yazılmaz: iskelet var).
 */
export function useFeedCongrats({ posts, now, onOpen }) {
  const { t } = useLocale()
  const celebrations = useCelebrations()
  const celOk = celebrations.status === STATUS.ready
  const celLoading = celebrations.status === "loading"

  // Postadan türeyen kartlardan en az biri dolu mu (boş durum kapısı için).
  const hasCongrats = useMemo(
    () =>
      ["joiner", "birthday"].some(
        (kind) => peopleRows(deriveHighlights(posts, kind, now), FEED.people.limit).length > 0,
      ),
    [posts, now],
  )

  const people = (
    <>
      <FeedPeople kind="joiner" posts={posts} now={now} onOpen={onOpen} />
      {celOk ? (
        <>
          <CelebrationPeople kind="birthday" people={celebrations.birthdays} />
          <CelebrationPeople kind="anniversary" people={celebrations.anniversaries} />
        </>
      ) : celLoading ? (
        <>
          <CelebrationSkeleton kind="birthday" />
          <CelebrationSkeleton kind="anniversary" />
        </>
      ) : (
        <FeedPeople kind="birthday" posts={posts} now={now} onOpen={onOpen} />
      )}
    </>
  )
  const celEmpty =
    !hasCongrats &&
    !celLoading &&
    !(celOk && (celebrations.birthdays?.length || celebrations.anniversaries?.length))
  const empty = celEmpty && (
    <FeedStateCard
      icon={UserAdd01Icon}
      title={t("feed.congratsEmpty")}
      body={t("feed.peopleEmptyBody")}
    />
  )
  return { celebrations, people, empty }
}
