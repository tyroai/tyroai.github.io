import { useEffect } from "react"
import { onTodoChanged } from "@/lib/todoSync"

/**
 * Başka bir yüzey To Do'ya yazdıysa (Denetim Merkezi'nin Hızlı görevi, To-Do sayfası, Bugünün
 * görevleri, Ufukta, posta) ekranda açık duran kanca hemen yeniden okusun (`reload`). Kendi yazdığı
 * (`self`) yok sayılır; art arda yazmalar `delay` içinde tek okumada toplanır. Önbelleği bayatlatmak
 * yalnız bir sonraki açılışı düzeltiyordu: açık karta yeni görev sayfa yenilenene dek düşmüyordu.
 */
export function useTodoChangeRefresh(self, reload, delay) {
  useEffect(() => {
    let timer = null
    const off = onTodoChanged((source) => {
      if (source === self) return
      clearTimeout(timer)
      timer = setTimeout(reload, delay)
    })
    return () => {
      clearTimeout(timer)
      off()
    }
  }, [self, reload, delay])
}
