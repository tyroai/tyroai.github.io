import "./periods.css"

// Gün diliminin rengi — şerit ve lejant aynı sınıfları kullanır. World Time
// Buddy'nin dili ama daha sakin: gece yumuşak lacivert (ekranın yarısı
// gece; ağır koyu kütle gözü yoruyordu), sabah erken/akşam açık mavi,
// mesai (08–18) belirgin bir krem sarısı — toplantıya uygun saat öne çıksın.
// Koyu temada gece soluk gri, sabah/akşam belirgin mavi: ikisi koyuda
// birbirine karışıyordu.
// Hafta sonu ve resmî tatil (gündüz): takvimlerdeki kapalı gün gibi ince çizgili, sakin
// (`periods.css`; ilk CSS'e yeni sınıf girmesin).
export const PERIOD = {
  night: "bg-slate-500 text-white dark:bg-slate-700/55 dark:text-slate-300",
  edge: "bg-sky-100 text-sky-950 dark:bg-sky-500/30 dark:text-sky-50",
  off: "wc-off",
  work: "bg-amber-100/80 text-amber-950 dark:bg-amber-400/30 dark:text-amber-50",
}

export const PERIODS = ["work", "edge", "off", "night"]
