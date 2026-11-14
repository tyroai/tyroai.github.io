import { lazy, Suspense } from "react"
import { motion } from "motion/react"
import { TOAST_SURFACE } from "@/components/common/toastSurface"
import { cn } from "@/lib/utils"

// Orb paketi yalnızca bu bildirim göründüğünde insin: sohbeti açan herkes
// indirmesin diye veri yenileme toast'ındaki kararın aynısı.
const ThinkingOrb = lazy(() => import("thinking-orbs").then((m) => ({ default: m.ThinkingOrb })))

/**
 * "Asistan çalışıyor" bildirimi.
 *
 * Eskiden sohbet başlığının üstünde, ekranın ORTASINDA açılan bir kart vardı.
 * İki sorunu vardı: söylediği şey ("burada bekleme, işine devam et") ile
 * durduğu yer çelişiyordu — kullanıcının baktığı yeri kaplayan bir kart,
 * bakmaya devam etmesini söyler — ve sohbetten çıkıldığında çıpası kaybolduğu
 * için kart da kayboluyordu, oysa mesaj tam da o an geçerli.
 *
 * Sayfanın ÜSTÜNDE, ortada ve yayla açılıyor: bu bildirim ambiyans değil,
 * kullanıcının bir saniye önce bastığı düğmeye verilen cevap. Yüzey veri
 * yenileme bildirimiyle ortak (`TOAST_SURFACE`) — ikisi aynı üründen
 * geliyor gibi görünsün diye — ama yeri ve girişi ayrı.
 *
 * `theme="dark"` SABİT: yüzey her iki temada da koyu cam; orbun `auto` modu
 * sayfanın `.dark` sınıfına bakar ve açık temada koyu mürekkep çizip
 * görünmez olurdu.
 */
export function FirstReplyToast({ title, body, compact = false }) {
  return (
    <motion.div
      // Yay: yukarıdan iner ve hafifçe büyüyerek yerine oturur. Doğrusal bir
      // geçiş burada "bir şey belirdi" der; yay "şu anda oldu" der.
      initial={{ opacity: 0, y: -28, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 420, damping: 26, mass: 0.9 }}
      // Sağ panelde küçük (ürün sahibi: "çok büyük, biraz küçültelim"): panelin genişliğine sığar
      // (panel en az 340, varsayılan 420 px), boşluklar ve rozet daha küçük.
      className={cn(TOAST_SURFACE, compact && "w-[min(320px,calc(100vw-2rem))] gap-3 p-3")}
    >
      {/* Rozet 72px, orb 64 (panelde 48 px rozet, orb 64'ün tasarımı %72 küçültülmüş ≈ 46 px). Paket
          yalnız 64 · 32 · 20 boylarını taşır (başka boy çöker); 20'de bantların dönüşü okunmuyor. */}
      <div className={cn("relative shrink-0", compact ? "size-12" : "size-[4.5rem]")}>
        <span
          aria-hidden="true"
          className="absolute -inset-1 rounded-2xl bg-[var(--badge)]/20 blur-md"
        />
        <span
          role="status"
          aria-label={title}
          className="relative grid size-full place-items-center"
        >
          <Suspense fallback={null}>
            <span className={cn("grid place-items-center", compact && "scale-[0.72]")}>
              <ThinkingOrb
                state="composing"
                size={64}
                speed={1.2}
                theme="dark"
                aria-hidden="true"
              />
            </span>
          </Suspense>
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "font-semibold tracking-tight text-white",
            compact ? "text-[0.875rem]" : "text-[0.9375rem]",
          )}
        >
          {title}
        </p>
        <p
          className={cn(
            "mt-0.5 leading-snug text-white/60",
            compact ? "text-[0.75rem]" : "text-[0.8125rem]",
          )}
        >
          {body}
        </p>
      </div>
    </motion.div>
  )
}
