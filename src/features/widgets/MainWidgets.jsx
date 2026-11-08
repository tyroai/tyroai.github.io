import { cn } from "@/lib/utils"
import "./boardGrid.css"
import { useWidgetEditor } from "./widgetEditorContext"
import { ZoneGrid } from "./ZoneGrid"

// Satırlar sabit: 1. satır hava kartının tasarım boyu (232px), sonrakiler 15rem. Sol sütun
// ve sağ ızgara aynı satırları kullanır — yan yana kartlar hizalı. Tek sütunda (telefon)
// hizalanacak komşu yok: kart kendi boyunda, boş alan bırakmaz.
const ROWS = "@[34rem]/myspace:[grid-template-rows:14.5rem] @[34rem]/myspace:auto-rows-[15rem]"
// Kısa ekranda (yatay telefon) hava kartı 13rem (skyCard.css); yalnız sol sütunun satırı, sağ
// ızgaranın kartları kendi boyunda kalır (o boyda ikisi alt alta, hizalanacak komşu yok).
// `auto`: selamlaması iki satıra kırılan kart bugünkü boyunda kalır, satır onu taşır.
const LEFT_SHORT = "shortest:@[34rem]/myspace:[grid-template-rows:minmax(13rem,auto)]"

/**
 * Ana bölüm — Anasayfa'nın üst kısmının düzeni: solda karşılama sütunu (hava + soru kutusu;
 * genişliği hep aynı, `boardGrid.css`), sağda üç eşit sütunlu widget ızgarası; aradaki boşluk
 * kartlarınki. İkisi de düzenlenir; sol sütun boşsa ızgara tam genişlik (düzenlerken sütun bırakma
 * alanı olarak durur).
 */
export function MainWidgets({ render }) {
  const { editing, layout } = useWidgetEditor()
  const left = editing || layout.items.some((x) => x.zone === "left")
  return (
    <div className={cn("grid gap-10", left && "board-split")}>
      {left && (
        <ZoneGrid
          zone="left"
          className={cn("grid min-w-0 gap-4", ROWS, LEFT_SHORT)}
          render={render}
        />
      )}
      <ZoneGrid
        zone="main"
        className={cn(
          // Üç eşit sütun (`boardGrid.css`): ortadaki mini kart köşedekiyle aynı genişlikte.
          "board-main grid min-w-0 grid-flow-row-dense gap-4 @[34rem]/myspace:grid-cols-2",
          ROWS,
        )}
        render={render}
      />
    </div>
  )
}
