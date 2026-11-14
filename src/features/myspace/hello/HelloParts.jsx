import { lazy, Suspense } from "react"
import { useLocale } from "@/hooks/useLocale"
import { InsightTip } from "../InsightTip"

import { preloadStory } from "./preloadStory"

const InsightBody = lazy(preloadStory)

/**
 * Günün okumasının ayrıntısı — Anasayfa selamlamasının ipucu kartıyla AYNI gövde (`InsightBody`:
 * günün şeridi, satırlar, eylem — odak bloğu ekle, işleri planla, izin iste). Fareyle üstüne
 * gelince ya da tıklayınca açılır; telefonda alttan çekmece.
 */
export function StoryTip({ story, onChanged, side = "bottom", align = "start", children }) {
  const { t } = useLocale()
  if (!story.insight) return children
  return (
    <InsightTip
      title={t("insight.tip.title")}
      kicker={story.day?.kicker}
      side={side}
      align={align}
      valueLang={null}
      look="glass"
      list={(close) => (
        <Suspense fallback={<div className="hello-tip-wait" />}>
          <InsightBody
            insight={story.insight}
            events={story.scene.events}
            tasks={story.scene.tasks}
            now={story.scene.now}
            onChanged={onChanged}
            close={close}
          />
        </Suspense>
      )}
    >
      {children}
    </InsightTip>
  )
}
