import { cn } from "@/lib/utils"

// Masrafın geniş penceresi (masaüstü): kalem tablosu ve yanında özet paneli (18rem) sığsın.
const WIDE_REM = 96
// Tablonun en dar genişliğine eklenen pay: özet paneli + aralık + pencerenin iç boşluğu.
const SIDE_EXTRA = 24

// İzin ve avans geniş: girişler yan yana dizilsin (tür · başlangıç · bitiş; amaç · yer · şirket),
// form kısalsın ve ilk açılışta kaydırmadan görünsün.
const WIDTH = {
  leave: "sm:max-w-[min(72rem,calc(100vw-3rem))]",
  expense: "sm:max-w-[min(48rem,calc(100vw-2rem))]",
  advance: "sm:max-w-[min(72rem,calc(100vw-3rem))]",
}
// Pencere ile ekranın kenarı arasında kalan en az pay (üstte ve altta).
const EDGE = "max(0.5rem, 1.5dvh)"

/**
 * Masaüstü talep penceresinin eni ve boyu. Pencere ÜSTTEN sabit: ilk açılıştaki boyuyla
 * ortalanır, büyüyünce yalnız aşağı uzar (açılan liste yer isteyince içerik kaymaz). İlk boy
 * içeriğin doğal boyu (`--fit`, `useFitHeight`), en az taban (38rem; geniş masrafta 46rem), en
 * çok ekran eksi kenar payı: ekran yetiyorsa ilk açılışta kaydırma yok, kaydırma yalnız içerik
 * sonradan büyüyüp ekranı aşınca. İzinde takvim ve etki kartı, avansta girişler ve
 * avans özeti yan yana sığsın diye pencere geniş. Masraf geniş masaüstünde (`wide`) baştan geniş: kalem tablosu ve özet paneli;
 * kişi sütun ekledikçe (`minRem`: tablonun en dar hâli) ekrana kadar genişler, tam ekrana
 * alınabilir (`full`). Dar pencerede masraf kart kart (48rem).
 */
export function requestFrame({ kind, wide, full, minRem = 0 }) {
  // Tam ekran yalnız geniş pencerede: pencere daralınca (ızgaradan kartlara) olağan çerçeveye döner.
  const whole = wide && full
  const base = wide ? "46rem" : "38rem"
  const minH = `min(max(${base}, var(--fit, 0px)), 100dvh - 2 * ${EDGE})`
  const style = whole
    ? undefined
    : {
        top: `calc((100dvh - ${minH}) / 2)`,
        translate: "-50% 0",
        minHeight: minH,
        maxHeight: `calc((100dvh + ${minH}) / 2 - ${EDGE})`,
        ...(wide && {
          maxWidth: `min(${Math.max(WIDE_REM, minRem + SIDE_EXTRA)}rem, calc(100vw - 3rem))`,
        }),
      }
  const className = cn(
    "flex max-h-[88dvh] w-[calc(100vw-2rem)] max-w-none flex-col gap-0 overflow-hidden rounded-[1.375rem] p-0 sm:max-h-[88dvh] sm:pb-0",
    wide ? "sm:max-w-[min(96rem,calc(100vw-3rem))]" : (WIDTH[kind] ?? WIDTH.advance),
    whole && "h-[calc(100dvh-1rem)] max-h-none w-[calc(100vw-1rem)] sm:max-h-none sm:max-w-none",
  )
  return { className, style }
}
