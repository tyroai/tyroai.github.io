import { createElement, Suspense } from "react"
import { widgetSlot } from "@/lib/widgetSlots"
import { useBrief } from "@/hooks/useBrief"
import { useBriefTips } from "./useBriefTips"

/**
 * Karşılama kartının panodaki kapısı: brifingin verisi (`useBrief`, TYRO brifingiyle aynı — ek istek
 * yok; TYRO'nun önerisi davet, posta ve gecikmiş işten seçilir) burada okunur; kartın kendisi Anasayfa'nın özelliğinde
 * (`myspace/welcome`, yuva `lib/widgetSlots` üzerinden). Kart inene dek aynı boyda boş yüzey.
 */
export function WelcomeGate({ ctx, className, ...rest }) {
  const brief = useBrief(ctx)
  // Karttaki vurgulu yazıların ayrıntısı brifingin ipuçlarından (liste, önizleme, pencere).
  const briefTips = useBriefTips(brief.tipData)
  // Yuvadaki bileşen kabukta bir kez kaydedilir (sabit tür); `createElement` ile çizilir.
  const card = widgetSlot("tyro-welcome")
  const fallback = <div className="ms-surface h-full min-h-[13rem] rounded-[1.75rem]" />
  return (
    <div className={className} style={{ display: "flex", flexDirection: "column" }}>
      {card ? (
        <Suspense fallback={fallback}>
          {createElement(card, { ctx, brief, briefTips, ...rest })}
        </Suspense>
      ) : (
        fallback
      )}
    </div>
  )
}
