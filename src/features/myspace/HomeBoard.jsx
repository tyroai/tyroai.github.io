import { useTodoBoard } from "@/hooks/useTodoBoard"
import { worstBoard, worstUpdateTask } from "@/dev/worstCase/calendarEvents"
import { BoardEditBar } from "@/features/widgets/BoardEditBar"
import { MainWidgets } from "@/features/widgets/MainWidgets"
import { WidgetEditor } from "@/features/widgets/WidgetEditor"
import { BOARDS } from "@/features/widgets/layout"
import { renderWidgetFor } from "@/features/widgets/renderWidget"
import { useAvailableWidgets } from "@/features/widgets/useBoardData"
import { useWidgetLayout } from "@/features/widgets/useWidgetLayout"

/**
 * Anasayfa'nın düzenlenebilir hâli (kitle `HOME_EDIT`, `lib/widgetsPolicy.js`): bugünkü
 * kartlar widget olarak (`HOME_LAYOUT`), Pano'yla aynı düzenleme — sağ alttaki cam düğme
 * ("Anasayfayı düzenle", `HomeEditFab`), sürükle, yığın, görünüm, önizlemeli katalog. "Diğer widget'lar"
 * YOK: eklenen her şey ana bölüme, asistan ayracının üstüne. Veriler sayfanın (`env`);
 * To Do panosu yalnız burada istenir (öneri ve To-Do özeti widget'ları için) — eski sabit
 * Anasayfa onu hiç çağırmaz.
 */
export function HomeBoard({ env }) {
  const realBoard = useTodoBoard()
  // DEV: `?data=worst` en kötü veri (src/dev/worstCase); üretimde ölü kod.
  const worst = import.meta.env.DEV ? worstBoard() : null
  const board = worst ? { ...realBoard, ...worst, updateTask: worstUpdateTask } : realBoard
  const available = useAvailableWidgets(env.ctx.pageAccess)
  const layout = useWidgetLayout(available, BOARDS.home)
  const render = renderWidgetFor({ ...env, ctx: { ...env.ctx, board } })
  return (
    <WidgetEditor layout={layout} render={render}>
      <BoardEditBar />
      {/* Zemin (düzenleme çubuğu): arkada paletin yumuşak ışıkları — cam kart onunla belirginleşir. */}
      <div className="relative isolate">
        {layout.ambient && <div aria-hidden="true" className="board-ambient" />}
        <MainWidgets render={render} />
      </div>
    </WidgetEditor>
  )
}
