import { useMemo } from "react"
import Award01Icon from "@hugeicons/core-free-icons/Award01Icon"
import BirthdayCakeIcon from "@hugeicons/core-free-icons/BirthdayCakeIcon"
import UserAdd01Icon from "@hugeicons/core-free-icons/UserAdd01Icon"
import { formatAgo } from "@/lib/date"
import { deriveHighlights, peopleRows } from "@/lib/feed"
import { STATUS } from "@/lib/graph"
import { circleOf } from "@/lib/myCircle"
import { celebrationWhen } from "../feedText"

/** Şeritte ve görüntüleyicide gösterilen en çok hikâye; gerisi "Tümü"de. */
export const MAX_STORIES = 12
const DAY = 86_400_000

export const STORY_ICON = {
  birthday: BirthdayCakeIcon,
  anniversary: Award01Icon,
  joiner: UserAdd01Icon,
}
export const STORY_KIND_LABEL = {
  birthday: "feed.birthdays",
  anniversary: "feed.anniversaries",
  joiner: "feed.joiners",
}

const rank = (s) => (s.today ? 0 : s.kind === "joiner" ? 1 : 2 + (s.inDays ?? 9))

/**
 * Sıra: ekibindekiler (yöneticin, ekip arkadaşların, sana bağlı olanlar — `lib/myCircle`) önde;
 * her iki grupta da bugünküler, sonra yeni katılanlar, sonra yaklaşan günler. Çevre bilinmezse
 * (yükleniyor, izin yok) kimse ekip sayılmaz, sıra eskisi gibi kalır.
 */
export function orderStories(list, circle) {
  return list
    .map((s) => (circleOf(circle, s.mail) === "team" ? { ...s, team: true } : s))
    .sort((a, b) => Number(Boolean(b.team)) - Number(Boolean(a.team)) || rank(a) - rank(b))
}

/** Halka: ekibinki yeşil (bugün değilse soluk), bugünkü paletin renginde, gerisi gri. */
export function storyRing(s) {
  if (s.team) return s.today ? "feed-story-ring-team" : "feed-story-ring-team-soft"
  return s.today ? "feed-story-ring" : "bg-border"
}

/** Şeridin hikâyeleri, `orderStories` sırasıyla (`circle`: `useMyCircle`). */
export function useStories(celebrations, posts, now, circle) {
  return useMemo(() => {
    const ready = celebrations.status === STATUS.ready
    const joiners = peopleRows(deriveHighlights(posts, "joiner", now), MAX_STORIES)
      .filter((r) => r.isPerson)
      .map((r) => ({
        key: `j-${r.key}`,
        kind: "joiner",
        name: r.label,
        postId: r.postId,
        received: r.received,
        today: r.received && now - r.received.getTime() < 2 * DAY,
      }))
    const dated = (kind, list) =>
      (list ?? []).map((p) => ({ ...p, key: `${kind}-${p.key}`, kind, today: p.inDays === 0 }))
    // İK kütüğü okunamadıysa doğum günü postadan türeyen yedeğe düşer (gün bilinmez).
    const birthdays = ready
      ? dated("birthday", celebrations.birthdays)
      : celebrations.status === "loading"
        ? []
        : peopleRows(deriveHighlights(posts, "birthday", now), MAX_STORIES)
            .filter((r) => r.isPerson)
            .map((r) => ({ key: `bp-${r.key}`, kind: "birthday", name: r.label, postId: r.postId }))
    const anniversaries = ready ? dated("anniversary", celebrations.anniversaries) : []
    return orderStories([...birthdays, ...anniversaries, ...joiners], circle)
  }, [celebrations, posts, now, circle])
}

/** Hikâyenin kısa altyazısı: "Yeni", "15. yıl · 3 gün sonra", "Yarın" ya da yok. */
export function storyCaption(t, s) {
  if (s.kind === "joiner") return t("feed.stories.new")
  if (s.kind === "anniversary") return t("feed.cel.years", { count: s.years })
  return s.inDays != null ? celebrationWhen(t, s, s.kind) : null
}

/** Kişi kartının bağlam şeridi (kutla düğmesini ve metni belirler). */
export function storyContext(t, locale, s) {
  if (s.kind === "joiner") {
    return { kind: "joiner", text: t("person.announced", { when: formatAgo(s.received, locale) }) }
  }
  return s.inDays != null
    ? { kind: s.kind, text: celebrationWhen(t, s, s.kind), years: s.years }
    : undefined
}
