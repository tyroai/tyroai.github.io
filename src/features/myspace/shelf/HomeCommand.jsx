import { useRef, useState } from "react"
import { useLocale } from "@/hooks/useLocale"
import { useIsMobile } from "@/hooks/use-mobile"
import { useVisualViewport } from "@/hooks/useVisualViewport"
import "@/lib/i18n/homeLayout"
import { DockAsk } from "./DockAsk"
import "./homeCommand.css"

/**
 * YÜZEN SOHBET ÇUBUĞU (Anasayfa'nın üç düzeni) — sayfanın altında duran buzlu cam kapsül:
 * soru kutusu ve ona bağlı öneriler (`DockAsk`). Kart değildir: panoda yer tutmaz, panonun sonuna
 * kadar ekranın altına yapışır (`sticky`) ve kendi yeri kadar boşluk bırakır (son kartlar altında
 * kalmaz). Dinlenirken tek satır (yazı alanı); öneriler yalnız çubuğa tıklanınca (odakta) yazı
 * alanının altında açılır (`homeCommand.css` › ÖNERİLER ODAKTA). Telefonda klavye açıkken klavyenin üstüne kalkar. Düzenlerken gizlenir:
 * alttaki yer düzenleme çubuğunun. Tur "Sor" adımında bunu gösterir (`data-tour="ask"`).
 */
export function HomeCommand({ briefCta, onNewChat, onCommand, editing = false }) {
  const { t } = useLocale()
  const mobile = useIsMobile()
  const ref = useRef(null)
  const [focused, setFocused] = useState(false)
  const { keyboardUp, keyboardOffset } = useVisualViewport()
  const lift = mobile && focused && keyboardUp ? keyboardOffset : 0
  if (editing) return null
  return (
    <div className="hcd-wrap">
      <section
        ref={ref}
        data-widget="ask"
        data-tour="ask"
        aria-label={t("widgets.ask.title")}
        className="hcd @container/hcd"
        style={lift ? { transform: `translateY(${-lift}px)` } : undefined}
        onFocus={() => setFocused(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false)
        }}
      >
        <DockAsk
          briefCta={briefCta}
          onNewChat={onNewChat}
          onCommand={onCommand}
          placeholder={t(mobile ? "homeLayout.shelf.commandShort" : "homeLayout.shelf.command")}
        />
      </section>
    </div>
  )
}
